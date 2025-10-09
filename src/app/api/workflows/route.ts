import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowTemplate, { DEFAULT_WORKFLOWS } from '@/models/Workflow';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType');

    // Build filter
    let filter: any = { isActive: true };

    // Super admin sees all workflows, others see org-specific + defaults
    if (user.role !== 'super_admin') {
      filter.$or = [
        { isDefault: true },
        { organization: user.organization?._id }
      ];
    }

    if (documentType) {
      filter.documentTypes = documentType;
    }

    const workflows = await WorkflowTemplate.find(filter)
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email')
      .sort({ isDefault: -1, name: 1 });

    // Log access
    DataIsolationService.logAccess(user, 'workflows', 'read', true);

    return NextResponse.json({
      success: true,
      data: workflows
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch workflows');
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      description,
      documentTypes,
      steps,
      organizationId
    } = body;

    // Validate required fields
    if (!name || !documentTypes || !steps || steps.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, documentTypes, and steps are required' },
        { status: 400 }
      );
    }

    // Check permissions
    if (user.role === 'viewer' || user.role === 'editor') {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to create workflows' },
        { status: 403 }
      );
    }

    // Determine target organization
    let targetOrganizationId = null;
    let isDefault = false;

    if (user.role === 'super_admin') {
      if (organizationId) {
        targetOrganizationId = organizationId;
      } else {
        // Super admin creating default workflow
        isDefault = true;
      }
    } else {
      // Admin creating org-specific workflow
      targetOrganizationId = user.organization?._id;
    }

    // Validate steps
    const stepIds = new Set(steps.map((s: any) => s.id));
    for (const step of steps) {
      for (const transition of step.allowedTransitions || []) {
        if (!stepIds.has(transition)) {
          return NextResponse.json(
            { success: false, error: `Invalid transition: ${transition} does not exist in workflow steps` },
            { status: 400 }
          );
        }
      }
    }

    const workflowData: any = {
      name,
      description,
      documentTypes,
      steps,
      isDefault,
      organization: targetOrganizationId,
      createdBy: user._id,
      updatedBy: user._id
    };

    const workflow = await WorkflowTemplate.create(workflowData);

    const populatedWorkflow = await WorkflowTemplate.findById(workflow._id)
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email');

    // Log creation
    DataIsolationService.logAccess(user, 'workflows', 'create', true);

    return NextResponse.json(
      { success: true, data: populatedWorkflow },
      { status: 201 }
    );
  } catch (error) {
    return createErrorResponse(error, 'Failed to create workflow');
  }
});
