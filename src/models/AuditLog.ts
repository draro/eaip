import mongoose, { Schema, Document } from 'mongoose';

/**
 * Audit Log Model for Security Monitoring and Compliance
 *
 * Security Finding Reference: C-003, H-002
 *
 * This model stores all application logs in MongoDB for:
 * - Security monitoring (SOC 2 requirement)
 * - Compliance auditing (GDPR, ICAO requirement)
 * - Incident investigation
 * - Performance monitoring
 *
 * Access Control:
 * - super_admin: Can access ALL logs (no filtering)
 * - org_admin: Can access logs filtered by their organization only
 * - Other roles: No direct access to audit logs
 */

export interface IAuditLog extends Document {
  timestamp: Date;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  organizationId: mongoose.Types.ObjectId | null;
  userId: mongoose.Types.ObjectId | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  duration: number | null;
  statusCode: number | null;
  method: string | null;
  url: string | null;
  errorStack: string | null;
  tags: string[];
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ['error', 'warn', 'info', 'debug'],
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      maxLength: [2000, 'Message cannot exceed 2000 characters'],
    },
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true, // Critical for org_admin queries
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      maxLength: [100, 'Action cannot exceed 100 characters'],
    },
    resource: {
      type: String,
      required: true,
      index: true,
      maxLength: [100, 'Resource cannot exceed 100 characters'],
    },
    resourceId: {
      type: String,
      default: null,
      index: true,
      maxLength: [100, 'Resource ID cannot exceed 100 characters'],
    },
    details: {
      type: Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      default: null,
      index: true,
      maxLength: [45, 'IP address cannot exceed 45 characters'], // IPv6 max length
    },
    userAgent: {
      type: String,
      default: null,
      maxLength: [500, 'User agent cannot exceed 500 characters'],
    },
    requestId: {
      type: String,
      default: null,
      index: true,
      maxLength: [100, 'Request ID cannot exceed 100 characters'],
    },
    duration: {
      type: Number,
      default: null,
      min: 0,
    },
    statusCode: {
      type: Number,
      default: null,
      min: 100,
      max: 599,
    },
    method: {
      type: String,
      default: null,
      enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD', null],
    },
    url: {
      type: String,
      default: null,
      maxLength: [1000, 'URL cannot exceed 1000 characters'],
    },
    errorStack: {
      type: String,
      default: null,
    },
    tags: [{
      type: String,
      maxLength: [50, 'Tag cannot exceed 50 characters'],
    }],
  },
  {
    timestamps: false, // We use our own timestamp field
    collection: 'auditlogs',
  }
);

// Compound indexes for common query patterns
AuditLogSchema.index({ organizationId: 1, timestamp: -1 }); // org_admin queries
AuditLogSchema.index({ userId: 1, timestamp: -1 }); // User activity tracking
AuditLogSchema.index({ action: 1, timestamp: -1 }); // Action-based queries
AuditLogSchema.index({ level: 1, timestamp: -1 }); // Error monitoring
AuditLogSchema.index({ timestamp: -1 }); // Time-based queries
AuditLogSchema.index({ requestId: 1 }); // Request tracing
AuditLogSchema.index({ tags: 1, timestamp: -1 }); // Tag-based queries

// TTL index - auto-delete logs older than 90 days (configurable)
// Remove this index if you want to keep logs indefinitely
const LOG_RETENTION_DAYS = parseInt(process.env.LOG_RETENTION_DAYS || '90');
AuditLogSchema.index(
  { timestamp: 1 },
  { expireAfterSeconds: LOG_RETENTION_DAYS * 24 * 60 * 60 }
);

// Static methods for querying with access control
AuditLogSchema.statics.findForUser = async function(
  userId: mongoose.Types.ObjectId,
  filters: any = {},
  options: any = {}
) {
  return this.find({
    ...filters,
    userId,
  })
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

AuditLogSchema.statics.findForOrganization = async function(
  organizationId: mongoose.Types.ObjectId,
  filters: any = {},
  options: any = {}
) {
  return this.find({
    ...filters,
    organizationId,
  })
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

AuditLogSchema.statics.findAllForSuperAdmin = async function(
  filters: any = {},
  options: any = {}
) {
  return this.find(filters)
    .sort({ timestamp: -1 })
    .limit(options.limit || 100);
};

// Method to sanitize sensitive data before logging
AuditLogSchema.statics.sanitizeDetails = function(details: any): any {
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'credit_card', 'ssn'];
  const sanitized = { ...details };

  const recursiveSanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    const result: any = Array.isArray(obj) ? [] : {};

    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();

      // Check if key contains sensitive data
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = recursiveSanitize(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  return recursiveSanitize(sanitized);
};

export default mongoose.models.AuditLog || mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
