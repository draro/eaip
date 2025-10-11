import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentReview from '@/models/DocumentReview';
import DocumentApproval from '@/models/DocumentApproval';
import User from '@/models/User';

export async function GET(req: NextRequest) {
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

    const reviews = await DocumentReview.find({
      reviewer: user._id,
      status: 'pending',
    })
      .populate('document', 'title section')
      .populate('requestedBy', 'name email')
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();

    const approvals = await DocumentApproval.find({
      approver: user._id,
      status: 'pending',
    })
      .populate('document', 'title section')
      .populate('requestedBy', 'name email')
      .sort({ requestedAt: -1 })
      .limit(10)
      .lean();

    const tasks = [
      ...reviews.map((review: any) => ({
        _id: review._id,
        type: 'review',
        title: review.document?.title || 'Untitled Document',
        section: review.document?.section || 'N/A',
        requestedBy: review.requestedBy,
        requestedAt: review.requestedAt,
        dueDate: review.dueDate,
        priority: review.priority || 'medium',
      })),
      ...approvals.map((approval: any) => ({
        _id: approval._id,
        type: 'approval',
        title: approval.document?.title || 'Untitled Document',
        section: approval.document?.section || 'N/A',
        requestedBy: approval.requestedBy,
        requestedAt: approval.requestedAt,
        dueDate: approval.dueDate,
        priority: approval.priority || 'medium',
      })),
    ].sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime();
    });

    return NextResponse.json({ tasks, total: tasks.length });
  } catch (error: any) {
    console.error('Error fetching assigned tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assigned tasks', details: error.message },
      { status: 500 }
    );
  }
}
