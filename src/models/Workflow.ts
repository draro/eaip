import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IWorkflowStep {
  id: string;
  name: string;
  description?: string;
  requiredRole?: 'viewer' | 'editor' | 'admin' | 'super_admin';
  requiredWorkflowRole?: 'reviewer' | 'approver'; // Additional workflow-specific role
  assignedUsers?: mongoose.Types.ObjectId[]; // Specific users assigned to this step
  allowedTransitions: string[]; // IDs of next possible steps
  notificationEmails?: string[];
  autoApprove?: boolean;
  requiresComment?: boolean;
  position?: { x: number; y: number }; // Visual position in workflow builder
  airacDeadline?: 'initial_submission' | 'final_submission' | 'review' | 'publication' | 'effective'; // AIRAC deadline alignment
  daysBeforeEffective?: number; // Days before AIRAC effective date this step should complete
}

export interface IWorkflow extends Document {
  name: string;
  description?: string;
  organization?: mongoose.Types.ObjectId;
  isDefault: boolean; // System default workflows
  isActive: boolean;
  documentTypes: ('AIP' | 'GEN' | 'ENR' | 'AD' | 'SUPPLEMENT' | 'NOTAM')[];
  steps: IWorkflowStep[];
  airacAligned: boolean; // Whether this workflow follows AIRAC deadlines
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const WorkflowStepSchema = new Schema<IWorkflowStep>({
  id: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String },
  requiredRole: {
    type: String,
    enum: ['viewer', 'editor', 'admin', 'super_admin']
  },
  requiredWorkflowRole: {
    type: String,
    enum: ['reviewer', 'approver']
  },
  assignedUsers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  allowedTransitions: [{ type: String }],
  notificationEmails: [{ type: String }],
  autoApprove: { type: Boolean, default: false },
  requiresComment: { type: Boolean, default: false },
  position: {
    type: {
      x: { type: Number },
      y: { type: Number }
    },
    required: false
  },
  airacDeadline: {
    type: String,
    enum: ['initial_submission', 'final_submission', 'review', 'publication', 'effective']
  },
  daysBeforeEffective: { type: Number }
}, { _id: false });

const WorkflowSchema = new Schema<IWorkflow>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization',
    required: function(this: IWorkflow) {
      return !this.isDefault; // Only required for custom workflows
    }
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  documentTypes: [{
    type: String,
    enum: ['AIP', 'GEN', 'ENR', 'AD', 'SUPPLEMENT', 'NOTAM']
  }],
  steps: {
    type: [WorkflowStepSchema],
    required: true,
    validate: {
      validator: function(steps: IWorkflowStep[]) {
        return steps && steps.length > 0;
      },
      message: 'Workflow must have at least one step'
    }
  },
  airacAligned: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Indexes
WorkflowSchema.index({ organization: 1, isActive: 1 });
WorkflowSchema.index({ isDefault: 1, isActive: 1 });
WorkflowSchema.index({ documentTypes: 1 });

const WorkflowTemplate: Model<IWorkflow> = mongoose.models.WorkflowTemplate || mongoose.model<IWorkflow>('WorkflowTemplate', WorkflowSchema);

export default WorkflowTemplate;

