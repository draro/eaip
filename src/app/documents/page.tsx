'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import DocumentDiffViewer from '@/components/DocumentDiffViewer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { formatAiracCycle } from '@/lib/utils';
import { ICAO_AIP_STRUCTURE, AIPSection } from '@/lib/aipStructure';
import {
  FileText,
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  GitBranch,
  Calendar,
  User,
  Globe,
  Copy,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

interface Document {
  _id: string;
  title: string;
  documentType: 'AIP' | 'SUPPLEMENT' | 'NOTAM';
  country: string;
  airport?: string;
  status: 'draft' | 'review' | 'published';
  airacCycle: string;
  revisionNumber?: number;
  effectiveDate: string;
  updatedAt: string;
  updatedBy: {
    name: string;
    email: string;
  };
  version: {
    versionNumber: string;
    airacCycle: string;
  };
  organization: {
    _id: string;
    name: string;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    subsections: Array<{
      id: string;
      code: string;
      title: string;
    }>;
  }>;
}

export default function DocumentsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [showCloneDialog, setShowCloneDialog] = useState(false);
  const [cloneTargetAirac, setCloneTargetAirac] = useState('');
  const [upcomingAiracCycles, setUpcomingAiracCycles] = useState<any[]>([]);
  const [cloningDocument, setCloningDocument] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'structure'>('list');
  const userRole = (session?.user as any)?.role || 'viewer';

  useEffect(() => {
    fetchDocuments();
    fetchUpcomingAiracCycles();
  }, []);

  const fetchUpcomingAiracCycles = async () => {
    try {
      const response = await fetch('/api/airac/activate?action=upcoming&count=12');
      const result = await response.json();
      if (result.success) {
        setUpcomingAiracCycles(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming AIRAC cycles:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/documents');
      const data = await response.json();

      if (data.success) {
        setDocuments(data.data);
      } else {
        console.error('Failed to fetch documents:', data.error);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  // Remove the old mock data code
  /*useEffect(() => {
    // Mock data - in real app, fetch from API based on user's organization
    const mockDocuments: Document[] = [
      {
        _id: '507f1f77bcf86cd799439011',
        title: 'General Information - Italy AIP',
        documentType: 'AIP',
        country: 'IT',
        status: 'published',
        airacCycle: '2024-13',
        effectiveDate: '2024-10-15',
        updatedAt: '2024-09-28',
        updatedBy: { name: 'Marco Rossi', email: 'marco@aviation.it' },
        version: { versionNumber: '1.2.0', airacCycle: '2024-13' },
        sections: [
          { id: 'gen-1', type: 'GEN', title: 'General Information', subsections: [] },
          { id: 'enr-1', type: 'ENR', title: 'En Route', subsections: [] }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439012',
        title: 'Milan Malpensa Airport Information',
        documentType: 'AIP',
        country: 'IT',
        airport: 'LIMC',
        status: 'review',
        airacCycle: '2024-14',
        effectiveDate: '2024-11-15',
        updatedAt: '2024-09-27',
        updatedBy: { name: 'Sofia Bianchi', email: 'sofia@aviation.it' },
        version: { versionNumber: '2.1.0', airacCycle: '2024-14' },
        sections: [
          { id: 'ad-1', type: 'AD', title: 'Aerodrome Information', subsections: [] }
        ]
      },
      {
        _id: '507f1f77bcf86cd799439013',
        title: 'Emergency NOTAM - Runway Closure',
        documentType: 'NOTAM',
        country: 'IT',
        airport: 'LIRF',
        status: 'draft',
        airacCycle: '2024-13',
        effectiveDate: '2024-09-30',
        updatedAt: '2024-09-28',
        updatedBy: { name: 'Giuseppe Verde', email: 'giuseppe@aviation.it' },
        version: { versionNumber: '1.0.0', airacCycle: '2024-13' },
        sections: []
      }
    ];

    setDocuments(mockDocuments);
    setLoading(false);
  }, []);*/

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AIP': return 'bg-blue-100 text-blue-800';
      case 'SUPPLEMENT': return 'bg-purple-100 text-purple-800';
      case 'NOTAM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = (document: Document) => {
    return ['super_admin', 'org_admin', 'editor'].includes(userRole) &&
           ['draft', 'review'].includes(document.status);
  };

  const canDelete = (document: Document) => {
    return ['super_admin', 'org_admin'].includes(userRole) ||
           (userRole === 'editor' && document.status === 'draft');
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doc.airport && doc.airport.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = !statusFilter || statusFilter === 'all' || doc.status === statusFilter;
    const matchesType = !typeFilter || typeFilter === 'all' || doc.documentType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Group documents by ICAO AIP structure sections
  const groupDocumentsByStructure = () => {
    const grouped = new Map<string, { section: AIPSection; documents: Document[] }>();

    // Initialize with ICAO structure
    ICAO_AIP_STRUCTURE.forEach(part => {
      if (part.children) {
        part.children.forEach(section => {
          grouped.set(section.code, { section, documents: [] });
        });
      }
    });

    // Group documents by their sections
    filteredDocuments.forEach(doc => {
      doc.sections.forEach(docSection => {
        // Match based on section type (GEN, ENR, AD)
        const sectionType = docSection.type; // "GEN", "ENR", or "AD"

        docSection.subsections?.forEach((subsection: any) => {
          // Try to find matching ICAO section by constructing the full code
          const fullCode = `${sectionType} ${subsection.code}`;

          // Look through all ICAO sections to find a match
          ICAO_AIP_STRUCTURE.forEach(part => {
            if (part.code === sectionType && part.children) {
              part.children.forEach(section => {
                // Check if this section or its children match
                if (section.code === fullCode) {
                  const existing = grouped.get(section.code);
                  if (existing && !existing.documents.find(d => d._id === doc._id)) {
                    existing.documents.push(doc);
                  }
                }

                // Also check subsections within the section
                if (section.children) {
                  section.children.forEach(subsec => {
                    if (subsec.code === fullCode) {
                      // Add to parent section
                      const existing = grouped.get(section.code);
                      if (existing && !existing.documents.find(d => d._id === doc._id)) {
                        existing.documents.push(doc);
                      }
                    }
                  });
                }
              });
            }
          });
        });
      });
    });

    return grouped;
  };

  const structuredDocuments = groupDocumentsByStructure();

  const handleViewDocument = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleEditDocument = (documentId: string) => {
    router.push(`/documents/${documentId}/edit`);
  };

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${documentTitle}"?\n\nThis action cannot be undone.\n\nNote: Only draft documents can be deleted. Published documents must be archived instead.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // Remove from local state
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
        alert('Document deleted successfully');
      } else {
        alert(`Failed to delete document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      alert('Failed to delete document. Please try again.');
    }
  };

  const handleExportDocument = async (document: Document) => {
    const format = prompt(
      `Export "${document.title}"\n\n` +
      `Choose export format:\n` +
      `1. JSON - Structured data format\n` +
      `2. XML - ICAO Annex 15 / EUROCONTROL Spec 3.0 compliant\n` +
      `3. HTML - Printable web format\n\n` +
      `Enter format (json/xml/html):`,
      'json'
    );

    if (!format) return;

    const normalizedFormat = format.toLowerCase().trim();
    if (!['json', 'xml', 'html'].includes(normalizedFormat)) {
      alert('Invalid format. Please choose: json, xml, or html');
      return;
    }

    try {
      const response = await fetch(`/api/documents/${document._id}/export?format=${normalizedFormat}`);

      if (!response.ok) {
        const result = await response.json();
        alert(`Export failed: ${result.error}`);
        return;
      }

      // Get the filename from Content-Disposition header or generate one
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `${document.country}-${document.documentType}-${document.airacCycle}.${normalizedFormat}`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = filename;
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);

      alert(`✅ Document exported successfully as ${normalizedFormat.toUpperCase()}`);
    } catch (error) {
      console.error('Error exporting document:', error);
      alert('Failed to export document. Please try again.');
    }
  };

  const handleCloneDocument = (document: Document) => {
    setSelectedDocument(document);
    setCloneTargetAirac('');
    setShowCloneDialog(true);
  };

  const confirmCloneDocument = async () => {
    if (!selectedDocument || !cloneTargetAirac) {
      alert('Please select a target AIRAC cycle');
      return;
    }

    setCloningDocument(true);
    try {
      const response = await fetch('/api/documents/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument._id,
          targetAiracCycle: cloneTargetAirac
        })
      });

      const result = await response.json();
      if (result.success) {
        setShowCloneDialog(false);
        alert(`✅ Document cloned successfully!\n\nNew document: "${result.data.title}"`);
        router.push(`/documents/${result.data._id}/edit`);
      } else {
        alert(`Failed to clone document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cloning document:', error);
      alert('Failed to clone document. Please try again.');
    } finally {
      setCloningDocument(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Manage AIP documents, supplements, and NOTAMs</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-gray-300 rounded-md p-1">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <FileText className="w-4 h-4 mr-2" />
                List View
              </Button>
              <Button
                variant={viewMode === 'structure' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('structure')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                ICAO Structure
              </Button>
            </div>
            {['super_admin', 'org_admin', 'editor'].includes(userRole) && (
              <Link href="/documents/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Document
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="AIP">AIP</SelectItem>
                  <SelectItem value="SUPPLEMENT">Supplement</SelectItem>
                  <SelectItem value="NOTAM">NOTAM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ICAO Structure View */}
        {viewMode === 'structure' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                ICAO Annex 15 Structure
              </CardTitle>
              <CardDescription>
                Documents organized by ICAO AIP sections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {ICAO_AIP_STRUCTURE.map((part) => (
                  <AccordionItem key={part.code} value={part.code}>
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{part.code}</span>
                        <span className="text-gray-600">-</span>
                        <span>{part.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {part.icaoReference}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 pl-4">
                        {part.children?.map((section) => {
                          const sectionData = structuredDocuments.get(section.code);
                          const docCount = sectionData?.documents.length || 0;

                          return (
                            <div key={section.code} className="border-l-2 border-blue-200 pl-4 py-2">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">{section.code}</span>
                                  <span className="text-gray-600">-</span>
                                  <span className="text-gray-700">{section.title}</span>
                                  {section.isMandatory && (
                                    <Badge variant="destructive" className="text-xs">
                                      Mandatory
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {section.icaoReference}
                                  </Badge>
                                </div>
                                <Badge variant="secondary">{docCount} docs</Badge>
                              </div>

                              {/* Documents for this section */}
                              {docCount > 0 && (
                                <div className="space-y-2 mt-3">
                                  {sectionData?.documents.map((doc) => (
                                    <div
                                      key={doc._id}
                                      className="bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">{doc.title}</span>
                                            <Badge className={getStatusColor(doc.status)} style={{ fontSize: '10px' }}>
                                              {doc.status}
                                            </Badge>
                                            <Badge className={getTypeColor(doc.documentType)} style={{ fontSize: '10px' }}>
                                              {doc.documentType}
                                            </Badge>
                                          </div>
                                          <div className="flex items-center gap-3 text-xs text-gray-600">
                                            <span>{doc.country}</span>
                                            {doc.airport && <span>• {doc.airport}</span>}
                                            <span>• AIRAC: {formatAiracCycle(doc.airacCycle)}</span>
                                            <span>• Revision: v{doc.revisionNumber || 1}</span>
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDocument(doc._id)}
                                          >
                                            <Eye className="w-4 h-4" />
                                          </Button>
                                          {canEdit(doc) && (
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleEditDocument(doc._id)}
                                            >
                                              <Edit className="w-4 h-4" />
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Subsections */}
                              {section.children && section.children.length > 0 && (
                                <div className="ml-4 mt-2 space-y-1">
                                  {section.children.map((subsection) => {
                                    const subData = structuredDocuments.get(subsection.code);
                                    const subDocCount = subData?.documents.length || 0;

                                    return (
                                      <div key={subsection.code} className="text-sm text-gray-700 flex items-center gap-2">
                                        <span className="font-mono text-xs">{subsection.code}</span>
                                        <span>-</span>
                                        <span>{subsection.title}</span>
                                        {subDocCount > 0 && (
                                          <Badge variant="secondary" className="text-xs">{subDocCount}</Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        {viewMode === 'list' && (
        <div className="space-y-4">
          {filteredDocuments.map((document) => (
            <Card key={document._id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{document.title}</h3>
                      <Badge className={getStatusColor(document.status)}>
                        {document.status}
                      </Badge>
                      <Badge className={getTypeColor(document.documentType)}>
                        {document.documentType}
                      </Badge>
                      {document.airport && (
                        <Badge variant="outline">
                          {document.airport}
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        <span>Country: {document.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>AIRAC: {formatAiracCycle(document.airacCycle)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        <span>Revision: v{document.revisionNumber || 1}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span>By: {document.updatedBy.name}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Effective: {new Date(document.effectiveDate).toLocaleDateString()}</span>
                      <span>Updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
                      <span>Sections: {document.sections.length}</span>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleViewDocument(document._id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Document
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDiffDialog(true);
                        }}
                      >
                        <GitBranch className="w-4 h-4 mr-2" />
                        View Changes
                      </DropdownMenuItem>

                      {canEdit(document) && (
                        <DropdownMenuItem
                          onClick={() => handleEditDocument(document._id)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Document
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => handleCloneDocument(document)}
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Clone Document
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => handleExportDocument(document)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </DropdownMenuItem>

                      {canDelete(document) && (
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteDocument(document._id, document.title)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}

        {filteredDocuments.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? 'No documents match your current filters.'
                  : 'Get started by creating your first document.'
                }
              </p>
              {['super_admin', 'org_admin', 'editor'].includes(userRole) && !searchTerm && !statusFilter && !typeFilter && (
                <Link href="/documents/create">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Document
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        )}
        </div>
        )}

        {/* Clone Document Dialog */}
        <Dialog open={showCloneDialog} onOpenChange={setShowCloneDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Copy className="w-5 h-5" />
                Clone Document for New AIRAC Cycle
              </DialogTitle>
              <DialogDescription>
                Select the target AIRAC cycle for the cloned document
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Source Document</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium">{selectedDocument?.title}</p>
                  <p className="text-sm text-gray-600">Current AIRAC: {selectedDocument?.airacCycle}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAirac">Target AIRAC Cycle *</Label>
                <Select value={cloneTargetAirac} onValueChange={setCloneTargetAirac}>
                  <SelectTrigger id="targetAirac">
                    <SelectValue placeholder="Select AIRAC cycle" />
                  </SelectTrigger>
                  <SelectContent>
                    {upcomingAiracCycles.length === 0 ? (
                      <div className="px-2 py-6 text-center text-sm text-gray-500">
                        Loading AIRAC cycles...
                      </div>
                    ) : (
                      upcomingAiracCycles.map((cycle) => (
                        <SelectItem key={cycle.airacCycle} value={cycle.airacCycle}>
                          {cycle.airacCycle} - Effective: {new Date(cycle.effectiveDate).toLocaleDateString()}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {upcomingAiracCycles.length > 0 && `${upcomingAiracCycles.length} upcoming cycles available`}
                </p>
              </div>

              <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> The cloned document will include all sections and content from the original document.
                  It will be created as a draft and you can edit it after cloning.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCloneDialog(false)}
                disabled={cloningDocument}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmCloneDocument}
                disabled={!cloneTargetAirac || cloningDocument}
              >
                {cloningDocument ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Cloning...
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Clone Document
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced Diff Viewer Dialog */}
        <Dialog open={showDiffDialog} onOpenChange={setShowDiffDialog}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <GitBranch className="w-5 h-5" />
                Document Changes - {selectedDocument?.title}
              </DialogTitle>
              <DialogDescription>
                Compare changes between versions {selectedDocument ? `v${(parseFloat(selectedDocument.version.versionNumber) - 0.1).toFixed(1)}` : ''} and v{selectedDocument?.version.versionNumber}
              </DialogDescription>
            </DialogHeader>
            {selectedDocument && (
              <DocumentDiffViewer document={selectedDocument} />
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </Layout>
  );
}