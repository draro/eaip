import mongoose, { Schema, Document } from 'mongoose';

export type ActionType =
  | 'template_created'
  | 'template_updated'
  | 'template_deleted'
  | 'instance_initiated'
  | 'checkbox_ticked'
  | 'checkbox_unticked'
  | 'note_added'
  | 'note_updated'
  | 'note_deleted'
  | 'file_uploaded'
  | 'file_downloaded'
  | 'review_submitted'
  | 'approval_submitted'
  | 'document_completed'
  | 'version_restored'
  | 'export_generated'
  | 'document_opened'
  | 'document_closed';

export interface IDocumentActionLog extends Document {
  actionType: ActionType;
  userId: mongoose.Types.ObjectId;
  userName: string;
  userEmail: string;
  documentId?: mongoose.Types.ObjectId;
  checklistInstanceId?: mongoose.Types.ObjectId;
  itemId?: string;
  organization: mongoose.Types.ObjectId;
  details: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  createdAt: Date;
}

const DocumentActionLogSchema = new Schema<IDocumentActionLog>(
  {
    actionType: {
      type: String,
      required: [true, 'Action type is required'],
      enum: [
        'template_created',
        'template_updated',
        'template_deleted',
        'instance_initiated',
        'checkbox_ticked',
        'checkbox_unticked',
        'note_added',
        'note_updated',
        'note_deleted',
        'file_uploaded',
        'file_downloaded',
        'review_submitted',
        'approval_submitted',
        'document_completed',
        'version_restored',
        'export_generated',
        'document_opened',
        'document_closed',
      ],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    userEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      index: true,
    },
    checklistInstanceId: {
      type: Schema.Types.ObjectId,
      ref: 'ChecklistInstance',
      index: true,
    },
    itemId: {
      type: String,
      trim: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for efficient querying
DocumentActionLogSchema.index({ organization: 1, timestamp: -1 });
DocumentActionLogSchema.index({ userId: 1, timestamp: -1 });
DocumentActionLogSchema.index({ checklistInstanceId: 1, timestamp: -1 });
DocumentActionLogSchema.index({ actionType: 1, timestamp: -1 });
DocumentActionLogSchema.index({ organization: 1, actionType: 1, timestamp: -1 });

// TTL Index for automatic log deletion after retention period (optional - 2 years)
DocumentActionLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 }); // 2 years

export default mongoose.models.DocumentActionLog ||
  mongoose.model<IDocumentActionLog>('DocumentActionLog', DocumentActionLogSchema);
