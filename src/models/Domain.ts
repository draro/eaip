import mongoose, { Schema, Document } from 'mongoose';

export interface IDomain extends Document {
  domain: string;
  organizationId: mongoose.Types.ObjectId;
  isActive: boolean;
  isVerified: boolean;
  sslStatus: 'pending' | 'active' | 'failed' | 'expired';
  verificationToken?: string;
  verifiedAt?: Date;
  lastCheckedAt?: Date;
  dnsRecords?: {
    type: 'CNAME' | 'A';
    value: string;
    verified: boolean;
    lastChecked: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const DomainSchema = new Schema<IDomain>(
  {
    domain: {
      type: String,
      required: [true, 'Domain is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/,
        'Please provide a valid domain name'
      ],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization ID is required'],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
      index: true,
    },
    sslStatus: {
      type: String,
      enum: ['pending', 'active', 'failed', 'expired'],
      default: 'pending',
      index: true,
    },
    verificationToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    verifiedAt: {
      type: Date,
    },
    lastCheckedAt: {
      type: Date,
    },
    dnsRecords: [{
      type: {
        type: String,
        enum: ['CNAME', 'A'],
        required: true,
      },
      value: {
        type: String,
        required: true,
      },
      verified: {
        type: Boolean,
        default: false,
      },
      lastChecked: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Compound indexes for performance
DomainSchema.index({ domain: 1, isActive: 1 });
DomainSchema.index({ organizationId: 1, isActive: 1 });
DomainSchema.index({ isVerified: 1, isActive: 1 });

// Pre-save middleware to generate verification token
DomainSchema.pre('save', function(next) {
  if (this.isNew && !this.verificationToken) {
    this.verificationToken = require('crypto').randomBytes(32).toString('hex');
  }
  next();
});

// Methods
DomainSchema.methods.markAsVerified = function() {
  this.isVerified = true;
  this.verifiedAt = new Date();
  return this.save();
};

DomainSchema.methods.updateDnsRecord = function(type: 'CNAME' | 'A', value: string, verified: boolean = false) {
  const existingRecord = this.dnsRecords?.find((record: any) => record.type === type);

  if (existingRecord) {
    existingRecord.value = value;
    existingRecord.verified = verified;
    existingRecord.lastChecked = new Date();
  } else {
    if (!this.dnsRecords) this.dnsRecords = [];
    this.dnsRecords.push({
      type,
      value,
      verified,
      lastChecked: new Date(),
    });
  }

  return this.save();
};

// Static methods
DomainSchema.statics.findByDomain = function(domain: string) {
  return this.findOne({
    domain: domain.toLowerCase(),
    isActive: true
  }).populate('organizationId');
};

DomainSchema.statics.findByOrganization = function(organizationId: string) {
  return this.find({
    organizationId,
    isActive: true
  }).sort({ createdAt: -1 });
};

let Domain: any;
try {
  Domain = mongoose.models.Domain || mongoose.model<IDomain>('Domain', DomainSchema);
} catch (error) {
  // Edge runtime fallback
  Domain = null;
}

export default Domain;