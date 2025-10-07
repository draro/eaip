import mongoose, { Schema } from "mongoose";
import { IOrganization } from "@/types";

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: {
      type: String,
      required: [true, "Organization name is required"],
      trim: true,
      maxLength: [100, "Organization name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: [true, "Organization slug is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens",
      ],
    },
    domain: {
      type: String,
      required: [true, "Domain is required"],
      trim: true,
      lowercase: true,
    },
    country: {
      type: String,
      required: [true, "Country is required"],
      uppercase: true,
      minLength: [2, "Country code must be at least 2 characters"],
      maxLength: [3, "Country code cannot exceed 3 characters"],
    },
    icaoCode: {
      type: String,
      uppercase: true,
      match: [/^[A-Z]{2,4}$/, "ICAO code must be 2-4 uppercase letters"],
    },
    logo: {
      type: String,
    },
    branding: {
      primaryColor: {
        type: String,
        default: "#1f2937",
        match: [/^#[0-9A-Fa-f]{6}$/, "Primary color must be a valid hex color"],
      },
      secondaryColor: {
        type: String,
        default: "#3b82f6",
        match: [
          /^#[0-9A-Fa-f]{6}$/,
          "Secondary color must be a valid hex color",
        ],
      },
      textColor: {
        type: String,
        default: "#000000",
        match: [/^#[0-9A-Fa-f]{6}$/, "Text color must be a valid hex color"],
      },
      logoUrl: {
        type: String,
      },
      fontFamily: {
        type: String,
        default: "Inter, system-ui, sans-serif",
      },
      fontSize: {
        type: String,
        default: "16px",
      },
      footerText: {
        type: String,
        default: "This electronic AIP is published in accordance with ICAO Annex 15.",
      },
    },
    contact: {
      email: {
        type: String,
        required: [true, "Contact email is required"],
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
      },
      phone: {
        type: String,
        required: [true, "Contact phone is required"],
        trim: true,
      },
      address: {
        type: String,
        required: [true, "Contact address is required"],
        trim: true,
      },
      website: {
        type: String,
        trim: true,
      },
    },
    settings: {
      publicUrl: {
        type: String,
        required: [true, "Public URL is required"],
        trim: true,
        lowercase: true,
      },
      timezone: {
        type: String,
        default: "UTC",
      },
      language: {
        type: String,
        default: "en",
        lowercase: true,
      },
      enablePublicAccess: {
        type: Boolean,
        default: true,
      },
      enableExport: {
        type: Boolean,
        default: true,
      },
      allowedExportFormats: {
        type: [String],
        default: ["pdf", "docx"],
        enum: {
          values: ["pdf", "docx", "xml", "html"],
          message: "Export format must be one of: pdf, docx, xml, html",
        },
      },
      airacStartDate: {
        type: Date,
        required: [true, "AIRAC start date is required"],
      },
    },
    aiProvider: {
      type: String,
      enum: ["claude", "openai"],
      default: "claude",
    },
    aiApiKey: {
      type: String,
      select: false,
    },
    aiModel: {
      type: String,
      default: "claude-sonnet-4-5-20250929",
    },
    subscription: {
      plan: {
        type: String,
        enum: ["basic", "professional", "enterprise"],
        default: "basic",
      },
      maxUsers: {
        type: Number,
        default: 5,
        min: [1, "Maximum users must be at least 1"],
      },
      maxDocuments: {
        type: Number,
        default: 10,
        min: [1, "Maximum documents must be at least 1"],
      },
      features: [
        {
          type: String,
        },
      ],
      expiresAt: {
        type: Date,
      },
    },
    status: {
      type: String,
      enum: ["active", "suspended", "trial"],
      default: "trial",
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
OrganizationSchema.index({ slug: 1 }, { unique: true });
OrganizationSchema.index({ domain: 1 });
OrganizationSchema.index({ country: 1 });
OrganizationSchema.index({ status: 1 });
OrganizationSchema.index({ "subscription.plan": 1 });

// Virtual for full name
OrganizationSchema.virtual("displayName").get(function () {
  return `${this.name} (${this.country})`;
});

// Pre-save middleware to generate slug if not provided
OrganizationSchema.pre("save", function (next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }
  next();
});

// Methods
OrganizationSchema.methods.canAddUser = function () {
  const currentUsers = 0; // This would be calculated from actual user count
  return currentUsers < this.subscription.maxUsers;
};

OrganizationSchema.methods.canAddDocument = function () {
  const currentDocuments = 0; // This would be calculated from actual document count
  return currentDocuments < this.subscription.maxDocuments;
};

OrganizationSchema.methods.hasFeature = function (feature: string) {
  return this.subscription.features.includes(feature);
};

OrganizationSchema.methods.isActive = function () {
  return (
    this.status === "active" &&
    (!this.subscription.expiresAt || this.subscription.expiresAt > new Date())
  );
};

export default mongoose.models.Organization ||
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
