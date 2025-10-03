'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Calendar, FileText, User, Edit, Trash2, Book } from 'lucide-react';
import { formatDate, generateAiracCycle } from '@/lib/utils';

interface Version {
  _id: string;
  versionNumber: string;
  airacCycle: string;
  effectiveDate: string;
  status: 'active' | 'archived' | 'draft';
  description?: string;
  createdBy?: {
    name: string;
    email: string;
  };
  createdAt: string;
  documents: any[];
}

export default function VersionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [versionNumber, setVersionNumber] = useState('');
  const [airacCycle, setAiracCycle] = useState('');
  const [effectiveDate, setEffectiveDate] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchVersions();
    // Auto-generate current AIRAC cycle
    const currentCycle = generateAiracCycle();
    setAiracCycle(currentCycle);
    setVersionNumber(`v${currentCycle}`);

    // Set effective date to next month
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setEffectiveDate(nextMonth.toISOString().split('T')[0]);
  }, []);

  const fetchVersions = async () => {
    try {
      const response = await fetch('/api/versions');
      const result = await response.json();
      if (result.success) {
        setVersions(result.data);
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!versionNumber || !airacCycle || !effectiveDate) {
      alert('Please fill in all required fields');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          versionNumber,
          airacCycle,
          effectiveDate,
          description,
          createdBy: '675f1f77bcf86cd799439011', // TODO: Get from auth context
        }),
      });

      const result = await response.json();
      if (result.success) {
        setVersions([result.data, ...versions]);
        setIsCreateOpen(false);
        // Reset form
        const newCycle = generateAiracCycle(new Date(new Date().setMonth(new Date().getMonth() + 1)));
        setAiracCycle(newCycle);
        setVersionNumber(`v${newCycle}`);
        setDescription('');
      } else {
        alert(`Failed to create version: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating version:', error);
      alert('Failed to create version');
    } finally {
      setCreating(false);
    }
  };

  const handleActivateVersion = async (versionId: string) => {
    try {
      const response = await fetch(`/api/versions/${versionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'active',
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update the local state
        setVersions(versions.map(v =>
          v._id === versionId
            ? { ...v, status: 'active' as const }
            : v.status === 'active'
              ? { ...v, status: 'archived' as const }
              : v
        ));
      } else {
        alert(`Failed to activate version: ${result.error}`);
      }
    } catch (error) {
      console.error('Error activating version:', error);
      alert('Failed to activate version');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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
    router.push('/auth/signin?callbackUrl=/versions');
    return null;
  }

  const user = session.user as any;

  if (loading) {
    return (
      <Layout user={{
        name: user.name || 'User',
        email: user.email || '',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading versions...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || '',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Versions</h1>
              <p className="text-gray-600">Manage AIRAC cycles and document versions</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Version
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New AIP Version</DialogTitle>
                  <DialogDescription>
                    Create a new AIRAC cycle version for document management.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="version-number">Version Number *</Label>
                      <Input
                        id="version-number"
                        value={versionNumber}
                        onChange={(e) => setVersionNumber(e.target.value)}
                        placeholder="e.g., v202505"
                      />
                    </div>
                    <div>
                      <Label htmlFor="airac-cycle">AIRAC Cycle *</Label>
                      <Input
                        id="airac-cycle"
                        value={airacCycle}
                        onChange={(e) => setAiracCycle(e.target.value)}
                        placeholder="e.g., 202505"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="effective-date">Effective Date *</Label>
                    <Input
                      id="effective-date"
                      type="date"
                      value={effectiveDate}
                      onChange={(e) => setEffectiveDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Optional description for this version"
                    />
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreate}
                      disabled={creating || !versionNumber || !airacCycle || !effectiveDate}
                    >
                      {creating ? 'Creating...' : 'Create Version'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">AIP Versions & AIRAC Cycles</h2>
          <p className="text-gray-600">
            Manage AIRAC cycles and document versions. Each version represents a complete set of AIP documents
            effective for a specific AIRAC cycle.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {versions.map((version) => (
            <Card key={version._id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{version.versionNumber}</CardTitle>
                    <CardDescription>
                      AIRAC Cycle: {version.airacCycle}
                    </CardDescription>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(version.status)}`}>
                    {version.status}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Effective: {formatDate(version.effectiveDate)}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Documents: {version.documents.length}
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    {version.createdBy?.name || 'Unknown User'}
                  </div>
                  {version.description && (
                    <div className="text-xs text-gray-500 mt-2">
                      {version.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {formatDate(version.createdAt)}
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Link href={`/documents?versionId=${version._id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <FileText className="h-4 w-4 mr-2" />
                      View Docs
                    </Button>
                  </Link>
                  {version.status === 'draft' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700"
                      onClick={() => handleActivateVersion(version._id)}
                    >
                      Activate
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {versions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No versions found</h3>
            <p className="text-gray-600 mb-4">
              Get started by creating your first AIRAC cycle version.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Version
            </Button>
          </div>
        )}
        </div>
        </div>
      </div>
    </Layout>
  );
}