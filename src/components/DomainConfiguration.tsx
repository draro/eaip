'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  RefreshCw,
  ExternalLink,
  Trash2,
  Plus
} from 'lucide-react';

interface DNSRecord {
  type: string;
  name: string;
  value: string;
  ttl: number;
  description: string;
}

interface DNSCheckResult {
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

interface Domain {
  _id: string;
  domain: string;
  organizationId: string;
  isActive: boolean;
  isVerified: boolean;
  sslStatus: 'pending' | 'active' | 'failed' | 'expired';
  verificationToken?: string;
  verifiedAt?: string;
  lastCheckedAt?: string;
  dnsRecords?: {
    type: 'CNAME' | 'A';
    value: string;
    verified: boolean;
    lastChecked: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface DomainConfigurationProps {
  organizationId?: string;
  organizationDomain?: string;
  onDomainUpdate?: (domains: Domain[]) => void;
}

export default function DomainConfiguration({
  organizationId,
  organizationDomain,
  onDomainUpdate
}: DomainConfigurationProps) {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [dnsResult, setDnsResult] = useState<DNSCheckResult | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<{
    aRecord: DNSRecord;
    txtRecord: DNSRecord;
    cnameAlternative: DNSRecord;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load domains on component mount
  useEffect(() => {
    if (organizationId) {
      loadDomains();
    }
  }, [organizationId]);

  const loadDomains = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/domains?organizationId=${organizationId}`);
      const result = await response.json();

      if (result.success) {
        setDomains(result.data);
        onDomainUpdate?.(result.data);
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
      setError('Failed to load domains');
    } finally {
      setLoading(false);
    }
  };

  const checkDomainAvailability = async (domain: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/domains/check?domain=${domain}&type=availability`);
      const result = await response.json();
      return result.success && result.available;
    } catch (error) {
      console.error('Error checking domain availability:', error);
      return false;
    }
  };

