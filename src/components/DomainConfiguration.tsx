'use client';

import React, { useState } from 'react';
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
  ExternalLink
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

interface DomainConfigurationProps {
  organizationDomain?: string;
  onDomainUpdate?: (domain: string) => void;
}

export default function DomainConfiguration({
  organizationDomain,
  onDomainUpdate
}: DomainConfigurationProps) {
  const [domain, setDomain] = useState(organizationDomain || '');
  const [checking, setChecking] = useState(false);
  const [dnsResult, setDnsResult] = useState<DNSCheckResult | null>(null);
  const [setupInstructions, setSetupInstructions] = useState<{
    aRecord: DNSRecord;
    txtRecord: DNSRecord;
    cnameAlternative: DNSRecord;
  } | null>(null);

  const handleCheckDNS = async () => {
    if (!domain) return;

    setChecking(true);
    try {
      const response = await fetch('/api/domains/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ domain }),
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

  const getStatusIcon = (valid: boolean) => {
    return valid ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <XCircle className="w-5 h-5 text-red-600" />
    );
  };

  const getStatusBadge = (valid: boolean) => {
    return (
      <Badge className={valid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {valid ? 'Configured' : 'Not Configured'}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Custom Domain Configuration
        </CardTitle>
        <CardDescription>
          Set up a custom domain for your organization's public eAIP
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Domain Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Custom Domain</label>
          <div className="flex gap-2">
            <Input
              placeholder="eaip.yourorganization.com"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleCheckDNS}
              disabled={!domain || checking}
              variant="outline"
            >
              {checking ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                'Check DNS'
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Enter the domain where you want your public eAIP to be accessible
          </p>
        </div>

        {/* DNS Check Results */}
        {dnsResult && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(dnsResult.valid)}
                <span className="font-medium">DNS Status</span>
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

        {/* Setup Instructions */}
        {setupInstructions && (
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="instructions">Setup Instructions</TabsTrigger>
              <TabsTrigger value="records">DNS Records</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium">DNS Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Access your domain registrar's DNS management panel</li>
                  <li>Add the DNS records shown in the "DNS Records" tab</li>
                  <li>Wait for DNS propagation (usually 15 minutes to 24 hours)</li>
                  <li>Click "Check DNS" again to verify the configuration</li>
                </ol>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    DNS changes can take up to 24 hours to propagate worldwide.
                    You may need to wait before the verification succeeds.
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

                  {/* CNAME Alternative */}
                  <div className="border rounded-lg p-3 space-y-2 opacity-75">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">CNAME Record (Alternative)</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(setupInstructions.cnameAlternative.value)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                    <div className="text-sm font-mono bg-gray-100 p-2 rounded">
                      Type: {setupInstructions.cnameAlternative.type}<br />
                      Name: {setupInstructions.cnameAlternative.name}<br />
                      Value: {setupInstructions.cnameAlternative.value}<br />
                      TTL: {setupInstructions.cnameAlternative.ttl}
                    </div>
                    <p className="text-xs text-gray-600">{setupInstructions.cnameAlternative.description}</p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {domain && domain !== organizationDomain && (
            <Button
              onClick={() => onDomainUpdate?.(domain)}
              disabled={!dnsResult?.valid}
            >
              Save Domain Configuration
            </Button>
          )}
          {domain && (
            <Button variant="outline" asChild>
              <a
                href={`https://${domain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                Test Domain
                <ExternalLink className="w-3 h-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}