import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateUser, requireOrgAdmin, canManageOrganization } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    // Authenticate user
    const authUser = await authenticateUser(request);
    requireOrgAdmin(authUser);

    // Find user
    const user = await User.findById(params.id).populate('organization');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if auth user can manage this user's organization
    if (!canManageOrganization(authUser, user.organization?._id?.toString() || '')) {
      return NextResponse.json(
        { success: false, error: 'Access denied: Cannot manage users in this organization' },
        { status: 403 }
      );
    }

    // Enable user (activate account)
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      {
        isActive: true,
        deletedAt: null,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email')
      .select('-password');

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User enabled successfully'
    });
  } catch (error) {
    console.error('Error enabling user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to enable user' },
      { status: 500 }
    );
  }
}