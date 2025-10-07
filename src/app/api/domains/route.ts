import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Domain from '@/models/Domain';
import Organization from '@/models/Organization';
import { DNSChecker } from '@/lib/domainServer';
import { withAuth } from '@/lib/apiMiddleware';

export const GET = withAuth(async (request: NextRequest, { user }: any) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    // Super admins can see all domains
    if (user.role === 'super_admin') {
      const query = organizationId ? { organizationId } : {};
      const domains = await Domain.find(query)
        .populate('organizationId', 'name domain status')
        .sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        data: domains
      });
    }

    // Organization admins can only see their own domains
    if (user.role === 'org_admin' && user.organization) {
      const domains = await Domain.find({
        organizationId: user.organization._id
      }).populate('organizationId', 'name domain status')
        .sort({ createdAt: -1 });

      return NextResponse.json({
        success: true,
        data: domains
      });
    }

    return NextResponse.json(
      { success: false, error: 'Insufficient permissions' },
      { status: 403 }
    );

  } catch (error) {
    console.error('Error fetching domains:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export const POST = withAuth(async (request: NextRequest, { user }: any) => {
  try {
    // Only org admins and super admins can create domains
    if (!['org_admin', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { domain, organizationId } = body;

    if (!domain) {
      return NextResponse.json(
        { success: false, error: 'Domain is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Determine target organization
    let targetOrgId = organizationId;
    if (user.role === 'org_admin') {
      // Org admins can only create domains for their own organization
      targetOrgId = user.organization?._id;
    }

    if (!targetOrgId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID is required' },
        { status: 400 }
      );
    }

    // Check if organization exists
    const organization = await Organization.findById(targetOrgId);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check if domain is already taken
    const existingDomain = await Domain.findOne({ domain: domain.toLowerCase() });
    if (existingDomain) {
      return NextResponse.json(
        { success: false, error: 'Domain is already registered' },
        { status: 409 }
      );
    }

    // Create new domain
    const newDomain = new Domain({
      domain: domain.toLowerCase(),
      organizationId: targetOrgId,
      isActive: true,
      isVerified: false,
      sslStatus: 'pending'
    });

    await newDomain.save();

    // Populate the organization data
    await newDomain.populate('organizationId', 'name domain status');

    return NextResponse.json({
      success: true,
      data: newDomain,
      message: 'Domain created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating domain:', error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'Domain already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});