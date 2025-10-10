import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { webhookService } from '@/lib/webhooks';
import { remoteStorage } from '@/lib/remoteStorage';
import { gitService } from '@/lib/gitService';
import User from '@/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await AIPDocument.findById(params.id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const {
      title,
      documentType,
      country,
      airport,
      sections,
      status,
      metadata,
      updatedBy,
    } = body;

    const document = await AIPDocument.findById(params.id).populate('version');
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check status transition validity
    if (status && !isValidStatusTransition(document.status, status)) {
      return NextResponse.json(
        { success: false, error: `Invalid status transition from ${document.status} to ${status}` },
        { status: 400 }
      );
    }

    // Get or create a default user if updatedBy is not provided
    const userId = updatedBy || await getOrCreateDefaultUser();

    // Get current active AIRAC cycle
    const activeVersion = await AIPVersion.findOne({ status: 'active' }).sort({ effectiveDate: -1 });
    if (activeVersion) {
      document.airacCycle = activeVersion.airacCycle;
      document.version = activeVersion._id;

      // Update effective date to match the active version
      if (activeVersion.effectiveDate) {
        document.effectiveDate = activeVersion.effectiveDate;
      }
    }

    if (title !== undefined) document.title = title;
    if (documentType !== undefined) document.documentType = documentType;
    if (country !== undefined) document.country = country;
    if (airport !== undefined) document.airport = airport;
    if (sections !== undefined) {
      console.log('Received sections to save:', JSON.stringify(sections, null, 2));
      document.sections = sections;
      // Update lastModified for all subsections
      document.sections.forEach((section: any) => {
        if (section.subsections && Array.isArray(section.subsections)) {
          section.subsections.forEach((subsection: any) => {
            subsection.lastModified = new Date();
            subsection.modifiedBy = userId;
          });
        }
      });
      document.markModified('sections');
      console.log('Sections after processing:', JSON.stringify(document.sections, null, 2));
    }
    if (status !== undefined) document.status = status;
    if (metadata !== undefined) {
      document.metadata = { ...document.metadata, ...metadata };
    }

    document.updatedBy = userId;
    document.updatedAt = new Date();

    const updatedDocument = await document.save();

    await updatedDocument.populate('version', 'versionNumber airacCycle');
    await updatedDocument.populate('createdBy', 'name email');
    await updatedDocument.populate('updatedBy', 'name email');
    await updatedDocument.populate('organization');

    console.log('Updated document sections:', JSON.stringify(updatedDocument?.sections, null, 2));

    // Commit to Git
    try {
      const user = await User.findById(userId);
      const commitResult = await gitService.commitDocument(
        updatedDocument.organization._id.toString(),
        updatedDocument,
        userId.toString(),
        user?.name || 'System User',
        user?.email || 'system@eaip.local'
      );

      if (commitResult.success) {
        console.log('Document committed to Git:', commitResult.commitHash);
      } else {
        console.error('Failed to commit to Git:', commitResult.error);
      }
    } catch (gitError) {
      console.error('Error during Git commit:', gitError);
      // Don't fail the save operation if Git commit fails
    }

    // Push to remote storage if configured
    if (remoteStorage.isConfigured()) {
      try {
        await remoteStorage.pushDocumentVersion(
          params.id,
          updatedDocument!.version.toString(),
          updatedDocument,
          userId
        );
      } catch (error) {
        console.error('Failed to push to remote storage:', error);
      }
    }

    // Send webhook notification
    await webhookService.sendDocumentUpdate(
      params.id,
      updatedDocument!.title,
      userId,
      {
        country: updatedDocument!.country,
        airport: updatedDocument!.airport,
        status: updatedDocument!.status,
        sectionsCount: updatedDocument!.sections.length,
        contentChanged: sections !== undefined,
      }
    );

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

function isValidStatusTransition(currentStatus: string, newStatus: string): boolean {
  const validTransitions: Record<string, string[]> = {
    'draft': ['review', 'published'],
    'review': ['draft', 'published'],
    'published': ['draft'], // Can only go back to draft for revisions
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const document = await AIPDocument.findById(params.id);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Check if document can be deleted (only drafts can be deleted)
    if (document.status === 'published') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete published documents. Please create a new revision instead.' },
        { status: 403 }
      );
    }

    // Remove document from version
    await AIPVersion.findByIdAndUpdate(document.version, {
      $pull: { documents: params.id },
    });

    // Delete the document
    await AIPDocument.findByIdAndDelete(params.id);

    // Send webhook notification
    await webhookService.sendDocumentDeleted(
      params.id,
      document.title,
      {
        country: document.country,
        airport: document.airport,
        status: document.status,
        sectionsCount: document.sections.length,
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}