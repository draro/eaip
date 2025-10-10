import mongoose, { Schema, Document } from 'mongoose';

export interface IFileChange {
  path: string;
  type: 'added' | 'modified' | 'deleted';
  additions?: number;
  deletions?: number;
}

export interface IGitVersion extends Document {
  document: mongoose.Types.ObjectId;
  documentType: 'checklist_instance' | 'file';
  commitHash: string;
  commitMessage: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorEmail: string;
  organization: mongoose.Types.ObjectId;
  fileChanges: IFileChange[];
  previousVersionHash?: string;
  snapshot: Record<string, any>;
  timestamp: Date;
  createdAt: Date;
}

const FileChangeSchema = new Schema<IFileChange>(
  {
    path: { type: String, required: true },
    type: { type: String, enum: ['added', 'modified', 'deleted'], required: true },
    additions: { type: Number },
    deletions: { type: Number },
  },
  { _id: false }
);

const GitVersionSchema = new Schema<IGitVersion>(
  {
    document: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['checklist_instance', 'file'],
      required: true,
    },
    commitHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    commitMessage: {
      type: String,
      required: true,
      trim: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    fileChanges: [FileChangeSchema],
    previousVersionHash: {
      type: String,
      trim: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
GitVersionSchema.index({ document: 1, timestamp: -1 });
GitVersionSchema.index({ organization: 1, timestamp: -1 });
GitVersionSchema.index({ author: 1, timestamp: -1 });
GitVersionSchema.index({ document: 1, documentType: 1 });

export default mongoose.models.GitVersion ||
  mongoose.model<IGitVersion>('GitVersion', GitVersionSchema);
