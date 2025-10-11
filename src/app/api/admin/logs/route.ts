import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import AuditLog from '@/models/AuditLog';
import User from '@/models/User';

/**
 * GET /api/admin/logs
 *
 * Fetch audit logs with role-based access control
 *
 * Access Control:
 * - super_admin: Can access ALL logs (no filtering)
 * - org_admin: Can access logs filtered by their organization only
 * - Other roles: Forbidden
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Only super_admin and org_admin can access logs
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions to access audit logs' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const level = searchParams.get('level') || '';
    const action = searchParams.get('action') || '';
    const resource = searchParams.get('resource') || '';
    const userId = searchParams.get('userId') || '';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const search = searchParams.get('search') || '';

    // Build query based on role
    const query: any = {};

    // CRITICAL: Apply organization filter for org_admin
    if (user.role === 'org_admin') {
      query.organizationId = user.organization;
    }
    // super_admin sees all logs (no organizationId filter)

    // Apply filters
    if (level) {
      query.level = level;
    }

    if (action) {
      query.action = action;
    }

    if (resource) {
      query.resource = resource;
    }

    if (userId) {
      query.userId = userId;
    }

    // Date range filter
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    // Text search in message
    if (search) {
      query.message = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    // Fetch logs with pagination
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role')
        .populate('organizationId', 'name domain')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query)
    ]);

    // Get unique values for filters
    const [levels, actions, resources] = await Promise.all([
      AuditLog.distinct('level', user.role === 'org_admin' ? { organizationId: user.organization } : {}),
      AuditLog.distinct('action', user.role === 'org_admin' ? { organizationId: user.organization } : {}),
      AuditLog.distinct('resource', user.role === 'org_admin' ? { organizationId: user.organization } : {})
    ]);

    return NextResponse.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        filters: {
          levels: levels.sort(),
          actions: actions.sort(),
          resources: resources.sort()
        },
        userRole: user.role
      }
    });

  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs', details: error.message },
      { status: 500 }
    );
  }
}
