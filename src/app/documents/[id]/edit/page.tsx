'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TipTapEditor from '@/components/editor/TipTapEditor';
import { ArrowLeft, Save, Download, Upload, FileText } from 'lucide-react';

interface Document {
  _id: string;
  title: string;
  sectionCode: string;
  subsectionCode: string;
  content: any;
  status: 'draft' | 'review' | 'published';
  version: {
    _id: string;
    versionNumber: string;
    airacCycle: string;
  };
  createdBy?: {
    name: string;
    email: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function EditDocumentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    fetchDocument();
  }, [params.id]);

  const fetchDocument = async () => {
    try {
      const response = await fetch(`/api/documents/${params.id}`);
      const result = await response.json();
      if (result.success) {
        setDocument(result.data);
        setTitle(result.data.title);
        setContent(result.data.content);
      } else {
        console.error('Failed to fetch document:', result.error);
        router.push('/documents');
      }
    } catch (error) {
      console.error('Error fetching document:', error);
      router.push('/documents');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!document) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/documents/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          updatedBy: undefined, // Will use default user from API
        }),
      });

      const result = await response.json();
      if (result.success) {
        setLastSaved(new Date());
        setDocument(result.data);
      } else {
        console.error('Failed to save document:', result.error);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentId', params.id);
    formData.append('uploadedBy', 'default-user'); // Will be handled by API

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        return result.data.url;
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }, [params.id, document]);

  const handleExport = async (format: 'docx' | 'pdf' | 'xml' | 'html') => {
    if (!document) return;

    try {
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: [document._id],
          format,
          versionId: document.version._id,
          requestedBy: 'default-user', // Will be handled by API
        }),
      });

      const result = await response.json();
      if (result.success && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank');
      } else {
        console.error('Export failed:', result.error);
      }
    } catch (error) {
      console.error('Error exporting document:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
          <Link href="/documents">
            <Button>Back to Documents</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/documents" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {document.sectionCode} {document.subsectionCode}
                </h1>
                <p className="text-sm text-gray-600">
                  Version: {document.version.versionNumber} | AIRAC: {document.version.airacCycle}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {lastSaved && (
                <span className="text-sm text-gray-500">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('docx')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  DOCX
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>

              <Button
                onClick={handleSave}
                disabled={saving}
                className="min-w-[80px]"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="text-lg font-medium"
                      placeholder="Enter document title..."
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TipTapEditor
                  content={content}
                  onChange={setContent}
                  onImageUpload={handleImageUpload}
                  className="min-h-[600px]"
                />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Document Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Section</Label>
                    <p className="text-sm">{document.sectionCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Subsection</Label>
                    <p className="text-sm">{document.subsectionCode}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Status</Label>
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      document.status === 'published' ? 'bg-green-100 text-green-800' :
                      document.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {document.status}
                    </span>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Created by</Label>
                    <p className="text-sm">{document.createdBy?.name || 'Unknown User'}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Last updated</Label>
                    <p className="text-sm">{new Date(document.updatedAt).toLocaleString()}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Export Options</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleExport('docx')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as DOCX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleExport('xml')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as XML
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => handleExport('html')}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as HTML
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}