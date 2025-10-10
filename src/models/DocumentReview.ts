import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentReview extends Document {
  document: mongoose.Types.ObjectId;
  documentType: 'checklist_instance';
  reviewer: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  comments: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentReviewSchema = new Schema<IDocumentReview>(
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
    reviewer: {
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
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentReviewSchema.index({ document: 1, reviewer: 1 }, { unique: true });
DocumentReviewSchema.index({ document: 1, status: 1 });
DocumentReviewSchema.index({ organization: 1, reviewer: 1, status: 1 });
DocumentReviewSchema.index({ reviewer: 1, status: 1 });

// Pre-save middleware to set reviewedAt
DocumentReviewSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status !== 'pending' && !this.reviewedAt) {
    this.reviewedAt = new Date();
  }
  next();
});

export default mongoose.models.DocumentReview ||
  mongoose.model<IDocumentReview>('DocumentReview', DocumentReviewSchema);
