import mongoose, { Schema, Document } from 'mongoose';

export interface IFileView extends Document {
  file: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  organization: mongoose.Types.ObjectId;
  viewedAt: Date;
  duration: number; // in seconds
  viewType: 'preview' | 'download';
  ipAddress?: string;
  userAgent?: string;
  completedView: boolean; // whether the user viewed the full document
  metadata?: {
    scrollPercentage?: number;
    pagesViewed?: number[];
    totalPages?: number;
  };
}

const FileViewSchema = new Schema<IFileView>(
  {
    file: {
      type: Schema.Types.ObjectId,
      ref: 'DMSFile',
      required: true,
      index: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    viewedAt: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
    viewType: {
      type: String,
      enum: ['preview', 'download'],
      required: true,
      default: 'preview',
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    completedView: {
      type: Boolean,
      default: false,
    },
    metadata: {
      scrollPercentage: { type: Number, min: 0, max: 100 },
      pagesViewed: [{ type: Number }],
      totalPages: { type: Number },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
FileViewSchema.index({ file: 1, user: 1, viewedAt: -1 });
FileViewSchema.index({ organization: 1, viewedAt: -1 });
FileViewSchema.index({ file: 1, viewedAt: -1 });
FileViewSchema.index({ user: 1, viewedAt: -1 });

// Static methods
FileViewSchema.statics.getFileViewCount = function (fileId: mongoose.Types.ObjectId) {
  return this.countDocuments({ file: fileId });
};

FileViewSchema.statics.getUniqueViewers = async function (fileId: mongoose.Types.ObjectId) {
  const viewers = await this.distinct('user', { file: fileId });
  return viewers.length;
};

FileViewSchema.statics.getAverageViewDuration = async function (fileId: mongoose.Types.ObjectId) {
  const result = await this.aggregate([
    { $match: { file: fileId } },
    { $group: { _id: null, avgDuration: { $avg: '$duration' } } },
  ]);
  return result.length > 0 ? Math.round(result[0].avgDuration) : 0;
};

FileViewSchema.statics.getRecentViewers = function (
  fileId: mongoose.Types.ObjectId,
  limit: number = 10
) {
  return this.find({ file: fileId })
    .sort({ viewedAt: -1 })
    .limit(limit)
    .populate('user', 'name email role')
    .populate('file', 'originalName fileType');
};

export default mongoose.models.FileView ||
  mongoose.model<IFileView>('FileView', FileViewSchema);
