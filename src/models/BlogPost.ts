import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: {
    name: string;
    email?: string;
    avatar?: string;
  };
  category: string;
  tags: string[];
  featuredImage?: string;
  publishedAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
  seo: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    canonicalUrl?: string;
  };
  readingTime?: number;
  views: number;
  organization?: mongoose.Types.ObjectId;
  createdAt: Date;
}

const BlogPostSchema: Schema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  excerpt: {
    type: String,
    required: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  author: {
    name: {
      type: String,
      required: true
    },
    email: String,
    avatar: String
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  featuredImage: {
    type: String
  },
  publishedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'published',
    index: true
  },
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },
  readingTime: {
    type: Number,
    default: 0
  },
  views: {
    type: Number,
    default: 0
  },
  organization: {
    type: Schema.Types.ObjectId,
    ref: 'Organization'
  }
}, {
  timestamps: true
});

BlogPostSchema.index({ slug: 1, status: 1 });
BlogPostSchema.index({ category: 1, status: 1, publishedAt: -1 });
BlogPostSchema.index({ tags: 1, status: 1, publishedAt: -1 });

BlogPostSchema.pre('save', function(this: IBlogPost, next) {
  if (this.isModified('content')) {
    const wordsPerMinute = 200;
    const wordCount = this.content.split(/\s+/).length;
    this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  }
  this.updatedAt = new Date();
  next();
});

const BlogPost: Model<IBlogPost> = mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema);

export default BlogPost;
