'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import Layout from '@/components/Layout';
import {
  FileText,
  Save,
  ArrowLeft,
  Calendar,
  Users,
  AlertCircle
} from 'lucide-react';

const documentTypes = [
  { value: 'gen', label: 'GEN - General' },
  { value: 'enr', label: 'ENR - En Route' },
  { value: 'ad', label: 'AD - Aerodromes' },
  { value: 'amdt', label: 'AMDT - Amendment' }
];

const documentSections = {
  gen: [
    'GEN 1 - National Regulations and Requirements',
    'GEN 2 - Tables and Codes',
    'GEN 3 - Services',
    'GEN 4 - Charges for Airports/Heliports and Air Navigation Services'
  ],
  enr: [
    'ENR 1 - General Rules and Procedures',
    'ENR 2 - Air Traffic Services Airspace',
    'ENR 3 - ATS Routes',
    'ENR 4 - Radio Navigation Aids/Systems',
    'ENR 5 - Navigation Warnings',
    'ENR 6 - En-route Charts'
  ],
  ad: [
    'AD 1 - Aerodromes/Heliports - Introduction',
    'AD 2 - Aerodromes',
    'AD 3 - Heliports'
  ],
  amdt: [
    'Amendment Notice',
    'Amendment Summary'
  ]
};

export default function CreateDocumentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '',
    section: '',
    effectiveDate: '',
    content: ''
  });

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/documents/create');
    return null;
  }

  const user = session.user as any;

  // Check permissions
  if (!['super_admin', 'org_admin', 'editor'].includes(user.role)) {
    return (
      <Layout user={{
        name: user.name || 'User',
        email: user.email || '',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                You don't have permission to create documents.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Reset section when type changes
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        section: ''
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          effectiveDate: formData.effectiveDate ? new Date(formData.effectiveDate) : null
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push(`/documents/${result.data._id}/edit`);
      } else {
        setError(result.error || 'Failed to create document');
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const availableSections = formData.type ? documentSections[formData.type as keyof typeof documentSections] || [] : [];

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || '',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Document</h1>
                <p className="text-gray-600">Create a new AIP document</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
              <CardDescription>
                Enter the basic information for your new AIP document
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title *</Label>
                    <Input
                      id="title"
                      placeholder="Enter document title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="space-y-2">
                    <Label htmlFor="type">Document Type *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => handleInputChange('type', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select document type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Section */}
                  {availableSections.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="section">Section</Label>
                      <Select
                        value={formData.section}
                        onValueChange={(value) => handleInputChange('section', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSections.map((section) => (
                            <SelectItem key={section} value={section}>
                              {section}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Effective Date */}
                  <div className="space-y-2">
                    <Label htmlFor="effectiveDate">Effective Date</Label>
                    <Input
                      id="effectiveDate"
                      type="date"
                      value={formData.effectiveDate}
                      onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter a brief description of the document"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                  />
                </div>

                {/* Initial Content */}
                <div className="space-y-2">
                  <Label htmlFor="content">Initial Content</Label>
                  <Textarea
                    id="content"
                    placeholder="Enter initial content for the document (optional)"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    rows={6}
                  />
                  <p className="text-xs text-gray-500">
                    You can also add content later using the rich text editor
                  </p>
                </div>

                {/* Actions */}
                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>Document will be created as draft</span>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !formData.title || !formData.type}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          Create Document
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Document Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium text-gray-600">Created By</div>
                  <div>{user.name}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Organization</div>
                  <div>{user.organization?.name || 'System'}</div>
                </div>
                <div>
                  <div className="font-medium text-gray-600">Initial Status</div>
                  <Badge className="bg-yellow-100 text-yellow-800">Draft</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}