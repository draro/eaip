import { Types } from 'mongoose';
import { AuthUser } from '@/lib/auth';

export interface IsolatedQuery {
  organization?: Types.ObjectId | string;
  [key: string]: any;
}

export class DataIsolationService {
  /**
   * Enforces data isolation by adding organization filter to queries
   */
  static enforceOrganizationFilter(user: AuthUser, baseQuery: any = {}): IsolatedQuery {
    if (user.role === 'super_admin') {
      // Super admin can access all data
      return baseQuery;
    }

    if (!user.organization) {
      throw new Error('User must be associated with an organization');
    }

    // Add organization filter to the query
    return {
      ...baseQuery,
      organization: user.organization._id
    };
  }

  /**
   * Validates that a user can access a specific organization's data
   */
  static validateOrganizationAccess(user: AuthUser, organizationId: string): boolean {
    if (user.role === 'super_admin') {
      return true;
    }

    if (!user.organization) {
      return false;
    }

    return user.organization._id === organizationId;
  }

  /**
   * Filters document results to only include organization-specific data
   */
  static filterDocumentsByOrganization(documents: any[], user: AuthUser): any[] {
    if (user.role === 'super_admin') {
      return documents;
    }

    if (!user.organization) {
      return [];
    }

    return documents.filter(doc =>
      doc.organization?.toString() === user.organization?._id ||
      doc.organization === user.organization?._id
    );
  }

  /**
   * Validates user creation within organization limits
   */
  static async validateUserCreation(organizationId: string, currentUserCount: number): Promise<void> {
    const Organization = (await import('@/models/Organization')).default;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (currentUserCount >= organization.subscription.maxUsers) {
      throw new Error(`Organization has reached its user limit of ${organization.subscription.maxUsers}`);
    }
  }

  /**
   * Validates document creation within organization limits
   */
  static async validateDocumentCreation(organizationId: string, currentDocumentCount: number): Promise<void> {
    const Organization = (await import('@/models/Organization')).default;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (currentDocumentCount >= organization.subscription.maxDocuments) {
      throw new Error(`Organization has reached its document limit of ${organization.subscription.maxDocuments}`);
    }
  }

  /**
   * Checks if organization has access to a specific feature
   */
  static async validateFeatureAccess(organizationId: string, feature: string): Promise<boolean> {
    const Organization = (await import('@/models/Organization')).default;

    const organization = await Organization.findById(organizationId);
    if (!organization) {
      return false;
    }

    return organization.subscription.features.includes(feature) ||
           organization.subscription.features.includes('*');
  }

  /**
   * Sanitizes data for public access
   */
  static sanitizeForPublicAccess(data: any): any {
    const sanitized = { ...data };

    // Remove sensitive fields
    delete sanitized.organization;
    delete sanitized.createdBy;
    delete sanitized.updatedBy;
    delete sanitized.__v;

    // Remove internal metadata
    if (sanitized.metadata) {
      delete sanitized.metadata.internalNotes;
      delete sanitized.metadata.privateComments;
    }

    return sanitized;
  }

  /**
   * Applies rate limiting for organization
   */
  static async checkRateLimit(organizationId: string, action: string): Promise<boolean> {
    // Implementation would depend on your rate limiting strategy
    // This is a placeholder for rate limiting logic
    return true;
  }

  /**
   * Logs access attempts for audit purposes
   */
  static logAccess(user: AuthUser, resource: string, action: string, success: boolean): void {
    const logEntry = {
      userId: user._id,
      userEmail: user.email,
      organizationId: user.organization?._id,
      resource,
      action,
      success,
      timestamp: new Date(),
      ipAddress: 'unknown', // Would be passed from request
      userAgent: 'unknown'  // Would be passed from request
    };

    // In a production environment, you would store this in a secure audit log
    console.log('ACCESS_LOG:', JSON.stringify(logEntry));
  }

  /**
   * Validates data integrity for organization
   */
  static validateDataIntegrity(data: any, organizationId: string): boolean {
    // Check if data belongs to the correct organization
    if (data.organization && data.organization.toString() !== organizationId) {
      return false;
    }

    // Additional integrity checks
    return true;
  }

  /**
   * Encrypts sensitive data fields
   */
  static encryptSensitiveData(data: any): any {
    // This is a placeholder - in production you would use proper encryption
    const encrypted = { ...data };

    if (encrypted.contact?.email) {
      // Encrypt email or other sensitive data
    }

    return encrypted;
  }

  /**
   * Decrypts sensitive data fields
   */
  static decryptSensitiveData(data: any): any {
    // This is a placeholder - in production you would use proper decryption
    return data;
  }

  /**
   * Validates file upload permissions
   */
  static async validateFileUpload(
    user: AuthUser,
    fileType: string,
    fileSize: number,
    organizationId: string
  ): Promise<void> {
    // Check organization limits
    const Organization = (await import('@/models/Organization')).default;
    const organization = await Organization.findById(organizationId);

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Check file type permissions based on subscription
    const allowedTypes = organization.subscription.plan === 'enterprise'
      ? ['image/*', 'application/pdf', 'application/vnd.openxmlformats-officedocument.*']
      : ['image/*'];

    const isAllowedType = allowedTypes.some(type =>
      type.endsWith('*') ? fileType.startsWith(type.slice(0, -1)) : fileType === type
    );

    if (!isAllowedType) {
      throw new Error('File type not allowed for your subscription plan');
    }

    // Check file size limits
    const maxFileSize = organization.subscription.plan === 'enterprise' ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB vs 10MB
    if (fileSize > maxFileSize) {
      throw new Error(`File size exceeds limit of ${maxFileSize / (1024 * 1024)}MB`);
    }
  }
}

export default DataIsolationService;