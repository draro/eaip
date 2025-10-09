import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const GET = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    await connectDB();

    // Check permissions - only org_admin and super_admin can fetch users
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to fetch users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const organization = searchParams.get('organization') || '';
    const active = searchParams.get('active');

    // Build query with data isolation
    let query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    if (role) {
      query.role = role;
    }

    if (organization) {
      query.organization = organization;
    }

    if (active !== null && active !== undefined) {
      query.isActive = active === 'true';
    }

    // Apply data isolation (org admins can only see users in their organization)
    if (user.role !== 'super_admin') {
      if (!user.organization?._id) {
        return NextResponse.json(
          { success: false, error: 'User not associated with any organization' },
          { status: 403 }
        );
      }
      query.organization = user.organization._id;
      console.log('Filtering users for org_admin:', {
        userRole: user.role,
        userName: user.name,
        userOrgId: user.organization._id,
        userOrgName: user.organization.name,
        query
      });
    } else {
      console.log('Super admin fetching all users, no organization filter');
    }

    const skip = (page - 1) * limit;

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('organization', 'name domain')
        .populate('createdBy', 'name email')
        .select('-password') // Exclude password from response
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    console.log('Fetched users:', users.map((u: any) => ({
      name: u.name,
      email: u.email,
      role: u.role,
      orgId: u.organization?._id?.toString(),
      orgName: u.organization?.name
    })));

    // Log access
    DataIsolationService.logAccess(user, 'users', 'read', true);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch users');
  }
});