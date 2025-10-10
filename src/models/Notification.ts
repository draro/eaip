import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType =
  | 'template_assigned'
  | 'checklist_completed'
  | 'review_requested'
  | 'review_completed'
  | 'approval_requested'
  | 'approval_completed'
  | 'document_approved'
  | 'document_rejected'
  | 'note_added'
  | 'mention';

export interface INotification extends Document {
  type: NotificationType;
  recipient: mongoose.Types.ObjectId;
  sender?: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  title: string;
  message: string;
  documentId?: mongoose.Types.ObjectId;
  documentType?: 'checklist_instance' | 'file';
  link?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: [
        'template_assigned',
        'checklist_completed',
        'review_requested',
        'review_completed',
        'approval_requested',
        'approval_completed',
        'document_approved',
        'document_rejected',
        'note_added',
        'mention',
      ],
      index: true,
    },
    recipient: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxLength: [200, 'Title cannot exceed 200 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxLength: [1000, 'Message cannot exceed 1000 characters'],
    },
    documentId: {
      type: Schema.Types.ObjectId,
    },
    documentType: {
      type: String,
      enum: ['checklist_instance', 'file'],
    },
    link: {
      type: String,
      trim: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NotificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ organization: 1, recipient: 1 });
NotificationSchema.index({ type: 1, recipient: 1 });

// TTL Index for automatic deletion after 90 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

// Methods
NotificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

export default mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', NotificationSchema);
