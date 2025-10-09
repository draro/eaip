import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Workflow Schema (reuse)
const WorkflowSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIPDocument', required: true },
  documentTitle: { type: String, required: true },
  workflowType: { type: String, enum: ['CRITICAL', 'ESSENTIAL', 'ROUTINE'], required: true },
  currentState: { type: String, required: true },
  requiredApprovals: [{ type: String }],
  approvals: [{
    id: String,
    approvalLevel: String,
    approvedBy: String,
    approverRole: String,
    decision: { type: String, enum: ['approve', 'reject', 'request_changes'] },
    comment: String,
    timestamp: Date,
  }],
  initiatedBy: { type: String, required: true },
  initiatedAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  targetCompletionDate: { type: Date },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  compliance: {
    icaoCompliant: { type: Boolean, default: false },
    eurocontrolCompliant: { type: Boolean, default: false },
    dataQualityVerified: { type: Boolean, default: false },
    securityCleared: { type: Boolean, default: false },
    validationDate: Date,
    validatedBy: String,
    issues: [String],
  },
  auditTrail: [{
    action: String,
    performedBy: String,
    timestamp: Date,
    state: String,
    comment: String,
  }],
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
}, { timestamps: true });

const Workflow = mongoose.models.Workflow || mongoose.model('Workflow', WorkflowSchema);

// POST /api/workflow/[id]/approve - Process approval
export async function POST(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!['super_admin', 'org_admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const workflow = await Workflow.findById(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check access permissions
    if (user.role !== 'super_admin' && workflow.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const data = await request.json();
    const { decision, comment, approvalLevel } = data;

    // Validate decision
    if (!['approve', 'reject', 'request_changes'].includes(decision)) {
      return NextResponse.json({ error: 'Invalid decision' }, { status: 400 });
    }

    // Add approval to workflow
    const approval = {
      id: uuidv4(),
      approvalLevel: approvalLevel || workflow.currentState,
      approvedBy: user.name || user.email,
      approverRole: user.role,
      decision,
      comment: comment || '',
      timestamp: new Date(),
    };

    workflow.approvals.push(approval);

    // Update audit trail
    workflow.auditTrail.push({
      action: decision === 'approve' ? 'approved' : decision === 'reject' ? 'rejected' : 'changes_requested',
      performedBy: user.name || user.email,
      timestamp: new Date(),
      state: workflow.currentState,
      comment: comment || '',
    });

    // Process state transition
    if (decision === 'approve') {
      // Find next state
      const currentIndex = workflow.requiredApprovals.indexOf(workflow.currentState);
      if (currentIndex < workflow.requiredApprovals.length - 1) {
        // Move to next approval level
        workflow.currentState = workflow.requiredApprovals[currentIndex + 1];
      } else {
        // All approvals complete
        workflow.currentState = 'approved';
        workflow.completedAt = new Date();
      }
    } else if (decision === 'reject') {
      workflow.currentState = 'rejected';
      workflow.completedAt = new Date();
    } else if (decision === 'request_changes') {
      workflow.currentState = 'draft';
    }

    await workflow.save();

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Approval processed successfully'
    });

  } catch (error) {
    console.error('Error processing approval:', error);
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    );
  }
}
