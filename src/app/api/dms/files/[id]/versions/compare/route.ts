import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import User from '@/models/User';
import { getSignedUrl } from '@/lib/googleCloudStorage';
import { diffLines, diffWords, Change } from 'diff';

/**
 * GET /api/dms/files/[id]/versions/compare?v1=1&v2=2
 * Compare two versions of a file
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const v1 = parseInt(searchParams.get('v1') || '1');
    const v2 = parseInt(searchParams.get('v2') || '2');

    if (isNaN(v1) || isNaN(v2) || v1 < 1 || v2 < 1) {
      return NextResponse.json({ error: 'Invalid version numbers' }, { status: 400 });
    }

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access
    if (file.organization?.toString() !== user.organization?.toString() && user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    if (!file.canUserAccess(user.role)) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the parent file ID
    const parentFileId = file.parentFile || file._id;

    // Find both versions
    const [version1, version2] = await Promise.all([
      DMSFile.findOne({
        $or: [
          { _id: parentFileId, version: v1 },
          { parentFile: parentFileId, version: v1 }
        ]
      }).populate('uploadedBy', 'name email'),
      DMSFile.findOne({
        $or: [
          { _id: parentFileId, version: v2 },
          { parentFile: parentFileId, version: v2 }
        ]
      }).populate('uploadedBy', 'name email'),
    ]);

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      );
    }

    // Basic comparison (metadata)
    const comparison: any = {
      version1: {
        version: version1.version,
        uploadedAt: version1.uploadedAt,
        uploadedBy: version1.uploadedBy,
        size: version1.size,
        checksum: version1.metadata?.checksum,
      },
      version2: {
        version: version2.version,
        uploadedAt: version2.uploadedAt,
        uploadedBy: version2.uploadedBy,
        size: version2.size,
        checksum: version2.metadata?.checksum,
      },
      differences: {
        sizeChange: version2.size - version1.size,
        sizeChangePercent: ((version2.size - version1.size) / version1.size * 100).toFixed(2),
        timeBetween: Math.floor((new Date(version2.uploadedAt).getTime() - new Date(version1.uploadedAt).getTime()) / 1000),
        filesIdentical: version1.metadata?.checksum === version2.metadata?.checksum,
      }
    };

    // For text files, provide detailed diff
    if (version1.mimeType.startsWith('text/') || version1.mimeType === 'application/json') {
      try {
        // Get signed URLs to download files
        const [url1, url2] = await Promise.all([
          version1.gcsUrl || version1.metadata?.gcsPath
            ? getSignedUrl(version1.metadata?.gcsPath || version1.filePath, 5)
            : null,
          version2.gcsUrl || version2.metadata?.gcsPath
            ? getSignedUrl(version2.metadata?.gcsPath || version2.filePath, 5)
            : null,
        ]);

        if (url1 && url2) {
          // Fetch file contents
          const [content1Response, content2Response] = await Promise.all([
            fetch(url1),
            fetch(url2),
          ]);

          const content1 = await content1Response.text();
          const content2 = await content2Response.text();

          // Generate diff
          const lineDiff = diffLines(content1, content2);

          comparison.textDiff = {
            changes: lineDiff.map((change: Change) => ({
              added: change.added || false,
              removed: change.removed || false,
              value: change.value,
              count: change.count || 0,
            })),
            stats: {
              additions: lineDiff.filter((c: Change) => c.added).reduce((sum: number, c: Change) => sum + (c.count || 0), 0),
              deletions: lineDiff.filter((c: Change) => c.removed).reduce((sum: number, c: Change) => sum + (c.count || 0), 0),
              unchanged: lineDiff.filter((c: Change) => !c.added && !c.removed).reduce((sum: number, c: Change) => sum + (c.count || 0), 0),
            }
          };
        }
      } catch (error) {
        console.error('Error generating text diff:', error);
        comparison.textDiff = { error: 'Could not generate text diff' };
      }
    }

    // For PDFs, provide metadata comparison
    if (version1.fileType === 'pdf') {
      comparison.pdfComparison = {
        pages1: version1.metadata?.pages,
        pages2: version2.metadata?.pages,
        pagesDiff: (version2.metadata?.pages || 0) - (version1.metadata?.pages || 0),
      };
    }

    return NextResponse.json({
      success: true,
      comparison,
    });
  } catch (error: any) {
    console.error('Error comparing file versions:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions', details: error.message },
      { status: 500 }
    );
  }
}
