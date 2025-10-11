import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import User from '@/models/User';

/**
 * POST /api/dms/files/[id]/versions/[versionNumber]/restore
 * Restore a specific version as the latest version
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string; versionNumber: string } }
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

    if (!['org_admin', 'atc_supervisor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only org_admin and atc_supervisor can restore versions' },
        { status: 403 }
      );
    }

    const versionNumber = parseInt(params.versionNumber);
    if (isNaN(versionNumber) || versionNumber < 1) {
      return NextResponse.json({ error: 'Invalid version number' }, { status: 400 });
    }

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check access
    if (file.organization?.toString() !== user.organization?.toString()) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get the parent file ID
    const parentFileId = file.parentFile || file._id;

    // Find the version to restore
    const versionToRestore = await DMSFile.findOne({
      $or: [
        { _id: parentFileId, version: versionNumber },
        { parentFile: parentFileId, version: versionNumber }
      ]
    });

    if (!versionToRestore) {
      return NextResponse.json(
        { error: `Version ${versionNumber} not found` },
        { status: 404 }
      );
    }

    // If this version is already the latest, no need to do anything
    if (versionToRestore.isLatest) {
      return NextResponse.json({
        success: true,
        message: `Version ${versionNumber} is already the latest version`,
        file: versionToRestore,
      });
    }

    // Mark all versions as not latest
    await DMSFile.updateMany(
      {
        $or: [
          { _id: parentFileId },
          { parentFile: parentFileId }
        ]
      },
      { isLatest: false }
    );

    // Mark the restored version as latest
    versionToRestore.isLatest = true;
    await versionToRestore.save();

    // Update parent file's version history
    await DMSFile.findByIdAndUpdate(parentFileId, {
      $push: {
        versionHistory: {
          version: versionNumber,
          fileId: versionToRestore._id,
          uploadedBy: user._id,
          uploadedAt: new Date(),
          changeNote: `Restored version ${versionNumber}`,
          size: versionToRestore.size,
          checksum: versionToRestore.metadata?.checksum,
        }
      }
    });

    const populatedVersion = await DMSFile.findById(versionToRestore._id)
      .populate('uploadedBy', 'name email')
      .populate('folder', 'name path');

    return NextResponse.json({
      success: true,
      message: `Version ${versionNumber} restored successfully`,
      file: populatedVersion,
    });
  } catch (error: any) {
    console.error('Error restoring file version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version', details: error.message },
      { status: 500 }
    );
  }
}
