import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowTemplate from '@/models/Workflow';
import AIPDocument from '@/models/AIPDocument';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const PATCH = withAuth(
  async (
    request: NextRequest,
    { params, user }: { params?: { id: string }; user: any }
  ) => {
    try {
      await connectDB();

      if (!params?.id) {
        return NextResponse.json(
          { success: false, error: "ID is required" },
          { status: 400 }
        );
      }
      const body = await request.json();
      const { isActive } = body;
      console.log("USER ==> ", user);
      // Check permissions - only org_admin and super_admin can modify workflows
      if (!["super_admin", "org_admin"].includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient permissions to modify workflows",
          },
          { status: 403 }
        );
      }

      // Fetch the workflow
      const workflow = await WorkflowTemplate.findById(params.id);

      if (!workflow) {
        return NextResponse.json(
          { success: false, error: "Workflow not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this workflow
      // Super admin can modify any workflow
      // Org admin can only modify workflows for their organization or default workflows
      if (user.role !== "super_admin") {
        if (
          !workflow.isDefault &&
          workflow.organization?.toString() !==
            user.organization?._id?.toString()
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "You do not have permission to modify this workflow",
            },
            { status: 403 }
          );
        }
      }

      // Update the workflow status
      if (typeof isActive === "boolean") {
        workflow.isActive = isActive;
        workflow.updatedBy = user._id;
        await workflow.save();
      }

      const populatedWorkflow = await WorkflowTemplate.findById(workflow._id)
        .populate("organization", "name domain")
        .populate("createdBy", "name email");

      // Log access
      DataIsolationService.logAccess(user, "workflows", "update", true);

      return NextResponse.json({
        success: true,
        data: populatedWorkflow,
      });
    } catch (error) {
      return createErrorResponse(error, "Failed to update workflow");
    }
  }
);

export const PUT = withAuth(
  async (
    request: NextRequest,
    { params, user }: { params?: { id: string }; user: any }
  ) => {
    try {
      await connectDB();

      if (!params?.id) {
        return NextResponse.json(
          { success: false, error: "ID is required" },
          { status: 400 }
        );
      }

      const body = await request.json();
      const { name, description, documentTypes, steps, isActive } = body;

      // Check permissions - only org_admin and super_admin can modify workflows
      if (!["super_admin", "org_admin"].includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: "Insufficient permissions to modify workflows",
          },
          { status: 403 }
        );
      }

      // Fetch the workflow
      const workflow = await WorkflowTemplate.findById(params.id);

      if (!workflow) {
        return NextResponse.json(
          { success: false, error: "Workflow not found" },
          { status: 404 }
        );
      }

      // Check if user has access to this workflow
      if (user.role !== "super_admin") {
        if (
          !workflow.isDefault &&
          workflow.organization?.toString() !==
            user.organization?._id?.toString()
        ) {
          return NextResponse.json(
            {
              success: false,
              error: "You do not have permission to modify this workflow",
            },
            { status: 403 }
          );
        }
      }

      // Check if workflow is in use by any documents
      const documentsUsingWorkflow = await AIPDocument.countDocuments({
        workflow: params.id,
      });

      if (documentsUsingWorkflow > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Cannot edit this workflow. It is currently in use by ${documentsUsingWorkflow} document(s). Please remove it from all documents first.`,
            documentsCount: documentsUsingWorkflow,
          },
          { status: 400 }
        );
      }

      // Update workflow fields
      if (name !== undefined) workflow.name = name;
      if (description !== undefined) workflow.description = description;
      if (documentTypes !== undefined) workflow.documentTypes = documentTypes;
      if (steps !== undefined) {
        // Validate steps
        const stepIds = new Set(steps.map((s: any) => s.id));
        for (const step of steps) {
          for (const transition of step.allowedTransitions || []) {
            if (!stepIds.has(transition)) {
              return NextResponse.json(
                {
                  success: false,
                  error: `Invalid transition: ${transition} does not exist in workflow steps`,
                },
                { status: 400 }
              );
            }
          }
        }
        workflow.steps = steps;
      }
      if (typeof isActive === "boolean") workflow.isActive = isActive;

      workflow.updatedBy = user._id;
      await workflow.save();

      const populatedWorkflow = await WorkflowTemplate.findById(workflow._id)
        .populate("organization", "name domain")
        .populate("createdBy", "name email");

      // Log access
      DataIsolationService.logAccess(user, "workflows", "update", true);

      return NextResponse.json({
        success: true,
        data: populatedWorkflow,
      });
    } catch (error) {
      return createErrorResponse(error, "Failed to update workflow");
    }
  }
);

export const GET = withAuth(
  async (
    request: NextRequest,
    { params, user }: { params?: { id: string }; user: any }
  ) => {
    try {
      await connectDB();

      if (!params?.id) {
        return NextResponse.json(
          { success: false, error: "ID is required" },
          { status: 400 }
        );
      }
      const workflow = await WorkflowTemplate.findById(params.id)
        .populate("organization", "name domain")
        .populate("createdBy", "name email")
        .populate("steps.assignedUsers", "name email");

      if (!workflow) {
        return NextResponse.json(
          { success: false, error: "Workflow not found" },
          { status: 404 }
        );
      }

      // Check access - super admin sees all, org admin sees their org + defaults
      if (user.role !== "super_admin") {
        const isSameOrg =
          workflow.organization?._id.toString?.() ===
          (user.organization?._id?.toString?.() ??
            user.organizationId?.toString?.());
  
        if (!workflow.isDefault && !isSameOrg) {
          return NextResponse.json(
            { success: false, error: "Access denied" },
            { status: 403 }
          );
        }
      }

      // Check if workflow is in use
      const documentsUsingWorkflow = await AIPDocument.countDocuments({
        workflow: params.id,
      });

      // Log access
      DataIsolationService.logAccess(user, "workflows", "read", true);

      return NextResponse.json({
        success: true,
        data: {
          ...workflow.toObject(),
          inUseBy: documentsUsingWorkflow,
        },
      });
    } catch (error) {
      return createErrorResponse(error, "Failed to fetch workflow");
    }
  }
);

export const DELETE = withAuth(async (request: NextRequest, { params, user }: { params?: { id: string }, user: any }) => {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check permissions - only org_admin and super_admin can delete workflows
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to delete workflows' },
        { status: 403 }
      );
    }

    // Fetch the workflow
    const workflow = await WorkflowTemplate.findById(params.id);

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check if user has access to this workflow
    if (user.role !== 'super_admin') {
      if (!workflow.isDefault && workflow.organization?.toString() !== user.organization?._id?.toString()) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to delete this workflow' },
          { status: 403 }
        );
      }
    }

    // Check if workflow is in use by any documents
    const documentsUsingWorkflow = await AIPDocument.countDocuments({ workflow: params.id });

    if (documentsUsingWorkflow > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Cannot delete this workflow. It is currently in use by ${documentsUsingWorkflow} document(s). Please remove it from all documents first.`,
          documentsCount: documentsUsingWorkflow
        },
        { status: 400 }
      );
    }

    // Prevent deletion of default workflows
    if (workflow.isDefault) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete default workflows' },
        { status: 400 }
      );
    }

    await WorkflowTemplate.findByIdAndDelete(params.id);

    // Log access
    DataIsolationService.logAccess(user, 'workflows', 'delete', true);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully'
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to delete workflow');
  }
});