// Default workflow configurations
export const DEFAULT_WORKFLOWS = {
  SIMPLE: {
    name: 'Simple Approval',
    description: 'Basic draft → review → published workflow',
    documentTypes: ['AIP', 'GEN', 'ENR', 'AD', 'SUPPLEMENT', 'NOTAM'],
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Document is being edited',
        requiredRole: 'editor',
        allowedTransitions: ['review', 'published'],
        requiresComment: false
      },
      {
        id: 'review',
        name: 'In Review',
        description: 'Document is under review',
        requiredRole: 'admin',
        allowedTransitions: ['draft', 'published'],
        requiresComment: true
      },
      {
        id: 'published',
        name: 'Published',
        description: 'Document is published and live',
        requiredRole: 'admin',
        allowedTransitions: ['draft'],
        requiresComment: true
      }
    ]
  },

  ADVANCED: {
    name: 'Advanced Approval',
    description: 'Multi-stage approval with technical and regulatory review',
    documentTypes: ['AIP', 'GEN', 'ENR', 'AD'],
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Initial document creation',
        requiredRole: 'editor',
        allowedTransitions: ['technical_review'],
        requiresComment: false
      },
      {
        id: 'technical_review',
        name: 'Technical Review',
        description: 'Technical accuracy verification',
        requiredRole: 'editor',
        allowedTransitions: ['draft', 'regulatory_review'],
        requiresComment: true
      },
      {
        id: 'regulatory_review',
        name: 'Regulatory Review',
        description: 'ICAO compliance and regulatory check',
        requiredRole: 'admin',
        allowedTransitions: ['technical_review', 'final_approval'],
        requiresComment: true
      },
      {
        id: 'final_approval',
        name: 'Final Approval',
        description: 'Final sign-off before publication',
        requiredRole: 'admin',
        allowedTransitions: ['regulatory_review', 'published'],
        requiresComment: true
      },
      {
        id: 'published',
        name: 'Published',
        description: 'Document is live',
        requiredRole: 'admin',
        allowedTransitions: ['draft'],
        requiresComment: true
      }
    ]
  },

  QUICK: {
    name: 'Quick Publish',
    description: 'Direct publish for urgent updates (NOTAM, Supplements)',
    documentTypes: ['NOTAM', 'SUPPLEMENT'],
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Creating urgent update',
        requiredRole: 'editor',
        allowedTransitions: ['published'],
        requiresComment: false
      },
      {
        id: 'published',
        name: 'Published',
        description: 'Document published immediately',
        requiredRole: 'editor',
        allowedTransitions: ['draft'],
        requiresComment: false
      }
    ]
  },

  AIRAC: {
    name: 'AIRAC-Aligned Workflow',
    description: 'Workflow aligned with AIRAC cycle deadlines (77 days before effective)',
    documentTypes: ['AIP', 'GEN', 'ENR', 'AD'],
    airacAligned: true,
    steps: [
      {
        id: 'draft',
        name: 'Draft',
        description: 'Initial document creation',
        requiredRole: 'editor',
        allowedTransitions: ['initial_submission'],
        requiresComment: false,
        daysBeforeEffective: 77,
        airacDeadline: 'initial_submission'
      },
      {
        id: 'initial_submission',
        name: 'Initial Submission',
        description: 'Submit for technical review (77 days before AIRAC effective)',
        requiredRole: 'editor',
        allowedTransitions: ['draft', 'technical_review'],
        requiresComment: true,
        daysBeforeEffective: 77,
        airacDeadline: 'initial_submission'
      },
      {
        id: 'technical_review',
        name: 'Technical Review',
        description: 'Technical accuracy verification',
        requiredRole: 'editor',
        allowedTransitions: ['initial_submission', 'final_submission'],
        requiresComment: true,
        daysBeforeEffective: 70
      },
      {
        id: 'final_submission',
        name: 'Final Submission',
        description: 'Final submission for approval (70 days before AIRAC effective)',
        requiredRole: 'admin',
        allowedTransitions: ['technical_review', 'regulatory_review'],
        requiresComment: true,
        daysBeforeEffective: 70,
        airacDeadline: 'final_submission'
      },
      {
        id: 'regulatory_review',
        name: 'Regulatory Review',
        description: 'ICAO compliance check (63 days before AIRAC effective)',
        requiredRole: 'admin',
        allowedTransitions: ['final_submission', 'publication_ready'],
        requiresComment: true,
        daysBeforeEffective: 63,
        airacDeadline: 'review'
      },
      {
        id: 'publication_ready',
        name: 'Publication Ready',
        description: 'Ready for publication (56 days before AIRAC effective)',
        requiredRole: 'admin',
        allowedTransitions: ['regulatory_review', 'published'],
        requiresComment: true,
        daysBeforeEffective: 56,
        airacDeadline: 'publication'
      },
      {
        id: 'published',
        name: 'Published',
        description: 'Document published (awaiting AIRAC effective date)',
        requiredRole: 'admin',
        allowedTransitions: ['effective'],
        requiresComment: true,
        daysBeforeEffective: 0,
        airacDeadline: 'effective'
      },
      {
        id: 'effective',
        name: 'Effective',
        description: 'Document is now effective per AIRAC cycle',
        requiredRole: 'admin',
        allowedTransitions: ['draft'],
        requiresComment: false,
        daysBeforeEffective: 0,
        airacDeadline: 'effective'
      }
    ]
  }
};
