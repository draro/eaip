import { Document, Types } from 'mongoose';

export interface IRemoteConnection {
  id: string;
  name: string;
  type: 's3' | 'ftp' | 'git' | 'webdav';
  endpoint: string;
  credentials: {
    accessKey?: string;
    secretKey?: string;
    username?: string;
    password?: string;
    token?: string;
  };
  settings: {
    bucket?: string;
    region?: string;
    basePath?: string;
    syncEnabled: boolean;
    autoBackup: boolean;
  };
  enabled: boolean;
  lastSync?: Date;
}

export interface ICompanySettings {
  domain: string;
  name: string;
  authority: string;
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  branding: {
    logo?: string;
    colors: {
      primary: string;
      secondary: string;
    };
  };
  remoteConnections: IRemoteConnection[];
  defaultSettings: {
    language: string;
    timezone: string;
    airacStartDate: Date;
  };
  aiProvider?: 'claude' | 'openai';
  aiApiKey?: string;
  aiModel?: string;
}

export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string; // URL-friendly identifier
  domain: string;
  country: string;
  icaoCode?: string;
  logo?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    textColor?: string;
    logoUrl?: string;
    fontFamily?: string;
    fontSize?: string;
    footerText?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  settings: {
    publicUrl: string; // Public eAIP viewer URL
    timezone: string;
    language: string;
    enablePublicAccess: boolean;
    enableExport?: boolean;
    allowedExportFormats?: string[];
    airacStartDate: Date;
  };
  aiProvider: 'claude' | 'openai';
  aiApiKey?: string;
  aiModel: string;
  subscription: {
    plan: 'basic' | 'professional' | 'enterprise';
    maxUsers: number;
    maxDocuments: number;
    features: string[];
    expiresAt?: Date;
  };
  status: 'active' | 'suspended' | 'trial';
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'super_admin' | 'org_admin' | 'editor' | 'viewer';
  workflowRoles?: ('reviewer' | 'approver')[];
  organization?: Types.ObjectId;
  avatar?: string;
  permissions: string[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    notifications: {
      email: boolean;
      browser: boolean;
      slack: boolean;
    };
    editor: {
      autoSave: boolean;
      spellCheck: boolean;
      wordWrap: boolean;
    };
  };
  lastLoginAt?: Date;
  isActive: boolean;
  isTemporaryPassword: boolean;
  mustChangePassword: boolean;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  failedLoginAttempts: number;
  lockedUntil?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: Types.ObjectId;
  verifyPassword(password: string): boolean;
}

export interface IImage {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: Types.ObjectId;
}

export interface ISection {
  id: string;
  type: 'GEN' | 'ENR' | 'AD';
  title: string;
  content?: string;
  subsections: ISubsection[];
  order: number;
}

export interface ISubsection {
  id: string;
  code: string; // e.g., "1.1", "1.2", "2.1"
  title: string;
  content: any; // TipTap JSON format
  images: IImage[];
  order: number;
  lastModified: Date;
  modifiedBy: Types.ObjectId;
}

export interface IAIPDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  documentType: 'AIP' | 'SUPPLEMENT' | 'NOTAM';
  country: string; // ICAO country code
  airport?: string; // For AD sections
  sections: ISection[];
  version: Types.ObjectId;
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  organization: Types.ObjectId;
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  publishedAt?: Date;
  parentDocument?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  airacCycle: string;
  effectiveDate: Date;
  metadata: {
    language: string;
    authority: string;
    contact: string;
    lastReview: Date;
    nextReview: Date;
  };
}

export interface IAIPVersion extends Document {
  _id: Types.ObjectId;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: Date;
  status: 'active' | 'archived' | 'draft';
  description?: string;
  createdBy: Types.ObjectId;
  createdAt: Date;
  documents: Types.ObjectId[];
}

export interface IExportJob extends Document {
  _id: Types.ObjectId;
  type: 'docx' | 'pdf' | 'xml' | 'html';
  documentIds: Types.ObjectId[];
  version: Types.ObjectId;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  errorMessage?: string;
  requestedBy: Types.ObjectId;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}

export interface WebhookPayload {
  event: 'document.updated' | 'document.created' | 'document.deleted' | 'version.published' | 'export.completed';
  docId?: string;
  versionId?: string;
  exportJobId?: string;
  title?: string;
  updatedBy?: string;
  timestamp: string;
  data?: any;
}

export interface N8NExportRequest {
  documentIds: string[];
  format: 'docx' | 'pdf' | 'xml' | 'html';
  versionId: string;
  userId: string;
}

export interface N8NPublishRequest {
  versionId: string;
  targetEnvironment: 'staging' | 'production';
  userId: string;
}

export interface IVersionDiff {
  _id: Types.ObjectId;
  fromVersion: Types.ObjectId;
  toVersion: Types.ObjectId;
  documentId: Types.ObjectId;
  changes: IChange[];
  summary: {
    sectionsAdded: number;
    sectionsRemoved: number;
    sectionsModified: number;
    subsectionsAdded: number;
    subsectionsRemoved: number;
    subsectionsModified: number;
  };
  createdAt: Date;
  createdBy: Types.ObjectId;
}

export interface IChange {
  id: string;
  type: 'section' | 'subsection' | 'content' | 'metadata';
  action: 'added' | 'removed' | 'modified';
  path: string; // e.g., "sections.0.subsections.1.content"
  sectionType?: 'GEN' | 'ENR' | 'AD';
  sectionCode?: string;
  oldValue?: any;
  newValue?: any;
  description: string;
  timestamp: Date;
}

export interface RemoteStorageConfig {
  provider: 's3' | 'azure' | 'gcp';
  credentials: {
    accessKey: string;
    secretKey: string;
    region?: string;
    bucket: string;
  };
  settings: {
    pathPrefix: string;
    enableVersioning: boolean;
    enableEncryption: boolean;
    retentionDays: number;
  };
}