'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import {
  Search,
  FileText,
  Clock,
  CircleCheck as CheckCircle2,
  Filter,
  Tag,
  X,
  AlertCircle,
  Download,
  Eye,
  CheckSquare,
  Upload,
  Calendar,
} from 'lucide-react';

interface ChecklistTemplate {
  _id: string;
  title: string;
  description: string;
  tags: string[];
  keywords: string[];
  items: any[];
  createdAt: string;
}

interface AssignedTask {
  _id: string;
  type: 'review' | 'approval';
  title: string;
  section: string;
  requestedBy: {
    name: string;
    email: string;
  };
  requestedAt: string;
  dueDate?: string;
  priority: 'high' | 'medium' | 'low';
}

interface DMSFile {
  _id: string;
  filename: string;
  originalName: string;
  filePath: string;
  fileType: string;
  size: number;
  tags: string[];
  uploadedBy: {
    name: string;
    email: string;
    role: string;
  };
  uploadedAt: string;
  folder?: {
    name: string;
    path: string;
  };
}

export default function ATCDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState<ChecklistTemplate[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [latestFiles, setLatestFiles] = useState<DMSFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [fileSearchTags, setFileSearchTags] = useState<string[]>([]);
  const [availableFileTags, setAvailableFileTags] = useState<string[]>([]);

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

      const [templatesRes, tasksRes, filesRes] = await Promise.all([
        fetch('/api/checklists/templates'),
        fetch('/api/tasks/assigned'),
        fetch('/api/dms/latest?limit=10'),
      ]);

      if (templatesRes.ok) {
        const templatesData = await templatesRes.json();
        if (templatesData.templates) {
          setTemplates(templatesData.templates);
          const allTags = new Set<string>();
          templatesData.templates.forEach((template: ChecklistTemplate) => {
            template.tags?.forEach((tag: string) => allTags.add(tag));
          });
          setAvailableTags(Array.from(allTags));
        }
      }

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        if (tasksData.tasks) {
          setAssignedTasks(tasksData.tasks);
        }
      }

      if (filesRes.ok) {
        const filesData = await filesRes.json();
        if (filesData.files) {
          setLatestFiles(filesData.files);
          const fileTags = new Set<string>();
          filesData.files.forEach((file: DMSFile) => {
            file.tags?.forEach((tag: string) => fileTags.add(tag));
          });
          setAvailableFileTags(Array.from(fileTags));
        }
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

  const toggleFileTag = (tag: string) => {
    setFileSearchTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const clearChecklistFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const clearFileFilters = () => {
    setFileSearchTags([]);
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

  const filteredFiles = latestFiles.filter((file) => {
    if (fileSearchTags.length === 0) return true;
    return fileSearchTags.some((tag) => file.tags?.includes(tag));
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <>
      <Navigation user={session?.user as any} />
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">ATC Dashboard</h1>
          <p className="text-gray-600">
            Manage your tasks, checklists, and access latest documents
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Assigned To Me
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{assignedTasks.length}</div>
              <p className="text-xs text-gray-500 mt-1">Pending reviews & approvals</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckSquare className="w-4 h-4" />
                Checklist Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{templates.length}</div>
              <p className="text-xs text-gray-500 mt-1">Available templates</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Latest Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{latestFiles.length}</div>
              <p className="text-xs text-gray-500 mt-1">Recent uploads</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="tasks" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tasks">
              Assigned To Me
              {assignedTasks.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {assignedTasks.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="checklists">Checklists</TabsTrigger>
            <TabsTrigger value="documents">Latest Documents</TabsTrigger>
          </TabsList>

          {/* Assigned Tasks Tab */}
          <TabsContent value="tasks" className="space-y-4 mt-6">
            {assignedTasks.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    All caught up!
                  </h3>
                  <p className="text-gray-500">You have no pending tasks assigned to you.</p>
                </CardContent>
              </Card>
            ) : (
              assignedTasks.map((task) => (
                <Card key={task._id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={task.type === 'approval' ? 'default' : 'secondary'}>
                            {task.type === 'approval' ? 'Approval' : 'Review'}
                          </Badge>
                          <Badge className={getPriorityColor(task.priority)}>
                            {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{task.title}</CardTitle>
                        <CardDescription>Section: {task.section}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Requested by:</span>
                        <span>{task.requestedBy.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Requested: {formatDate(task.requestedAt)}</span>
                        {task.dueDate && (
                          <>
                            <span>•</span>
                            <span>Due: {formatDate(task.dueDate)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button size="sm" className="w-full">
                        <Eye className="w-4 h-4 mr-2" />
                        View & {task.type === 'approval' ? 'Approve' : 'Review'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Checklists Tab */}
          <TabsContent value="checklists" className="space-y-4 mt-6">
            <div className="mb-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search checklists by title, description, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
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
                    <Button variant="ghost" size="sm" onClick={clearChecklistFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {filteredTemplates.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-gray-500">
                  No checklists found matching your criteria
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template._id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle>{template.title}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {template.tags && template.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {template.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-sm text-gray-500">
                          {template.items?.length || 0} items
                        </div>
                        <Button
                          onClick={() => handleInitiateChecklist(template._id)}
                          className="w-full"
                          size="sm"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Start Checklist
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Latest Documents Tab */}
          <TabsContent value="documents" className="space-y-4 mt-6">
            <div className="mb-4">
              {availableFileTags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium text-gray-700">Filter by tags:</span>
                  {availableFileTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={fileSearchTags.includes(tag) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => toggleFileTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {fileSearchTags.length > 0 && (
                    <Button variant="ghost" size="sm" onClick={clearFileFilters}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  )}
                </div>
              )}
            </div>

            {filteredFiles.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Upload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No documents yet
                  </h3>
                  <p className="text-gray-500 mb-4">
                    No documents have been uploaded to your organization.
                  </p>
                  <Button onClick={() => router.push('/dms')}>
                    <Upload className="w-4 h-4 mr-2" />
                    Go to Document Management
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map((file) => (
                  <Card key={file._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">
                                {file.originalName}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>Uploaded by {file.uploadedBy.name}</span>
                                <span>•</span>
                                <span>{formatDate(file.uploadedAt)}</span>
                              </div>
                              {file.tags && file.tags.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                  {file.tags.slice(0, 3).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {file.tags.length > 3 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{file.tags.length - 3}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(file.filePath, '_blank')}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {filteredFiles.length > 0 && (
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => router.push('/dms')}>
                  View All Documents
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
