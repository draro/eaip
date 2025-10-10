import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import DocumentReview from '@/models/DocumentReview';
import User from '@/models/User';
import Notification from '@/models/Notification';
import DocumentActionLog from '@/models/DocumentActionLog';
import { emailService } from '@/lib/email';

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
        { error: 'You do not have permission to request review for this checklist' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { reviewerIds } = body;

    if (!reviewerIds || !Array.isArray(reviewerIds) || reviewerIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one reviewer must be specified' },
        { status: 400 }
      );
    }

    // Verify all reviewers exist and belong to the same organization
    const reviewers = await User.find({
      _id: { $in: reviewerIds },
      organization: user.organization,
    });

    if (reviewers.length !== reviewerIds.length) {
      return NextResponse.json(
        { error: 'Some reviewers not found or do not belong to your organization' },
        { status: 400 }
      );
    }

    // Create review records
    const reviews = [];
    for (const reviewer of reviewers) {
      try {
        const review = await DocumentReview.create({
          document: instance._id,
          documentType: 'checklist_instance',
          reviewer: reviewer._id,
          organization: user.organization,
          status: 'pending',
        });
        reviews.push(review);

        // Create notification
        await Notification.create({
          type: 'review_requested',
          recipient: reviewer._id,
          sender: user._id,
          organization: user.organization,
          title: 'Review Requested',
          message: `${user.name} has requested your review for checklist: ${instance.title}`,
          documentId: instance._id,
          documentType: 'checklist_instance',
          link: `/checklists/${instance._id}`,
          isRead: false,
        });

        // Send email notification
        try {
          const org = await user.populate('organization');
          await emailService.sendReviewRequestEmail({
            reviewerEmail: reviewer.email,
            reviewerName: reviewer.name,
            requesterName: user.name,
            documentTitle: instance.title,
            documentLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checklists/${instance._id}`,
            organizationName: org.organization?.name || 'eAIP',
          });
        } catch (emailError) {
          console.error('Failed to send review request email:', emailError);
          // Don't fail the request if email fails
        }
      } catch (error: any) {
        if (error.code === 11000) {
          // Duplicate key - review already exists
          console.log(`Review already exists for reviewer ${reviewer._id}`);
        } else {
          throw error;
        }
      }
    }

    // Update instance review status
    await instance.updateReviewStatus();
    await instance.save();

    // Log action
    await DocumentActionLog.create({
      actionType: 'review_requested',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      organization: user.organization,
      details: {
        title: instance.title,
        reviewers: reviewers.map((r) => ({ id: r._id, name: r.name, email: r.email })),
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Review requested successfully',
      reviewsCreated: reviews.length,
      reviewers: reviewers.map((r) => ({ id: r._id, name: r.name, email: r.email })),
    });
  } catch (error: any) {
    console.error('Error requesting review:', error);
    return NextResponse.json(
      { error: 'Failed to request review', details: error.message },
      { status: 500 }
    );
  }
}
