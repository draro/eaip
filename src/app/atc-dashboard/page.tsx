'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, FileText, Clock, CheckCircle2, Filter, Tag, X } from 'lucide-react';

interface ChecklistTemplate {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  items: any[];
  createdAt: string;
}

interface ChecklistInstance {
  _id: string;
  title: string;
  status: string;
  progress: number;
  totalItems: number;
  completedItems: number;
  initiatedAt: string;
}

export default function ATCDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [instances, setInstances] = useState<ChecklistInstance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const templatesRes = await fetch('/api/checklists/templates');
      const templatesData = await templatesRes.json();

      if (templatesData.templates) {
        setTemplates(templatesData.templates);

        const allTags = new Set<string>();
        templatesData.templates.forEach((template: ChecklistTemplate) => {
          template.tags?.forEach((tag: string) => allTags.add(tag));
        });
        setAvailableTags(Array.from(allTags));
      }

      const instancesRes = await fetch('/api/checklists/instances');
      const instancesData = await instancesRes.json();

      if (instancesData.instances) {
        setInstances(instancesData.instances);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiateChecklist = async (templateId: string) => {
    try {
      const res = await fetch('/api/checklists/instances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId }),
      });

      const data = await res.json();

      if (res.ok) {
        router.push(`/checklists/${data.instance._id}`);
      } else {
        alert(data.error || 'Failed to create checklist');
      }
    } catch (error) {
      console.error('Error initiating checklist:', error);
      alert('Failed to create checklist');
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setStatusFilter('all');
  };

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      searchQuery === '' ||
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.keywords?.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((tag) => template.tags?.includes(tag));

    return matchesSearch && matchesTags;
  });

  const sortedTemplates = [...filteredTemplates].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'alphabetical':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const filteredInstances = instances.filter((instance) => {
    if (statusFilter === 'all') return true;
    return instance.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ATC Dashboard</h1>
        <p className="text-gray-600">Manage your checklists and track progress</p>
      </div>

      <div className="mb-6 space-y-4">
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Search checklists by title, description, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border rounded-md bg-white"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>

        {availableTags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
            {(searchQuery || selectedTags.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Checklists</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{instances.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {instances.filter((i) => i.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {instances.filter((i) => i.status === 'completed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Available Templates</h2>
          <div className="space-y-4">
            {sortedTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No templates found matching your criteria
                </CardContent>
              </Card>
            ) : (
              sortedTemplates.map((template) => (
                <Card key={template._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>{template.title}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2 flex-wrap">
                        {template.tags?.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Button onClick={() => handleInitiateChecklist(template._id)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Start
                      </Button>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      {template.items?.length || 0} items
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">My Checklists</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-4">
            {filteredInstances.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No checklists found
                </CardContent>
              </Card>
            ) : (
              filteredInstances.map((instance) => (
                <Card
                  key={instance._id}
                  className="hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/checklists/${instance._id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{instance.title}</CardTitle>
                      {instance.status === 'completed' ? (
                        <Badge className="bg-green-500">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Clock className="h-3 w-3 mr-1" />
                          In Progress
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span className="font-medium">
                          {instance.completedItems} / {instance.totalItems}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${instance.progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        Started {new Date(instance.initiatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