  const handleAddDomain = async () => {
    if (!newDomain || !organizationId) return;

    setError(null);
    setLoading(true);

    try {
      // First check if domain is available
      const isAvailable = await checkDomainAvailability(newDomain);
      if (!isAvailable) {
        setError('Domain is already registered by another organization');
        return;
      }

      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain: newDomain.toLowerCase(),
          organizationId
        }),
      });

      const result = await response.json();
      if (result.success) {
        setNewDomain('');
        await loadDomains(); // Reload domains list
        // Automatically fetch DNS instructions for the newly added domain
        await handleCheckDNS(newDomain.toLowerCase());
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error adding domain:', error);
      setError('Failed to add domain');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyDomain = async (domainId: string) => {
    setVerifying(domainId);
    setError(null);

    try {
      const response = await fetch(`/api/domains/${domainId}/verify`, {
        method: 'POST',
      });

      const result = await response.json();
      if (result.success) {
        await loadDomains(); // Reload to get updated status
      } else {
        setError(result.message || 'Domain verification failed');
      }
    } catch (error) {
      console.error('Error verifying domain:', error);
      setError('Failed to verify domain');
    } finally {
      setVerifying(null);
    }
  };

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain?')) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        await loadDomains(); // Reload domains list
      } else {
        setError(result.error);
      }
    } catch (error) {
      console.error('Error deleting domain:', error);
      setError('Failed to delete domain');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckDNS = async (domain: string) => {
    setChecking(true);
    try {
      const response = await fetch(`/api/domains/check?domain=${domain}`, {
        method: 'GET',
      });

      const result = await response.json();
      if (result.success) {
        setDnsResult(result.data.dnsCheck);
        setSetupInstructions(result.data.setupInstructions);
      } else {
        console.error('DNS check failed:', result.error);
      }
    } catch (error) {
      console.error('Error checking DNS:', error);
    } finally {
      setChecking(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getStatusIcon = (isVerified: boolean) => {
    return isVerified ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (isVerified: boolean) => {
    return (
      <Badge className={isVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {isVerified ? 'Verified' : 'Not Verified'}
      </Badge>
    );
  };

  const getSSLBadge = (sslStatus: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      expired: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={colors[sslStatus as keyof typeof colors] || colors.pending}>
        SSL {sslStatus}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Multi-Tenant Domain Configuration
          </CardTitle>
          <CardDescription>
            Manage custom domains for your organization's multi-tenant eAIP system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Add New Domain */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Add Custom Domain</label>
            <div className="flex gap-2">
              <Input
                placeholder="eaip.yourorganization.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                className="flex-1"
                disabled={loading}
              />
              <Button
                onClick={handleAddDomain}
                disabled={!newDomain || loading}
                variant="default"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Domain
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              Add a domain where your public eAIP will be accessible with strict tenant isolation
            </p>
          </div>

          {/* Domains List */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Registered Domains ({domains.length})</h4>

            {loading && domains.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading domains...
              </div>
            )}

            {domains.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                <Globe className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>No custom domains configured yet</p>
                <p className="text-sm">Add your first domain above to get started</p>
              </div>
            )}

            {domains.map((domain) => (
              <Card key={domain._id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-lg">{domain.domain}</h5>
                        {getStatusIcon(domain.isVerified)}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {getStatusBadge(domain.isVerified)}
                        {getSSLBadge(domain.sslStatus)}
                        <Badge variant="outline">
                          {domain.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>Added: {new Date(domain.createdAt).toLocaleDateString()}</p>
                        {domain.verifiedAt && (
                          <p>Verified: {new Date(domain.verifiedAt).toLocaleDateString()}</p>
                        )}
                        {domain.lastCheckedAt && (
                          <p>Last checked: {new Date(domain.lastCheckedAt).toLocaleDateString()}</p>
                        )}
                      </div>

                      {/* DNS Records */}
                      {domain.dnsRecords && domain.dnsRecords.length > 0 && (
                        <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
                          <p className="font-medium mb-1">DNS Records:</p>
                          {domain.dnsRecords.map((record, idx) => (
                            <div key={idx} className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{record.type}</Badge>
                              <span className="font-mono text-xs">{record.value}</span>
                              {record.verified && <CheckCircle className="w-3 h-3 text-green-500" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerifyDomain(domain._id)}
                        disabled={verifying === domain._id}
                      >
                        {verifying === domain._id ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          'Verify'
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckDNS(domain.domain)}
                        disabled={checking}
                      >
                        {checking ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          'Check DNS'
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                      >
                        <a
                          href={`https://${domain.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteDomain(domain._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DNS Setup Instructions - Only shown when DNS check results are available */}
      {dnsResult && setupInstructions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              DNS Configuration Instructions
            </CardTitle>
            <CardDescription>
              Follow these steps to configure your domain for multi-tenant access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="instructions" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
                <TabsTrigger value="records">DNS Records</TabsTrigger>
              </TabsList>

              <TabsContent value="instructions" className="space-y-4">
                <div className="space-y-3">
                  <h4 className="font-medium">Multi-Tenant DNS Setup Steps:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Access your domain registrar's DNS management panel</li>
                    <li>Add the DNS records shown in the "DNS Records" tab</li>
                    <li>Ensure the domain points to our multi-tenant system</li>
                    <li>Wait for DNS propagation (usually 15 minutes to 24 hours)</li>
                    <li>Click "Verify" on the domain to confirm configuration</li>
                    <li>Test tenant isolation by accessing your domain</li>
                  </ol>

                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Multi-Tenant Security:</strong> Each domain will enforce strict organization-level access control.
                      Users from other organizations cannot access your domain, ensuring complete tenant isolation.
                    </AlertDescription>
                  </Alert>

                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      DNS changes can take up to 24 hours to propagate worldwide.
                      SSL certificates will be automatically provisioned once DNS is verified.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>

              <TabsContent value="records" className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Required DNS Records:</h4>

                    {/* A Record */}
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">A Record</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(setupInstructions.aRecord.value)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        Type: {setupInstructions.aRecord.type}<br />
                        Name: {setupInstructions.aRecord.name}<br />
                        Value: {setupInstructions.aRecord.value}<br />
                        TTL: {setupInstructions.aRecord.ttl}
                      </div>
                      <p className="text-xs text-gray-600">{setupInstructions.aRecord.description}</p>
                    </div>

                    {/* TXT Record */}
                    <div className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">TXT Record (Verification)</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(setupInstructions.txtRecord.value)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                        Type: {setupInstructions.txtRecord.type}<br />
                        Name: {setupInstructions.txtRecord.name}<br />
                        Value: {setupInstructions.txtRecord.value}<br />
                        TTL: {setupInstructions.txtRecord.ttl}
                      </div>
                      <p className="text-xs text-gray-600">{setupInstructions.txtRecord.description}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Current DNS Status */}
            {dnsResult && (
              <div className="mt-4 space-y-4 border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dnsResult.valid)}
                    <span className="font-medium">Current DNS Status</span>
                  </div>
                  {getStatusBadge(dnsResult.valid)}
                </div>

                {/* DNS Records Found */}
                {(dnsResult.records.a || dnsResult.records.cname || dnsResult.records.txt) && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Current DNS Records:</h4>
                    <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm font-mono">
                      {dnsResult.records.a && (
                        <div>A: {dnsResult.records.a.join(', ')}</div>
                      )}
                      {dnsResult.records.cname && (
                        <div>CNAME: {dnsResult.records.cname.join(', ')}</div>
                      )}
                      {dnsResult.records.txt && dnsResult.records.txt.length > 0 && (
                        <div>TXT: {dnsResult.records.txt.slice(0, 2).map(txt => txt.slice(0, 50) + '...').join(', ')}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Errors */}
                {dnsResult.errors && dnsResult.errors.length > 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <ul className="list-disc list-inside space-y-1">
                        {dnsResult.errors.map((error, index) => (
                          <li key={index} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}