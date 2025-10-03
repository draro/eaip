import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { generateAiracCycle } from '@/lib/utils';
import { withAuth, createErrorResponse, paginateQuery } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const { page, limit, skip } = paginateQuery(request);
    const versionId = searchParams.get('versionId');
    const status = searchParams.get('status');
    const documentType = searchParams.get('documentType');

    // Build base filter with organization isolation
    let filter = DataIsolationService.enforceOrganizationFilter(user);

    if (versionId) filter.version = versionId;
    if (status) filter.status = status;
    if (documentType) filter.documentType = documentType;

    // Log access attempt
    DataIsolationService.logAccess(user, 'documents', 'read', true);

    const [documents, total] = await Promise.all([
      AIPDocument.find(filter)
        .populate('version', 'versionNumber airacCycle effectiveDate')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .populate('organization', 'name domain')
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit),
      AIPDocument.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch documents');
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      documentType,
      country,
      airport,
      sections,
      versionId,
      effectiveDate,
      metadata,
      organizationId
    } = body;

    // Validate required fields for new multi-tenant structure
    if (!title || !documentType || !country || !versionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, documentType, country, and versionId are required' },
        { status: 400 }
      );
    }

    // Validate ICAO codes
    if (country.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Country code must be exactly 2 characters (ICAO format)' },
        { status: 400 }
      );
    }

    if (airport && airport.length !== 4) {
      return NextResponse.json(
        { success: false, error: 'Airport code must be exactly 4 characters (ICAO format) or omitted' },
        { status: 400 }
      );
    }

    // Determine which organization to use
    let targetOrganizationId = null;
    if (user.role === 'super_admin') {
      // Super admin can specify organization
      if (!organizationId) {
        return NextResponse.json(
          { success: false, error: 'Super admin must specify an organizationId' },
          { status: 400 }
        );
      }
      targetOrganizationId = organizationId;
    } else {
      // Regular users use their own organization
      if (!user.organization) {
        return NextResponse.json(
          { success: false, error: 'User must belong to an organization' },
          { status: 400 }
        );
      }
      targetOrganizationId = user.organization._id;
    }

    // Check if user can create documents
    if (user.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create documents' },
        { status: 403 }
      );
    }

    // Validate document creation limits
    const currentDocCount = await AIPDocument.countDocuments({
      organization: targetOrganizationId
    });

    await DataIsolationService.validateDocumentCreation(
      targetOrganizationId,
      currentDocCount
    );

    const version = await AIPVersion.findById(versionId);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Check for existing document with same criteria
    const existingDocQuery: any = {
      country: country.toUpperCase(),
      version: versionId,
      documentType,
      organization: targetOrganizationId
    };

    if (airport) {
      existingDocQuery.airport = airport.toUpperCase();
    }

    const existingDoc = await AIPDocument.findOne(existingDocQuery);

    if (existingDoc) {
      return NextResponse.json(
        {
          success: false,
          error: `Document with these criteria already exists for this version`,
          details: {
            existingDocumentId: existingDoc._id,
            existingDocumentTitle: existingDoc.title,
            message: `A ${documentType} document for country ${country.toUpperCase()}${airport ? ` at airport ${airport.toUpperCase()}` : ''} already exists in this version.`
          }
        },
        { status: 409 }
      );
    }

    // Get organization name for metadata
    const Organization = (await import('@/models/Organization')).default;
    const targetOrg = await Organization.findById(targetOrganizationId);

    // Create document with organization isolation
    const documentData: any = {
      title,
      documentType,
      country: country.toUpperCase(),
      airport: airport?.toUpperCase() || undefined,
      sections: sections || [],
      version: versionId,
      organization: targetOrganizationId,
      createdBy: user._id,
      updatedBy: user._id,
      airacCycle: version.airacCycle,
      effectiveDate: effectiveDate || version.effectiveDate,
      metadata: {
        language: metadata?.language || 'en',
        authority: metadata?.authority || targetOrg?.name || 'Authority',
        contact: metadata?.contact || 'contact@authority.gov',
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    };

    const document = await AIPDocument.create(documentData);

    await AIPVersion.findByIdAndUpdate(versionId, {
      $push: { documents: document._id },
    });

    // Log creation
    DataIsolationService.logAccess(user, 'documents', 'create', true);

    const populatedDocument = await AIPDocument.findById(document._id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('organization', 'name domain');

    // Send webhook notification
    const webhookPayload = {
      event: 'document.created' as const,
      docId: document._id.toString(),
      title: document.title,
      updatedBy: user._id,
      timestamp: new Date().toISOString(),
      data: {
        documentType: document.documentType,
        country: document.country,
        airport: document.airport,
        status: document.status,
        organizationId: user.organization._id
      },
    };

    try {
      if (process.env.N8N_WEBHOOK_URL) {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
      }
    } catch (webhookError) {
      console.error('Failed to send webhook:', webhookError);
    }

    return NextResponse.json(
      { success: true, data: populatedDocument },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Failed to create document');
  }
});