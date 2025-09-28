import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { ApprovalWorkflowService } from '@/lib/approvalWorkflow';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { action, documentId, approvalType, approval, workflowId } = body;

    if (action === 'initiate') {
      if (!documentId) {
        return NextResponse.json(
          { success: false, error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const document = await AIPDocument.findById(documentId);
      if (!document) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      const userId = await getOrCreateDefaultUser();
      const workflow = await ApprovalWorkflowService.initiateApproval(
        document,
        userId,
        approvalType || 'ESSENTIAL'
      );

      return NextResponse.json({
        success: true,
        data: workflow,
        message: 'Approval workflow initiated successfully'
      });
    }

    if (action === 'process_approval') {
      if (!workflowId || !approval) {
        return NextResponse.json(
          { success: false, error: 'Workflow ID and approval data are required' },
          { status: 400 }
        );
      }

      // In a real implementation, you would fetch the workflow from database
      // For now, we'll create a mock workflow
      const mockWorkflow = {
        id: workflowId,
        documentId: 'test',
        documentTitle: 'Test Document',
        workflowType: 'ESSENTIAL' as const,
        currentState: 'technical_review',
        requiredApprovals: ['technical_review', 'operational_review', 'authority_approval'],
        approvals: [],
        initiatedBy: 'system',
        initiatedAt: new Date(),
        targetCompletionDate: new Date(),
        priority: 'medium' as const,
        compliance: {
          icaoCompliant: false,
          eurocontrolCompliant: false,
          dataQualityVerified: false,
          securityCleared: false
        },
        digitalSignatures: [],
        auditTrail: []
      };

      const updatedWorkflow = await ApprovalWorkflowService.processApproval(
        mockWorkflow,
        approval
      );

      return NextResponse.json({
        success: true,
        data: updatedWorkflow,
        message: 'Approval processed successfully'
      });
    }

    if (action === 'validate_compliance') {
      if (!documentId) {
        return NextResponse.json(
          { success: false, error: 'Document ID is required' },
          { status: 400 }
        );
      }

      const document = await AIPDocument.findById(documentId);
      if (!document) {
        return NextResponse.json(
          { success: false, error: 'Document not found' },
          { status: 404 }
        );
      }

      // Create mock workflow for validation
      const mockWorkflow = {
        id: 'mock',
        documentId,
        documentTitle: document.title,
        workflowType: 'ESSENTIAL' as const,
        currentState: 'technical_review',
        requiredApprovals: [],
        approvals: [],
        initiatedBy: 'system',
        initiatedAt: new Date(),
        targetCompletionDate: new Date(),
        priority: 'medium' as const,
        compliance: {
          icaoCompliant: false,
          eurocontrolCompliant: false,
          dataQualityVerified: false,
          securityCleared: false
        },
        digitalSignatures: [],
        auditTrail: []
      };

      const validation = await ApprovalWorkflowService.validateCompliance(
        mockWorkflow,
        document
      );

      return NextResponse.json({
        success: true,
        data: validation,
        message: 'Compliance validation completed'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error processing approval workflow:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process approval workflow' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'workflow_types') {
      return NextResponse.json({
        success: true,
        data: {
          CRITICAL: {
            name: 'Critical Approval',
            description: 'For safety-critical aeronautical information',
            requiredApprovals: ['technical_review', 'operational_review', 'authority_approval', 'final_review'],
            timelineWeeks: 4
          },
          ESSENTIAL: {
            name: 'Essential Approval',
            description: 'For essential operational information',
            requiredApprovals: ['technical_review', 'operational_review', 'authority_approval'],
            timelineWeeks: 3
          },
          ROUTINE: {
            name: 'Routine Approval',
            description: 'For routine informational updates',
            requiredApprovals: ['technical_review', 'operational_review'],
            timelineWeeks: 2
          }
        }
      });
    }

    if (action === 'approval_levels') {
      return NextResponse.json({
        success: true,
        data: {
          'technical_review': {
            name: 'Technical Review',
            description: 'Technical accuracy and compliance validation',
            requiredRoles: ['technical_reviewer', 'senior_technical_reviewer']
          },
          'operational_review': {
            name: 'Operational Review',
            description: 'Operational impact and safety assessment',
            requiredRoles: ['operational_reviewer', 'senior_operational_reviewer']
          },
          'authority_approval': {
            name: 'Authority Approval',
            description: 'Final regulatory authority approval',
            requiredRoles: ['authority_approver', 'senior_authority_approver']
          },
          'final_review': {
            name: 'Final Review',
            description: 'Final quality and compliance check',
            requiredRoles: ['final_reviewer']
          }
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        message: 'Approval workflow API is available',
        endpoints: [
          'POST /api/approval/workflow - Process workflow actions',
          'GET /api/approval/workflow?action=workflow_types - Get workflow types',
          'GET /api/approval/workflow?action=approval_levels - Get approval levels'
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching approval workflow data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch approval workflow data' },
      { status: 500 }
    );
  }
}