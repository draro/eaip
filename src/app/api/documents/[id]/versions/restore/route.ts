import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import { gitDocumentService } from '@/lib/gitDocumentService';
import ChecklistInstance from '@/models/ChecklistInstance';
import User from '@/models/User';
import DocumentActionLog from '@/models/DocumentActionLog';

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

    const instance = await ChecklistInstance.findById(params.id);
    if (!instance) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (
      instance.organization.toString() !== user.organization?.toString() &&
      user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to restore this document' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { commitHash } = body;

    if (!commitHash) {
      return NextResponse.json(
        { error: 'Commit hash is required' },
        { status: 400 }
      );
    }

    await gitDocumentService.restoreVersion(commitHash, {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    });

    await DocumentActionLog.create({
      actionType: 'version_restored',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      organization: user.organization,
      details: {
        commitHash,
        restoredFrom: commitHash.substring(0, 7),
      },
      timestamp: new Date(),
    });

    const updatedInstance = await ChecklistInstance.findById(params.id)
      .populate('template', 'title description')
      .populate('initiatedBy', 'name email');

    return NextResponse.json({
      message: 'Version restored successfully',
      instance: updatedInstance,
    });
  } catch (error: any) {
    console.error('Error restoring version:', error);
    return NextResponse.json(
      { error: 'Failed to restore version', details: error.message },
      { status: 500 }
    );
  }
}
