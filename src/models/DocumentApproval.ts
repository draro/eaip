import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentApproval extends Document {
  document: mongoose.Types.ObjectId;
  documentType: 'checklist_instance';
  approver: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentApprovalSchema = new Schema<IDocumentApproval>(
  {
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['checklist_instance'],
      default: 'checklist_instance',
      required: true,
    },
    approver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      required: true,
      index: true,
    },
    comments: {
      type: String,
      trim: true,
      maxLength: [2000, 'Comments cannot exceed 2000 characters'],
    },
    approvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentApprovalSchema.index({ document: 1, approver: 1 }, { unique: true });
DocumentApprovalSchema.index({ document: 1, status: 1 });
DocumentApprovalSchema.index({ organization: 1, approver: 1, status: 1 });
DocumentApprovalSchema.index({ approver: 1, status: 1 });

// Pre-save middleware to set approvedAt
DocumentApprovalSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
  next();
});

export default mongoose.models.DocumentApproval ||
  mongoose.model<IDocumentApproval>('DocumentApproval', DocumentApprovalSchema);
