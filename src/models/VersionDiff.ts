import mongoose, { Schema } from 'mongoose';
import { IVersionDiff, IChange } from '@/types';

const ChangeSchema = new Schema<IChange>({
  id: { type: String, required: true },
  type: {
    type: String,
    enum: ['section', 'subsection', 'content', 'metadata'],
    required: true,
  },
  action: {
    type: String,
    enum: ['added', 'removed', 'modified'],
    required: true,
  },
  path: { type: String, required: true },
  sectionType: {
    type: String,
    enum: ['GEN', 'ENR', 'AD'],
  },
  sectionCode: { type: String },
  oldValue: { type: Schema.Types.Mixed },
  newValue: { type: Schema.Types.Mixed },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const VersionDiffSchema = new Schema<IVersionDiff>(
  {
    fromVersion: {
      type: Schema.Types.ObjectId,
      ref: 'AIPVersion',
      required: true,
    },
    toVersion: {
      type: Schema.Types.ObjectId,
      ref: 'AIPVersion',
      required: true,
    },
    documentId: {
      type: Schema.Types.ObjectId,
      ref: 'AIPDocument',
      required: true,
    },
    changes: [ChangeSchema],
    summary: {
      sectionsAdded: { type: Number, default: 0 },
      sectionsRemoved: { type: Number, default: 0 },
      sectionsModified: { type: Number, default: 0 },
      subsectionsAdded: { type: Number, default: 0 },
      subsectionsRemoved: { type: Number, default: 0 },
      subsectionsModified: { type: Number, default: 0 },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

VersionDiffSchema.index({ fromVersion: 1, toVersion: 1, documentId: 1 }, { unique: true });
VersionDiffSchema.index({ documentId: 1 });
VersionDiffSchema.index({ createdAt: 1 });

export default mongoose.models.VersionDiff || mongoose.model<IVersionDiff>('VersionDiff', VersionDiffSchema);