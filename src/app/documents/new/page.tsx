'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Plus } from 'lucide-react';

interface Version {
  _id: string;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: string;
  status: string;
}

export default function NewDocumentPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [sectionCode, setSectionCode] = useState('');
  const [subsectionCode, setSubsectionCode] = useState('');
  const [versionId, setVersionId] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchVersions();
  }, []);

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

  const handleCreate = async () => {
    if (!title || !sectionCode || !subsectionCode || !versionId) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          sectionCode: sectionCode.toUpperCase(),
          subsectionCode,
          versionId,
          createdBy: undefined, // Will use default user from API
          effectiveDate: versions.find(v => v._id === versionId)?.effectiveDate,
        }),
      });

      const result = await response.json();
      if (result.success) {
        router.push(`/documents/${result.data._id}/edit`);
      } else {
        alert(`Failed to create document: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating document:', error);
      alert('Failed to create document');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Link href="/documents" className="mr-4">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Documents
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-gray-900">Create New Document</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="h-6 w-6 mr-2" />
              New AIP Document
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="section">Section Code *</Label>
                <select
                  id="section"
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Section</option>
                  <option value="GEN">GEN - General</option>
                  <option value="ENR">ENR - En Route</option>
                  <option value="AD">AD - Aerodromes</option>
                </select>
              </div>

              <div>
                <Label htmlFor="subsection">Subsection Code *</Label>
                <Input
                  id="subsection"
                  value={subsectionCode}
                  onChange={(e) => setSubsectionCode(e.target.value)}
                  placeholder="e.g., 1.1, 2.3, 3.2"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="title">Document Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                className="text-lg"
                required
              />
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

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-900 mb-2">EUROCONTROL Spec 3.0 Compliance</h3>
              <p className="text-sm text-yellow-700">
                This document will be created in compliance with EUROCONTROL Specification 3.0
                for electronic AIP. All exports will maintain this compliance standard.
              </p>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Link href="/documents">
                <Button variant="outline">Cancel</Button>
              </Link>
              <Button
                onClick={handleCreate}
                disabled={creating || !title || !sectionCode || !subsectionCode || !versionId}
                className="min-w-[120px]"
              >
                {creating ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Document
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
      </main>
    </div>
  );
}