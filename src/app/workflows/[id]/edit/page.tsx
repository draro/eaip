'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Layout from '@/components/Layout';
import WorkflowBuilder from '@/components/WorkflowBuilder';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';

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
  airacDeadline?: string;
  daysBeforeEffective?: number;
}

interface Workflow {
  _id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
  documentTypes: string[];
  steps: WorkflowStep[];
  airacAligned?: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  workflowRoles?: string[];
}

export default function EditWorkflowPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [workflow, setWorkflow] = useState<Workflow | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [documentTypes, setDocumentTypes] = useState<string[]>([]);
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [airacAligned, setAiracAligned] = useState(false);

  const availableDocTypes = ['AIP', 'GEN', 'ENR', 'AD', 'SUPPLEMENT', 'NOTAM'];

  useEffect(() => {
    fetchWorkflow();
    fetchUsers();
  }, [params.id]);

  const fetchWorkflow = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/workflows/${params.id}`);
      const result = await response.json();

      if (result.success) {
        const wf = result.data;
        setWorkflow(wf);
        setName(wf.name);
        setDescription(wf.description || '');
        setDocumentTypes(wf.documentTypes);
        setSteps(wf.steps.map((step: any) => ({
          ...step,
          position: step.position || { x: 50, y: 50 }
        })));
        setIsActive(wf.isActive);
        setAiracAligned(wf.airacAligned || false);
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

  const fetchUsers = async () => {
    try {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || steps.length === 0 || documentTypes.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    for (const step of steps) {
      if (!step.name || !step.id) {
        alert('All steps must have a name and ID');
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/workflows/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          documentTypes,
          isActive,
          airacAligned,
          steps: steps.map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            requiredRole: step.requiredRole,
            requiredWorkflowRole: step.requiredWorkflowRole,
            assignedUsers: step.assignedUsers,
            allowedTransitions: step.allowedTransitions,
            requiresComment: step.requiresComment,
            position: step.position,
            airacDeadline: step.airacDeadline,
            daysBeforeEffective: step.daysBeforeEffective
          }))
        })
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Workflow updated successfully!');
        router.push(`/workflows/${params.id}`);
      } else {
        alert(`Failed to update workflow: ${result.error}`);
      }
    } catch (error) {
      console.error('Error updating workflow:', error);
      alert('Failed to update workflow. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${params.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (result.success) {
        alert('✅ Workflow deleted successfully!');
        router.push('/workflows');
      } else {
        alert(`Failed to delete workflow: ${result.error}`);
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      alert('Failed to delete workflow. Please try again.');
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

  if (!workflow) {
    return null;
  }

  if (workflow.isDefault) {
    return (
      <Layout user={user}>
        <div className="max-w-6xl mx-auto p-6">
          <Card>
            <CardContent className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Cannot Edit Default Workflow</h3>
              <p className="text-gray-600 mb-4">Default workflows are read-only. Please create a custom workflow instead.</p>
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
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push(`/workflows/${params.id}`)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Edit Workflow</h1>
              <p className="text-gray-600 mt-1">Modify workflow configuration</p>
            </div>
          </div>
          <Button onClick={handleDelete} variant="outline" className="text-red-600">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Update workflow name and description</CardDescription>
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
                  placeholder="Describe the purpose of this workflow..."
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="airacAligned"
                    checked={airacAligned}
                    onCheckedChange={setAiracAligned}
                  />
                  <Label htmlFor="airacAligned">AIRAC Aligned</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Types *</CardTitle>
              <CardDescription>Select which document types can use this workflow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {availableDocTypes.map((type) => (
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
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Steps *</CardTitle>
              <CardDescription>Configure workflow steps and transitions</CardDescription>
            </CardHeader>
            <CardContent>
              <WorkflowBuilder
                steps={steps}
                users={users}
                onStepsChange={handleStepsChange}
              />
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="submit" disabled={saving || loading}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/workflows/${params.id}`)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
