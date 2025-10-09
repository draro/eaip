import dns from 'dns/promises';

export interface DNSCheckResult {
  domain: string;
  valid: boolean;
  records: {
    a?: string[];
    cname?: string[];
    txt?: string[];
  };
  errors?: string[];
  recommendations?: string[];
}

export async function checkDNSRecords(domain: string, targetIP?: string): Promise<DNSCheckResult> {
  const result: DNSCheckResult = {
    domain,
    valid: false,
    records: {},
    errors: [],
    recommendations: []
  };

  try {
    // Check A records
    try {
      const aRecords = await dns.resolve4(domain);
      result.records.a = aRecords;

      if (targetIP && aRecords.includes(targetIP)) {
        result.valid = true;
      } else if (targetIP) {
        result.errors?.push(`Domain ${domain} does not point to expected IP ${targetIP}`);
        result.recommendations?.push(`Add an A record pointing ${domain} to ${targetIP}`);
      }
    } catch (error) {
      result.errors?.push(`No A records found for ${domain}`);
    }

    // Check CNAME records
    try {
      const cnameRecords = await dns.resolveCname(domain);
      result.records.cname = cnameRecords;
    } catch (error) {
      // CNAME records are optional
    }

    // Check TXT records for verification
    try {
      const txtRecords = await dns.resolveTxt(domain);
      result.records.txt = txtRecords.map(record => record.join(''));

      // Look for eAIP verification TXT record
      const verificationRecord = txtRecords.find(record =>
        record.join('').includes('eaip-verification=')
      );

      if (verificationRecord) {
        result.valid = true;
      } else {
        result.recommendations?.push(
          `Add a TXT record: eaip-verification=${generateVerificationToken(domain)}`
        );
      }
    } catch (error) {
      result.recommendations?.push(
        `Add a TXT record for verification: eaip-verification=${generateVerificationToken(domain)}`
      );
    }

    // Additional checks for subdomain setup
    if (domain.includes('.')) {
      const rootDomain = domain.split('.').slice(-2).join('.');
      if (rootDomain !== domain) {
        result.recommendations?.push(
          `Consider setting up a CNAME record pointing ${domain} to your-eaip-host.com`
        );
      }
    }

  } catch (error) {
    result.errors?.push(`DNS lookup failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }

  return result;
}

export function generateVerificationToken(domain: string): string {
  // Generate a deterministic token based on domain
  return Buffer.from(`${domain}-${Date.now().toString().slice(-8)}`).toString('base64').slice(0, 16);
}

export async function verifyDomainOwnership(domain: string, expectedToken: string): Promise<boolean> {
  try {
    const txtRecords = await dns.resolveTxt(domain);
    return txtRecords.some(record =>
      record.join('').includes(`eaip-verification=${expectedToken}`)
    );
  } catch (error) {
    return false;
  }
}

export function getDNSSetupInstructions(domain: string, targetIP: string) {
  return {
    aRecord: {
      type: 'A',
      name: domain,
      value: targetIP,
      ttl: 3600,
      description: `Point ${domain} to the eAIP server`
    },
    txtRecord: {
      type: 'TXT',
      name: domain,
      value: `eaip-verification=${generateVerificationToken(domain)}`,
      ttl: 3600,
      description: 'Verify domain ownership for eAIP'
    },
    cnameAlternative: {
      type: 'CNAME',
      name: domain,
      value: 'your-eaip-host.com',
      ttl: 3600,
      description: 'Alternative: Point to eAIP CNAME (recommended for subdomains)'
    }
  };
}