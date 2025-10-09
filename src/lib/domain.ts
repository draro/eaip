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
  static validateUserAccess(
    userOrgId: string | null | undefined,
    domainOrgId: string
  ): boolean {
    if (!userOrgId) return false;

    // Convert to strings for comparison
    const userOrgStr = userOrgId.toString();
    const domainOrgStr = domainOrgId.toString();

    return userOrgStr === domainOrgStr;
  }

}

// DNS record checking utilities (Edge Runtime compatible)
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