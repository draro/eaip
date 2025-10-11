import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import Folder from '@/models/Folder';
import User from '@/models/User';
import { moveFileInGCS, generateGCSPath } from '@/lib/googleCloudStorage';

export async function PATCH(
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

    // Check if user has permission to move files
    const canMove = ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor'].includes(user.role);
    if (!canMove) {
      return NextResponse.json(
        { error: 'You do not have permission to move files' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { targetFolderId } = body;

    if (!targetFolderId) {
      return NextResponse.json(
        { error: 'Target folder ID is required' },
        { status: 400 }
      );
    }

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has access to this file (same organization)
    if (file.organization?.toString() !== user.organization?.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to move this file' },
        { status: 403 }
      );
    }

    // Get old and new folder info for metadata updates
    const oldFolderId = file.folder?.toString();
    const newFolderId = targetFolderId === 'root' ? null : targetFolderId;

    // Verify target folder exists and belongs to same organization
    let targetFolder = null;
    if (newFolderId) {
      targetFolder = await Folder.findById(newFolderId);
      if (!targetFolder) {
        return NextResponse.json({ error: 'Target folder not found' }, { status: 404 });
      }
      if (targetFolder.organization.toString() !== user.organization?.toString()) {
        return NextResponse.json(
          { error: 'Target folder belongs to different organization' },
          { status: 403 }
        );
      }
    }

    // Move file in Google Cloud Storage
    if (file.filePath) {
      try {
        const newGCSPath = generateGCSPath(
          user.organization?.toString() || '',
          newFolderId,
          file.originalName
        );

        await moveFileInGCS(file.filePath, newGCSPath);

        // Update file path in database
        file.filePath = newGCSPath;
        file.metadata = {
          ...file.metadata,
          gcsPath: newGCSPath,
        };

        console.log(`✓ Moved file in GCS from ${file.filePath} to ${newGCSPath}`);
      } catch (gcsError) {
        console.error('Error moving file in GCS:', gcsError);
        return NextResponse.json(
          { error: 'Failed to move file in Google Cloud Storage' },
          { status: 500 }
        );
      }
    }

    // Update folder metadata
    if (oldFolderId) {
      await Folder.findByIdAndUpdate(oldFolderId, {
        $inc: {
          'metadata.fileCount': -1,
          'metadata.totalSize': -file.size,
        },
      });
    }

    if (newFolderId) {
      await Folder.findByIdAndUpdate(newFolderId, {
        $inc: {
          'metadata.fileCount': 1,
          'metadata.totalSize': file.size,
        },
      });
    }

    // Update the file's folder
    file.folder = newFolderId as any;
    await file.save();

    const populatedFile = await DMSFile.findById(file._id)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name path');

    return NextResponse.json({
      success: true,
      message: 'File moved successfully',
      file: populatedFile,
    });
  } catch (error: any) {
    console.error('Error moving file:', error);
    return NextResponse.json(
      { error: 'Failed to move file', details: error.message },
      { status: 500 }
    );
  }
}
