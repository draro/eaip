import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import User from '@/models/User';
import { getSignedUrl } from '@/lib/googleCloudStorage';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * GET /api/dms/files/[id]/download
 * Download a file from GCS or local file system (hybrid support)
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

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file
    if (file.organization?.toString() !== user.organization?.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Check role-based access
    if (!file.canUserAccess(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to access this file' },
        { status: 403 }
      );
    }

    // Increment download count
    await file.incrementDownloadCount();

    // Check if file is in GCS or local file system
    if (file.gcsUrl || file.metadata?.gcsPath) {
      // File is in GCS - generate signed URL and redirect
      const gcsPath = file.metadata?.gcsPath || file.filePath;
      const signedUrl = await getSignedUrl(gcsPath, 5);
      return NextResponse.redirect(signedUrl);
    } else {
      // File is in local file system - serve directly
      try {
        const localPath = path.join(process.cwd(), 'public', file.filePath);
        const fileBuffer = await readFile(localPath);

        return new NextResponse(fileBuffer, {
          headers: {
            'Content-Type': file.mimeType || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${file.originalName}"`,
            'Content-Length': fileBuffer.length.toString(),
          },
        });
      } catch (fsError) {
        console.error('Error reading local file:', fsError);
        return NextResponse.json(
          { error: 'File not found in storage', details: 'The file may have been moved or deleted' },
          { status: 404 }
        );
      }
    }
  } catch (error: any) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file', details: error.message },
      { status: 500 }
    );
  }
}
