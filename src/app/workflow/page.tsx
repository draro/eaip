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
  AlertTriangle, FileText, User, Calendar, ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface Workflow {
  _id: string;
  id: string;
  documentId: string;
  documentTitle: string;
  workflowType: 'CRITICAL' | 'ESSENTIAL' | 'ROUTINE';
  currentState: string;
  requiredApprovals: string[];
  approvals: any[];
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
  targetCompletionDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
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
      const response = await fetch('/api/workflow');
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows || []);
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (state: string) => {
    switch (state) {
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
      case 'technical_review':
        return <Badge className="bg-blue-100 text-blue-800">Technical Review</Badge>;
      case 'operational_review':
        return <Badge className="bg-purple-100 text-purple-800">Operational Review</Badge>;
      case 'authority_approval':
        return <Badge className="bg-orange-100 text-orange-800">Authority Approval</Badge>;
      case 'final_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Final Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'published':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Published</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{state}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Critical</Badge>;
      case 'high':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">High</Badge>;
      case 'medium':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'low':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const getWorkflowTypeBadge = (type: string) => {
    switch (type) {
      case 'CRITICAL':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Critical (4-level)</Badge>;
      case 'ESSENTIAL':
        return <Badge variant="outline" className="bg-orange-50 text-orange-700">Essential (3-level)</Badge>;
      case 'ROUTINE':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">Routine (2-level)</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredWorkflows = workflows.filter(workflow => {
    const matchesSearch = searchTerm === '' ||
      workflow.documentTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workflow.id.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || workflow.currentState === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const pendingWorkflows = workflows.filter(w =>
    !['approved', 'published', 'rejected', 'withdrawn'].includes(w.currentState)
  );

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
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {pendingWorkflows.length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-green-600">
                        {workflows.filter(w => ['approved', 'published'].includes(w.currentState)).length}
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
                      <p className="text-sm text-gray-600">Rejected</p>
                      <p className="text-2xl font-bold text-red-600">
                        {workflows.filter(w => w.currentState === 'rejected').length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
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
                  <option value="draft">Draft</option>
                  <option value="technical_review">Technical Review</option>
                  <option value="operational_review">Operational Review</option>
                  <option value="authority_approval">Authority Approval</option>
                  <option value="final_review">Final Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="rejected">Rejected</option>
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
                <p className="text-gray-600">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Workflows will appear here when documents are submitted for approval'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredWorkflows.map((workflow) => (
                <Card key={workflow._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {workflow.documentTitle}
                          </CardTitle>
                          {getStatusBadge(workflow.currentState)}
                          {getPriorityBadge(workflow.priority)}
                          {getWorkflowTypeBadge(workflow.workflowType)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <FileText className="h-4 w-4 mr-1" />
                            Workflow ID: {workflow.id}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Initiated by: {workflow.initiatedBy}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(workflow.initiatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Link href={`/workflow/${workflow._id}`}>
                        <Button variant="outline" size="sm">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">Progress:</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${(workflow.approvals.length / workflow.requiredApprovals.length) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {workflow.approvals.length}/{workflow.requiredApprovals.length} approvals
                      </span>
                    </div>
                    {workflow.targetCompletionDate && (
                      <div className="mt-3 text-sm text-gray-600 flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        Target completion: {new Date(workflow.targetCompletionDate).toLocaleDateString()}
                      </div>
                    )}
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