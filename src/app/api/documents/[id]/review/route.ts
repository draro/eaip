import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentReview from '@/models/DocumentReview';
import ChecklistInstance from '@/models/ChecklistInstance';
import User from '@/models/User';
import Notification from '@/models/Notification';
import DocumentActionLog from '@/models/DocumentActionLog';

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

    const reviews = await DocumentReview.find({
      document: params.id,
    })
      .populate('reviewer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ reviews });
  } catch (error: any) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews', details: error.message },
      { status: 500 }
    );
  }
}

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
      instance.organization?.toString() !== user.organization?.toString() &&
      user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to review this document' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { status, comments, requestedChanges } = body;

    if (!status || !['pending', 'approved', 'rejected', 'changes_requested'].includes(status)) {
      return NextResponse.json(
        { error: 'Valid status is required' },
        { status: 400 }
      );
    }

    const review = await DocumentReview.create({
      document: params.id,
      documentType: 'checklist_instance',
      reviewer: user._id,
      reviewerName: user.name,
      reviewerEmail: user.email,
      organization: user.organization,
      status,
      comments: comments || '',
      requestedChanges: requestedChanges || [],
      reviewedAt: status !== 'pending' ? new Date() : undefined,
    });

    await DocumentActionLog.create({
      actionType: `document_${status}`,
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      organization: user.organization,
      details: {
        reviewId: review._id.toString(),
        status,
        comments: comments?.substring(0, 100),
      },
      timestamp: new Date(),
    });

    if (status === 'approved' || status === 'rejected') {
      await Notification.create({
        user: instance.initiatedBy,
        title: `Checklist ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your checklist "${instance.title}" has been ${status === 'approved' ? 'approved' : 'rejected'} by ${user.name}`,
        type: status === 'approved' ? 'approval' : 'system',
        relatedDocument: instance._id,
        relatedDocumentType: 'checklist_instance',
        organization: user.organization,
      });
    }

    const populatedReview = await DocumentReview.findById(review._id)
      .populate('reviewer', 'name email')
      .lean();

    return NextResponse.json({
      message: 'Review submitted successfully',
      review: populatedReview,
    });
  } catch (error: any) {
    console.error('Error creating review:', error);
    return NextResponse.json(
      { error: 'Failed to create review', details: error.message },
      { status: 500 }
    );
  }
}
