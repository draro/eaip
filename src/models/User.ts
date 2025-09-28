import mongoose, { Schema } from 'mongoose';
import { IUser } from '@/types';
import crypto from 'crypto';

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxLength: [100, 'Name cannot exceed 100 characters'],
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
      maxLength: [50, 'First name cannot exceed 50 characters'],
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
      maxLength: [50, 'Last name cannot exceed 50 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['super_admin', 'org_admin', 'editor', 'viewer'],
      default: 'viewer',
      required: true,
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: function() {
        return this.role !== 'super_admin';
      },
    },
    avatar: {
      type: String,
      trim: true,
    },
    permissions: [{
      type: String,
      trim: true,
    }],
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'auto'],
        default: 'auto',
      },
      language: {
        type: String,
        default: 'en',
        lowercase: true,
        minLength: [2, 'Language code must be at least 2 characters'],
        maxLength: [5, 'Language code cannot exceed 5 characters'],
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      notifications: {
        email: { type: Boolean, default: true },
        browser: { type: Boolean, default: true },
        slack: { type: Boolean, default: false },
      },
      editor: {
        autoSave: { type: Boolean, default: true },
        spellCheck: { type: Boolean, default: true },
        wordWrap: { type: Boolean, default: true },
      },
    },
    lastLoginAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ organization: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ isActive: 1 });
UserSchema.index({ organization: 1, role: 1 });

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim();
});

// Pre-save middleware
UserSchema.pre('save', function(next) {
  // Automatically set name from firstName and lastName
  if (this.firstName && this.lastName) {
    this.name = `${this.firstName} ${this.lastName}`.trim();
  }
  next();
});

// Methods
UserSchema.methods.isAdmin = function() {
  return ['super_admin', 'org_admin'].includes(this.role);
};

UserSchema.methods.isSuperAdmin = function() {
  return this.role === 'super_admin';
};

UserSchema.methods.canManageOrganization = function(organizationId: string) {
  if (this.role === 'super_admin') return true;
  if (this.role === 'org_admin' && this.organization?.toString() === organizationId) return true;
  return false;
};

UserSchema.methods.canEdit = function() {
  return ['super_admin', 'org_admin', 'editor'].includes(this.role);
};

UserSchema.methods.hasPermission = function(permission: string) {
  return this.permissions.includes(permission);
};

UserSchema.methods.verifyPassword = function(password: string) {
  const hashedPassword = crypto.createHash('sha256').update(password + 'eAIP_salt_2025').digest('hex');
  return this.password === hashedPassword;
};

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);