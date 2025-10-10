import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import DocumentApproval from '@/models/DocumentApproval';
import User from '@/models/User';
import Notification from '@/models/Notification';
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
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instance.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to request approval for this checklist' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { approverIds } = body;

    if (!approverIds || !Array.isArray(approverIds) || approverIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one approver must be specified' },
        { status: 400 }
      );
    }

    // Verify all approvers exist and belong to the same organization
    const approvers = await User.find({
      _id: { $in: approverIds },
      organization: user.organization,
    });

    if (approvers.length !== approverIds.length) {
      return NextResponse.json(
        { error: 'Some approvers not found or do not belong to your organization' },
        { status: 400 }
      );
    }

    // Create approval records
    const approvals = [];
    for (const approver of approvers) {
      try {
        const approval = await DocumentApproval.create({
          document: instance._id,
          documentType: 'checklist_instance',
          approver: approver._id,
          organization: user.organization,
          status: 'pending',
        });
        approvals.push(approval);

        // Create notification
        await Notification.create({
          type: 'approval_requested',
          recipient: approver._id,
          sender: user._id,
          organization: user.organization,
          title: 'Approval Requested',
          message: `${user.name} has requested your approval for checklist: ${instance.title}`,
          documentId: instance._id,
          documentType: 'checklist_instance',
          link: `/checklists/${instance._id}`,
          isRead: false,
        });
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key - approval already exists
          console.log(`Approval already exists for approver ${approver._id}`);
        } else {
          throw error;
        }
      }
    }

    // Update instance approval status
    await instance.updateApprovalStatus();
    await instance.save();

    // Log action
    await DocumentActionLog.create({
      actionType: 'approval_requested',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      organization: user.organization,
      details: {
        title: instance.title,
        approvers: approvers.map((a) => ({ id: a._id, name: a.name, email: a.email })),
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Approval requested successfully',
      approvalsCreated: approvals.length,
      approvers: approvers.map((a) => ({ id: a._id, name: a.name, email: a.email })),
    });
  } catch (error: any) {
    console.error('Error requesting approval:', error);
    return NextResponse.json(
      { error: 'Failed to request approval', details: error.message },
      { status: 500 }
    );
  }
}
