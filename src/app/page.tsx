'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout';
import { FileText, Book, Upload, Download, Settings, Users, Radio } from 'lucide-react';

export default function HomePage() {
  const { data: session, status } = useSession();

  const user = session?.user as any;

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Electronic Aeronautical Information Publication Editor
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Create, edit, and publish EUROCONTROL Spec 3.0 compliant eAIP documents with our modern,
              feature-rich editor supporting images, tables, and automated exports.
            </p>
            <div className="space-x-4">
              <Link href="/auth/signin">
                <Button size="lg" className="px-8 py-3 text-lg">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || '',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50">

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Electronic Aeronautical Information Publication Editor
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Create, edit, and publish EUROCONTROL Spec 3.0 compliant eAIP documents with our modern,
            feature-rich editor supporting images, tables, and automated exports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Radio className="h-6 w-6 mr-2 text-indigo-600" />
                eAIP Viewer
              </CardTitle>
              <CardDescription>
                View published eAIP documents in ICAO-compliant format with navigation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/eaip">
                <Button className="w-full" variant="default">View eAIP</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-6 w-6 mr-2 text-blue-600" />
                Document Management
              </CardTitle>
              <CardDescription>
                Create and manage AIP documents with our TipTap-powered rich text editor
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <Link href="/documents">
                  <Button className="w-full">Manage Documents</Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button className="w-full">Sign in to Manage Documents</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Book className="h-6 w-6 mr-2 text-green-600" />
                Version Control
              </CardTitle>
              <CardDescription>
                Track AIRAC cycles and manage document versions with built-in versioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <Link href="/versions">
                  <Button className="w-full" variant="outline">View Versions</Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button className="w-full" variant="outline">Sign in to View Versions</Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="h-6 w-6 mr-2 text-purple-600" />
                Export & Publish
              </CardTitle>
              <CardDescription>
                Export to DOCX, PDF, or eAIP XML/HTML formats with preserved formatting
              </CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <Link href="/exports">
                  <Button className="w-full" variant="outline">Export Documents</Button>
                </Link>
              ) : (
                <Link href="/auth/signin">
                  <Button className="w-full" variant="outline">Sign in to Export Documents</Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start">
              <Upload className="h-6 w-6 text-blue-600 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">Rich Text Editing</h4>
                <p className="text-gray-600">
                  Full-featured editor with support for headings, lists, tables, and drag-and-drop image uploads
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Settings className="h-6 w-6 text-green-600 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">AIRAC Cycle Management</h4>
                <p className="text-gray-600">
                  Automated AIRAC cycle generation and document versioning for aviation compliance
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Download className="h-6 w-6 text-purple-600 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">Multiple Export Formats</h4>
                <p className="text-gray-600">
                  Export to DOCX, PDF, and EUROCONTROL Spec 3.0 compliant XML/HTML formats
                </p>
              </div>
            </div>
            <div className="flex items-start">
              <Users className="h-6 w-6 text-orange-600 mr-3 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-900">n8n Integration</h4>
                <p className="text-gray-600">
                  Automated workflows for document updates, exports, and publication processes
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          {session ? (
            <Link href="/documents/new">
              <Button size="lg" className="px-8 py-3 text-lg">
                Create New Document
              </Button>
            </Link>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600">Sign in to start creating AIP documents</p>
              <div className="space-x-4">
                <Link href="/auth/signin">
                  <Button size="lg" className="px-8 py-3 text-lg">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="lg" variant="outline" className="px-8 py-3 text-lg">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

        <footer className="bg-gray-800 text-white mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p>&copy; 2025 eAIP Editor. Built with Next.js 14, TipTap, and MongoDB.</p>
              <p className="text-gray-400 mt-2">EUROCONTROL Spec 3.0 Compliant</p>
            </div>
          </div>
        </footer>
      </div>
    </Layout>
  );
}