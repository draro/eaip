import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import DocumentReview from '@/models/DocumentReview';
import User from '@/models/User';
import Notification from '@/models/Notification';
import DocumentActionLog from '@/models/DocumentActionLog';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; reviewId: string } }
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

    const review = await DocumentReview.findById(params.reviewId);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (review.reviewer.toString() !== user._id.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You are not authorized to update this review' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, comments } = body;

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Status must be either "approved" or "rejected"' },
        { status: 400 }
      );
    }

    review.status = status;
    review.comments = comments || '';
    review.reviewedAt = new Date();
    await review.save();

    // Update instance review status
    const instance = await ChecklistInstance.findById(params.id);
    if (instance) {
      await instance.updateReviewStatus();
      await instance.save();

      // Notify the requester
      await Notification.create({
        type: 'review_completed',
        recipient: instance.initiatedBy,
        sender: user._id,
        organization: user.organization,
        title: 'Review Completed',
        message: `${user.name} has ${status} your checklist: ${instance.title}`,
        documentId: instance._id,
        documentType: 'checklist_instance',
        link: `/checklists/${instance._id}`,
        isRead: false,
      });
    }

    // Log action
    await DocumentActionLog.create({
      actionType: status === 'approved' ? 'document_reviewed' : 'document_rejected',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: params.id,
      organization: user.organization,
      details: {
        status,
        comments,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: review.toObject(),
    });
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review', details: error.message },
      { status: 500 }
    );
  }
}
