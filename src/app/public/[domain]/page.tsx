'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Calendar, Globe, Mail, ExternalLink, Download, Phone } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { formatAiracCycle } from '@/lib/utils';

interface Organization {
  name: string;
  country: string;
  icaoCode?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  contact: {
    email: string;
    website?: string;
  };
}

interface Document {
  _id: string;
  title: string;
  documentType: 'AIP' | 'SUPPLEMENT' | 'NOTAM';
  country: string;
  airport?: string;
  airacCycle: string;
  effectiveDate: string;
  metadata: {
    language: string;
    authority: string;
  };
  version: {
    versionNumber: string;
    airacCycle: string;
    effectiveDate: string;
  };
}

interface PublicData {
  organization: Organization & {
    settings: {
      enableExport?: boolean;
      allowedExportFormats?: string[];
    };
  };
  statistics: {
    totalDocuments: number;
  };
  latestDocuments: Document[];
}

export default function PublicEAIPViewer() {
  const params = useParams();
  const domain = params.domain as string;

  const [data, setData] = useState<PublicData | null>(null);
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('');

  // Contact form state
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Detect if we're on a custom domain (not the main app domain)
  const isCustomDomain = typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    !window.location.hostname.includes('localhost') &&
    window.location.hostname !== 'eaip.flyclim.com' &&
    !window.location.hostname.includes('vercel.app') &&
    !window.location.hostname.includes('netlify.app');

  useEffect(() => {
    fetchPublicData();
  }, [domain]);

  const fetchPublicData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/${domain}`);

      if (response.ok) {
        const result = await response.json();
        setData(result.data);
      } else {
        console.error('Failed to fetch public data');
      }
    } catch (error) {
      console.error('Error fetching public data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const params = new URLSearchParams({
        action: 'search',
        q: searchTerm,
        ...(selectedType && { type: selectedType })
      });

      const response = await fetch(`/api/public/${domain}?${params}`);

      if (response.ok) {
        const result = await response.json();
        setSearchResults(result.data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const response = await fetch('https://automation.flyclim.com/webhook/contact-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...contactForm,
          domain,
          organizationName: data?.organization?.name,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        setSubmitSuccess(true);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setSubmitSuccess(false), 5000);
      } else {
        setSubmitError('Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitError('Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type) {
      case 'AIP': return 'bg-blue-100 text-blue-800';
      case 'SUPPLEMENT': return 'bg-green-100 text-green-800';
      case 'NOTAM': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>eAIP Not Available</CardTitle>
            <CardDescription>
              The electronic AIP for this domain is not available or public access is disabled.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const { organization } = data;
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXTAUTH_URL || 'https://eaip.flyclim.com';
  const canonicalUrl = `${baseUrl}/public/${domain}`;

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: `${organization.branding.primaryColor}10`,
        fontFamily: (organization.branding as any).fontFamily || 'Inter, system-ui, sans-serif',
        fontSize: (organization.branding as any).fontSize || '16px',
        color: (organization.branding as any).textColor || '#000000'
      }}
    >
        {/* Header */}
      <header
        className="shadow-sm"
        style={{ backgroundColor: organization.branding.primaryColor }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {organization.branding.logoUrl && (
                <img
                  src={organization.branding.logoUrl}
                  alt={organization.name}
                  className="h-12 w-12 object-contain bg-white rounded p-1"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {organization.name}
                </h1>
                <p className="text-white/80 text-sm">
                  Electronic Aeronautical Information Publication
                  {organization.icaoCode && ` - ${organization.icaoCode}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-white/80">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="text-sm">{organization.country}</span>
              </div>
              {organization.contact.website && (
                <a
                  href={organization.contact.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">Website</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Search Section */}
        <Card>
          <CardHeader style={{
            borderBottom: `2px solid ${organization.branding.primaryColor}`,
            backgroundColor: `${organization.branding.primaryColor}05`
          }}>
            <CardTitle className="flex items-center gap-2" style={{ color: organization.branding.primaryColor }}>
              <Search className="w-5 h-5" />
              Search eAIP Documents
            </CardTitle>
            <CardDescription>
              Search through published aeronautical information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Search documents, sections, or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  style={{ borderColor: organization.branding.primaryColor + '40' }}
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md"
                style={{ borderColor: organization.branding.primaryColor + '40' }}
              >
                <option value="">All Types</option>
                <option value="AIP">AIP</option>
                <option value="SUPPLEMENT">Supplement</option>
                <option value="NOTAM">NOTAM</option>
              </select>
              <Button
                onClick={handleSearch}
                disabled={searching}
                style={{
                  backgroundColor: organization.branding.secondaryColor,
                  color: 'white'
                }}
              >
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Search Results ({searchResults.length})</h3>
                {searchResults.map((doc) => (
                  <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{doc.title}</h4>
                          <Badge className={getDocumentTypeColor(doc.documentType)}>
                            {doc.documentType}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div>AIRAC Cycle: {formatAiracCycle(doc.airacCycle)}</div>
                          <div>Effective: {new Date(doc.effectiveDate).toLocaleDateString()}</div>
                          <div>Authority: {doc.metadata.authority}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            // Use clean URLs on custom domains
                            const url = isCustomDomain ? `/${doc._id}` : `/public/${domain}/${doc._id}`;
                            window.location.href = url;
                          }}
                          style={{
                            backgroundColor: organization.branding.primaryColor,
                            color: 'white'
                          }}
                          className="hover:opacity-90"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {data.organization.settings.enableExport !== false && (
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                window.open(`/api/public/${domain}/documents/${doc._id}/export?format=${e.target.value}`, '_blank');
                                e.target.value = '';
                              }
                            }}
                            className="px-3 py-1 text-sm border rounded-md cursor-pointer"
                            style={{
                              borderColor: organization.branding.primaryColor,
                              color: organization.branding.primaryColor
                            }}
                          >
                            <option value="">Export...</option>
                            {(data.organization.settings.allowedExportFormats || ['pdf', 'docx']).map((format: string) => (
                              <option key={format} value={format}>{format.toUpperCase()}</option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.statistics.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                Available for public access
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current AIRAC</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {data.latestDocuments[0]?.airacCycle ? formatAiracCycle(data.latestDocuments[0].airacCycle) : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">
                Latest cycle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Contact Us</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <a href="mailto:info@flyclim.com" className="text-blue-600 hover:underline">
                      info@flyclim.com
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="space-y-1">
                    <div>
                      <a href="tel:+19894472494" className="text-blue-600 hover:underline">
                        +1 989 447 2494
                      </a>
                    </div>
                    <div>
                      <a href="tel:+972538344355" className="text-blue-600 hover:underline">
                        +972 53 834 4355
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              <form onSubmit={handleContactSubmit} className="space-y-3">
                <div>
                  <Input
                    type="text"
                    placeholder="Your Name"
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Your Message"
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    required
                    className="w-full min-h-[100px]"
                  />
                </div>
                {submitSuccess && (
                  <p className="text-sm text-green-600">Message sent successfully!</p>
                )}
                {submitError && (
                  <p className="text-sm text-red-600">{submitError}</p>
                )}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full"
                  style={{ backgroundColor: organization.branding.primaryColor }}
                >
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Latest Documents */}
        <Card>
          <CardHeader style={{
            borderBottom: `2px solid ${organization.branding.primaryColor}`,
            backgroundColor: `${organization.branding.primaryColor}05`
          }}>
            <CardTitle style={{ color: organization.branding.primaryColor }}>
              Latest Published Documents
            </CardTitle>
            <CardDescription>
              Most recently published aeronautical information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.latestDocuments.map((doc) => (
                <div key={doc._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{doc.title}</h3>
                        <Badge className={getDocumentTypeColor(doc.documentType)}>
                          {doc.documentType}
                        </Badge>
                        {doc.airport && (
                          <Badge variant="outline">
                            {doc.airport}
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">AIRAC:</span> {formatAiracCycle(doc.airacCycle)}
                        </div>
                        <div>
                          <span className="font-medium">Version:</span> {doc.version.versionNumber}
                        </div>
                        <div>
                          <span className="font-medium">Effective:</span> {new Date(doc.effectiveDate).toLocaleDateString()}
                        </div>
                        <div>
                          <span className="font-medium">Language:</span> {doc.metadata.language.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          // Use clean URLs on custom domains
                          const url = isCustomDomain ? `/${doc._id}` : `/public/${domain}/${doc._id}`;
                          window.location.href = url;
                        }}
                        style={{
                          backgroundColor: organization.branding.primaryColor,
                          color: 'white'
                        }}
                        className="hover:opacity-90"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {data.organization.settings.enableExport !== false && (
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              window.open(`/api/public/${domain}/documents/${doc._id}/export?format=${e.target.value}`, '_blank');
                              e.target.value = '';
                            }
                          }}
                          className="px-3 py-1 text-sm border rounded-md cursor-pointer"
                          style={{
                            borderColor: organization.branding.primaryColor,
                            color: organization.branding.primaryColor
                          }}
                        >
                          <option value="">Export...</option>
                          {(data.organization.settings.allowedExportFormats || ['pdf', 'docx']).map((format: string) => (
                            <option key={format} value={format}>{format.toUpperCase()}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {data.latestDocuments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No published documents available at this time.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <footer
          className="text-center text-sm border-t pt-6"
          style={{
            borderTopColor: organization.branding.primaryColor + '40',
            color: organization.branding.primaryColor
          }}
        >
          <p>
            {(organization.branding as any).footerText || `This electronic AIP is published by ${organization.name} in accordance with ICAO Annex 15.`}
          </p>
          <p className="mt-2">
            For technical issues or inquiries, contact{' '}
            <a
              href={`mailto:${organization.contact.email}`}
              style={{ color: organization.branding.secondaryColor }}
              className="font-medium hover:underline"
            >
              {organization.contact.email}
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}