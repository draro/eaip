'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
  Copy
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
  sections: Array<{
    id: string;
    type: string;
    title: string;
    subsections: any[];
  }>;
}

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showDiffDialog, setShowDiffDialog] = useState(false);
  const [userRole, setUserRole] = useState<string>('editor'); // This would come from auth context

  useEffect(() => {
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
  }, []);

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

  const handleViewDocument = (documentId: string) => {
    router.push(`/documents/${documentId}`);
  };

  const handleEditDocument = (documentId: string) => {
    router.push(`/documents/${documentId}/edit`);
  };

  const handleDeleteDocument = async (documentId: string, documentTitle: string) => {
    if (confirm(`Are you sure you want to delete "${documentTitle}"? This action cannot be undone.`)) {
      try {
        // TODO: Add actual delete API call
        console.log('Deleting document:', documentId);
        // For now, just remove from local state
        setDocuments(prev => prev.filter(doc => doc._id !== documentId));
      } catch (error) {
        console.error('Error deleting document:', error);
        alert('Failed to delete document. Please try again.');
      }
    }
  };

  const handleExportDocument = (documentId: string) => {
    // TODO: Add actual export functionality
    console.log('Exporting document:', documentId);
    alert('Export functionality will be implemented soon.');
  };

  const handleCloneDocument = async (document: Document) => {
    const confirmed = confirm(
      `Clone "${document.title}"?\n\n` +
      `This will create a new document with:\n` +
      `- All sections and content from the original\n` +
      `- Draft status\n` +
      `- Current date as creation date\n\n` +
      `You can edit the cloned document after creation.`
    );

    if (!confirmed) return;

    try {
      const response = await fetch('/api/documents/clone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: document._id })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Document cloned successfully!\n\nNew document: "${result.data.title}"`);
        router.push(`/documents/${result.data._id}/edit`);
      } else {
        alert(`Failed to clone document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cloning document:', error);
      alert('Failed to clone document. Please try again.');
    }
  };

  // Enhanced Diff Viewer Component
  const DocumentDiffViewer = ({ document }: { document: Document }) => (
    <div className="space-y-6">
      {/* Change Summary */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <GitBranch className="w-4 h-4" />
          Document Changes Summary
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span><strong>Added:</strong> Emergency procedures section (2.3)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            <span><strong>Modified:</strong> Contact information updated</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
            <span><strong>Removed:</strong> Outdated emergency frequency</span>
          </div>
        </div>
      </div>

      {/* Side-by-side diff view */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2 text-red-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Previous Version (v{(parseFloat(document.version.versionNumber) - 0.1).toFixed(1)})
          </h4>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="font-mono text-sm space-y-2">
              <div className="font-semibold">1.1 Contact Information</div>
              <div>Phone: +39 06 1234567</div>
              <div>Email: old-contact@aviation.it</div>
              <div className="line-through text-red-600 bg-red-100 p-1 rounded">
                Emergency Freq: 118.250 MHz
              </div>
              <div className="text-gray-400">[Section 2.3 not present]</div>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-medium mb-2 text-green-700 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Current Version (v{document.version.versionNumber})
          </h4>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="font-mono text-sm space-y-2">
              <div className="font-semibold">1.1 Contact Information</div>
              <div>Phone: +39 06 1234567</div>
              <div className="bg-green-200 p-1 rounded">
                Email: new-contact@aviation.it
              </div>
              <div className="bg-green-200 p-1 rounded">
                Emergency Freq: 121.500 MHz
              </div>
              <div className="bg-green-200 p-1 rounded">
                <div className="font-semibold">2.3 Emergency Procedures</div>
                <div className="text-xs">In case of emergency, contact tower immediately on 121.500 MHz...</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Details */}
      <div className="space-y-3">
        <h4 className="font-semibold">Detailed Changes</h4>
        <div className="space-y-2">
          <div className="bg-green-50 border-l-4 border-green-400 p-3">
            <div className="text-sm font-medium text-green-800">Added Section</div>
            <div className="text-xs text-green-600">Section 2.3 "Emergency Procedures" has been added with comprehensive emergency contact information and procedures.</div>
          </div>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
            <div className="text-sm font-medium text-yellow-800">Modified Content</div>
            <div className="text-xs text-yellow-600">Contact email updated from old-contact@aviation.it to new-contact@aviation.it</div>
          </div>
          <div className="bg-red-50 border-l-4 border-red-400 p-3">
            <div className="text-sm font-medium text-red-800">Removed Content</div>
            <div className="text-xs text-red-600">Emergency frequency 118.250 MHz removed and replaced with standard 121.500 MHz</div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Documents</h1>
            <p className="text-gray-600">Manage AIP documents, supplements, and NOTAMs</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard">
              <Button variant="outline">
                Back to Dashboard
              </Button>
            </Link>
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

        {/* Documents List */}
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
                        <span>AIRAC: {document.airacCycle}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GitBranch className="w-4 h-4" />
                        <span>Version: {document.version.versionNumber}</span>
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
                        onClick={() => handleExportDocument(document._id)}
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
        </div>

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