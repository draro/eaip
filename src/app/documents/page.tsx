'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Search, Filter, FileText, Calendar, User, Edit, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';

interface Document {
  _id: string;
  title: string;
  sectionCode: string;
  subsectionCode: string;
  status: 'draft' | 'review' | 'published';
  version: {
    versionNumber: string;
    airacCycle: string;
  };
  updatedBy?: {
    name: string;
    email: string;
  };
  updatedAt: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sectionFilter, setSectionFilter] = useState<string>('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      const result = await response.json();
      if (result.success) {
        setDocuments(result.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.sectionCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.subsectionCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || doc.status === statusFilter;
    const matchesSection = !sectionFilter || doc.sectionCode === sectionFilter;

    return matchesSearch && matchesStatus && matchesSection;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
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
                <FileText className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-3xl font-bold text-gray-900">eAIP Editor</h1>
              </Link>
              <nav className="flex space-x-4">
                <Link href="/documents">
                  <Button variant="default">Documents</Button>
                </Link>
                <Link href="/versions">
                  <Button variant="ghost">Versions</Button>
                </Link>
                <Link href="/exports">
                  <Button variant="ghost">Exports</Button>
                </Link>
              </nav>
            </div>
            <Link href="/documents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Document
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AIP Documents</h2>

          <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Documents</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by title, section, or subsection..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="md:w-48">
                <Label htmlFor="status-filter">Status</Label>
                <select
                  id="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="md:w-48">
                <Label htmlFor="section-filter">Section</Label>
                <select
                  id="section-filter"
                  value={sectionFilter}
                  onChange={(e) => setSectionFilter(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Sections</option>
                  <option value="GEN">GEN - General</option>
                  <option value="ENR">ENR - En Route</option>
                  <option value="AD">AD - Aerodromes</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDocuments.map((document) => (
            <Card key={document._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{document.title}</CardTitle>
                    <CardDescription>
                      {document.sectionCode} {document.subsectionCode}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(document.status)}`}>
                    {document.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Version: {document.version.versionNumber}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    AIRAC: {document.version.airacCycle}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {document.updatedBy?.name || 'Unknown User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated: {formatDateTime(document.updatedAt)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/documents/${document._id}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </Link>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDocuments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || statusFilter || sectionFilter
                ? 'Try adjusting your search criteria or filters.'
                : 'Get started by creating your first AIP document.'}
            </p>
            <Link href="/documents/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Document
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}