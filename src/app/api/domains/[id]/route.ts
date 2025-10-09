import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/apiMiddleware';
import connectDB from '@/lib/mongodb';
import Domain from '@/models/Domain';
import { DNSChecker } from '@/lib/domainServer';

interface RouteParams {
  params?: { id: string };
}

export const GET = withAuth(async (request: NextRequest, context: { params?: { id: string }; user: any }) => {
  try {
    const { params, user } = context;

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      );
    }
    await connectDB();

    const domain = await Domain.findById(params.id)
      .populate('organizationId', 'name domain status');

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'super_admin') {
      if (!user.organization || user.organization._id !== domain.organizationId._id.toString()) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: domain
    });

  } catch (error) {
    console.error('Error fetching domain:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, context: { params?: { id: string }; user: any }) => {
  try {
    const { params, user } = context;

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    if (!['org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { isActive, sslStatus } = body;

    await connectDB();

    const domain = await Domain.findById(params.id);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'super_admin') {
      if (!user.organization || user.organization._id !== domain.organizationId.toString()) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Update domain
    if (typeof isActive === 'boolean') {
      domain.isActive = isActive;
    }

    if (sslStatus && ['pending', 'active', 'failed', 'expired'].includes(sslStatus)) {
      domain.sslStatus = sslStatus;
    }

    await domain.save();
    await domain.populate('organizationId', 'name domain status');

    return NextResponse.json({
      success: true,
      data: domain,
      message: 'Domain updated successfully'
    });

  } catch (error) {
    console.error('Error updating domain:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const DELETE = withAuth(async (request: NextRequest, context: { params?: { id: string }; user: any }) => {
  try {
    const { params, user } = context;

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Domain ID is required' },
        { status: 400 }
      );
    }

    if (!['org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await connectDB();

    const domain = await Domain.findById(params.id);

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain not found' },
        { status: 404 }
      );
    }

    // Check permissions
    if (user.role !== 'super_admin') {
      if (!user.organization || user.organization._id !== domain.organizationId.toString()) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    await Domain.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Domain deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting domain:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});