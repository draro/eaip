import mongoose, { Schema } from 'mongoose';
import { IAIPDocument, IImage } from '@/types';

const ImageSchema = new Schema<IImage>({
  id: { type: String, required: true },
  filename: { type: String, required: true },
  originalName: { type: String, required: true },
  url: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const AIPDocumentSchema = new Schema<IAIPDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    sectionCode: {
      type: String,
      required: [true, 'Section code is required'],
      uppercase: true,
      enum: ['GEN', 'ENR', 'AD'],
    },
    subsectionCode: {
      type: String,
      required: [true, 'Subsection code is required'],
      trim: true,
    },
    content: {
      type: Schema.Types.Mixed,
      default: {
        type: 'doc',
        content: [],
      },
    },
    images: [ImageSchema],
    version: {
      type: Schema.Types.ObjectId,
      ref: 'AIPVersion',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'published'],
      default: 'draft',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    airacCycle: {
      type: String,
      required: true,
    },
    effectiveDate: {
      type: Date,
      required: true,
    },
    autoNumbering: {
      enabled: { type: Boolean, default: true },
      prefix: { type: String, required: true },
      currentNumber: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

AIPDocumentSchema.index({ sectionCode: 1, subsectionCode: 1, version: 1 }, { unique: true });
AIPDocumentSchema.index({ version: 1 });
AIPDocumentSchema.index({ status: 1 });
AIPDocumentSchema.index({ airacCycle: 1 });

export default mongoose.models.AIPDocument || mongoose.model<IAIPDocument>('AIPDocument', AIPDocumentSchema);