import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import AIPDocument from '@/models/AIPDocument';

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string; id: string } }
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const subsection = searchParams.get('subsection');

    // Find organization by domain
    const organization = await Organization.findOne({
      domain: params.domain.toLowerCase(),
      status: 'active'
    });

    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found or inactive' },
        { status: 404 }
      );
    }

    // Check if public access is enabled
    if (!organization.settings.enablePublicAccess) {
      return NextResponse.json(
        { success: false, error: 'Public access is disabled for this organization' },
        { status: 403 }
      );
    }

    // Find the document
    const document = await AIPDocument.findOne({
      _id: params.id,
      organization: organization._id,
      status: 'published'
    })
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found or not published' },
        { status: 404 }
      );
    }

    // If specific section/subsection is requested, filter the content
    let responseData = document.toObject();

    if (section) {
      const requestedSection = document.sections.find(s =>
        s.id === section || s.type === section
      );

      if (!requestedSection) {
        return NextResponse.json(
          { success: false, error: 'Section not found' },
          { status: 404 }
        );
      }

      if (subsection) {
        const requestedSubsection = requestedSection.subsections.find(sub =>
          sub.id === subsection || sub.code === subsection
        );

        if (!requestedSubsection) {
          return NextResponse.json(
            { success: false, error: 'Subsection not found' },
            { status: 404 }
          );
        }

        responseData = {
          ...responseData,
          sections: [{
            ...requestedSection.toObject(),
            subsections: [requestedSubsection.toObject()]
          }]
        };
      } else {
        responseData = {
          ...responseData,
          sections: [requestedSection.toObject()]
        };
      }
    }

    // Remove sensitive information for public access
    delete responseData.organization;
    delete responseData.__v;

    // Add organization branding info
    responseData.organizationBranding = {
      name: organization.name,
      branding: organization.branding,
      contact: {
        email: organization.contact.email,
        website: organization.contact.website
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching public document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}