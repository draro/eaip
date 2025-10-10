import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentNote extends Document {
  content: string;
  document: mongoose.Types.ObjectId;
  documentType: 'checklist_instance' | 'file';
  pageNumber?: number;
  positionData?: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  noteType: 'text' | 'annotation';
  organization: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentNoteSchema = new Schema<IDocumentNote>(
  {
    content: {
      type: String,
      required: [true, 'Note content is required'],
      trim: true,
      maxLength: [5000, 'Note content cannot exceed 5000 characters'],
    },
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['checklist_instance', 'file'],
      required: true,
      index: true,
    },
    pageNumber: {
      type: Number,
      min: [1, 'Page number must be at least 1'],
    },
    positionData: {
      x: { type: Number, required: false },
      y: { type: Number, required: false },
      width: { type: Number, required: false },
      height: { type: Number, required: false },
    },
    noteType: {
      type: String,
      enum: ['text', 'annotation'],
      default: 'text',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentNoteSchema.index({ document: 1, isPublic: 1 });
DocumentNoteSchema.index({ document: 1, createdBy: 1 });
DocumentNoteSchema.index({ organization: 1, createdBy: 1 });
DocumentNoteSchema.index({ document: 1, pageNumber: 1 });
DocumentNoteSchema.index({ createdAt: -1 });

// Methods
DocumentNoteSchema.methods.canView = function (userId: string) {
  return this.isPublic || this.createdBy.toString() === userId.toString();
};

DocumentNoteSchema.methods.canEdit = function (userId: string) {
  return this.createdBy.toString() === userId.toString();
};

export default mongoose.models.DocumentNote ||
  mongoose.model<IDocumentNote>('DocumentNote', DocumentNoteSchema);
