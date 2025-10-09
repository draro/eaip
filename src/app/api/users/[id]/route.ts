import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { authenticateUser, requireOrgAdmin, canManageOrganization } from '@/lib/auth';

export async function GET(
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
    const user = await User.findById(params?.id)
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email')
      .select('-password'); // Exclude password from response

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authUser = await authenticateUser(request);
    requireOrgAdmin(authUser);

    const body = await request.json();
    const {
      firstName,
      lastName,
      role,
      permissions,
      preferences,
      isActive
    } = body;

    // Find user
    const user = await User.findById(params?.id).populate('organization');
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

    // Validate role if provided
    if (role) {
      const validRoles = ['super_admin', 'org_admin', 'editor', 'viewer'];
      if (!validRoles.includes(role)) {
        return NextResponse.json(
          { success: false, error: 'Invalid role. Must be one of: super_admin, org_admin, editor, viewer' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    };

    if (firstName !== undefined) {
      updateData.firstName = firstName;
      updateData.name = `${firstName} ${lastName || user.lastName}`.trim();
    }
    if (lastName !== undefined) {
      updateData.lastName = lastName;
      updateData.name = `${firstName || user.firstName} ${lastName}`.trim();
    }
    if (role !== undefined) updateData.role = role;
    if (permissions !== undefined) updateData.permissions = permissions;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (preferences !== undefined) {
      updateData.preferences = { ...user.preferences, ...preferences };
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      params?.id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email')
      .select('-password');

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Authenticate user
    const authUser = await authenticateUser(request);
    requireOrgAdmin(authUser);

    const { searchParams } = new URL(request.url);
    const hardDelete = searchParams.get('hard') === 'true';

    // Find user
    const user = await User.findById(params?.id).populate('organization');
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

    // Prevent deletion of super_admin users unless the requester is also super_admin
    if (user.role === 'super_admin' && authUser.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admins can delete other super admin users' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (user._id.toString() === authUser._id) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete your own account' },
        { status: 403 }
      );
    }

    let result;
    let message;

    if (hardDelete && authUser.role === 'super_admin') {
      // Hard delete: completely remove from database (super admin only)
      await User.findByIdAndDelete(params?.id);
      result = { _id: params?.id };
      message = 'User permanently deleted from database';
    } else {
      // Soft delete: deactivate user (preserves data integrity and audit trails)
      result = await User.findByIdAndUpdate(
        params?.id,
        {
          isActive: false,
          deletedAt: new Date(),
          email: `deleted_${Date.now()}_${user.email}` // Prevent email conflicts
        },
        { new: true }
      ).select('-password');
      message = 'User deactivated successfully';
    }

    return NextResponse.json({
      success: true,
      data: result,
      message
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}