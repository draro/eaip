import mongoose, { Schema } from 'mongoose';

export interface IAIRACCycle {
  _id: string;
  airacCycle: string;
  effectiveDate: Date;
  status: 'upcoming' | 'active' | 'expired';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIRACCycleSchema = new Schema<IAIRACCycle>(
  {
    airacCycle: {
      type: String,
      required: [true, 'AIRAC cycle is required'],
      unique: true,
      trim: true,
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
    },
    status: {
      type: String,
      enum: ['upcoming', 'active', 'expired'],
      default: 'upcoming',
    },
    description: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

AIRACCycleSchema.index({ airacCycle: 1 });
AIRACCycleSchema.index({ effectiveDate: 1 });
AIRACCycleSchema.index({ status: 1 });

export default mongoose.models.AIRACCycle || mongoose.model<IAIRACCycle>('AIRACCycle', AIRACCycleSchema);
