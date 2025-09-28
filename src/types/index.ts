import { Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  name: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
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

export interface IAIPDocument extends Document {
  _id: Types.ObjectId;
  title: string;
  sectionCode: string; // e.g., "GEN", "ENR", "AD"
  subsectionCode: string; // e.g., "1.1", "1.2"
  content: any; // TipTap JSON format
  images: IImage[];
  version: Types.ObjectId;
  status: 'draft' | 'review' | 'published';
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  airacCycle: string;
  effectiveDate: Date;
  autoNumbering: {
    enabled: boolean;
    prefix: string; // e.g., "GEN", "ENR"
    currentNumber: number;
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