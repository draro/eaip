import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentFile from '@/models/DocumentFile';
import User from '@/models/User';

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
    const file = await DocumentFile.findById(params.id);
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

    // Update the file's folder
    const folderId = targetFolderId === 'root' ? null : targetFolderId;
    file.folder = folderId;
    await file.save();

    return NextResponse.json({
      success: true,
      message: 'File moved successfully',
      file,
    });
  } catch (error: any) {
    console.error('Error moving file:', error);
    return NextResponse.json(
      { error: 'Failed to move file', details: error.message },
      { status: 500 }
    );
  }
}
