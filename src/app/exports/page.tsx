'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, FileText, Calendar, User, Clock, CheckCircle, XCircle, AlertCircle, Book, Plus } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface ExportJob {
  _id: string;
  type: 'docx' | 'pdf' | 'xml' | 'html';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  errorMessage?: string;
  requestedBy: {
    name: string;
    email: string;
  };
  version: {
    versionNumber: string;
    airacCycle: string;
  };
  documentIds: string[];
  createdAt: string;
  completedAt?: string;
  expiresAt: string;
}

interface Document {
  _id: string;
  title: string;
  sectionCode: string;
  subsectionCode: string;
  version: {
    _id: string;
    versionNumber: string;
    airacCycle: string;
  };
}

interface Version {
  _id: string;
  versionNumber: string;
  airacCycle: string;
}

export default function ExportsPage() {
  const [exports, setExports] = useState<ExportJob[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Form state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedVersion, setSelectedVersion] = useState('');
  const [exportFormat, setExportFormat] = useState<'docx' | 'pdf' | 'xml' | 'html'>('pdf');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch export jobs
      const exportsResponse = await fetch('/api/exports');
      if (exportsResponse.ok) {
        const exportsResult = await exportsResponse.json();
        if (exportsResult.success) {
          setExports(exportsResult.data || []);
        }
      }

      // Fetch documents
      const docsResponse = await fetch('/api/documents');
      if (docsResponse.ok) {
        const docsResult = await docsResponse.json();
        if (docsResult.success) {
          setDocuments(docsResult.data || []);
        }
      }

      // Fetch versions
      const versionsResponse = await fetch('/api/versions');
      if (versionsResponse.ok) {
        const versionsResult = await versionsResponse.json();
        if (versionsResult.success) {
          setVersions(versionsResult.data || []);
          if (versionsResult.data.length > 0) {
            setSelectedVersion(versionsResult.data[0]._id);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    if (selectedDocuments.length === 0 || !selectedVersion) {
      alert('Please select documents and version');
      return;
    }

    setExporting(true);
    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocuments,
          format: exportFormat,
          versionId: selectedVersion,
          requestedBy: '507f1f77bcf86cd799439011', // TODO: Get from auth context
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Add the new export job to the list
        const newJob: ExportJob = {
          _id: result.data.jobId,
          type: exportFormat,
          status: result.data.status,
          downloadUrl: result.data.downloadUrl,
          requestedBy: {
            name: 'Current User', // TODO: Get from auth context
            email: 'user@example.com',
          },
          version: versions.find(v => v._id === selectedVersion) || { versionNumber: '', airacCycle: '' },
          documentIds: selectedDocuments,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        };
        setExports([newJob, ...exports]);
        setIsCreateOpen(false);
        setSelectedDocuments([]);

        if (result.data.downloadUrl) {
          window.open(result.data.downloadUrl, '_blank');
        }
      } else {
        alert(`Export failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating export:', error);
      alert('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const filteredDocuments = documents.filter(doc => doc.version._id === selectedVersion);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading exports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Link href="/" className="flex items-center mr-8">
                <Book className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
              </Link>
              <nav className="flex space-x-4">
                <Link href="/documents">
                  <Button variant="ghost">Documents</Button>
                </Link>
                <Link href="/versions">
                  <Button variant="ghost">Versions</Button>
                </Link>
                <Link href="/exports">
                  <Button variant="default">Exports</Button>
                </Link>
              </nav>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Export
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Export Job</DialogTitle>
                  <DialogDescription>
                    Select documents and format to export AIP content.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div>
                    <label className="text-sm font-medium">Version</label>
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                    >
                      <option value="">Select Version</option>
                      {versions.map((version) => (
                        <option key={version._id} value={version._id}>
                          {version.versionNumber} - AIRAC {version.airacCycle}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Export Format</label>
                    <div className="grid grid-cols-4 gap-2 mt-1">
                      {(['docx', 'pdf', 'xml', 'html'] as const).map((format) => (
                        <Button
                          key={format}
                          variant={exportFormat === format ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setExportFormat(format)}
                          className="w-full"
                        >
                          {format.toUpperCase()}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Documents ({filteredDocuments.length} available)</label>
                    <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-md mt-1">
                      <div className="p-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDocuments(filteredDocuments.map(d => d._id))}
                          className="w-full mb-2"
                        >
                          Select All
                        </Button>
                        {filteredDocuments.map((doc) => (
                          <div key={doc._id} className="flex items-center space-x-2 p-2 hover:bg-gray-50">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments([...selectedDocuments, doc._id]);
                                } else {
                                  setSelectedDocuments(selectedDocuments.filter(id => id !== doc._id));
                                }
                              }}
                            />
                            <span className="text-sm">
                              {doc.sectionCode} {doc.subsectionCode} - {doc.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleExport}
                      disabled={exporting || selectedDocuments.length === 0 || !selectedVersion}
                    >
                      {exporting ? 'Exporting...' : `Export ${selectedDocuments.length} Document(s)`}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Export Jobs</h2>
          <p className="text-gray-600">
            Export AIP documents to various formats including DOCX, PDF, and EUROCONTROL-compliant XML/HTML.
          </p>
        </div>

        <div className="space-y-4">
          {exports.map((exportJob) => (
            <Card key={exportJob._id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(exportJob.status)}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {exportJob.type.toUpperCase()} Export
                      </h3>
                      <p className="text-sm text-gray-600">
                        {exportJob.documentIds.length} document(s) • {exportJob.version.versionNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right text-sm text-gray-600">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {exportJob.requestedBy.name}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {formatDateTime(exportJob.createdAt)}
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(exportJob.status)}`}>
                      {exportJob.status}
                    </span>

                    {exportJob.status === 'completed' && exportJob.downloadUrl && (
                      <Button
                        size="sm"
                        onClick={() => window.open(exportJob.downloadUrl, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    )}
                  </div>
                </div>

                {exportJob.status === 'failed' && exportJob.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      <strong>Error:</strong> {exportJob.errorMessage}
                    </p>
                  </div>
                )}

                {exportJob.status === 'completed' && (
                  <div className="mt-4 text-xs text-gray-500">
                    Expires: {formatDateTime(exportJob.expiresAt)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {exports.length === 0 && (
          <div className="text-center py-12">
            <Download className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No exports found</h3>
            <p className="text-gray-600 mb-4">
              Create your first export job to generate AIP documents in various formats.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Export
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}