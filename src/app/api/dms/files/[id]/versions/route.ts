import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import User from '@/models/User';
import crypto from 'crypto';
import { uploadToGCS, generateGCSPath } from '@/lib/googleCloudStorage';

function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * GET /api/dms/files/[id]/versions
 * Get all versions of a file
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

    // Find the parent file (or the file itself if it's the parent)
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

    // Get all versions - if this file has a parent, use the parent, otherwise use this file as parent
    const parentId = file.parentFile || file._id;

    const versions = await DMSFile.find({
      $or: [
        { _id: parentId },
        { parentFile: parentId }
      ]
    })
      .sort({ version: -1 })
      .populate('uploadedBy', 'name email')
      .select('-versionHistory'); // Don't include the full version history array in each doc

    return NextResponse.json({
      success: true,
      versions,
      totalVersions: versions.length,
    });
  } catch (error: any) {
    console.error('Error fetching file versions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch versions', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dms/files/[id]/versions
 * Upload a new version of a file
 */
export async function POST(
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

    if (!['org_admin', 'atc_supervisor', 'atc', 'editor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only org_admin, atc_supervisor, atc, and editor can upload file versions' },
        { status: 403 }
      );
    }

    // Find the current latest file
    const currentFile = await DMSFile.findById(params.id);
    if (!currentFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access
    if (currentFile.organization?.toString() !== user.organization?.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const changeNote = formData.get('changeNote') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 104857600) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    // Get the parent file ID (this is the original file, all versions reference it)
    const parentFileId = currentFile.parentFile || currentFile._id;

    // Get the next version number
    const latestVersion = await DMSFile.findOne({
      $or: [
        { _id: parentFileId },
        { parentFile: parentFileId }
      ]
    }).sort({ version: -1 });

    const nextVersion = (latestVersion?.version || 0) + 1;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const checksum = calculateChecksum(buffer);

    // Generate GCS path for new version
    const gcsPath = generateGCSPath(
      user.organization?.toString() || '',
      currentFile.folder?.toString() || null,
      `v${nextVersion}_${file.name}`
    );

    // Upload to Google Cloud Storage
    const gcsResult = await uploadToGCS({
      destination: gcsPath,
      file: buffer,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: user._id.toString(),
        organization: user.organization?.toString() || '',
        checksum,
        version: nextVersion.toString(),
        parentFileId: parentFileId.toString(),
      },
      makePublic: false,
    });

    // Mark current version as not latest
    await DMSFile.updateMany(
      {
        $or: [
          { _id: parentFileId },
          { parentFile: parentFileId }
        ]
      },
      { isLatest: false }
    );

    // Create new version document
    const newVersion = await DMSFile.create({
      filename: file.name,
      originalName: currentFile.originalName, // Keep original name
      filePath: gcsPath,
      storageUrl: gcsResult.url,
      gcsUrl: gcsResult.gsUrl,
      mimeType: file.type,
      fileType: currentFile.fileType, // Keep same file type
      size: file.size,
      organization: user.organization,
      folder: currentFile.folder,
      uploadedBy: user._id,
      tags: currentFile.tags, // Inherit tags
      description: currentFile.description, // Inherit description
      version: nextVersion,
      isLatest: true,
      parentFile: parentFileId,
      metadata: {
        checksum,
        gcsPath,
      },
      allowedRoles: currentFile.allowedRoles, // Inherit permissions
      approvalRequired: currentFile.approvalRequired,
      approvalStatus: currentFile.approvalRequired ? 'pending' : undefined,
      versionHistory: [], // New versions start with empty history
    });

    // Update the parent file's version history
    await DMSFile.findByIdAndUpdate(parentFileId, {
      $push: {
        versionHistory: {
          version: nextVersion,
          fileId: newVersion._id,
          uploadedBy: user._id,
          uploadedAt: new Date(),
          changeNote: changeNote || '',
          size: file.size,
          checksum,
        }
      }
    });

    const populatedVersion = await DMSFile.findById(newVersion._id)
      .populate('uploadedBy', 'name email')
      .populate('folder', 'name path');

    return NextResponse.json({
      success: true,
      version: populatedVersion,
      message: `Version ${nextVersion} uploaded successfully`,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file version:', error);
    return NextResponse.json(
      { error: 'Failed to upload version', details: error.message },
      { status: 500 }
    );
  }
}
