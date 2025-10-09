import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orgId, domain } = body;

    if (!orgId || !domain) {
      return NextResponse.json(
        { success: false, error: 'orgId and domain are required' },
        { status: 400 }
      );
    }

    const org = await Organization.findById(orgId);

    if (!org) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    console.log('Before update:', org.toObject());

    org.domain = domain;

    if (!org.settings) {
      org.settings = {
        publicUrl: domain,
        timezone: 'UTC',
        language: 'en',
        enablePublicAccess: true,
        enableExport: true,
        allowedExportFormats: ['pdf', 'docx'],
        airacStartDate: new Date('2024-01-01'),
      };
    } else if (!org.settings.publicUrl) {
      org.settings.publicUrl = domain;
    }

    await org.save({ validateBeforeSave: false });

    console.log('After update:', org.toObject());

    return NextResponse.json({
      success: true,
      organization: org.toObject(),
    });
  } catch (error: any) {
    console.error('Error fixing organization domain:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fix organization domain' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectDB();

    const orgs = await Organization.find({}).lean();

    return NextResponse.json({
      success: true,
      organizations: orgs,
    });
  } catch (error: any) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}
