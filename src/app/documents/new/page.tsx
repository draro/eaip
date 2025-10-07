'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus, Sparkles } from 'lucide-react';

interface Version {
  _id: string;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: string;
  status: string;
}

interface Template {
  _id: string;
  name: string;
  description: string;
  section: string;
  subsection: string;
  content: string;
}

interface Organization {
  _id: string;
  name: string;
  domain: string;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [documentType, setDocumentType] = useState('AIP');
  const [country, setCountry] = useState('');
  const [airport, setAirport] = useState('');
  const [versionId, setVersionId] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [userRole, setUserRole] = useState<string>((session?.user as any)?.role || 'viewer');
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [useAI, setUseAI] = useState(false);
  const [previousVersionId, setPreviousVersionId] = useState('');

  useEffect(() => {
    fetchVersions();
    if (session?.user) {
      const role = (session.user as any)?.role || 'viewer';
      setUserRole(role);
      if (role === 'super_admin') {
        fetchOrganizations();
      }
    }
  }, [session]);

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/versions');
      const result = await response.json();
      if (result.success) {
        setVersions(result.data);
        if (result.data.length > 0) {
          setVersionId(result.data[0]._id);
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    }
  };

  const fetchOrganizations = async () => {
    try {
      // Fetch all organizations without pagination
      const response = await fetch('/api/organizations?limit=1000');
      const result = await response.json();
      if (result.success) {
        // The API returns data.organizations
        const orgs = result.data?.organizations || [];
        setOrganizations(orgs);
        console.log('Fetched organizations:', orgs.length);
      } else {
        console.error('Failed to fetch organizations:', result.error);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    }
  };

  const handleCreate = async () => {
    if (!title || !documentType || !country || !versionId) {
      alert('Please fill in all required fields: title, document type, country, and version');
      return;
    }

    if (userRole === 'super_admin' && !organizationId) {
      alert('Please select an organization');
      return;
    }

    if (country.length !== 2) {
      alert('Country code must be a 2-letter ICAO code (e.g., US, GB, IT)');
      return;
    }

    if (airport && airport.length !== 4) {
      alert('Airport code must be a 4-letter ICAO code (e.g., KJFK, EGLL, LIRF)');
      return;
    }

    if (useAI && !previousVersionId) {
      alert('Please select a previous version to build from when using AI assistance');
      return;
    }

    setCreating(true);
    try {
      if (useAI && previousVersionId) {
        // Show progress message for AI creation
        console.log('🤖 AI is analyzing and creating document... This may take 30-60 seconds.');

        // Use AI-assisted creation endpoint with timeout handling
        const payload: any = {
          title,
          documentType,
          country: country.toUpperCase(),
          airport: airport?.toUpperCase() || undefined,
          versionId,
          previousVersionId,
          effectiveDate: versions.find(v => v._id === versionId)?.effectiveDate,
        };

        if (userRole === 'super_admin' && organizationId) {
          payload.organizationId = organizationId;
        }

        // Create abort controller for timeout (5 minutes for AI)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000);

        try {
          const response = await fetch('/api/documents/ai-create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          const result = await response.json();
          if (result.success) {
            alert(`✅ AI has created the document based on the previous version!\n\n${result.data.aiSummary || 'Document created successfully.'}`);
            router.push(`/documents/${result.data._id}/edit`);
          } else {
            alert(`Failed to create document: ${result.error}${result.details ? '\n\n' + result.details : ''}`);
          }
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name === 'AbortError') {
            alert('AI document creation is taking longer than expected. Please check the documents list in a moment - it may still complete in the background.');
          } else {
            throw fetchError;
          }
        }
      } else {
        // Standard creation
        const payload: any = {
          title,
          documentType,
          country: country.toUpperCase(),
          airport: airport?.toUpperCase() || undefined,
          sections: [],
          versionId,
          effectiveDate: versions.find(v => v._id === versionId)?.effectiveDate,
        };

        if (userRole === 'super_admin' && organizationId) {
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
        if (result.success) {
          router.push(`/documents/${result.data._id}/edit`);
        } else {
          // Check if it's a duplicate document error
          if (result.details?.existingDocumentId) {
            const viewExisting = confirm(
              `${result.details.message}\n\nExisting document: "${result.details.existingDocumentTitle}"\n\nWould you like to view/edit the existing document instead?`
            );
            if (viewExisting) {
              router.push(`/documents/${result.details.existingDocumentId}/edit`);
            }
          } else {
            alert(`Failed to create document: ${result.error}`);
          }
        }
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/documents">
                <Button variant="ghost">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Document</h1>
                <p className="text-gray-600 mt-1">Create a new AIP document, supplement, or NOTAM</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-6 w-6 mr-2" />
              New AIP Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Italy AIP, Rome Fiumicino Airport"
                className="text-lg"
                required
              />
            </div>

            {userRole === 'super_admin' && (
              <div>
                <Label htmlFor="organization">Organization *</Label>
                <select
                  id="organization"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Organization</option>
                  {organizations.map((org) => (
                    <option key={org._id} value={org._id}>
                      {org.name} ({org.domain})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select which organization this document belongs to
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <select
                  id="documentType"
                  value={documentType}
                  onChange={(e) => setDocumentType(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="AIP">AIP - Complete Aeronautical Information Publication (GEN + ENR + AD)</option>
                  <option value="GEN">GEN - General (Section only)</option>
                  <option value="ENR">ENR - En-route (Section only)</option>
                  <option value="AD">AD - Aerodromes (Section only)</option>
                  <option value="SUPPLEMENT">Supplement</option>
                  <option value="NOTAM">NOTAM</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select "AIP" for a complete document with all sections, or choose individual sections (GEN, ENR, AD)
                </p>
              </div>

              <div>
                <Label htmlFor="country">Country Code (ICAO) *</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase())}
                  placeholder="e.g., IT, US, GB"
                  maxLength={2}
                  className="uppercase"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">2-letter ICAO country code</p>
              </div>
            </div>

            <div>
              <Label htmlFor="airport">Airport Code (ICAO) - Optional</Label>
              <Input
                id="airport"
                value={airport}
                onChange={(e) => setAirport(e.target.value.toUpperCase())}
                placeholder="e.g., LIRF, KJFK, EGLL"
                maxLength={4}
                className="uppercase"
              />
              <p className="text-xs text-gray-500 mt-1">
                4-letter ICAO airport code (only for AD-type documents)
              </p>
            </div>

            <div>
              <Label htmlFor="version">AIP Version *</Label>
              <select
                id="version"
                value={versionId}
                onChange={(e) => setVersionId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select Version</option>
                {versions.map((version) => (
                  <option key={version._id} value={version._id}>
                    {version.versionNumber} - AIRAC {version.airacCycle} - {version.status}
                    ({new Date(version.effectiveDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {versions.length === 0 && (
                <p className="text-sm text-red-600 mt-1">
                  No versions found. Please create a version first.
                </p>
              )}
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Version Status Information</h3>
              <p className="text-sm text-blue-700">
                You can create documents under any version (draft, active, or archived).
                Note: New versions are created as "draft" by default. You can activate them
                from the Versions page when ready.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">Auto-numbering Information</h3>
              <p className="text-sm text-green-700">
                Documents will be automatically numbered based on their section code.
                For example, GEN documents will be numbered as GEN 1.1, GEN 1.2, etc.
              </p>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
              <h3 className="font-medium text-yellow-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                ICAO Annex 15 & EUROCONTROL Spec 3.0 Compliance
              </h3>
              <p className="text-sm text-yellow-700 mb-2">
                <strong>Automatic Template Generation:</strong> New documents are automatically created with all mandatory sections and subsections according to ICAO Annex 15 standards.
              </p>
              <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                <li><strong>Full AIP:</strong> Complete document with all three parts (GEN + ENR + AD) - 85+ mandatory subsections</li>
                <li><strong>GEN section:</strong> 30+ mandatory subsections including preface, amendments, authorities, and regulations</li>
                <li><strong>ENR section:</strong> 28+ subsections covering airways, airspace, navigation aids, and procedures</li>
                <li><strong>AD section:</strong> 27+ subsections for aerodrome information, facilities, and procedures</li>
              </ul>
              <p className="text-sm text-yellow-700 mt-2">
                This significantly reduces manual work and ensures regulatory compliance from the start.
              </p>
            </div>

            {/* AI-Assisted Creation */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg border-2 border-purple-200">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium text-purple-900">AI-Assisted Document Creation</h3>
                    <input
                      type="checkbox"
                      id="useAI"
                      checked={useAI}
                      onChange={(e) => setUseAI(e.target.checked)}
                      className="w-4 h-4 text-purple-600 rounded"
                      disabled={creating}
                    />
                    <label htmlFor="useAI" className="text-sm font-medium text-purple-700 cursor-pointer">
                      Enable AI
                    </label>
                  </div>
                  {creating && useAI && (
                    <div className="mb-3 p-3 bg-purple-100 rounded border border-purple-300">
                      <div className="flex items-center gap-2 text-purple-900 font-medium mb-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
                        <span>AI is analyzing and creating your document...</span>
                      </div>
                      <p className="text-xs text-purple-700">
                        This process may take 30-60 seconds. Please wait while Claude analyzes the previous version and generates compliant content.
                      </p>
                    </div>
                  )}
                  <p className="text-sm text-purple-700 mb-3">
                    Let AI analyze a previous version and automatically create updated content for the new AIRAC cycle,
                    applying appropriate changes and maintaining compliance standards.
                  </p>

                  {useAI && (
                    <div>
                      <Label htmlFor="previousVersion" className="text-purple-900">
                        Previous Version to Build From *
                      </Label>
                      <select
                        id="previousVersion"
                        value={previousVersionId}
                        onChange={(e) => setPreviousVersionId(e.target.value)}
                        className="w-full p-2 border border-purple-300 rounded-md bg-white"
                        required
                      >
                        <option value="">Select Previous Version</option>
                        {versions
                          .filter(v => v._id !== versionId)
                          .map((version) => (
                            <option key={version._id} value={version._id}>
                              {version.versionNumber} - AIRAC {version.airacCycle} - {version.status}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-purple-600 mt-1">
                        AI will analyze documents from this version and create updated content for the selected version
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/documents">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleCreate}
                disabled={creating || !title || !documentType || !country || !versionId || (useAI && !previousVersionId)}
                className={`min-w-[180px] ${useAI ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}`}
              >
                {creating ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>{useAI ? 'AI Creating...' : 'Creating...'}</span>
                  </div>
                ) : (
                  <>
                    {useAI ? (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Create with AI
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Document
                      </>
                    )}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Document Structure Guidelines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900">GEN - General</h4>
                  <p className="text-sm text-gray-600">
                    General information about the aeronautical information service, units of measurement,
                    abbreviations, etc.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">ENR - En Route</h4>
                  <p className="text-sm text-gray-600">
                    Information about airspace organization, air traffic services routes,
                    navigation aids, etc.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">AD - Aerodromes</h4>
                  <p className="text-sm text-gray-600">
                    Information about aerodromes, including runways, ground services,
                    operational procedures, etc.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}