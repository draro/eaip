import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import Domain from '@/models/Domain';
import { DNSChecker, domainService } from '@/lib/domainServer';

interface RouteParams {
  params: { id: string };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession();

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (!['org_admin', 'super_admin'].includes(session.user.role)) {
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
    if (session.user.role !== 'super_admin') {
      if (session.user.organizationId !== domain.organizationId.toString()) {
        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        );
      }
    }

    // Perform DNS verification
    const dnsResults = await DNSChecker.checkDNSRecords(domain.domain);
    const ownershipVerified = await DNSChecker.verifyDomainOwnership(
      domain.domain,
      domain.verificationToken || 'default-token'
    );

    // Update domain with verification results
    if (dnsResults.verified || ownershipVerified) {
      domain.isVerified = true;
      domain.verifiedAt = new Date();
      domain.lastCheckedAt = new Date();

      // Update DNS records
      if (dnsResults.cname) {
        await domain.updateDnsRecord('CNAME', dnsResults.cname, true);
      }

      if (dnsResults.a && dnsResults.a.length > 0) {
        await domain.updateDnsRecord('A', dnsResults.a[0], true);
      }
    } else {
      domain.lastCheckedAt = new Date();
      await domain.save();
    }

    // Clear domain cache to force refresh
    domainService.clearCache(domain.domain);

    await domain.populate('organizationId', 'name domain status');

    return NextResponse.json({
      success: true,
      data: domain,
      verification: {
        dnsVerified: dnsResults.verified,
        ownershipVerified,
        dnsRecords: dnsResults,
      },
      message: domain.isVerified
        ? 'Domain verified successfully'
        : 'Domain verification failed - please check your DNS settings'
    });

  } catch (error) {
    console.error('Error verifying domain:', error);
    return NextResponse.json(
      { success: false, error: 'Domain verification failed' },
      { status: 500 }
    );
  }
}