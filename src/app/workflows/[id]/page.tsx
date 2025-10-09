'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, GitBranch, CheckCircle, ArrowRight, Settings, Users } from 'lucide-react';

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  documentTypes: string[];
  steps: {
    id: string;
    name: string;
    description?: string;
    requiredRole?: string;
    requiredWorkflowRole?: string;
    assignedUsers?: string[];
    allowedTransitions: string[];
    requiresComment: boolean;
  }[];
  organization?: {
    _id: string;
    name: string;
  };
  createdBy: {
    name: string;
  };
}

export default function ViewWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${params.id}`);
      const result = await response.json();

      if (result.success) {
        setWorkflow(result.data);
      } else {
        alert('Failed to load workflow');
        router.push('/workflows');
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      alert('Failed to load workflow');
      router.push('/workflows');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'super_admin': return 'bg-purple-100 text-purple-800';
      case 'org_admin': return 'bg-blue-100 text-blue-800';
      case 'editor': return 'bg-green-100 text-green-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const user = session?.user as any;
  const isAdmin = user?.role === 'org_admin' || user?.role === 'super_admin';

  if (loading) {
    return (
      <Layout user={user}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!workflow) {
    return (
      <Layout user={user}>
        <div className="max-w-7xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <GitBranch className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Workflow not found</h3>
              <Button onClick={() => router.push('/workflows')} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Workflows
              </Button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user}>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/workflows')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workflow.name}</h1>
              <p className="text-gray-600 mt-1">{workflow.description}</p>
            </div>
          </div>
          {isAdmin && !workflow.isDefault && (
            <Button onClick={() => router.push(`/workflows/${workflow._id}/edit`)}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Workflow
            </Button>
          )}
        </div>

        {/* Workflow Info */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <div className="mt-1">
                  {workflow.isActive ? (
                    <Badge className="bg-green-50 text-green-700">Active</Badge>
                  ) : (
                    <Badge className="bg-gray-50 text-gray-700">Inactive</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <div className="mt-1">
                  {workflow.isDefault ? (
                    <Badge className="bg-blue-50 text-blue-700">Default</Badge>
                  ) : (
                    <Badge className="bg-purple-50 text-purple-700">Custom</Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Document Types</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {workflow.documentTypes.map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Steps</span>
                <div className="mt-1">
                  <span className="font-medium">{workflow.steps.length} steps</span>
                </div>
              </div>
            </div>

            {workflow.organization && (
              <div>
                <span className="text-sm text-gray-500">Organization</span>
                <p className="font-medium">{workflow.organization.name}</p>
              </div>
            )}

            <div>
              <span className="text-sm text-gray-500">Created By</span>
              <p className="font-medium">{workflow.createdBy.name}</p>
            </div>
          </CardContent>
        </Card>

        {/* Workflow Steps */}
        <Card>
          <CardHeader>
            <CardTitle>Workflow Steps</CardTitle>
            <CardDescription>Visual representation of the workflow process</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {workflow.steps.map((step, index) => (
                <div key={step.id} className="space-y-2">
                  <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{step.name}</h3>
                        {step.requiredRole && (
                          <Badge className={`text-xs ${getRoleBadgeColor(step.requiredRole)}`}>
                            {step.requiredRole}
                          </Badge>
                        )}
                        {step.requiredWorkflowRole && (
                          <Badge variant="outline" className="text-xs">
                            {step.requiredWorkflowRole}
                          </Badge>
                        )}
                        {step.requiresComment && (
                          <Badge variant="outline" className="text-xs">
                            Requires Comment
                          </Badge>
                        )}
                      </div>
                      {step.description && (
                        <p className="text-sm text-gray-600 mb-2">{step.description}</p>
                      )}
                      {step.assignedUsers && step.assignedUsers.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{step.assignedUsers.length} user(s) assigned</span>
                        </div>
                      )}
                      {step.allowedTransitions.length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs text-gray-500">Can transition to:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {step.allowedTransitions.map((transitionId) => {
                              const targetStep = workflow.steps.find(s => s.id === transitionId);
                              return targetStep ? (
                                <Badge key={transitionId} variant="outline" className="text-xs">
                                  {targetStep.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < workflow.steps.length - 1 && (
                    <div className="flex items-center justify-center py-2">
                      <ArrowRight className="w-5 h-5 text-gray-400 rotate-90" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
