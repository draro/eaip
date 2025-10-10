import mongoose, { Schema, Document } from 'mongoose';

export interface IDocumentFile extends Document {
  filename: string;
  originalName: string;
  filePath: string;
  storageUrl: string;
  mimeType: string;
  fileType: 'word' | 'pdf' | 'other';
  size: number;
  organization: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  gridFsId?: mongoose.Types.ObjectId;
  metadata: {
    pages?: number;
    width?: number;
    height?: number;
    author?: string;
    title?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFileSchema = new Schema<IDocumentFile>(
  {
    filename: {
      type: String,
      required: [true, 'Filename is required'],
      trim: true,
    },
    originalName: {
      type: String,
      required: [true, 'Original name is required'],
      trim: true,
    },
    filePath: {
      type: String,
      required: [true, 'File path is required'],
      trim: true,
    },
    storageUrl: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
    },
    fileType: {
      type: String,
      enum: ['word', 'pdf', 'other'],
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
      max: [52428800, 'File size cannot exceed 50MB'], // 50MB in bytes
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
    gridFsId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      pages: { type: Number },
      width: { type: Number },
      height: { type: Number },
      author: { type: String, trim: true },
      title: { type: String, trim: true },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DocumentFileSchema.index({ organization: 1, fileType: 1 });
DocumentFileSchema.index({ uploadedBy: 1 });
DocumentFileSchema.index({ uploadedAt: -1 });
DocumentFileSchema.index({ mimeType: 1 });

// Methods
DocumentFileSchema.methods.isImage = function () {
  return this.mimeType.startsWith('image/');
};

DocumentFileSchema.methods.isPDF = function () {
  return this.mimeType === 'application/pdf' || this.fileType === 'pdf';
};

DocumentFileSchema.methods.isWord = function () {
  return (
    this.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    this.mimeType === 'application/msword' ||
    this.fileType === 'word'
  );
};

DocumentFileSchema.methods.getFileExtension = function () {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
};

export default mongoose.models.DocumentFile ||
  mongoose.model<IDocumentFile>('DocumentFile', DocumentFileSchema);
