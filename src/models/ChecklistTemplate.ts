import mongoose, { Schema, Document } from 'mongoose';

export interface IChecklistItem {
  id: string;
  text: string;
  order: number;
  required: boolean;
}

export interface IChecklistTemplate extends Document {
  title: string;
  description: string;
  organization: mongoose.Types.ObjectId;
  items: IChecklistItem[];
  attachedFiles: mongoose.Types.ObjectId[];
  allowedRoles: string[];
  tags: string[];
  keywords: string[];
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChecklistItemSchema = new Schema<IChecklistItem>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true, trim: true },
    order: { type: Number, required: true, default: 0 },
    required: { type: Boolean, default: true },
  },
  { _id: false }
);

const ChecklistTemplateSchema = new Schema<IChecklistTemplate>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxLength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [2000, 'Description cannot exceed 2000 characters'],
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    items: {
      type: [ChecklistItemSchema],
      required: true,
      validate: {
        validator: function (items: IChecklistItem[]) {
          return items && items.length > 0;
        },
        message: 'Template must have at least one checklist item',
      },
    },
    attachedFiles: [
      {
        type: Schema.Types.ObjectId,
        ref: 'DocumentFile',
      },
    ],
    allowedRoles: {
      type: [String],
      default: ['atc'],
      enum: ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor', 'viewer'],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
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
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
ChecklistTemplateSchema.index({ organization: 1, isActive: 1 });
ChecklistTemplateSchema.index({ tags: 1 });
ChecklistTemplateSchema.index({ keywords: 1 });
ChecklistTemplateSchema.index({ allowedRoles: 1 });
ChecklistTemplateSchema.index({ title: 'text', description: 'text', keywords: 'text' });

export default mongoose.models.ChecklistTemplate ||
  mongoose.model<IChecklistTemplate>('ChecklistTemplate', ChecklistTemplateSchema);
