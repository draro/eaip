import mongoose, { Schema } from 'mongoose';
import { IAIPDocument, IImage, ISection, ISubsection } from '@/types';

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

const SubsectionSchema = new Schema<ISubsection>({
  id: { type: String, required: true },
  code: { type: String, required: true, trim: true },
  title: { type: String, required: true, trim: true },
  content: {
    type: Schema.Types.Mixed,
    default: {
      type: 'doc',
      content: [],
    },
  },
  images: [ImageSchema],
  order: { type: Number, required: true },
  lastModified: { type: Date, default: Date.now },
  modifiedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
});

const SectionSchema = new Schema<ISection>({
  id: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['GEN', 'ENR', 'AD'],
  },
  title: { type: String, required: true, trim: true },
  content: {
    type: String,
    default: '',
  },
  subsections: [SubsectionSchema],
  order: { type: Number, required: true },
});

const AIPDocumentSchema = new Schema<IAIPDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    documentType: {
      type: String,
      required: true,
      enum: ['AIP', 'SUPPLEMENT', 'NOTAM'],
      default: 'AIP',
    },
    country: {
      type: String,
      required: [true, 'Country code is required'],
      uppercase: true,
      trim: true,
    },
    airport: {
      type: String,
      uppercase: true,
      trim: true,
    },
    sections: [SectionSchema],
    version: {
      type: Schema.Types.ObjectId,
      ref: 'AIPVersion',
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'review', 'approved', 'published', 'archived'],
      default: 'draft',
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    publishedAt: {
      type: Date,
    },
    parentDocument: {
      type: Schema.Types.ObjectId,
      ref: 'AIPDocument',
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
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
    metadata: {
      language: { type: String, default: 'en' },
      authority: { type: String, required: true },
      contact: { type: String, required: true },
      lastReview: { type: Date, default: Date.now },
      nextReview: { type: Date, required: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
AIPDocumentSchema.index({ organization: 1, country: 1, airport: 1, version: 1, documentType: 1 }, { unique: true });
AIPDocumentSchema.index({ organization: 1 });
AIPDocumentSchema.index({ version: 1 });
AIPDocumentSchema.index({ status: 1 });
AIPDocumentSchema.index({ airacCycle: 1 });
AIPDocumentSchema.index({ organization: 1, status: 1 });

export default mongoose.models.AIPDocument || mongoose.model<IAIPDocument>('AIPDocument', AIPDocumentSchema);