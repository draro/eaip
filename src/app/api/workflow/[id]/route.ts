import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import mongoose from 'mongoose';

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

// GET /api/workflow/[id] - Get single workflow
export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const workflow = await Workflow.findById(params.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Check access permissions
    const user = session.user as any;
    if (user.role !== 'super_admin' && workflow.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error('Error fetching workflow:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}