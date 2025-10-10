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
  { value: 'AIP', label: 'AIP - Complete Aeronautical Information Publication (GEN + ENR + AD)' },
  { value: 'GEN', label: 'GEN - General (Section only)' },
  { value: 'ENR', label: 'ENR - En Route (Section only)' },
  { value: 'AD', label: 'AD - Aerodromes (Section only)' },
  { value: 'SUPPLEMENT', label: 'Supplement' },
  { value: 'NOTAM', label: 'NOTAM' }
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
    documentType: 'AIP',
    country: '',
    airport: '',
    versionId: '',
    effectiveDate: '',
    content: '',
    targetAiracCycle: ''
  });
  const [versions, setVersions] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [organizationId, setOrganizationId] = useState('');
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedSourceDocument, setSelectedSourceDocument] = useState('');
  const [airacCycles, setAiracCycles] = useState<any[]>([]);
  const [cloneMode, setCloneMode] = useState(false);

  React.useEffect(() => {
    fetchVersions();
    fetchDocuments();
    fetchUpcomingAiracCycles();
    if (session?.user && (session.user as any).role === 'super_admin') {
      fetchOrganizations();
    }
  }, [session]);

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/versions');
      const result = await response.json();
      if (result.success) {
        setVersions(result.data);
        if (result.data.length > 0) {
          setFormData(prev => ({ ...prev, versionId: result.data[0]._id }));
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations?limit=1000');
      const result = await response.json();
      if (result.success) {
        const orgs = result.data?.organizations || [];
        setOrganizations(orgs);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/documents?limit=1000');
      const result = await response.json();
      if (result.success) {
        setDocuments(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchUpcomingAiracCycles = async () => {
    try {
      const response = await fetch('/api/airac/activate?action=upcoming&count=12');
      const result = await response.json();
      if (result.success) {
        setAiracCycles(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching AIRAC cycles:', error);
    }
  };

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cloneMode) {
      if (!selectedSourceDocument || !formData.targetAiracCycle) {
        setError('Please select a source document and target AIRAC cycle');
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/documents/clone', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            documentId: selectedSourceDocument,
            targetAiracCycle: formData.targetAiracCycle,
            title: formData.title || undefined
          }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
          router.push(`/documents/${result.data._id}/edit`);
        } else {
          if (result.details?.existingDocumentId) {
            const viewExisting = confirm(
              `${result.error}\n\nWould you like to view/edit the existing document instead?`
            );
            if (viewExisting) {
              router.push(`/documents/${result.details.existingDocumentId}/edit`);
            }
          } else {
            setError(result.error || 'Failed to clone document');
          }
        }
      } catch (error) {
        console.error('Error cloning document:', error);
        setError('Failed to clone document');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!formData.title || !formData.documentType || !formData.country || !formData.versionId) {
      setError('Please fill in all required fields: title, document type, country, and version');
      return;
    }

    if (formData.country.length !== 2) {
      setError('Country code must be a 2-letter ICAO code (e.g., US, GB, IT)');
      return;
    }

    if (formData.airport && formData.airport.length !== 4) {
      setError('Airport code must be a 4-letter ICAO code (e.g., KJFK, EGLL, LIRF)');
      return;
    }

    if (user.role === 'super_admin' && !organizationId) {
      setError('Please select an organization');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        title: formData.title,
        documentType: formData.documentType,
        country: formData.country.toUpperCase(),
        airport: formData.airport?.toUpperCase() || undefined,
        sections: [], // Empty sections will trigger template generation
        versionId: formData.versionId,
        effectiveDate: formData.effectiveDate || versions.find(v => v._id === formData.versionId)?.effectiveDate,
      };

      if (user.role === 'super_admin' && organizationId) {
        payload.organizationId = organizationId;
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        router.push(`/documents/${result.data._id}/edit`);
      } else {
        if (result.details?.existingDocumentId) {
          const viewExisting = confirm(
            `${result.details.message}\n\nExisting document: "${result.details.existingDocumentTitle}"\n\nWould you like to view/edit the existing document instead?`
          );
          if (viewExisting) {
            router.push(`/documents/${result.details.existingDocumentId}/edit`);
          }
        } else {
          setError(result.error || 'Failed to create document');
        }
      }
    } catch (error) {
      console.error('Error creating document:', error);
      setError('Failed to create document');
    } finally {
      setLoading(false);
    }
  };

  const availableSections = formData.documentType ? documentSections[formData.documentType.toLowerCase() as keyof typeof documentSections] || [] : [];

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

          {/* Mode Selection */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={!cloneMode ? "default" : "outline"}
                  onClick={() => setCloneMode(false)}
                  className="flex-1"
                >
                  Create New Document
                </Button>
                <Button
                  type="button"
                  variant={cloneMode ? "default" : "outline"}
                  onClick={() => setCloneMode(true)}
                  className="flex-1"
                >
                  Clone for New AIRAC Cycle
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>{cloneMode ? 'Clone Document for AIRAC Cycle' : 'Document Details'}</CardTitle>
              <CardDescription>
                {cloneMode
                  ? 'Select an existing document and target AIRAC cycle to create a copy'
                  : 'Enter the basic information for your new AIP document'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {cloneMode ? (
                  <>
                    {/* Clone Mode Fields */}
                    <div className="space-y-2">
                      <Label htmlFor="sourceDocument">Source Document *</Label>
                      <Select
                        value={selectedSourceDocument}
                        onValueChange={(value) => {
                          setSelectedSourceDocument(value);
                          const doc = documents.find(d => d._id === value);
                          if (doc) {
                            setFormData(prev => ({ ...prev, title: doc.title }));
                          }
                        }}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a document to clone" />
                        </SelectTrigger>
                        <SelectContent>
                          {documents.filter(d => d.status !== 'archived').map((doc) => (
                            <SelectItem key={doc._id} value={doc._id}>
                              {doc.title} - {doc.airacCycle} ({doc.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Choose the document you want to clone
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="targetAiracCycle">Target AIRAC Cycle *</Label>
                      <Select
                        value={formData.targetAiracCycle}
                        onValueChange={(value) => handleInputChange('targetAiracCycle', value)}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select AIRAC cycle" />
                        </SelectTrigger>
                        <SelectContent>
                          {airacCycles.map((cycle) => (
                            <SelectItem key={cycle.airacCycle} value={cycle.airacCycle}>
                              {cycle.airacCycle} - Effective: {new Date(cycle.effectiveDate).toLocaleDateString()} ({cycle.status})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Select when this document should become effective
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="title">Document Title (Optional)</Label>
                      <Input
                        id="title"
                        placeholder="Leave blank to use source document title"
                        value={formData.title}
                        onChange={(e) => handleInputChange('title', e.target.value)}
                      />
                      <p className="text-xs text-gray-500">
                        Optionally customize the title for the cloned document
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Original Create Mode Fields */}
                    {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Italy AIP, Rome Fiumicino Airport"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    required
                  />
                </div>

                {/* Organization (super admin only) */}
                {user.role === 'super_admin' && (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization *</Label>
                    <Select
                      value={organizationId}
                      onValueChange={setOrganizationId}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Organization" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org._id} value={org._id}>
                            {org.name} ({org.domain})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Select which organization this document belongs to
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document Type */}
                  <div className="space-y-2">
                    <Label htmlFor="documentType">Document Type *</Label>
                    <Select
                      value={formData.documentType}
                      onValueChange={(value) => handleInputChange('documentType', value)}
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
                    <p className="text-xs text-gray-500">
                      Select "AIP" for complete document with all sections
                    </p>
                  </div>

                  {/* Country Code */}
                  <div className="space-y-2">
                    <Label htmlFor="country">Country Code (ICAO) *</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => handleInputChange('country', e.target.value.toUpperCase())}
                      placeholder="e.g., IT, US, GB"
                      maxLength={2}
                      className="uppercase"
                      required
                    />
                    <p className="text-xs text-gray-500">2-letter ICAO country code</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Airport Code */}
                  <div className="space-y-2">
                    <Label htmlFor="airport">Airport Code (ICAO) - Optional</Label>
                    <Input
                      id="airport"
                      value={formData.airport}
                      onChange={(e) => handleInputChange('airport', e.target.value.toUpperCase())}
                      placeholder="e.g., LIRF, KJFK, EGLL"
                      maxLength={4}
                      className="uppercase"
                    />
                    <p className="text-xs text-gray-500">
                      4-letter ICAO airport code (for AD-type documents)
                    </p>
                  </div>

                  {/* Version */}
                  <div className="space-y-2">
                    <Label htmlFor="versionId">AIP Version *</Label>
                    <Select
                      value={formData.versionId}
                      onValueChange={(value) => handleInputChange('versionId', value)}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Version" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((version) => (
                          <SelectItem key={version._id} value={version._id}>
                            {version.versionNumber} - AIRAC {version.airacCycle} - {version.status}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {versions.length === 0 && (
                      <p className="text-sm text-red-600">
                        No versions found. Please create a version first.
                      </p>
                    )}
                  </div>
                </div>

                {/* Effective Date */}
                <div className="space-y-2">
                  <Label htmlFor="effectiveDate">Effective Date (Optional)</Label>
                  <Input
                    id="effectiveDate"
                    type="date"
                    value={formData.effectiveDate}
                    onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Leave blank to use version's effective date
                  </p>
                </div>

                    {/* Info Box */}
                    <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
                  <h3 className="font-medium text-yellow-900 mb-2">
                    ICAO Annex 15 Compliant Templates
                  </h3>
                  <p className="text-sm text-yellow-700 mb-2">
                    <strong>Automatic Template Generation:</strong> New documents are automatically created with all mandatory sections and subsections according to ICAO Annex 15 standards.
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li><strong>Full AIP:</strong> Complete document with all three parts (GEN + ENR + AD) - 86 mandatory subsections</li>
                    <li><strong>GEN section:</strong> 30 mandatory subsections including preface, amendments, authorities</li>
                    <li><strong>ENR section:</strong> 28 subsections covering airways, airspace, navigation aids</li>
                        <li><strong>AD section:</strong> 28 subsections for aerodrome information and facilities</li>
                      </ul>
                    </div>
                  </>
                )}

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
                      disabled={loading || (cloneMode ? (!selectedSourceDocument || !formData.targetAiracCycle) : (!formData.title || !formData.documentType || !formData.country || !formData.versionId))}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {cloneMode ? 'Cloning...' : 'Creating...'}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Save className="w-4 h-4" />
                          {cloneMode ? 'Clone Document' : 'Create Document'}
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