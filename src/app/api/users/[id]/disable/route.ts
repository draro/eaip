import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateUser, requireOrgAdmin, canManageOrganization } from '@/lib/auth';

export async function PUT(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }


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

    // Prevent disabling super_admin users unless the requester is also super_admin
    if (user.role === 'super_admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admins can disable other super admin users' },
        { status: 403 }
      );
    }

    // Prevent self-disabling
    if (user._id.toString() === authUser._id) {
      return NextResponse.json(
        { success: false, error: 'Cannot disable your own account' },
        { status: 403 }
      );
    }

    // Disable user (deactivate account)
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      {
        isActive: false,
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
      message: 'User disabled successfully'
    });
  } catch (error) {
    console.error('Error disabling user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to disable user' },
      { status: 500 }
    );
  }
}
