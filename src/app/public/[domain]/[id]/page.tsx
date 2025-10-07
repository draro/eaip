'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  X,
  Menu,
  Home,
  FileText,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatAiracCycle } from '@/lib/utils';
import SEOStructuredData from '@/components/SEOStructuredData';
import CanonicalLink from '@/components/CanonicalLink';

interface Subsection {
  id: string;
  code: string;
  title: string;
  content: any;
  order: number;
  isMandatory: boolean;
}

interface Section {
  id: string;
  type: string;
  title: string;
  description: string;
  subsections: Subsection[];
  order: number;
}

interface Document {
  _id: string;
  title: string;
  documentType: string;
  country: string;
  airport?: string;
  airacCycle: string;
  effectiveDate: string;
  sections: Section[];
  metadata: {
    language: string;
    authority: string;
    contact: string;
  };
  version: {
    versionNumber: string;
    airacCycle: string;
  };
  organizationBranding?: {
    settings?: {
      enableExport?: boolean;
      allowedExportFormats?: string[];
    };
  };
}

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

export default function PublicDocumentViewer() {
  const params = useParams();
  const router = useRouter();
  const domain = params.domain as string;
  const documentId = params.id as string;

  const [document, setDocument] = useState<Document | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [selectedSubsection, setSelectedSubsection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDocument();
  }, [documentId]);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/public/${domain}/documents/${documentId}`);

      if (response.ok) {
        const result = await response.json();
        const doc = result.data;
        setDocument(doc);

        // Extract organization from the response
        if (doc.organizationBranding) {
          setOrganization({
            name: doc.organizationBranding.name,
            country: doc.country || '',
            icaoCode: doc.organizationBranding.icaoCode,
            branding: doc.organizationBranding.branding,
            contact: doc.organizationBranding.contact || { email: '' },
          });
        }

        // Auto-select first section and subsection
        if (doc.sections && doc.sections.length > 0) {
          const firstSection = doc.sections[0];
          setSelectedSection(firstSection.id);
          setExpandedSections(new Set([firstSection.id]));

          if (firstSection.subsections && firstSection.subsections.length > 0) {
            setSelectedSubsection(firstSection.subsections[0].id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching document:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const selectSubsection = (sectionId: string, subsectionId: string) => {
    setSelectedSection(sectionId);
    setSelectedSubsection(subsectionId);

    // Ensure section is expanded
    if (!expandedSections.has(sectionId)) {
      setExpandedSections(new Set([...Array.from(expandedSections), sectionId]));
    }

    // Scroll to top of content
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  };

  const getNextSubsection = () => {
    if (!document || !selectedSection || !selectedSubsection) return null;

    const currentSection = document.sections.find(s => s.id === selectedSection);
    if (!currentSection) return null;

    const currentSubIndex = currentSection.subsections.findIndex(
      sub => sub.id === selectedSubsection
    );

    // Check if there's a next subsection in current section
    if (currentSubIndex < currentSection.subsections.length - 1) {
      return {
        sectionId: selectedSection,
        subsection: currentSection.subsections[currentSubIndex + 1]
      };
    }

    // Check if there's a next section
    const currentSectionIndex = document.sections.findIndex(s => s.id === selectedSection);
    if (currentSectionIndex < document.sections.length - 1) {
      const nextSection = document.sections[currentSectionIndex + 1];
      if (nextSection.subsections.length > 0) {
        return {
          sectionId: nextSection.id,
          subsection: nextSection.subsections[0]
        };
      }
    }

    return null;
  };

  const getPreviousSubsection = () => {
    if (!document || !selectedSection || !selectedSubsection) return null;

    const currentSection = document.sections.find(s => s.id === selectedSection);
    if (!currentSection) return null;

    const currentSubIndex = currentSection.subsections.findIndex(
      sub => sub.id === selectedSubsection
    );

    // Check if there's a previous subsection in current section
    if (currentSubIndex > 0) {
      return {
        sectionId: selectedSection,
        subsection: currentSection.subsections[currentSubIndex - 1]
      };
    }

    // Check if there's a previous section
    const currentSectionIndex = document.sections.findIndex(s => s.id === selectedSection);
    if (currentSectionIndex > 0) {
      const prevSection = document.sections[currentSectionIndex - 1];
      if (prevSection.subsections.length > 0) {
        return {
          sectionId: prevSection.id,
          subsection: prevSection.subsections[prevSection.subsections.length - 1]
        };
      }
    }

    return null;
  };

  const navigateNext = () => {
    const next = getNextSubsection();
    if (next) {
      selectSubsection(next.sectionId, next.subsection.id);
    }
  };

  const navigatePrevious = () => {
    const prev = getPreviousSubsection();
    if (prev) {
      selectSubsection(prev.sectionId, prev.subsection.id);
    }
  };

  const renderContent = (content: any) => {
    if (!content) return <div className="text-gray-500 italic">No content available</div>;

    // If content is a string, render it as HTML
    if (typeof content === 'string') {
      return <div dangerouslySetInnerHTML={{ __html: content }} className="prose max-w-none" />;
    }

    // If content is a ProseMirror JSON object
    if (content.type === 'doc' && content.content) {
      return <div dangerouslySetInnerHTML={{ __html: content }} className="prose max-w-none" />;
    }

    return <div className="text-gray-500 italic">Content format not supported</div>;
  };

  const getCurrentSubsection = () => {
    if (!document || !selectedSection || !selectedSubsection) return null;

    const section = document.sections.find(s => s.id === selectedSection);
    if (!section) return null;

    return section.subsections.find(sub => sub.id === selectedSubsection);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!document || !organization) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Document Not Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              This document is not available or has been removed.
            </p>
            <Button onClick={() => router.push(`/public/${domain}`)}>
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentSubsection = getCurrentSubsection();
  const nextSubsection = getNextSubsection();
  const prevSubsection = getPreviousSubsection();

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXTAUTH_URL || 'https://eaip.flyclim.com';
  const canonicalUrl = `${baseUrl}/public/${domain}/${documentId}`;

  return (
    <>
      {/* SEO Components */}
      <CanonicalLink url={canonicalUrl} />
      <SEOStructuredData
        organization={organization}
        document={document}
        domain={domain}
      />

      <div
        className="h-screen flex flex-col bg-gray-50"
        style={{
          fontFamily: (organization.branding as any).fontFamily || 'Inter, system-ui, sans-serif',
          fontSize: (organization.branding as any).fontSize || '16px',
          color: (organization.branding as any).textColor || '#000000'
        }}
      >
        {/* Header */}
      <header
        className="shadow-sm z-10"
        style={{ backgroundColor: organization.branding.primaryColor }}
      >
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push(`/public/${domain}`)}
                className="text-white hover:bg-white/20"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-white/30" />
              <div className="text-white">
                <h1 className="text-lg font-semibold">{document.title}</h1>
                <p className="text-xs text-white/80">
                  AIRAC {formatAiracCycle(document.airacCycle)} • Effective {new Date(document.effectiveDate).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchOpen(!searchOpen)}
                className="text-white hover:bg-white/20"
              >
                <Search className="w-4 h-4" />
              </Button>
              {document.organizationBranding?.settings?.enableExport !== false && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      window.open(`/api/public/${domain}/documents/${documentId}/export?format=${e.target.value}`, '_blank');
                      e.target.value = '';
                    }
                  }}
                  className="px-3 py-1 text-sm border rounded-md cursor-pointer bg-transparent text-white border-white/30 hover:bg-white/20"
                >
                  <option value="" className="text-gray-900">Export...</option>
                  {((document.organizationBranding?.settings?.allowedExportFormats as any) || ['pdf', 'docx']).map((format: string) => (
                    <option key={format} value={format} className="text-gray-900">{format.toUpperCase()}</option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Table of Contents */}
        <aside
          className={`bg-white border-r transition-all duration-300 flex flex-col ${
            sidebarOpen ? 'w-80' : 'w-0'
          }`}
          style={{ minWidth: sidebarOpen ? '320px' : '0' }}
        >
          {sidebarOpen && (
            <>
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-semibold text-gray-900">Table of Contents</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-600">
                  {document.sections.length} sections • {document.sections.reduce((sum, s) => sum + s.subsections.length, 0)} subsections
                </p>
              </div>

              <div className="flex-1 overflow-y-auto p-2">
                {document.sections.map((section) => (
                  <div key={section.id} className="mb-1">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-gray-900">
                          {section.type}
                        </div>
                        <div className="text-xs text-gray-600 truncate">
                          {section.title}
                        </div>
                      </div>
                      {expandedSections.has(section.id) ? (
                        <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      )}
                    </button>

                    {expandedSections.has(section.id) && (
                      <div className="ml-2 mt-1 space-y-1">
                        {section.subsections.map((subsection) => (
                          <button
                            key={subsection.id}
                            onClick={() => selectSubsection(section.id, subsection.id)}
                            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                              selectedSubsection === subsection.id
                                ? 'bg-blue-50 text-blue-700 font-medium border-l-2 border-blue-600'
                                : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="text-xs font-mono text-gray-500 flex-shrink-0 mt-0.5">
                                {section.type} {subsection.code}
                              </span>
                              <span className="flex-1 text-xs leading-relaxed">
                                {subsection.title}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </aside>

        {/* Toggle Sidebar Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed left-0 top-1/2 -translate-y-1/2 bg-white border-r border-t border-b rounded-r-lg p-2 shadow-lg hover:bg-gray-50 z-10"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        )}

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div ref={contentRef} className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto p-8">
              {currentSubsection ? (
                <div>
                  {/* Breadcrumb */}
                  <div className="mb-6 text-sm text-gray-600">
                    <span className="font-medium">
                      {document.sections.find(s => s.id === selectedSection)?.type}
                    </span>
                    {' '}&rsaquo;{' '}
                    <span className="font-mono">{currentSubsection.code}</span>
                  </div>

                  {/* Title */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {currentSubsection.title}
                  </h1>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 mb-8 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span>
                        {document.sections.find(s => s.id === selectedSection)?.type} {currentSubsection.code}
                      </span>
                    </div>
                    {currentSubsection.isMandatory && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Mandatory
                      </Badge>
                    )}
                  </div>

                  {/* Content */}
                  <div className="prose prose-blue max-w-none">
                    {renderContent(currentSubsection.content)}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p>Select a section from the table of contents</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Footer */}
          <div className="border-t bg-white px-8 py-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <Button
                variant="outline"
                onClick={navigatePrevious}
                disabled={!prevSubsection}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>

              <div className="text-sm text-gray-600">
                {currentSubsection && (
                  <span>
                    Section {document.sections.find(s => s.id === selectedSection)?.type} {currentSubsection.code}
                  </span>
                )}
              </div>

              <Button
                variant="outline"
                onClick={navigateNext}
                disabled={!nextSubsection}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
      </div>
    </>
  );
}
