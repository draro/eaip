'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  GitBranch, ArrowLeft, CheckCircle, XCircle, AlertTriangle,
  FileText, User, Calendar, Clock, Shield, MessageSquare
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
  priority: string;
  compliance: any;
  auditTrail: any[];
}

export default function WorkflowDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showApprovalForm, setShowApprovalForm] = useState(false);
  const [decision, setDecision] = useState<'approve' | 'reject' | 'request_changes'>('approve');
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/workflow');
      return;
    }
    if (status === 'authenticated' && params.id) {
      fetchWorkflow();
    }
  }, [status, params.id, router]);

  const fetchWorkflow = async () => {
    try {
      const response = await fetch(`/api/workflow/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
      } else {
        router.push('/workflow');
      }
    } catch (error) {
      console.error('Error fetching workflow:', error);
      router.push('/workflow');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async () => {
    if (!comment && decision !== 'approve') {
      alert('Please provide a comment for rejection or change request');
      return;
    }

    setProcessing(true);
    try {
      const response = await fetch(`/api/workflow/${params.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          comment,
          approvalLevel: workflow?.currentState,
        }),
      });

      if (response.ok) {
        setShowApprovalForm(false);
        setComment('');
        fetchWorkflow();
        alert('Approval processed successfully');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to process approval');
      }
    } catch (error) {
      console.error('Error processing approval:', error);
      alert('An error occurred while processing the approval');
    } finally {
      setProcessing(false);
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

  const canApprove = () => {
    const user = session?.user as any;
    if (!workflow) return false;

    // Check if workflow is in a state that allows approval
    const approvableStates = ['technical_review', 'operational_review', 'authority_approval', 'final_review'];
    if (!approvableStates.includes(workflow.currentState)) return false;

    // Check user role
    return ['super_admin', 'org_admin', 'editor'].includes(user.role);
  };

  if (status === 'loading' || loading) {
    return (
      <Layout user={session?.user as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!workflow) {
    return null;
  }

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/workflow">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workflows
              </Button>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <GitBranch className="h-8 w-8 text-blue-600" />
                  {workflow.documentTitle}
                  {getStatusBadge(workflow.currentState)}
                </h1>
                <p className="text-gray-600 mt-2">Workflow ID: {workflow.id}</p>
              </div>
              {canApprove() && !showApprovalForm && (
                <Button
                  onClick={() => setShowApprovalForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Take Action
                </Button>
              )}
            </div>
          </div>

          {/* Approval Form */}
          {showApprovalForm && (
            <Card className="mb-6 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle>Take Approval Action</CardTitle>
                <CardDescription>Review and approve or request changes to this document</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="decision">Decision *</Label>
                  <select
                    id="decision"
                    value={decision}
                    onChange={(e) => setDecision(e.target.value as any)}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="approve">Approve</option>
                    <option value="request_changes">Request Changes</option>
                    <option value="reject">Reject</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="comment">Comment {decision !== 'approve' && '*'}</Label>
                  <Textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add your comments here..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApproval}
                    disabled={processing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {processing ? 'Processing...' : 'Submit Decision'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowApprovalForm(false);
                      setComment('');
                      setDecision('approve');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Workflow Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Approval Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflow.requiredApprovals.map((level, index) => {
                      const approval = workflow.approvals.find(a => a.approvalLevel === level);
                      const isCompleted = !!approval;
                      const isCurrent = workflow.currentState === level;

                      return (
                        <div key={index} className="flex items-start gap-4">
                          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                            isCompleted ? 'bg-green-100' : isCurrent ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            ) : isCurrent ? (
                              <Clock className="h-5 w-5 text-blue-600" />
                            ) : (
                              <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold text-gray-900 capitalize">
                                {level.replace(/_/g, ' ')}
                              </h4>
                              {isCompleted && (
                                <Badge className="bg-green-100 text-green-800">Completed</Badge>
                              )}
                              {isCurrent && (
                                <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
                              )}
                            </div>
                            {approval && (
                              <div className="mt-2 text-sm text-gray-600">
                                <p><strong>Approved by:</strong> {approval.approvedBy}</p>
                                <p><strong>Decision:</strong> {approval.decision}</p>
                                {approval.comment && <p className="mt-1 italic">"{approval.comment}"</p>}
                                <p className="mt-1"><strong>Date:</strong> {new Date(approval.timestamp).toLocaleString()}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Trail */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Audit Trail
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workflow.auditTrail.map((entry, index) => (
                      <div key={index} className="border-l-2 border-gray-300 pl-4 pb-4 last:pb-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-gray-900 capitalize">
                            {entry.action.replace(/_/g, ' ')}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {entry.state.replace(/_/g, ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          By {entry.performedBy} on {new Date(entry.timestamp).toLocaleString()}
                        </p>
                        {entry.comment && (
                          <p className="text-sm text-gray-700 mt-1 italic">"{entry.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workflow Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Type</p>
                    <Badge variant="outline" className="mt-1">
                      {workflow.workflowType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Priority</p>
                    <Badge variant="outline" className="mt-1 capitalize">
                      {workflow.priority}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Initiated By</p>
                    <p className="text-sm font-semibold text-gray-900">{workflow.initiatedBy}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Initiated At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(workflow.initiatedAt).toLocaleString()}
                    </p>
                  </div>
                  {workflow.targetCompletionDate && (
                    <div>
                      <p className="text-sm text-gray-600">Target Completion</p>
                      <p className="text-sm text-gray-900">
                        {new Date(workflow.targetCompletionDate).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {workflow.completedAt && (
                    <div>
                      <p className="text-sm text-gray-600">Completed At</p>
                      <p className="text-sm text-gray-900">
                        {new Date(workflow.completedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Document
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Link href={`/documents/${workflow.documentId}`}>
                    <Button variant="outline" className="w-full">
                      View Document
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              {workflow.compliance && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Compliance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ICAO Compliant</span>
                      {workflow.compliance.icaoCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">EUROCONTROL Compliant</span>
                      {workflow.compliance.eurocontrolCompliant ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Data Quality</span>
                      {workflow.compliance.dataQualityVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}