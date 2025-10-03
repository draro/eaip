'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Edit,
  ArrowLeft,
  Calendar,
  Globe,
  User,
  GitBranch,
  Download,
  Eye
} from 'lucide-react';

interface Document {
  _id: string;
  title: string;
  documentType: 'AIP' | 'SUPPLEMENT' | 'NOTAM';
  country: string;
  airport?: string;
  status: 'draft' | 'review' | 'published';
  airacCycle: string;
  effectiveDate: string;
  updatedAt: string;
  updatedBy: {
    name: string;
    email: string;
  };
  version: {
    versionNumber: string;
    airacCycle: string;
  };
  sections: Array<{
    id: string;
    type: string;
    title: string;
    content: string;
  }>;
}

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('editor'); // This would come from auth context

  useEffect(() => {
    const documentId = params.id as string;

    // Mock data - in real app, fetch from API
    const mockDocument: Document = {
      _id: documentId,
      title: 'General Information - Italy AIP',
      documentType: 'AIP',
      country: 'IT',
      status: 'published',
      airacCycle: '2024-13',
      effectiveDate: '2024-10-15',
      updatedAt: '2024-09-28',
      updatedBy: { name: 'Marco Rossi', email: 'marco@aviation.it' },
      version: { versionNumber: '1.2.0', airacCycle: '2024-13' },
      sections: [
        {
          id: 'gen-1',
          type: 'GEN',
          title: 'General Information',
          content: `
            <h2>1.1 National Authorities</h2>
            <p>The Italian Civil Aviation Authority (ENAC) is responsible for aviation safety oversight in Italy.</p>
            <p><strong>Contact Information:</strong></p>
            <ul>
              <li>Address: Via P.le Dello Sport, 00194 Roma RM, Italy</li>
              <li>Phone: +39 06 4596 1</li>
              <li>Email: info@enac.gov.it</li>
              <li>Website: https://www.enac.gov.it</li>
            </ul>

            <h2>1.2 Entry, Transit and Departure of Aircraft</h2>
            <p>All aircraft entering Italian airspace must comply with the following requirements:</p>
            <ol>
              <li>Valid Certificate of Registration</li>
              <li>Valid Certificate of Airworthiness</li>
              <li>Appropriate insurance coverage</li>
              <li>Flight plan filed with appropriate ATC facility</li>
            </ol>

            <h2>1.3 Entry, Transit and Departure of Passengers and Crew</h2>
            <p>Immigration and customs procedures for international flights:</p>
            <ul>
              <li>Valid passport or EU identification document required</li>
              <li>Visa requirements vary by nationality</li>
              <li>Customs declaration required for goods exceeding duty-free limits</li>
            </ul>
          `
        },
        {
          id: 'gen-2',
          type: 'GEN',
          title: 'Emergency Procedures',
          content: `
            <h2>2.1 Search and Rescue</h2>
            <p>Search and Rescue services in Italy are coordinated by the Italian Coast Guard (Guardia Costiera).</p>
            <p><strong>Emergency Frequencies:</strong></p>
            <ul>
              <li>International Emergency: 121.500 MHz</li>
              <li>Military Emergency: 243.000 MHz</li>
              <li>Coast Guard Operations: 156.800 MHz (VHF Channel 16)</li>
            </ul>

            <h2>2.2 Reporting Procedures</h2>
            <p>Aircraft experiencing emergency situations should:</p>
            <ol>
              <li>Contact nearest ATC facility immediately</li>
              <li>Squawk 7700 on transponder</li>
              <li>State nature of emergency and assistance required</li>
              <li>Follow ATC instructions</li>
            </ol>
          `
        }
      ]
    };

    setDocument(mockDocument);
    setLoading(false);
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'review': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'AIP': return 'bg-blue-100 text-blue-800';
      case 'SUPPLEMENT': return 'bg-purple-100 text-purple-800';
      case 'NOTAM': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = () => {
    if (!document) return false;
    return ['super_admin', 'org_admin', 'editor'].includes(userRole) &&
           ['draft', 'review'].includes(document.status);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!document) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document not found</h3>
                <p className="text-gray-600 mb-4">
                  The document you're looking for doesn't exist or has been removed.
                </p>
                <Button onClick={() => router.push('/documents')} variant="outline">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Documents
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Button
              onClick={() => router.push('/documents')}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </Button>

            <div className="flex items-center gap-2">
              {canEdit() && (
                <Button
                  onClick={() => router.push(`/documents/${document._id}/edit`)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Document
                </Button>
              )}
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Document Header */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <CardTitle className="text-2xl">{document.title}</CardTitle>
                    <Badge className={getStatusColor(document.status)}>
                      {document.status}
                    </Badge>
                    <Badge className={getTypeColor(document.documentType)}>
                      {document.documentType}
                    </Badge>
                    {document.airport && (
                      <Badge variant="outline">
                        {document.airport}
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    Official aeronautical information publication for {document.country}
                  </CardDescription>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Country:</span>
                  <span className="font-medium">{document.country}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">AIRAC:</span>
                  <span className="font-medium">{document.airacCycle}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <GitBranch className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">{document.version.versionNumber}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">Updated by:</span>
                  <span className="font-medium">{document.updatedBy.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-500 mt-2">
                <span>Effective: {new Date(document.effectiveDate).toLocaleDateString()}</span>
                <span>Last updated: {new Date(document.updatedAt).toLocaleDateString()}</span>
                <span>Sections: {document.sections.length}</span>
              </div>
            </CardHeader>
          </Card>

          {/* Document Content */}
          <div className="space-y-6">
            {document.sections.map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    {section.title}
                  </CardTitle>
                  <Badge variant="outline" className="w-fit">
                    {section.type}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Footer Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Document ID: {document._id}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View Public Version
                  </Button>
                  {canEdit() && (
                    <Button
                      onClick={() => router.push(`/documents/${document._id}/edit`)}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Document
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}