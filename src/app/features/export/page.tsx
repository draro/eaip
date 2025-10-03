'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  Download,
  FileText,
  File,
  Code,
  Globe,
  Cloud,
  ArrowRight,
  CheckCircle,
  Zap,
  Settings
} from 'lucide-react';

export default function ExportFeature() {
  const exportFormats = [
    {
      icon: FileText,
      title: "Microsoft Word (DOCX)",
      description: "Professional formatted documents with headers, footers, tables, and images",
      features: ["Full formatting preservation", "Headers and footers", "Table of contents", "Cross-references"]
    },
    {
      icon: File,
      title: "PDF Generation",
      description: "High-quality PDF documents with proper pagination and styling",
      features: ["Professional layout", "Print-ready quality", "Bookmarks", "Hyperlinks"]
    },
    {
      icon: Code,
      title: "XML Export",
      description: "EUROCONTROL-compliant XML with proper schema validation",
      features: ["Schema validation", "Dublin Core metadata", "Structured content", "Standard compliance"]
    },
    {
      icon: Globe,
      title: "HTML Export",
      description: "Web-ready HTML with embedded CSS for online publication",
      features: ["Responsive design", "Embedded styles", "Navigation", "SEO optimized"]
    }
  ];

  return (
    <>
      <PublicNav />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-indigo-800 p-4 rounded-full">
                <Download className="h-12 w-12 text-indigo-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Export & Distribution
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Multi-format export capabilities with professional formatting, bulk operations, and cloud storage integration
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 text-lg font-semibold">
                  Start Exporting
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 px-8 py-4 text-lg font-semibold">
                  All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Export Formats */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Export Formats
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Export your AIP documents to multiple professional formats with preserved formatting and compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {exportFormats.map((format, index) => {
              const IconComponent = format.icon;
              return (
                <Card key={index} className="h-full hover:shadow-xl transition-shadow">
                  <CardHeader>
                    <div className="bg-indigo-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-indigo-600" />
                    </div>
                    <CardTitle className="text-xl mb-2">{format.title}</CardTitle>
                    <CardDescription className="text-gray-600 mb-4">{format.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {format.features.map((feature, i) => (
                        <div key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advanced Features */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Export Capabilities
            </h2>
            <p className="text-xl text-gray-600">
              Enterprise-grade features for efficient document distribution
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Bulk Operations</CardTitle>
                <CardDescription>Export multiple documents simultaneously with batch processing and queue management</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Cloud className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-2">Cloud Integration</CardTitle>
                <CardDescription>Direct upload to AWS S3, Google Cloud, or Azure with automated versioning and access control</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Settings className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Custom Templates</CardTitle>
                <CardDescription>Configurable export templates with custom headers, footers, and organizational branding</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-indigo-900 to-blue-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Professional Document Distribution
          </h2>
          <p className="text-xl text-indigo-100 mb-8">
            Export to any format you need with professional quality and compliance guarantee
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-indigo-900 hover:bg-indigo-50 px-8 py-4 text-lg font-semibold">
                Try Export Features
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-indigo-900 px-8 py-4 text-lg font-semibold">
                Explore More Features
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}