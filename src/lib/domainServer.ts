// Server-side domain utilities (not used in middleware)
import connectDB from '@/lib/mongodb';
import Domain from '@/models/Domain';
import Organization from '@/models/Organization';
import { Types } from 'mongoose';

export interface DomainInfo {
  domain: string;
  organizationId: string;
  organization?: {
    _id: string;
    name: string;
    status: string;
    settings: {
      publicUrl: string;
      timezone: string;
      language: string;
    };
  };
  isActive: boolean;
  isVerified: boolean;
}

export interface TenantInfo {
  organizationId: string;
  domain: string;
  organization?: any;
  isMainDomain: boolean;
}

export class DomainService {
  private static instance: DomainService;
  private domainCache = new Map<string, { data: DomainInfo; expiry: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  static getInstance(): DomainService {
    if (!DomainService.instance) {
      DomainService.instance = new DomainService();
    }
    return DomainService.instance;
  }

  /**
   * Get organization ID from domain with caching
   */
  async getOrganizationByDomain(domain: string): Promise<DomainInfo | null> {
    const cleanDomain = domain.toLowerCase().replace(/^www\./, '');

    // Check cache first
    const cached = this.domainCache.get(cleanDomain);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }

    try {
      await connectDB();

      // First try to find in domains collection
      const domainRecord = await Domain.findOne({
        domain: cleanDomain,
        isActive: true
      }).populate('organizationId');

      if (domainRecord?.organizationId) {
        const domainInfo: DomainInfo = {
          domain: cleanDomain,
          organizationId: domainRecord.organizationId._id.toString(),
          organization: {
            _id: domainRecord.organizationId._id.toString(),
            name: domainRecord.organizationId.name,
            status: domainRecord.organizationId.status,
            settings: domainRecord.organizationId.settings,
          },
          isActive: domainRecord.isActive,
          isVerified: domainRecord.isVerified,
        };

        // Cache the result
        this.domainCache.set(cleanDomain, {
          data: domainInfo,
          expiry: Date.now() + this.cacheTimeout
        });

        return domainInfo;
      }

      // Fallback: check organization's default domain field
      const organization = await Organization.findOne({
        domain: cleanDomain,
        status: 'active'
      });

      if (organization) {
        const domainInfo: DomainInfo = {
          domain: cleanDomain,
          organizationId: organization._id.toString(),
          organization: {
            _id: organization._id.toString(),
            name: organization.name,
            status: organization.status,
            settings: organization.settings,
          },
          isActive: true,
          isVerified: true, // Default domains are considered verified
        };

        // Cache the result
        this.domainCache.set(cleanDomain, {
          data: domainInfo,
          expiry: Date.now() + this.cacheTimeout
        });

        return domainInfo;
      }

      return null;
    } catch (error) {
      console.error('Error looking up domain:', error);
      return null;
    }
  }

  /**
   * Extract domain from request headers
   */
  static extractDomain(host: string | null): string | null {
    if (!host) return null;

    // Remove port number if present
    const domain = host.split(':')[0].toLowerCase();

    // Skip localhost and IP addresses for development
    if (domain === 'localhost' || /^\d+\.\d+\.\d+\.\d+$/.test(domain)) {
      return null;
    }

    return domain;
  }

  /**
   * Check if user belongs to organization for domain
   */
  static async validateUserAccess(
    userOrgId: string | null | undefined,
    domainOrgId: string
  ): Promise<boolean> {
    if (!userOrgId) return false;

    // Convert to strings for comparison
    const userOrgStr = userOrgId.toString();
    const domainOrgStr = domainOrgId.toString();

    return userOrgStr === domainOrgStr;
  }

  /**
   * Get tenant information for the current request
   */
  async getTenantInfo(host: string | null): Promise<TenantInfo | null> {
    const domain = DomainService.extractDomain(host);
    if (!domain) return null;

    const domainInfo = await this.getOrganizationByDomain(domain);
    if (!domainInfo) return null;

    return {
      organizationId: domainInfo.organizationId,
      domain: domainInfo.domain,
      organization: domainInfo.organization,
      isMainDomain: domain === domainInfo.organization?.settings?.publicUrl?.replace(/^https?:\/\//, ''),
    };
  }

  /**
   * Clear domain cache (useful for testing or when domains are updated)
   */
  clearCache(domain?: string): void {
    if (domain) {
      this.domainCache.delete(domain.toLowerCase());
    } else {
      this.domainCache.clear();
    }
  }

  /**
   * Preload domain into cache
   */
  async preloadDomain(domain: string): Promise<void> {
    await this.getOrganizationByDomain(domain);
  }
}

// DNS record checking utilities
export class DNSChecker {
  static async checkCNAME(domain: string, expectedTarget: string): Promise<boolean> {
    try {
      // This would need a DNS resolution library in a real implementation
      // For now, we'll use a simple fetch to check if the domain resolves
      const response = await fetch(`https://${domain}/.well-known/domain-verification`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async verifyDomainOwnership(domain: string, token: string): Promise<boolean> {
    try {
      // Check for verification token at well-known URL
      const response = await fetch(`https://${domain}/.well-known/domain-verification/${token}`, {
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  static async checkDNSRecords(domain: string): Promise<{
    cname?: string;
    a?: string[];
    verified: boolean;
  }> {
    // In a production environment, you would use a proper DNS library
    // like 'dns' in Node.js or a third-party service
    try {
      // Simplified check - attempt to resolve the domain
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });

      return {
        verified: response.ok,
        cname: response.ok ? 'verified' : undefined,
      };
    } catch {
      return { verified: false };
    }
  }
}

// Export singleton instance
export const domainService = DomainService.getInstance();