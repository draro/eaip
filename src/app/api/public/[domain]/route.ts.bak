import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';

export async function GET(
  request: NextRequest,
  { params }: { params: { domain: string } }
) {
  try {
    await connectDB();

    // Ensure AIPVersion model is registered
    if (!AIPVersion) {
      throw new Error('AIPVersion model not loaded');
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

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

    switch (action) {
      case 'info':
        // Return organization info for branding
        return NextResponse.json({
          success: true,
          data: {
            name: organization.name,
            country: organization.country,
            icaoCode: organization.icaoCode,
            branding: organization.branding,
            contact: {
              email: organization.contact.email,
              website: organization.contact.website
            },
            settings: {
              language: organization.settings.language,
              timezone: organization.settings.timezone
            }
          }
        });

      case 'documents':
        // Return published documents
        const documents = await AIPDocument.find({
          organization: organization._id,
          status: 'published'
        })
          .populate('version', 'versionNumber airacCycle effectiveDate')
          .select('title documentType country airport airacCycle effectiveDate metadata version')
          .sort({ effectiveDate: -1 });

        return NextResponse.json({
          success: true,
          data: documents
        });

      case 'search':
        // Search within published documents
        const searchTerm = searchParams.get('q') || '';
        const documentType = searchParams.get('type') || '';

        const searchQuery: any = {
          organization: organization._id,
          status: 'published'
        };

        if (searchTerm) {
          searchQuery.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { 'sections.title': { $regex: searchTerm, $options: 'i' } },
            { 'sections.subsections.title': { $regex: searchTerm, $options: 'i' } },
            { 'sections.subsections.content': { $regex: searchTerm, $options: 'i' } }
          ];
        }

        if (documentType) {
          searchQuery.documentType = documentType;
        }

        const searchResults = await AIPDocument.find(searchQuery)
          .populate('version', 'versionNumber airacCycle effectiveDate')
          .select('title documentType country airport airacCycle effectiveDate metadata version')
          .limit(50)
          .sort({ effectiveDate: -1 });

        return NextResponse.json({
          success: true,
          data: searchResults
        });

      default:
        // Return organization overview
        const totalDocuments = await AIPDocument.countDocuments({
          organization: organization._id,
          status: 'published'
        });

        const latestDocuments = await AIPDocument.find({
          organization: organization._id,
          status: 'published'
        })
          .populate('version', 'versionNumber airacCycle effectiveDate')
          .select('title documentType country airport airacCycle effectiveDate metadata version')
          .sort({ effectiveDate: -1 })
          .limit(10);

        return NextResponse.json({
          success: true,
          data: {
            organization: {
              name: organization.name,
              country: organization.country,
              icaoCode: organization.icaoCode,
              branding: organization.branding,
              contact: {
                email: organization.contact.email,
                website: organization.contact.website
              },
              settings: {
                enableExport: organization.settings.enableExport,
                allowedExportFormats: organization.settings.allowedExportFormats
              }
            },
            statistics: {
              totalDocuments
            },
            latestDocuments
          }
        });
    }
  } catch (error) {
    console.error('Error in public API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}