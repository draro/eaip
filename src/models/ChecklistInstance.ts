import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistInstanceItem {
  id: string;
  text: string;
  order: number;
  required: boolean;
  completed: boolean;
  completedBy?: mongoose.Types.ObjectId;
  completedAt?: Date;
}

export interface IChecklistInstance extends Document {
  template: mongoose.Types.ObjectId;
  title: string;
  description: string;
  organization: mongoose.Types.ObjectId;
  items: IChecklistInstanceItem[];
  status: 'in_progress' | 'completed';
  initiatedBy: mongoose.Types.ObjectId;
  initiatedAt: Date;
  completedAt?: Date;
  additionalFiles: mongoose.Types.ObjectId[];
  gitCommitHash?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistInstanceItemSchema = new Schema<IChecklistInstanceItem>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    required: { type: Boolean, default: true },
    completed: { type: Boolean, default: false, index: true },
    completedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    completedAt: {
      type: Date,
    },
  },
  { _id: false }
);

const ChecklistInstanceSchema = new Schema<IChecklistInstance>(
  {
    template: {
      type: Schema.Types.ObjectId,
      ref: 'ChecklistTemplate',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    items: {
      type: [ChecklistInstanceItemSchema],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed'],
      default: 'in_progress',
      index: true,
    },
    initiatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    initiatedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    completedAt: {
      type: Date,
    },
    additionalFiles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DocumentFile',
      },
    ],
    gitCommitHash: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChecklistInstanceSchema.index({ organization: 1, status: 1 });
ChecklistInstanceSchema.index({ initiatedBy: 1, status: 1 });
ChecklistInstanceSchema.index({ template: 1 });
ChecklistInstanceSchema.index({ createdAt: -1 });

// Methods
ChecklistInstanceSchema.methods.calculateProgress = function () {
  const totalItems = this.items.length;
  const completedItems = this.items.filter((item: IChecklistInstanceItem) => item.completed).length;
  return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
};

ChecklistInstanceSchema.methods.checkAndUpdateStatus = function () {
  const allCompleted = this.items.every((item: IChecklistInstanceItem) =>
    !item.required || item.completed
  );

  if (allCompleted && this.status !== 'completed') {
    this.status = 'completed';
    this.completedAt = new Date();
    return true;
  }
  return false;
};

export default mongoose.models.ChecklistInstance ||
  mongoose.model<IChecklistInstance>('ChecklistInstance', ChecklistInstanceSchema);
