import mongoose, { Document, Schema } from 'mongoose';

export interface ICookieConsent extends Document {
  userId?: mongoose.Types.ObjectId; // Optional - for authenticated users
  sessionId?: string; // For anonymous users
  ipAddress?: string;
  userAgent?: string;
  preferences: {
    essential: boolean;
    functional: boolean;
    analytics: boolean;
  };
  policyVersion: string;
  consentedAt: Date;
  updatedAt: Date;
  organization?: mongoose.Types.ObjectId;
}

const CookieConsentSchema = new Schema<ICookieConsent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      sparse: true,
      index: true
    },
    sessionId: {
      type: String,
      sparse: true,
      index: true
    },
    ipAddress: {
      type: String
    },
    userAgent: {
      type: String
    },
    preferences: {
      essential: {
        type: Boolean,
        default: true,
        required: true
      },
      functional: {
        type: Boolean,
        default: false,
        required: true
      },
      analytics: {
        type: Boolean,
        default: false,
        required: true
      }
    },
    policyVersion: {
      type: String,
      required: true,
      default: '1.0.0'
    },
    consentedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    updatedAt: {
      type: Date,
      default: Date.now,
      required: true
    },
    organization: {
      type: Schema.Types.ObjectId,
      ref: 'Organization',
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
CookieConsentSchema.index({ userId: 1, policyVersion: 1 });
CookieConsentSchema.index({ sessionId: 1, policyVersion: 1 });
CookieConsentSchema.index({ consentedAt: 1 });
CookieConsentSchema.index({ organization: 1, consentedAt: 1 });

// Update updatedAt on save
CookieConsentSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get latest consent for user
CookieConsentSchema.statics.getLatestConsent = function (
  userId?: mongoose.Types.ObjectId,
  sessionId?: string
) {
  const query: any = {};

  if (userId) {
    query.userId = userId;
  } else if (sessionId) {
    query.sessionId = sessionId;
  } else {
    return null;
  }

  return this.findOne(query).sort({ consentedAt: -1 });
};

// Static method to get consent statistics for an organization
CookieConsentSchema.statics.getConsentStats = async function (
  organizationId: mongoose.Types.ObjectId,
  startDate?: Date,
  endDate?: Date
) {
  const matchStage: any = {
    organization: organizationId
  };

  if (startDate || endDate) {
    matchStage.consentedAt = {};
    if (startDate) matchStage.consentedAt.$gte = startDate;
    if (endDate) matchStage.consentedAt.$lte = endDate;
  }

  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        acceptedFunctional: {
          $sum: { $cond: ['$preferences.functional', 1, 0] }
        },
        acceptedAnalytics: {
          $sum: { $cond: ['$preferences.analytics', 1, 0] }
        },
        acceptedAll: {
          $sum: {
            $cond: [
              {
                $and: [
                  '$preferences.functional',
                  '$preferences.analytics'
                ]
              },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  return stats[0] || {
    total: 0,
    acceptedFunctional: 0,
    acceptedAnalytics: 0,
    acceptedAll: 0
  };
};

const CookieConsent = mongoose.models.CookieConsent || mongoose.model<ICookieConsent>('CookieConsent', CookieConsentSchema);

export default CookieConsent;
