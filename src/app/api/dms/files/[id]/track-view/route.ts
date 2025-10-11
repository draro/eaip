import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import FileView from '@/models/FileView';
import User from '@/models/User';

/**
 * POST /api/dms/files/[id]/track-view
 * Record a new view of a file
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

    // Find the file
    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check permissions
    if (file.organization?.toString() !== user.organization?.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view this file' },
        { status: 403 }
      );
    }

    if (!file.canUserAccess(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to view this file' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { viewType = 'preview', ipAddress, userAgent } = body;

    // Create file view record
    const fileView = await FileView.create({
      file: file._id,
      user: user._id,
      organization: user.organization,
      viewedAt: new Date(),
      viewType,
      ipAddress,
      userAgent,
      duration: 0,
      completedView: false,
    });

    // Increment file view count
    await file.incrementViewCount();

    return NextResponse.json({
      success: true,
      viewId: fileView._id,
      message: 'View tracked successfully',
    });
  } catch (error: any) {
    console.error('Error tracking view:', error);
    return NextResponse.json(
      { error: 'Failed to track view', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/dms/files/[id]/track-view
 * Update view duration and completion status
 */
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

    const body = await req.json();
    const { viewId, duration, completedView, metadata } = body;

    if (!viewId) {
      return NextResponse.json(
        { error: 'View ID is required' },
        { status: 400 }
      );
    }

    // Update the view record
    const fileView = await FileView.findById(viewId);
    if (!fileView) {
      return NextResponse.json({ error: 'View record not found' }, { status: 404 });
    }

    if (duration !== undefined) {
      fileView.duration = duration;
    }
    if (completedView !== undefined) {
      fileView.completedView = completedView;
    }
    if (metadata) {
      fileView.metadata = { ...fileView.metadata, ...metadata };
    }

    await fileView.save();

    return NextResponse.json({
      success: true,
      message: 'View updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating view:', error);
    return NextResponse.json(
      { error: 'Failed to update view', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/dms/files/[id]/track-view
 * Get view history for a file (admin only)
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

    // Only admins can view detailed analytics
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const file = await DMSFile.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Get view statistics
    const [viewCount, uniqueViewers, avgDuration, recentViewers] = await Promise.all([
      FileView.getFileViewCount(file._id),
      FileView.getUniqueViewers(file._id),
      FileView.getAverageViewDuration(file._id),
      FileView.getRecentViewers(file._id, 20),
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        totalViews: viewCount,
        uniqueViewers,
        averageDuration: avgDuration,
        downloadCount: file.downloadCount,
      },
      recentViewers,
    });
  } catch (error: any) {
    console.error('Error fetching view history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch view history', details: error.message },
      { status: 500 }
    );
  }
}
