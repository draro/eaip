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
    const { documentId, targetAiracCycle, title } = body;

    if (!documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: documentId' },
        { status: 400 }
      );
    }

    if (!targetAiracCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: targetAiracCycle (e.g., "2024-10")' },
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

    let targetVersion = await AIPVersion.findOne({ airacCycle: targetAiracCycle });

    if (!targetVersion) {
      const [year, cycleNum] = targetAiracCycle.split('-');
      const cycleNumber = parseInt(cycleNum);
      const baseDate = new Date(parseInt(year), 0, 1);
      const daysSinceStart = (cycleNumber - 1) * 28;
      const effectiveDate = new Date(baseDate.getTime() + daysSinceStart * 24 * 60 * 60 * 1000);

      targetVersion = await AIPVersion.create({
        versionNumber: `v${targetAiracCycle}`,
        airacCycle: targetAiracCycle,
        effectiveDate,
        status: 'draft',
        description: `AIRAC Cycle ${targetAiracCycle}`,
        createdBy: user._id,
        documents: []
      });
    }

    const checkDuplicate = await AIPDocument.findOne({
      organization: targetOrganizationId,
      country: sourceDoc.country,
      airport: sourceDoc.airport,
      documentType: sourceDoc.documentType,
      airacCycle: targetAiracCycle,
      version: targetVersion._id
    });

    if (checkDuplicate) {
      return NextResponse.json(
        {
          success: false,
          error: 'A document for this AIRAC cycle already exists',
          details: {
            existingDocumentId: checkDuplicate._id,
            existingDocumentTitle: checkDuplicate.title
          }
        },
        { status: 409 }
      );
    }

    const defaultTitle = `${sourceDoc.title.replace(/\s+AIRAC\s+\d{4}(-\d{2})?/i, '').trim()} - AIRAC ${targetAiracCycle}`;

    const clonedDocData = {
      title: title || defaultTitle,
      documentType: sourceDoc.documentType,
      country: sourceDoc.country,
      airport: sourceDoc.airport,
      sections: sourceDoc.sections.map((section: any) => {
        const sectionObj = section.toObject ? section.toObject() : section;
        return {
          ...sectionObj,
          _id: undefined,
          subsections: sectionObj.subsections?.map((subsection: any) => {
            const subObj = subsection.toObject ? subsection.toObject() : subsection;
            return {
              ...subObj,
              _id: undefined,
              lastModified: new Date(),
              modifiedBy: user._id
            };
          }) || []
        };
      }),
      version: targetVersion._id,
      organization: targetOrganizationId,
      createdBy: user._id,
      updatedBy: user._id,
      airacCycle: targetAiracCycle,
      effectiveDate: targetVersion.effectiveDate,
      status: 'draft',
      parentDocument: sourceDoc._id,
      metadata: {
        language: sourceDoc.metadata.language,
        authority: sourceDoc.metadata.authority,
        contact: sourceDoc.metadata.contact,
        lastReview: new Date(),
        nextReview: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    };

    const clonedDoc = await AIPDocument.create(clonedDocData);

    await AIPVersion.findByIdAndUpdate(targetVersion._id, {
      $push: { documents: clonedDoc._id }
    });

    // Log creation
    DataIsolationService.logAccess(user, 'documents', 'clone', true);

    const populatedDoc = await AIPDocument.findById(clonedDoc._id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('organization', 'name domain')
      .populate('parentDocument', 'title airacCycle');

    return NextResponse.json(
      {
        success: true,
        data: populatedDoc,
        message: `Document cloned successfully for AIRAC cycle ${targetAiracCycle}`
      },
      { status: 201 }
    );

  } catch (error) {
    return createErrorResponse(error, 'Failed to clone document');
  }
});
