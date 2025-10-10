'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, GitBranch, Settings, CheckCircle, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

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
    allowedTransitions: string[];
  }[];
  organization?: {
    _id: string;
    name: string;
  };
  createdBy: {
    name: string;
  };
}

export default function WorkflowsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/workflows');
      const result = await response.json();

      if (result.success) {
        setWorkflows(result.data);
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

  const toggleWorkflowStatus = async (workflowId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    const action = newStatus ? 'enable' : 'disable';

    if (!confirm(`Are you sure you want to ${action} this workflow?`)) return;

    try {
      const response = await fetch(`/api/workflows/${workflowId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ Workflow ${action}d successfully`);
        fetchWorkflows();
      } else {
        alert(`Failed to ${action} workflow: ${result.error}`);
      }
    } catch (error) {
      console.error(`Error ${action}ing workflow:`, error);
      alert(`Failed to ${action} workflow`);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'editor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const user = session?.user as any;

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const isSuperAdmin = session?.user?.role === 'super_admin';
  const isOrgAdmin = session?.user?.role === 'org_admin';
  const isAdmin = isOrgAdmin || isSuperAdmin;

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="text-gray-600 mt-1">
              Manage document approval workflows and status transitions
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
                New Workflow
              </Button>
            )}
          </div>
        </div>

        {/* Workflows Grid */}
        {workflows.length === 0 ? (
          <Card>
            <CardContent className="py-12">
              <div className="text-center">
                <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                <p className="text-gray-600 mb-4">
                  {isSuperAdmin
                    ? 'Seed default workflows to get started'
                    : 'Contact your administrator to set up workflows'}
                </p>
                {isSuperAdmin && (
                  <Button onClick={seedDefaultWorkflows}>
                    <Settings className="w-4 h-4 mr-2" />
                    Seed Default Workflows
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Active Workflows */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Active Workflows</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {workflows.filter(w => w.isActive).map((workflow) => (
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
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              Active
                            </Badge>
                          </div>
                          <CardDescription>{workflow.description}</CardDescription>
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

                      {/* Organization */}
                      {workflow.organization && (
                        <p className="text-xs text-gray-500 mt-2">
                          Organization: {workflow.organization.name}
                        </p>
                      )}
                    </CardHeader>

                    <CardContent>
                      {/* Workflow Steps Visualization */}
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-gray-700">Workflow Steps:</h4>
                        <div className="flex flex-col gap-2">
                          {workflow.steps.map((step, index) => (
                            <div key={step.id}>
                              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                                <CheckCircle className="w-4 h-4 text-blue-600" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{step.name}</span>
                                    {step.requiredRole && (
                                      <Badge className={`text-xs ${getRoleBadgeColor(step.requiredRole)}`}>
                                        {step.requiredRole}
                                      </Badge>
                                    )}
                                  </div>
                                  {step.description && (
                                    <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                                  )}
                                </div>
                              </div>

                              {/* Transitions */}
                              {step.allowedTransitions.length > 0 && index < workflow.steps.length - 1 && (
                                <div className="flex items-center justify-center py-1">
                                  <ArrowRight className="w-3 h-3 text-gray-400" />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-4 pt-4 border-t flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/workflows/${workflow._id}`)}
                        >
                          View
                        </Button>
                        {isAdmin && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => toggleWorkflowStatus(workflow._id, workflow.isActive)}
                            >
                              {workflow.isActive ? 'Disable' : 'Enable'}
                            </Button>
                            {!workflow.isDefault && (
                              workflow.inUseBy && workflow.inUseBy > 0 ? (
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
                              )
                            )}
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Inactive Workflows - Compressed View */}
            {workflows.filter(w => !w.isActive).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">Inactive Workflows</h2>
                <div className="space-y-2">
                  {workflows.filter(w => !w.isActive).map((workflow) => (
                    <Card key={workflow._id} className="hover:shadow transition-shadow bg-gray-50">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <GitBranch className="w-4 h-4 text-gray-400" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-700">{workflow.name}</span>
                                {workflow.isDefault && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600">
                                    Default
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-xs bg-gray-100 text-gray-600">
                                  Inactive
                                </Badge>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{workflow.steps.length} steps • {workflow.documentTypes.join(', ')}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/workflows/${workflow._id}`)}
                            >
                              View
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => toggleWorkflowStatus(workflow._id, workflow.isActive)}
                              >
                                Enable
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
