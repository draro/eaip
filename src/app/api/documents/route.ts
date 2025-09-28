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
      metadata
    } = body;

    // Validate required fields for new multi-tenant structure
    if (!title || !documentType || !country || !versionId || !user.organization) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user can create documents
    if (!user.canEdit()) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create documents' },
        { status: 403 }
      );
    }

    // Validate document creation limits
    const currentDocCount = await AIPDocument.countDocuments({
      organization: user.organization._id
    });

    await DataIsolationService.validateDocumentCreation(
      user.organization._id,
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
    const existingDoc = await AIPDocument.findOne({
      organization: user.organization._id,
      country: country.toUpperCase(),
      airport: airport?.toUpperCase(),
      version: versionId,
      documentType
    });

    if (existingDoc) {
      return NextResponse.json(
        { success: false, error: 'Document with these criteria already exists for this version' },
        { status: 409 }
      );
    }

    // Create document with organization isolation
    const document = await AIPDocument.create({
      title,
      documentType,
      country: country.toUpperCase(),
      airport: airport?.toUpperCase(),
      sections: sections || [],
      version: versionId,
      organization: user.organization._id,
      createdBy: user._id,
      updatedBy: user._id,
      airacCycle: version.airacCycle,
      effectiveDate: effectiveDate || version.effectiveDate,
      metadata: {
        language: metadata?.language || 'en',
        authority: metadata?.authority || user.organization?.name || 'Authority',
        contact: metadata?.contact || user.organization?.contact?.email || 'contact@authority.gov',
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    });

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