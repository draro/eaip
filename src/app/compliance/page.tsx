'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ICAO_AIP_STRUCTURE, AIPSection } from '@/lib/aipStructure';
import {
  Shield, CheckCircle, XCircle, AlertTriangle, FileText,
  Search, TrendingUp, Award, Target, Zap, Info, MapPin, Sparkles, BookOpen, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

interface ComplianceDocument {
  _id: string;
  title: string;
  section: string;
  status: string;
  complianceScore: number;
  lastChecked: string;
  issues: number;
  auditReport?: any;
}

export default function CompliancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [documents, setDocuments] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallScore, setOverallScore] = useState(0);
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDocument | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [fixingWithAI, setFixingWithAI] = useState(false);
  const [stats, setStats] = useState({
    totalDocuments: 0,
    compliant: 0,
    warnings: 0,
    issues: 0,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/compliance');
      return;
    }
    if (status === 'authenticated') {
      fetchComplianceData();
    }
  }, [status, router]);

  const fetchComplianceData = async () => {
    try {
      const user = session?.user as any;
      // Fetch all documents
      let apiUrl = '/api/documents?limit=1000';

      const docsResponse = await fetch(apiUrl);
      if (docsResponse.ok) {
        const docsData = await docsResponse.json();
        const allDocs = docsData.data || [];

        // Run real compliance audits for each document
        const auditPromises = allDocs.map(async (doc: any) => {
          try {
            const auditResponse = await fetch('/api/compliance/audit', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                documentId: doc._id,
                frameworks: ['ICAO_ANNEX_15', 'EUROCONTROL_SPEC_3']
              })
            });

            if (auditResponse.ok) {
              const auditData = await auditResponse.json();
              const audit = auditData.data;

              return {
                _id: doc._id,
                title: doc.title,
                section: `${doc.country}${doc.airport ? `/${doc.airport}` : ''}`,
                status: doc.status,
                complianceScore: Math.round(audit.metrics.complianceScore),
                lastChecked: audit.auditDate,
                issues: audit.metrics.failedChecks,
                auditReport: audit,
              };
            } else {
              // Fallback if audit fails
              return {
                _id: doc._id,
                title: doc.title,
                section: `${doc.country}${doc.airport ? `/${doc.airport}` : ''}`,
                status: doc.status,
                complianceScore: 0,
                lastChecked: new Date().toISOString(),
                issues: 0,
              };
            }
          } catch (error) {
            console.error(`Error auditing document ${doc._id}:`, error);
            return {
              _id: doc._id,
              title: doc.title,
              section: `${doc.country}${doc.airport ? `/${doc.airport}` : ''}`,
              status: doc.status,
              complianceScore: 0,
              lastChecked: new Date().toISOString(),
              issues: 0,
            };
          }
        });

        const docsWithCompliance = await Promise.all(auditPromises);
        setDocuments(docsWithCompliance);

        // Calculate overall statistics
        const total = docsWithCompliance.length;
        const compliant = docsWithCompliance.filter(d => d.complianceScore >= 95).length;
        const warnings = docsWithCompliance.filter(d => d.complianceScore >= 85 && d.complianceScore < 95).length;
        const issuesCount = docsWithCompliance.filter(d => d.complianceScore < 85).length;
        const avgScore = total > 0
          ? Math.round(docsWithCompliance.reduce((sum, d) => sum + d.complianceScore, 0) / total)
          : 0;

        setOverallScore(avgScore);
        setStats({
          totalDocuments: total,
          compliant,
          warnings,
          issues: issuesCount,
        });
      }
    } catch (error) {
      console.error('Error fetching compliance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 95) {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Compliant</Badge>;
    } else if (score >= 85) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="h-3 w-3 mr-1" />Warning</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Issues</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 95) return 'text-green-600';
    if (score >= 85) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleAIFix = async () => {
    if (!selectedDoc) return;

    const confirmed = confirm(
      `AI will automatically fix compliance issues in "${selectedDoc.title}".\n\n` +
      `This will:\n` +
      `- Apply fixes for ${selectedDoc.issues} detected issues\n` +
      `- Update the document content\n` +
      `- Maintain ICAO and EUROCONTROL compliance\n\n` +
      `Continue?`
    );

    if (!confirmed) return;

    setFixingWithAI(true);
    try {
      const response = await fetch('/api/compliance/ai-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDoc._id,
          auditReport: selectedDoc.auditReport
        })
      });

      const result = await response.json();
      if (result.success) {
        alert(`✅ AI has successfully fixed ${result.data.fixedIssues} issues!\n\nThe document has been updated and saved.`);
        setShowDetailsModal(false);
        // Refresh compliance data
        fetchComplianceData();
      } else {
        alert(`Failed to apply AI fixes: ${result.error}`);
      }
    } catch (error) {
      console.error('Error applying AI fixes:', error);
      alert('Failed to apply AI fixes. Please try again.');
    } finally {
      setFixingWithAI(false);
    }
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
                  <Shield className="h-8 w-8 mr-3 text-blue-600" />
                  Compliance Dashboard
                </h1>
                <p className="text-gray-600 mt-2">
                  Real-time ICAO Annex 15 & EUROCONTROL Spec 3.0 compliance monitoring
                </p>
              </div>
            </div>

            {/* Overall Score */}
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg text-gray-600 mb-2">Overall Compliance Score</h2>
                    <div className="flex items-center gap-4">
                      <span className={`text-5xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore}%
                      </span>
                      {getScoreBadge(overallScore)}
                    </div>
                    <p className="text-sm text-gray-600 mt-3">
                      {stats.totalDocuments} documents evaluated • Last updated: {new Date().toLocaleString()}
                    </p>
                  </div>
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke="#E5E7EB"
                        strokeWidth="8"
                        fill="none"
                      />
                      <circle
                        cx="64"
                        cy="64"
                        r="56"
                        stroke={overallScore >= 95 ? '#10B981' : overallScore >= 85 ? '#F59E0B' : '#EF4444'}
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 56}`}
                        strokeDashoffset={`${2 * Math.PI * 56 * (1 - overallScore / 100)}`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Documents</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalDocuments}</p>
                    </div>
                    <FileText className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Compliant</p>
                      <p className="text-2xl font-bold text-green-600">{stats.compliant}</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">{stats.warnings}</p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Issues</p>
                      <p className="text-2xl font-bold text-red-600">{stats.issues}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Compliance Frameworks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2 text-blue-600" />
                  ICAO Annex 15
                </CardTitle>
                <CardDescription>
                  International Standards and Recommended Practices for Aeronautical Information Services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Mandatory sections</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Data quality requirements</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">WGS-84 coordinate system</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Content standards</span>
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2 text-purple-600" />
                  EUROCONTROL Spec 3.0
                </CardTitle>
                <CardDescription>
                  European Standard for Electronic AIP Specification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">XML schema compliance</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Dublin Core metadata</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Presentation standards</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Quality levels (A, B, C)</span>
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ICAO Structure Compliance View */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                ICAO Annex 15 Compliance by Section
              </CardTitle>
              <CardDescription>
                Compliance status mapped to ICAO AIP structure sections with regulation references
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full">
                {ICAO_AIP_STRUCTURE.map((part) => (
                  <AccordionItem key={part.code} value={part.code}>
                    <AccordionTrigger className="text-lg font-semibold">
                      <div className="flex items-center gap-2">
                        <span>{part.code}</span>
                        <span className="text-gray-600">-</span>
                        <span>{part.title}</span>
                        <Badge variant="outline" className="ml-2">
                          {part.icaoReference}
                        </Badge>
                        {part.isMandatory && (
                          <Badge variant="destructive" className="ml-2 text-xs">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pl-4">
                        {part.children?.map((section) => {
                          // Find documents for this section based on title or section code matching
                          const sectionDocs = documents.filter(doc => {
                            // Match if document title includes the section code
                            const titleMatch = doc.title.toLowerCase().includes(section.code.toLowerCase());
                            // Or if section field includes part of the code
                            const sectionMatch = doc.section.includes(section.code.replace(/\s/g, ''));
                            return titleMatch || sectionMatch;
                          });
                          const avgScore = sectionDocs.length > 0
                            ? Math.round(sectionDocs.reduce((sum, d) => sum + d.complianceScore, 0) / sectionDocs.length)
                            : 0;

                          return (
                            <div key={section.code} className="border-l-2 border-blue-200 pl-4 py-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <ChevronRight className="w-4 h-4 text-gray-400" />
                                  <span className="font-semibold text-gray-900">{section.code}</span>
                                  <span className="text-gray-600">-</span>
                                  <span className="text-gray-700">{section.title}</span>
                                  {section.isMandatory && (
                                    <Badge variant="destructive" className="text-xs">
                                      Mandatory
                                    </Badge>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {section.icaoReference}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  {sectionDocs.length > 0 && (
                                    <>
                                      <span className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
                                        {avgScore}%
                                      </span>
                                      {getScoreBadge(avgScore)}
                                    </>
                                  )}
                                  <Badge variant="secondary">{sectionDocs.length} docs</Badge>
                                </div>
                              </div>

                              {/* Section regulations */}
                              {section.regulations && section.regulations.length > 0 && (
                                <div className="mt-3 p-3 bg-blue-50 rounded-md">
                                  <h5 className="text-sm font-semibold text-blue-900 mb-2">Regulatory Requirements</h5>
                                  <div className="space-y-2">
                                    {section.regulations.map((reg, idx) => (
                                      <div key={idx} className="text-xs">
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="text-xs">{reg.authority}</Badge>
                                            <span className="text-gray-700">{reg.document} - {reg.section}</span>
                                          </div>
                                          <Badge
                                            className={`text-xs ${
                                              reg.complianceStatus === 'compliant' ? 'bg-green-100 text-green-800' :
                                              reg.complianceStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                                              reg.complianceStatus === 'non-compliant' ? 'bg-red-100 text-red-800' :
                                              'bg-gray-100 text-gray-800'
                                            }`}
                                          >
                                            {reg.complianceStatus}
                                          </Badge>
                                        </div>
                                        <p className="text-gray-600 mt-1 ml-2">{reg.requirement}</p>
                                        {reg.notes && (
                                          <p className="text-gray-500 mt-1 ml-2 italic">Note: {reg.notes}</p>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Documents in this section */}
                              {sectionDocs.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {sectionDocs.map((doc) => (
                                    <div
                                      key={doc._id}
                                      className="bg-gray-50 rounded-md p-3 hover:bg-gray-100 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-sm">{doc.title}</span>
                                            {getScoreBadge(doc.complianceScore)}
                                            {doc.issues > 0 && (
                                              <span className="text-xs text-red-600">
                                                {doc.issues} issue{doc.issues > 1 ? 's' : ''}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className={`text-lg font-bold ${getScoreColor(doc.complianceScore)}`}>
                                            {doc.complianceScore}%
                                          </span>
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedDoc(doc);
                                              setShowDetailsModal(true);
                                            }}
                                          >
                                            <Info className="h-4 w-4 mr-2" />
                                            Details
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          {/* Document Compliance List */}
          <Card>
            <CardHeader>
              <CardTitle>All Documents - Compliance Status</CardTitle>
              <CardDescription>Real-time compliance status for all AIP documents</CardDescription>
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No documents to evaluate</h3>
                  <p className="text-gray-600">Create documents to see their compliance status</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div
                      key={doc._id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                          {getScoreBadge(doc.complianceScore)}
                          <Badge variant="outline">{doc.section}</Badge>
                        </div>
                        {doc.issues > 0 && (
                          <p className="text-sm text-red-600">
                            {doc.issues} issue{doc.issues > 1 ? 's' : ''} found
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className={`text-2xl font-bold ${getScoreColor(doc.complianceScore)}`}>
                            {doc.complianceScore}%
                          </p>
                          <p className="text-xs text-gray-500">Score</p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowDetailsModal(true);
                          }}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Compliance Audit Report</DialogTitle>
            <DialogDescription>
              {selectedDoc?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedDoc?.auditReport && (
            <div className="space-y-6">
              {/* Overall Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Audit Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Checks</p>
                      <p className="text-2xl font-bold">{selectedDoc.auditReport.metrics.totalChecks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Passed</p>
                      <p className="text-2xl font-bold text-green-600">{selectedDoc.auditReport.metrics.passedChecks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Failed</p>
                      <p className="text-2xl font-bold text-red-600">{selectedDoc.auditReport.metrics.failedChecks}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-600">{selectedDoc.auditReport.metrics.warningChecks}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Critical Issues */}
              {selectedDoc.auditReport.criticalIssues.length > 0 && (
                <Card className="border-red-300">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-700 flex items-center">
                      <XCircle className="h-5 w-5 mr-2" />
                      Critical Issues ({selectedDoc.auditReport.criticalIssues.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedDoc.auditReport.criticalIssues.map((issue: any, idx: number) => (
                        <div key={idx} className="border-l-4 border-red-500 pl-4 py-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="font-semibold text-gray-900">{issue.description}</p>
                              <p className="text-sm text-gray-600 mt-1">
                                <MapPin className="h-3 w-3 inline mr-1" />
                                {issue.location}
                              </p>
                              <p className="text-sm text-gray-700 mt-2">
                                <strong>Requirement:</strong> {issue.requirement}
                              </p>
                              <p className="text-sm text-blue-600 mt-2">
                                <strong>Remediation:</strong> {issue.remediation}
                              </p>
                            </div>
                            <Badge className="bg-red-100 text-red-800 ml-2">Critical</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Framework Results */}
              {Object.entries(selectedDoc.auditReport.frameworkResults).map(([framework, result]: [string, any]) => (
                result.issues.length > 0 && (
                  <Card key={framework}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        <span>{framework.replace(/_/g, ' ')}</span>
                        <Badge variant={result.isCompliant ? "default" : "destructive"}>
                          {result.isCompliant ? 'Compliant' : 'Non-Compliant'}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {result.issues.map((issue: any, idx: number) => (
                          <div
                            key={idx}
                            className={`border-l-4 pl-4 py-2 ${
                              issue.severity === 'critical' ? 'border-red-500' :
                              issue.severity === 'high' ? 'border-orange-500' :
                              issue.severity === 'medium' ? 'border-yellow-500' :
                              'border-blue-500'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{issue.description}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  <MapPin className="h-3 w-3 inline mr-1" />
                                  {issue.location}
                                </p>
                                <p className="text-sm text-gray-700 mt-1">
                                  <strong>Category:</strong> {issue.category.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm text-blue-600 mt-2">
                                  💡 {issue.remediation}
                                </p>
                              </div>
                              <Badge
                                className={`ml-2 ${
                                  issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                  issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                  issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {issue.severity}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}

              {/* Recommendations */}
              {selectedDoc.auditReport.recommendations.length > 0 && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-blue-900 flex items-center">
                      <Zap className="h-5 w-5 mr-2" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {selectedDoc.auditReport.recommendations.map((rec: string, idx: number) => (
                        <li key={idx} className="text-sm text-blue-900 flex items-start">
                          <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-between items-center">
                <div>
                  {selectedDoc.issues > 0 && (
                    <Button
                      onClick={handleAIFix}
                      disabled={fixingWithAI}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      {fixingWithAI ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Applying AI Fixes...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          AI Auto-Fix ({selectedDoc.issues} issues)
                        </>
                      )}
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                    Close
                  </Button>
                  <Link href={`/documents/${selectedDoc._id}/edit`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Edit Manually
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}