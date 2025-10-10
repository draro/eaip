'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  CheckCircle2,
  Clock,
  Save,
  AlertCircle,
  ArrowLeft,
  User,
  Calendar
} from 'lucide-react';

interface ChecklistItem {
  id: string;
  text: string;
  order: number;
  required: boolean;
  completed: boolean;
  completedBy?: {
    _id: string;
    name: string;
    email: string;
  };
  completedAt?: string;
}

interface ChecklistInstance {
  _id: string;
  title: string;
  description: string;
  status: string;
  items: ChecklistItem[];
  progress: number;
  totalItems: number;
  completedItems: number;
  initiatedAt: string;
  completedAt?: string;
  initiatedBy: {
    _id: string;
    name: string;
    email: string;
  };
}

export default function ChecklistViewerPage({ params }: { params: { id: string } }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [instance, setInstance] = useState<ChecklistInstance | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [notes, setNotes] = useState<string>('');
  const autosaveTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchInstance();
      loadDraft();
    }
  }, [status, params.id, router]);

  useEffect(() => {
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
    }

    autosaveTimer.current = setTimeout(() => {
      if (instance) {
        autosave();
      }
    }, 30000);

    return () => {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
      }
    };
  }, [instance, notes]);

  const fetchInstance = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/checklists/instances/${params.id}`);
      const data = await res.json();

      if (res.ok) {
        setInstance(data.instance);
      } else {
        alert(data.error || 'Failed to fetch checklist');
        router.push('/atc-dashboard');
      }
    } catch (error) {
      console.error('Error fetching instance:', error);
      alert('Failed to fetch checklist');
      router.push('/atc-dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = async () => {
    try {
      const res = await fetch(`/api/checklists/instances/${params.id}/autosave`);
      const data = await res.json();

      if (data.draft) {
        const shouldRestore = confirm(
          `A draft was found from ${new Date(data.draft.lastSavedAt).toLocaleString()}. Would you like to restore it?`
        );

        if (shouldRestore && data.draft.draftContent) {
          if (data.draft.draftContent.notes) {
            setNotes(data.draft.draftContent.notes);
          }
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
    }
  };

  const autosave = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/checklists/instances/${params.id}/autosave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          draftContent: {
            notes,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setLastSaved(new Date(data.lastSavedAt));
      }
    } catch (error) {
      console.error('Error autosaving:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCheckboxChange = async (itemId: string, completed: boolean) => {
    if (!instance) return;

    const optimisticInstance: ChecklistInstance = {
      ...instance,
      items: instance.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed,
              completedBy: completed && session?.user ? {
                _id: session.user.id,
                name: session.user.name || '',
                email: session.user.email || '',
              } : undefined,
              completedAt: completed ? new Date().toISOString() : undefined,
            }
          : item
      ),
    };

    const completedCount = optimisticInstance.items.filter((i) => i.completed).length;
    optimisticInstance.completedItems = completedCount;
    optimisticInstance.progress = (completedCount / instance.totalItems) * 100;

    setInstance(optimisticInstance);

    try {
      const res = await fetch(`/api/checklists/instances/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, completed }),
      });

      const data = await res.json();

      if (res.ok) {
        setInstance(data.instance);
      } else {
        fetchInstance();
        alert(data.error || 'Failed to update checklist item');
      }
    } catch (error) {
      console.error('Error updating item:', error);
      fetchInstance();
      alert('Failed to update checklist item');
    }
  };

  const handleManualSave = async () => {
    await autosave();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Checklist not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push('/atc-dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">{instance.title}</CardTitle>
              {instance.description && (
                <p className="text-gray-600">{instance.description}</p>
              )}
            </div>
            {instance.status === 'completed' ? (
              <Badge className="bg-green-500">
                <CheckCircle2 className="h-4 w-4 mr-1" />
                Completed
              </Badge>
            ) : (
              <Badge variant="secondary">
                <Clock className="h-4 w-4 mr-1" />
                In Progress
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Initiated by:</span>
                <span className="font-medium">{instance.initiatedBy.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-600">Started:</span>
                <span className="font-medium">
                  {new Date(instance.initiatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Progress</span>
                <span className="font-medium">
                  {instance.completedItems} / {instance.totalItems} items
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{ width: `${instance.progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
              <div className="flex items-center gap-2">
                {saving ? (
                  <>
                    <Save className="h-3 w-3 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : lastSaved ? (
                  <>
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    <span>Last saved at {lastSaved.toLocaleTimeString()}</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" />
                    <span>Autosave enabled (every 30 seconds)</span>
                  </>
                )}
              </div>
              <Button variant="ghost" size="sm" onClick={handleManualSave} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />
                Save Now
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Checklist Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {instance.items
              .sort((a, b) => a.order - b.order)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <Checkbox
                    id={item.id}
                    checked={item.completed}
                    onCheckedChange={(checked) =>
                      handleCheckboxChange(item.id, checked === true)
                    }
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <label
                      htmlFor={item.id}
                      className={`cursor-pointer ${
                        item.completed ? 'line-through text-gray-500' : ''
                      }`}
                    >
                      {item.text}
                      {item.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    {item.completed && item.completedBy && (
                      <div className="text-xs text-gray-500 mt-1">
                        Completed by {item.completedBy.name} on{' '}
                        {new Date(item.completedAt!).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add your notes here... (autosaved every 30 seconds)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={6}
            className="resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
