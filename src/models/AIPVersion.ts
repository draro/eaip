import mongoose, { Schema } from 'mongoose';
import { IAIPVersion } from '@/types';

const AIPVersionSchema = new Schema<IAIPVersion>(
  {
    versionNumber: {
      type: String,
      required: [true, 'Version number is required'],
      unique: true,
      trim: true,
    },
    airacCycle: {
      type: String,
      required: [true, 'AIRAC cycle is required'],
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
    },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'draft',
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    documents: [{
      type: Schema.Types.ObjectId,
      ref: 'AIPDocument',
    }],
  },
  {
    timestamps: true,
  }
);

AIPVersionSchema.index({ airacCycle: 1 });
AIPVersionSchema.index({ effectiveDate: 1 });
AIPVersionSchema.index({ status: 1 });

export default mongoose.models.AIPVersion || mongoose.model<IAIPVersion>('AIPVersion', AIPVersionSchema);