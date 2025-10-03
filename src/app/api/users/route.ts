import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { authenticateUser, requireOrgAdmin, enforceDataIsolation } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Authenticate user
    const authUser = await authenticateUser(request);
    requireOrgAdmin(authUser);

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
    query = await enforceDataIsolation(authUser, query);

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
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}