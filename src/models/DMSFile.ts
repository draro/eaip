import mongoose, { Schema, Document } from 'mongoose';

export interface IDMSFile extends Document {
  filename: string;
  originalName: string;
  filePath: string;
  storageUrl: string;
  gcsUrl?: string; // Google Cloud Storage gs:// URL
  mimeType: string;
  fileType: 'document' | 'image' | 'pdf' | 'excel' | 'video' | 'audio' | 'other';
  size: number;
  organization: mongoose.Types.ObjectId;
  folder?: mongoose.Types.ObjectId;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  tags: string[];
  description?: string;
  version: number;
  isLatest: boolean;
  parentFile?: mongoose.Types.ObjectId;
  metadata: {
    pages?: number;
    width?: number;
    height?: number;
    duration?: number;
    author?: string;
    title?: string;
    checksum?: string;
    gcsPath?: string; // Google Cloud Storage path
  };
  allowedRoles: string[];
  downloadCount: number;
  lastDownloadedAt?: Date;
  viewCount: number;
  lastViewedAt?: Date;
  approvalRequired: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  approvalComments?: string;
  approvalHistory: Array<{
    action: 'submitted' | 'approved' | 'rejected' | 'resubmitted';
    by: mongoose.Types.ObjectId;
    at: Date;
    comments?: string;
  }>;
  versionHistory: Array<{
    version: number;
    fileId: mongoose.Types.ObjectId;
    uploadedBy: mongoose.Types.ObjectId;
    uploadedAt: Date;
    changeNote?: string;
    size: number;
    checksum?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const DMSFileSchema = new Schema<IDMSFile>(
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
    gcsUrl: {
      type: String,
      trim: true,
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      trim: true,
      index: true,
    },
    fileType: {
      type: String,
      enum: ['document', 'image', 'pdf', 'excel', 'video', 'audio', 'other'],
      required: true,
      index: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [0, 'File size cannot be negative'],
      max: [104857600, 'File size cannot exceed 100MB'],
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    folder: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
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
      index: true,
    },
    tags: {
      type: [String],
      default: [],
      index: true,
      validate: {
        validator: function (tags: string[]) {
          return tags.length <= 20;
        },
        message: 'Cannot have more than 20 tags',
      },
    },
    description: {
      type: String,
      trim: true,
      maxLength: [1000, 'Description cannot exceed 1000 characters'],
    },
    version: {
      type: Number,
      default: 1,
      min: 1,
    },
    isLatest: {
      type: Boolean,
      default: true,
      index: true,
    },
    parentFile: {
      type: Schema.Types.ObjectId,
      ref: 'DMSFile',
      default: null,
      index: true,
    },
    metadata: {
      pages: { type: Number },
      width: { type: Number },
      height: { type: Number },
      duration: { type: Number },
      author: { type: String, trim: true },
      title: { type: String, trim: true },
      checksum: { type: String, trim: true },
      gcsPath: { type: String, trim: true },
    },
    allowedRoles: {
      type: [String],
      default: ['org_admin', 'atc_supervisor', 'atc', 'editor'],
      enum: ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor', 'viewer'],
    },
    downloadCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastDownloadedAt: {
      type: Date,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastViewedAt: {
      type: Date,
    },
    approvalRequired: {
      type: Boolean,
      default: false,
      index: true,
    },
    approvalStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      index: true,
    },
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    approvedAt: {
      type: Date,
    },
    approvalComments: {
      type: String,
      maxLength: [1000, 'Approval comments cannot exceed 1000 characters'],
    },
    approvalHistory: {
      type: [{
        action: {
          type: String,
          enum: ['submitted', 'approved', 'rejected', 'resubmitted'],
          required: true,
        },
        by: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        at: {
          type: Date,
          required: true,
          default: Date.now,
        },
        comments: {
          type: String,
          maxLength: 1000,
        },
      }],
      default: [],
    },
    versionHistory: {
      type: [{
        version: {
          type: Number,
          required: true,
        },
        fileId: {
          type: Schema.Types.ObjectId,
          ref: 'DMSFile',
          required: true,
        },
        uploadedBy: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        uploadedAt: {
          type: Date,
          required: true,
          default: Date.now,
        },
        changeNote: {
          type: String,
          maxLength: 500,
        },
        size: {
          type: Number,
          required: true,
        },
        checksum: {
          type: String,
        },
      }],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DMSFileSchema.index({ organization: 1, folder: 1 });
DMSFileSchema.index({ organization: 1, uploadedAt: -1 });
DMSFileSchema.index({ organization: 1, tags: 1 });
DMSFileSchema.index({ organization: 1, fileType: 1 });
DMSFileSchema.index({ uploadedBy: 1, uploadedAt: -1 });
DMSFileSchema.index({ tags: 1, organization: 1 });
DMSFileSchema.index({ originalName: 'text', description: 'text', tags: 'text' });
DMSFileSchema.index({ organization: 1, approvalRequired: 1, approvalStatus: 1 });
DMSFileSchema.index({ parentFile: 1, version: 1 });
DMSFileSchema.index({ parentFile: 1, isLatest: 1 });

// Methods
DMSFileSchema.methods.getFileExtension = function (): string {
  return this.originalName.split('.').pop()?.toLowerCase() || '';
};

DMSFileSchema.methods.isImage = function (): boolean {
  return this.fileType === 'image' || this.mimeType.startsWith('image/');
};

DMSFileSchema.methods.isPDF = function (): boolean {
  return this.fileType === 'pdf' || this.mimeType === 'application/pdf';
};

DMSFileSchema.methods.isDocument = function (): boolean {
  return this.fileType === 'document' || [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.oasis.opendocument.text',
  ].includes(this.mimeType);
};

DMSFileSchema.methods.canUserAccess = function (userRole: string): boolean {
  if (userRole === 'super_admin') return true;
  return this.allowedRoles.includes(userRole);
};

DMSFileSchema.methods.incrementDownloadCount = async function (): Promise<void> {
  this.downloadCount += 1;
  this.lastDownloadedAt = new Date();
  await this.save();
};

DMSFileSchema.methods.incrementViewCount = async function (): Promise<void> {
  this.viewCount += 1;
  this.lastViewedAt = new Date();
  await this.save();
};

DMSFileSchema.methods.addTags = function (newTags: string[]): void {
  const uniqueTags = new Set([...this.tags, ...newTags.map((tag: string) => tag.toLowerCase().trim())]);
  this.tags = Array.from(uniqueTags).slice(0, 20);
};

DMSFileSchema.methods.removeTags = function (tagsToRemove: string[]): void {
  const tagsSet = new Set(tagsToRemove.map((tag: string) => tag.toLowerCase().trim()));
  this.tags = this.tags.filter((tag: string) => !tagsSet.has(tag));
};

// Static methods
DMSFileSchema.statics.findByTags = function (organizationId: mongoose.Types.ObjectId, tags: string[]) {
  return this.find({
    organization: organizationId,
    tags: { $in: tags.map((tag: string) => tag.toLowerCase().trim()) },
    isLatest: true,
  }).sort({ uploadedAt: -1 });
};

DMSFileSchema.statics.getLatestFiles = function (organizationId: mongoose.Types.ObjectId, limit: number = 10) {
  return this.find({
    organization: organizationId,
    isLatest: true,
  })
    .sort({ uploadedAt: -1 })
    .limit(limit)
    .populate('uploadedBy', 'name email')
    .populate('folder', 'name path');
};

DMSFileSchema.statics.getAllVersions = function (fileId: mongoose.Types.ObjectId) {
  return this.find({
    $or: [
      { _id: fileId },
      { parentFile: fileId }
    ]
  })
    .sort({ version: -1 })
    .populate('uploadedBy', 'name email');
};

DMSFileSchema.statics.getVersion = function (fileId: mongoose.Types.ObjectId, version: number) {
  return this.findOne({
    $or: [
      { _id: fileId, version: version },
      { parentFile: fileId, version: version }
    ]
  });
};

export default mongoose.models.DMSFile ||
  mongoose.model<IDMSFile>('DMSFile', DMSFileSchema);
