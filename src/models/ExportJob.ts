import mongoose, { Schema } from 'mongoose';
import { IExportJob } from '@/types';

const ExportJobSchema = new Schema<IExportJob>(
  {
    type: {
      type: String,
      enum: ['docx', 'pdf', 'xml', 'html'],
      required: true,
    },
    documentIds: [{
      type: Schema.Types.ObjectId,
      ref: 'AIPDocument',
      required: true,
    }],
    version: {
      type: Schema.Types.ObjectId,
      ref: 'AIPVersion',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
    },
    downloadUrl: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    completedAt: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    },
  },
  {
    timestamps: true,
  }
);

ExportJobSchema.index({ status: 1 });
ExportJobSchema.index({ requestedBy: 1 });
ExportJobSchema.index({ expiresAt: 1 });

export default mongoose.models.ExportJob || mongoose.model<IExportJob>('ExportJob', ExportJobSchema);