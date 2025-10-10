'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  GitBranch, Search, Clock, CheckCircle, XCircle,
  AlertTriangle, FileText, User, Calendar, ArrowRight, Settings, Plus
} from 'lucide-react';
import Link from 'next/link';

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  documentTypes: string[];
  inUseBy?: number;
  steps: {
    id: string;
    name: string;
    description?: string;
    requiredRole?: string;
    requiredWorkflowRole?: string;
    allowedTransitions: string[];
    assignedUsers?: any[];
  }[];
  organization?: {
    _id: string;
    name: string;
  };
  createdBy: {
    name: string;
  };
}

export default function WorkflowPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/workflow');
      return;
    }
    if (status === 'authenticated') {
      fetchWorkflows();
    }
  }, [status, router]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.success ? data.data : []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultWorkflows = async () => {
    if (!confirm('Seed default workflows? This will create standard workflow templates.')) return;

    try {
      const response = await fetch('/api/workflows/seed-defaults', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ ${result.message}`);
        fetchWorkflows();
      } else {
        alert(`Failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error seeding workflows:', error);
      alert('Failed to seed workflows');
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = searchTerm === '' ||
      workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'active' && workflow.isActive) ||
      (filterStatus === 'inactive' && !workflow.isActive);

    return matchesSearch && matchesStatus;
  });

  const activeWorkflows = workflows.filter(w => w.isActive);
  const totalSteps = workflows.reduce((sum, w) => sum + w.steps.length, 0);
  const defaultWorkflows = workflows.filter(w => w.isDefault);

  if (status === 'loading' || loading) {
    return (
      <Layout user={session?.user as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const user = session?.user as any;
  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = ['super_admin', 'org_admin'].includes(user?.role);

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <GitBranch className="h-8 w-8 mr-3 text-blue-600" />
                  Workflow Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage multi-level approval workflows for AIP documents
                </p>
              </div>
              <div className="flex gap-2">
                {isSuperAdmin && (
                  <Button onClick={seedDefaultWorkflows} variant="outline">
                    <Settings className="w-4 h-4 mr-2" />
                    Seed Defaults
                  </Button>
                )}
                {isAdmin && (
                  <Button onClick={() => router.push('/workflows/new')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Configure Workflows
                  </Button>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Workflows</p>
                      <p className="text-2xl font-bold text-gray-900">{workflows.length}</p>
                    </div>
                    <GitBranch className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {activeWorkflows.length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Steps</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {totalSteps}
                      </p>
                    </div>
                    <ArrowRight className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Default Templates</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {defaultWorkflows.length}
                      </p>
                    </div>
                    <Settings className="h-8 w-8 text-purple-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search workflows..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* Workflow List */}
          {filteredWorkflows.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Create or seed workflow templates to get started'}
                </p>
                {isSuperAdmin && (
                  <Button onClick={seedDefaultWorkflows}>
                    <Settings className="w-4 h-4 mr-2" />
                    Seed Default Workflows
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CardTitle className="text-xl">{workflow.name}</CardTitle>
                          {workflow.isDefault && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700">
                              Default
                            </Badge>
                          )}
                          <Badge variant="outline" className={workflow.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}>
                            {workflow.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <CardDescription>{workflow.description || 'No description'}</CardDescription>
                      </div>
                    </div>

                    {/* Document Types */}
                    <div className="flex flex-wrap gap-1 mt-3">
                      {workflow.documentTypes.map((type) => (
                        <Badge key={type} variant="outline" className="text-xs">
                          {type}
                        </Badge>
                      ))}
                      {workflow.inUseBy !== undefined && workflow.inUseBy > 0 && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                          In use by {workflow.inUseBy} doc(s)
                        </Badge>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent>
                    {/* Steps Summary */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">
                        {workflow.steps.length} Steps
                      </h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        {workflow.steps.slice(0, 3).map((step, idx) => (
                          <div key={step.id} className="flex items-center gap-2">
                            <ArrowRight className="w-3 h-3 text-gray-400" />
                            <span>{step.name}</span>
                            {step.requiredWorkflowRole && (
                              <Badge variant="outline" className="text-xs">
                                {step.requiredWorkflowRole}
                              </Badge>
                            )}
                          </div>
                        ))}
                        {workflow.steps.length > 3 && (
                          <div className="text-xs text-gray-500 ml-5">
                            +{workflow.steps.length - 3} more steps...
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 pt-4 border-t flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/workflows/${workflow._id}`)}
                      >
                        View Details
                      </Button>
                      {isAdmin && !workflow.isDefault && (
                        <>
                          {workflow.inUseBy && workflow.inUseBy > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled
                              title={`Cannot edit - in use by ${workflow.inUseBy} document(s)`}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Edit (In Use)
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/workflows/${workflow._id}/edit`)}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}