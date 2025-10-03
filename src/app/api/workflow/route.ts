import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

// Workflow Schema
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

// GET /api/workflow - List workflows
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = session.user as any;
    const query: any = {};

    // Filter by organization if not super admin
    if (user.role !== 'super_admin') {
      query.organizationId = user.organizationId;
    }

    const workflows = await Workflow.find(query).sort({ createdAt: -1 }).limit(100);

    return NextResponse.json({ success: true, workflows });
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

// POST /api/workflow - Create workflow
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    // Check permissions
    if (!['super_admin', 'org_admin', 'editor'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();

    // Define required approvals based on workflow type
    const APPROVAL_REQUIREMENTS: Record<string, string[]> = {
      CRITICAL: ['technical_review', 'operational_review', 'authority_approval', 'final_review'],
      ESSENTIAL: ['technical_review', 'operational_review', 'authority_approval'],
      ROUTINE: ['technical_review', 'operational_review']
    };

    const workflowId = `WF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Calculate target completion date based on type
    const targetDate = new Date();
    switch (data.workflowType) {
      case 'CRITICAL':
        targetDate.setDate(targetDate.getDate() + 7); // 5-7 days
        break;
      case 'ESSENTIAL':
        targetDate.setDate(targetDate.getDate() + 5); // 3-5 days
        break;
      case 'ROUTINE':
        targetDate.setDate(targetDate.getDate() + 2); // 1-2 days
        break;
    }

    const workflow = new Workflow({
      id: workflowId,
      documentId: data.documentId,
      documentTitle: data.documentTitle,
      workflowType: data.workflowType || 'ESSENTIAL',
      currentState: 'technical_review',
      requiredApprovals: APPROVAL_REQUIREMENTS[data.workflowType || 'ESSENTIAL'],
      approvals: [],
      initiatedBy: user.name || user.email,
      initiatedAt: new Date(),
      targetCompletionDate: targetDate,
      priority: data.priority || 'medium',
      compliance: {
        icaoCompliant: false,
        eurocontrolCompliant: false,
        dataQualityVerified: false,
        securityCleared: false,
        validationDate: new Date(),
        validatedBy: user.name || user.email,
        issues: [],
      },
      auditTrail: [{
        action: 'workflow_initiated',
        performedBy: user.name || user.email,
        timestamp: new Date(),
        state: 'technical_review',
        comment: `${data.workflowType || 'ESSENTIAL'} approval workflow initiated`,
      }],
      organizationId: user.organizationId,
    });

    await workflow.save();

    return NextResponse.json({
      success: true,
      workflow,
      message: 'Workflow created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating workflow:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}