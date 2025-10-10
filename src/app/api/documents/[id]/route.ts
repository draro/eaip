import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { webhookService } from '@/lib/webhooks';
import { remoteStorage } from '@/lib/remoteStorage';
import { gitService } from '@/lib/gitService';
import User from '@/models/User';
import WorkflowTemplate from '@/models/Workflow';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';

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
      workflowId,
    } = body;

    const document = await AIPDocument.findById(params.id).populate('version').populate('organization');
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

    // Check workflow permissions if status is changing
    if (status && status !== document.status) {
      const session = await getServerSession(authOptions);
      const currentUser = session?.user as any;

      if (!currentUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Check workflow permissions
      const permissionCheck = await checkWorkflowPermission(
        currentUser,
        document,
        status,
        workflowId
      );

      if (!permissionCheck.allowed) {
        return NextResponse.json(
          { success: false, error: permissionCheck.message },
          { status: 403 }
        );
      }
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
    'draft': ['review', 'approved', 'published'],
    'review': ['draft', 'approved', 'published'],
    'approved': ['draft', 'published'],
    'published': ['draft', 'archived'],
    'archived': ['draft'],
  };

  return validTransitions[currentStatus]?.includes(newStatus) || false;
}

// Check if user has permission to perform workflow transition
async function checkWorkflowPermission(
  user: any,
  document: any,
  newStatus: string,
  workflowId?: string
): Promise<{ allowed: boolean; message: string }> {
  // Super admins can always transition
  if (user.role === 'super_admin') {
    return { allowed: true, message: 'OK' };
  }

  // If no workflow specified, use basic role checks
  if (!workflowId) {
    const canEdit = ['org_admin', 'editor'].includes(user.role);
    return {
      allowed: canEdit,
      message: canEdit ? 'OK' : 'Insufficient permissions to change document status'
    };
  }

  try {
    // Fetch the workflow
    const workflow = await WorkflowTemplate.findById(workflowId);
    if (!workflow) {
      return { allowed: false, message: 'Workflow not found' };
    }

    // Find the step that corresponds to the new status
    const targetStep = workflow.steps.find((step: any) =>
      step.name.toLowerCase() === newStatus.toLowerCase() ||
      step.id === newStatus
    );

    if (!targetStep) {
      // If no specific step found, use basic role check
      const canEdit = ['org_admin', 'editor'].includes(user.role);
      return {
        allowed: canEdit,
        message: canEdit ? 'OK' : 'Insufficient permissions'
      };
    }

    // Check if user is assigned to this step
    if (targetStep.assignedUsers && targetStep.assignedUsers.length > 0) {
      const isAssigned = targetStep.assignedUsers.some(
        (assignedUserId: any) => assignedUserId.toString() === user._id?.toString()
      );

      if (!isAssigned) {
        return {
          allowed: false,
          message: `You are not assigned to the "${targetStep.name}" step. Only assigned users can transition to this status.`
        };
      }
    }

    // Check role requirements
    if (targetStep.requiredRole) {
      const roleHierarchy: Record<string, number> = {
        'viewer': 1,
        'editor': 2,
        'org_admin': 3,
        'super_admin': 4
      };

      const userRoleLevel = roleHierarchy[user.role] || 0;
      const requiredRoleLevel = roleHierarchy[targetStep.requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return {
          allowed: false,
          message: `Insufficient role. This step requires "${targetStep.requiredRole}" role or higher.`
        };
      }
    }

    // Check workflow role requirements
    if (targetStep.requiredWorkflowRole) {
      const userDoc = await User.findById(user._id);
      const hasWorkflowRole = userDoc?.workflowRoles?.includes(targetStep.requiredWorkflowRole);

      if (!hasWorkflowRole) {
        return {
          allowed: false,
          message: `This step requires the "${targetStep.requiredWorkflowRole}" workflow role.`
        };
      }
    }

    return { allowed: true, message: 'OK' };
  } catch (error) {
    console.error('Error checking workflow permission:', error);
    return { allowed: false, message: 'Error validating workflow permissions' };
  }
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