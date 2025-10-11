'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft } from 'lucide-react';

interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  requiredRole: string;
  requiredWorkflowRole?: string;
  assignedUsers: string[];
  allowedTransitions: string[];
  requiresComment: boolean;
  position: { x: number; y: number };
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  workflowRoles?: string[];
}

export default function NewWorkflowPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowType, setWorkflowType] = useState<'document' | 'dms'>('document');
  const [documentTypes, setDocumentTypes] = useState<string[]>(['AIP']);
  const [dmsFileTypes, setDmsFileTypes] = useState<string[]>(['pdf']);
  const [steps, setSteps] = useState<WorkflowStep[]>([
    {
      id: 'draft',
      name: 'Draft',
      description: 'Document is being created or edited',
      requiredRole: 'editor',
      requiredWorkflowRole: undefined,
      assignedUsers: [],
      allowedTransitions: [],
      requiresComment: false,
      position: { x: 50, y: 50 }
    }
  ]);

  const availableDocTypes = ['AIP', 'GEN', 'ENR', 'AD', 'SUPPLEMENT', 'NOTAM'];
  const availableDmsFileTypes = ['document', 'image', 'pdf', 'excel', 'video', 'audio', 'other'];
  const availableRoles = ['viewer', 'editor', 'admin', 'super_admin'];
  const availableWorkflowRoles = ['reviewer', 'approver'];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      // Fetch all users for the organization (no pagination limit for workflow assignment)
      const response = await fetch('/api/users?limit=1000');
      const result = await response.json();
      if (result.success) {
        setUsers(result.data?.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleStepsChange = (updatedSteps: WorkflowStep[]) => {
    setSteps(updatedSteps);
  };

  const toggleDocumentType = (type: string) => {
    if (documentTypes.includes(type)) {
      setDocumentTypes(documentTypes.filter(t => t !== type));
    } else {
      setDocumentTypes([...documentTypes, type]);
    }
  };

  const toggleDmsFileType = (type: string) => {
    if (dmsFileTypes.includes(type)) {
      setDmsFileTypes(dmsFileTypes.filter(t => t !== type));
    } else {
      setDmsFileTypes([...dmsFileTypes, type]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || steps.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    if (workflowType === 'document' && documentTypes.length === 0) {
      alert('Please select at least one document type');
      return;
    }

    if (workflowType === 'dms' && dmsFileTypes.length === 0) {
      alert('Please select at least one file type');
      return;
    }

    // Validate steps
    for (const step of steps) {
      if (!step.name || !step.id) {
        alert('All steps must have a name and ID');
        return;
      }
    }

    setLoading(true);

    try {
      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          workflowType,
          documentTypes: workflowType === 'document' ? documentTypes : [],
          dmsFileTypes: workflowType === 'dms' ? dmsFileTypes : undefined,
          steps: steps.map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            requiredRole: step.requiredRole,
            requiredWorkflowRole: step.requiredWorkflowRole,
            assignedUsers: step.assignedUsers,
            allowedTransitions: step.allowedTransitions,
            requiresComment: step.requiresComment,
            position: step.position
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Workflow created successfully!');
        router.push('/workflows');
      } else {
        alert(`Failed to create workflow: ${result.error}`);
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/workflows')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Workflow</h1>
              <p className="text-gray-600 mt-1">Define custom approval workflow for documents</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Provide workflow name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Workflow Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Standard Review Process"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe this workflow..."
                  rows={3}
                />
              </div>

              <div>
                <Label>Workflow Type *</Label>
                <div className="flex gap-4 mt-2">
                  <div
                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      workflowType === 'document'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setWorkflowType('document')}
                  >
                    <div className="font-medium">Document Workflow</div>
                    <p className="text-sm text-gray-600">For AIP, NOTAM, and other aviation documents</p>
                  </div>
                  <div
                    className={`flex-1 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      workflowType === 'dms'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setWorkflowType('dms')}
                  >
                    <div className="font-medium">DMS Workflow</div>
                    <p className="text-sm text-gray-600">For document management system files</p>
                  </div>
                </div>
              </div>

              {workflowType === 'document' && (
                <div>
                  <Label>Document Types *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableDocTypes.map(type => (
                      <Badge
                        key={type}
                        variant={documentTypes.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDocumentType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Select document types this workflow applies to</p>
                </div>
              )}

              {workflowType === 'dms' && (
                <div>
                  <Label>File Types *</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableDmsFileTypes.map(type => (
                      <Badge
                        key={type}
                        variant={dmsFileTypes.includes(type) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleDmsFileType(type)}
                      >
                        {type.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Select file types this workflow applies to</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Workflow Steps - Visual Builder */}
          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps</CardTitle>
              <CardDescription>Design your workflow visually - click steps to edit properties</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowBuilder steps={steps} users={users} onStepsChange={handleStepsChange} />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/workflows')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Workflow'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
