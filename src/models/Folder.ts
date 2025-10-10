import mongoose, { Schema, Document } from 'mongoose';

export interface IFolder extends Document {
  name: string;
  description?: string;
  organization: mongoose.Types.ObjectId;
  parentFolder?: mongoose.Types.ObjectId;
  path: string;
  createdBy: mongoose.Types.ObjectId;
  updatedBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  allowedRoles: string[];
  metadata: {
    fileCount: number;
    subfolderCount: number;
    totalSize: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const FolderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: [true, 'Folder name is required'],
      trim: true,
      maxLength: [100, 'Folder name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'Description cannot exceed 500 characters'],
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    parentFolder: {
      type: Schema.Types.ObjectId,
      ref: 'Folder',
      default: null,
      index: true,
    },
    path: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
      index: true,
    },
    allowedRoles: {
      type: [String],
      default: ['org_admin', 'atc_supervisor', 'atc', 'editor'],
      enum: ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor', 'viewer'],
    },
    metadata: {
      fileCount: { type: Number, default: 0 },
      subfolderCount: { type: Number, default: 0 },
      totalSize: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
FolderSchema.index({ organization: 1, parentFolder: 1 });
FolderSchema.index({ organization: 1, path: 1 }, { unique: true });
FolderSchema.index({ createdBy: 1 });
FolderSchema.index({ name: 'text', description: 'text' });

// Methods
FolderSchema.methods.getFullPath = function (): string {
  return this.path;
};

FolderSchema.methods.isRootFolder = function (): boolean {
  return !this.parentFolder;
};

FolderSchema.methods.canUserAccess = function (userRole: string): boolean {
  if (userRole === 'super_admin') return true;
  if (this.isPublic) return true;
  return this.allowedRoles.includes(userRole);
};

// Pre-save hook to update path
FolderSchema.pre('save', async function (next) {
  if (this.isModified('parentFolder') || this.isModified('name')) {
    if (this.parentFolder) {
      const parent = await mongoose.models.Folder.findById(this.parentFolder);
      if (parent) {
        this.path = `${parent.path}/${this.name}`;
      } else {
        this.path = `/${this.name}`;
      }
    } else {
      this.path = `/${this.name}`;
    }
  }
  next();
});

export default mongoose.models.Folder ||
  mongoose.model<IFolder>('Folder', FolderSchema);
