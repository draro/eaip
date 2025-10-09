import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    // Check permissions
    if (user.role === 'viewer') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to clone documents' },
        { status: 403 }
      );
    }

    // Fetch the source document
    const sourceDoc = await AIPDocument.findById(documentId)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('organization', 'name domain');

    if (!sourceDoc) {
      return NextResponse.json(
        { success: false, error: 'Source document not found' },
        { status: 404 }
      );
    }

    // Verify user has access to this document (organization isolation)
    if (user.role !== 'super_admin' &&
        sourceDoc.organization._id.toString() !== user.organization?._id?.toString()) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this document' },
        { status: 403 }
      );
    }

    // Determine target organization
    const targetOrganizationId = user.role === 'super_admin'
      ? sourceDoc.organization._id
      : user.organization?._id;

    if (!targetOrganizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 400 }
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

    // Create cloned document
    const clonedDocData = {
      title: `${sourceDoc.title} (Copy)`,
      documentType: sourceDoc.documentType,
      country: sourceDoc.country,
      airport: sourceDoc.airport,
      sections: sourceDoc.sections.map((section: any) => ({
        ...section.toObject(),
        _id: undefined // Generate new IDs for sections
      })),
      version: sourceDoc.version._id,
      organization: targetOrganizationId,
      createdBy: user._id,
      updatedBy: user._id,
      airacCycle: sourceDoc.airacCycle,
      effectiveDate: sourceDoc.effectiveDate,
      status: 'draft', // Always create clones as draft
      metadata: {
        ...sourceDoc.metadata,
        clonedFrom: sourceDoc._id,
        clonedAt: new Date(),
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    };

    const clonedDoc = await AIPDocument.create(clonedDocData);

    // Add to version's documents array
    await AIPVersion.findByIdAndUpdate(sourceDoc.version._id, {
      $push: { documents: clonedDoc._id }
    });

    // Log creation
    DataIsolationService.logAccess(user, 'documents', 'clone', true);

    const populatedDoc = await AIPDocument.findById(clonedDoc._id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('organization', 'name domain');

    return NextResponse.json(
      {
        success: true,
        data: populatedDoc,
        message: 'Document cloned successfully'
      },
      { status: 201 }
    );

  } catch (error) {
    return createErrorResponse(error, 'Failed to clone document');
  }
});
