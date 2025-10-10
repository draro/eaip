import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentReader extends Document {
  document: mongoose.Types.ObjectId;
  documentType: 'checklist_instance' | 'file';
  user: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  openedAt: Date;
  createdAt: Date;
}

const DocumentReaderSchema = new Schema<IDocumentReader>(
  {
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['checklist_instance', 'file'],
      required: true,
    },
    user: {
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
    openedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
DocumentReaderSchema.index({ document: 1, openedAt: -1 });
DocumentReaderSchema.index({ user: 1, openedAt: -1 });
DocumentReaderSchema.index({ organization: 1, openedAt: -1 });
DocumentReaderSchema.index({ document: 1, user: 1, openedAt: -1 });

// TTL Index for automatic deletion after 1 year
DocumentReaderSchema.index({ openedAt: 1 }, { expireAfterSeconds: 31536000 }); // 1 year

export default mongoose.models.DocumentReader ||
  mongoose.model<IDocumentReader>('DocumentReader', DocumentReaderSchema);
