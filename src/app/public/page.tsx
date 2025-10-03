'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Globe, Building2, FileText, Calendar, ChevronRight, Book, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  country: string;
  icaoCode?: string;
  settings: {
    publicUrl?: string;
    timezone: string;
    language: string;
  };
  branding?: {
    logoUrl?: string;
    colors?: {
      primary: string;
      secondary: string;
    };
  };
}

interface Version {
  _id: string;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: string;
  status: string;
  documents?: any[];
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  country: string;
  airport?: string;
  status: string;
  airacCycle: string;
  effectiveDate: string;
  sections: any[];
}

export default function PublicEAIPPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login?callbackUrl=/public');
      return;
    }

    fetchOrganizations();
  }, [session, status, router]);

  useEffect(() => {
    if (selectedOrgId) {
      fetchVersions();
    }
  }, [selectedOrgId]);

  useEffect(() => {
    if (selectedVersion && selectedOrgId) {
      fetchDocuments();
    }
  }, [selectedVersion, selectedOrgId]);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const user = session?.user as any;

      if (user?.role === 'super_admin') {
        // Super admin can see all organizations
        const response = await fetch('/api/organizations?limit=1000');
        const data = await response.json();

        if (data.success) {
          const orgs = data.data?.organizations || [];
          setOrganizations(orgs);

          // Set first organization as default
          if (orgs.length > 0) {
            setSelectedOrgId(orgs[0]._id);
            setCurrentOrg(orgs[0]);
          }
        }
      } else {
        // Regular users see only their organization
        if (user?.organization) {
          const response = await fetch(`/api/organizations/${user.organization._id}`);
          const data = await response.json();

          if (data.success) {
            const org = data.data;
            setOrganizations([org]);
            setSelectedOrgId(org._id);
            setCurrentOrg(org);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/versions?status=active&limit=100');
      const data = await response.json();

      if (data.success) {
        const versionsList = data.data || [];
        setVersions(versionsList);

        // Auto-select first version
        if (versionsList.length > 0) {
          setSelectedVersion(versionsList[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/documents?versionId=${selectedVersion}&organizationId=${selectedOrgId}&status=published`);
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data || []);
        setSelectedDoc(null);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleOrgChange = (orgId: string) => {
    setSelectedOrgId(orgId);
    const org = organizations.find(o => o._id === orgId);
    setCurrentOrg(org || null);
    setVersions([]);
    setSelectedVersion('');
    setDocuments([]);
    setSelectedDoc(null);
  };

  const handleVersionChange = (versionId: string) => {
    setSelectedVersion(versionId);
    setSelectedDoc(null);
  };

  const handleDocumentSelect = (doc: Document) => {
    setSelectedDoc(doc);
  };

  const getDocumentTypeColor = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'AIP': return 'bg-blue-100 text-blue-800';
      case 'SUPPLEMENT': return 'bg-purple-100 text-purple-800';
      case 'NOTAM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const user = session?.user as any;

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <Layout user={user}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  // No session
  if (!session) {
    return null;
  }

  const selectedVersionData = versions.find(v => v._id === selectedVersion);

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Public eAIP Viewer</h1>
                  <p className="text-gray-600">Electronic Aeronautical Information Publication</p>
                </div>
              </div>

              {/* Organization Selector - Only for super admin */}
              {user?.role === 'super_admin' && organizations.length > 0 && (
                <div className="w-80">
                  <Label htmlFor="org-select" className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Organization
                  </Label>
                  <Select value={selectedOrgId} onValueChange={handleOrgChange}>
                    <SelectTrigger id="org-select" className="w-full">
                      <SelectValue placeholder="Choose an organization" />
                    </SelectTrigger>
                    <SelectContent>
                      {organizations.map((org) => (
                        <SelectItem key={org._id} value={org._id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            <span>{org.name}</span>
                            {org.icaoCode && (
                              <span className="text-xs text-gray-500">({org.icaoCode})</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {currentOrg ? (
            <div className="grid grid-cols-12 gap-6">
              {/* Left Sidebar - Navigation */}
              <div className="col-span-3 space-y-4">
                {/* Organization Info */}
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      {currentOrg.branding?.logoUrl ? (
                        <img
                          src={currentOrg.branding.logoUrl}
                          alt={currentOrg.name}
                          className="w-10 h-10 object-contain"
                        />
                      ) : (
                        <Building2
                          className="w-10 h-10"
                          style={{ color: currentOrg.branding?.colors?.primary || '#2563eb' }}
                        />
                      )}
                      <div>
                        <CardTitle className="text-base">{currentOrg.name}</CardTitle>
                        <CardDescription className="text-xs">{currentOrg.country}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                {/* Version Selector */}
                {versions.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">AIRAC Version</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Select value={selectedVersion} onValueChange={handleVersionChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {versions.map((version) => (
                            <SelectItem key={version._id} value={version._id}>
                              <div className="flex flex-col">
                                <span>{version.versionNumber}</span>
                                <span className="text-xs text-gray-500">AIRAC {version.airacCycle}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {selectedVersionData && (
                        <div className="mt-3 p-2 bg-blue-50 rounded text-xs space-y-1">
                          <div className="flex items-center gap-1 text-gray-700">
                            <Calendar className="w-3 h-3" />
                            <span>Effective: {new Date(selectedVersionData.effectiveDate).toLocaleDateString()}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {selectedVersionData.status}
                          </Badge>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Documents List */}
                {documents.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Documents</CardTitle>
                      <CardDescription className="text-xs">{documents.length} published</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="max-h-96 overflow-y-auto">
                        {documents.map((doc) => (
                          <button
                            key={doc._id}
                            onClick={() => handleDocumentSelect(doc)}
                            className={`w-full text-left p-3 border-b hover:bg-gray-50 transition-colors ${
                              selectedDoc?._id === doc._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-600" />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-gray-900 truncate">
                                  {doc.title}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge className={`${getDocumentTypeColor(doc.documentType)} text-xs px-1 py-0`}>
                                    {doc.documentType}
                                  </Badge>
                                  {doc.airport && (
                                    <Badge variant="outline" className="text-xs px-1 py-0">
                                      {doc.airport}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Main Content Area - Document Viewer */}
              <div className="col-span-9">
                {selectedDoc ? (
                  <Card>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <CardTitle className="text-xl">{selectedDoc.title}</CardTitle>
                            <Badge className={getDocumentTypeColor(selectedDoc.documentType)}>
                              {selectedDoc.documentType}
                            </Badge>
                            {selectedDoc.airport && (
                              <Badge variant="outline">{selectedDoc.airport}</Badge>
                            )}
                          </div>
                          <CardDescription>
                            {selectedDoc.country} • AIRAC {selectedDoc.airacCycle} •
                            Effective {new Date(selectedDoc.effectiveDate).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export PDF
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="prose max-w-none">
                        {selectedDoc.sections && selectedDoc.sections.length > 0 ? (
                          <div className="space-y-6">
                            {selectedDoc.sections.map((section: any, idx: number) => (
                              <div key={section.id || idx} className="border-b pb-4 last:border-b-0">
                                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                                  {section.code && <span className="text-blue-600">{section.code}</span>}
                                  {section.code && ' - '}
                                  {section.title}
                                </h2>
                                {section.content && (
                                  <div
                                    className="text-gray-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: section.content }}
                                  />
                                )}
                                {section.subsections && section.subsections.length > 0 && (
                                  <div className="mt-4 ml-6 space-y-4">
                                    {section.subsections.map((subsection: any, subIdx: number) => (
                                      <div key={subsection.id || subIdx}>
                                        <h3 className="text-base font-medium text-gray-800 mb-2">
                                          {subsection.code && <span className="text-blue-600">{subsection.code}</span>}
                                          {subsection.code && ' - '}
                                          {subsection.title}
                                        </h3>
                                        {subsection.content && (
                                          <div
                                            className="text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: subsection.content }}
                                          />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            <Book className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                            <p>This document has no content sections.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {documents.length > 0
                          ? 'Select a Document'
                          : versions.length > 0
                          ? 'No Published Documents'
                          : 'Select a Version'}
                      </h3>
                      <p className="text-gray-600">
                        {documents.length > 0
                          ? 'Choose a document from the list on the left to view its content.'
                          : versions.length > 0
                          ? 'This version has no published documents yet.'
                          : 'Select an AIRAC version to view available documents.'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Organization Selected
                </h3>
                <p className="text-gray-600">
                  {user?.role === 'super_admin'
                    ? 'Select an organization from the dropdown above to view their eAIP.'
                    : 'You are not assigned to any organization. Please contact your administrator.'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </Layout>
  );
}
