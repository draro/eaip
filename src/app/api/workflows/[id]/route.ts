import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowTemplate from '@/models/Workflow';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { DataIsolationService } from '@/lib/dataIsolation';

export const PATCH = withAuth(async (request: NextRequest, { params, user }: { params: { id: string }, user: any }) => {
  try {
    await connectDB();

    const body = await request.json();
    const { isActive } = body;

    // Check permissions - only org_admin and super_admin can modify workflows
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions to modify workflows' },
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
    // Super admin can modify any workflow
    // Org admin can only modify workflows for their organization or default workflows
    if (user.role !== 'super_admin') {
      if (!workflow.isDefault && workflow.organization?.toString() !== user.organization?._id?.toString()) {
        return NextResponse.json(
          { success: false, error: 'You do not have permission to modify this workflow' },
          { status: 403 }
        );
      }
    }

    // Update the workflow status
    if (typeof isActive === 'boolean') {
      workflow.isActive = isActive;
      workflow.updatedBy = user._id;
      await workflow.save();
    }

    const populatedWorkflow = await WorkflowTemplate.findById(workflow._id)
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email');

    // Log access
    DataIsolationService.logAccess(user, 'workflows', 'update', true);

    return NextResponse.json({
      success: true,
      data: populatedWorkflow
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to update workflow');
  }
});

export const GET = withAuth(async (request: NextRequest, { params, user }: { params: { id: string }, user: any }) => {
  try {
    await connectDB();

    const workflow = await WorkflowTemplate.findById(params.id)
      .populate('organization', 'name domain')
      .populate('createdBy', 'name email');

    if (!workflow) {
      return NextResponse.json(
        { success: false, error: 'Workflow not found' },
        { status: 404 }
      );
    }

    // Check access - super admin sees all, org admin sees their org + defaults
    if (user.role !== 'super_admin') {
      if (!workflow.isDefault && workflow.organization?.toString() !== user.organization?._id?.toString()) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    // Log access
    DataIsolationService.logAccess(user, 'workflows', 'read', true);

    return NextResponse.json({
      success: true,
      data: workflow
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to fetch workflow');
  }
});
