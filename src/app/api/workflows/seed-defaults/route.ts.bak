import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import WorkflowTemplate, { DEFAULT_WORKFLOWS } from '@/models/Workflow';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    // Only super admin can seed default workflows
    if (user.role !== 'super_admin') {
      return NextResponse.json(
        { success: false, error: 'Only super admin can seed default workflows' },
        { status: 403 }
      );
    }

    const createdWorkflows = [];

    // Create each default workflow
    for (const [key, config] of Object.entries(DEFAULT_WORKFLOWS)) {
      // Check if it already exists
      const existing = await WorkflowTemplate.findOne({
        name: config.name,
        isDefault: true
      });

      if (!existing) {
        const workflow = await WorkflowTemplate.create({
          ...config,
          isDefault: true,
          isActive: true,
          createdBy: user._id,
          updatedBy: user._id
        });
        createdWorkflows.push(workflow);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdWorkflows.length} default workflows`,
      data: createdWorkflows
    });
  } catch (error) {
    return createErrorResponse(error, 'Failed to seed default workflows');
  }
});
