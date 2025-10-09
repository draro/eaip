'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  FileText,
  Edit,
  Image,
  Layout,
  Save,
  Copy,
  Search,
  FolderOpen,
  CheckCircle,
  ArrowRight,
  Plane,
  List,
  Type,
  Grid,
  Upload,
  Eye,
  Settings
} from 'lucide-react';

export default function DocumentManagementFeature() {
  const features = [
    {
      icon: Edit,
      title: "Rich Text Editor",
      description: "Advanced TipTap-based editor with full formatting capabilities, tables, and collaborative editing support"
    },
    {
      icon: Layout,
      title: "ICAO Structure Support",
      description: "Built-in support for GEN (General), ENR (En-route), and AD (Aerodrome) sections with proper hierarchy"
    },
    {
      icon: Image,
      title: "Image Management",
      description: "Drag-and-drop image upload with automatic optimization, captions, and reference management"
    },
    {
      icon: Copy,
      title: "Template System",
      description: "Pre-built AIP templates following ICAO standards for quick document creation and consistency"
    },
    {
      icon: Search,
      title: "Content Search",
      description: "Full-text search across all documents with filtering by section, type, and modification date"
    },
    {
      icon: FolderOpen,
      title: "Document Organization",
      description: "Hierarchical organization with categories, tags, and custom metadata for easy document discovery"
    }
  ];

  const editorFeatures = [
    "Rich text formatting (bold, italic, underline)",
    "Heading levels (H1-H6) with automatic TOC",
    "Bullet and numbered lists with nesting",
    "Tables with advanced formatting options",
    "Image insertion with caption support",
    "Links and cross-references",
    "Code blocks and technical content",
    "Mathematical expressions support"
  ];

  const sectionTypes = [
    {
      code: "GEN",
      title: "General",
      description: "General information about the state and its AIS",
      sections: ["GEN 1", "GEN 2", "GEN 3", "GEN 4"]
    },
    {
      code: "ENR",
      title: "En-route",
      description: "En-route procedures, airspace, and navigation information",
      sections: ["ENR 1", "ENR 2", "ENR 3", "ENR 4", "ENR 5", "ENR 6"]
    },
    {
      code: "AD",
      title: "Aerodrome",
      description: "Aerodrome/heliport information and procedures",
      sections: ["AD 1", "AD 2", "AD 3", "AD 4"]
    }
  ];

  return (
    <>
      <PublicNav />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-blue-800 p-4 rounded-full">
                <FileText className="h-12 w-12 text-blue-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Document Management
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive ICAO-compliant AIP document creation and management system with professional editing tools
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Try Document Editor
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                  All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Professional Document Creation Tools
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, edit, and manage ICAO-compliant AIP documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* ICAO Structure Support */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ICAO Annex 15 Compliant Structure
            </h2>
            <p className="text-xl text-gray-600">
              Built-in support for standard AIP sections and subsections
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {sectionTypes.map((section, index) => (
              <Card key={index} className="h-full">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="bg-indigo-100 px-4 py-2 rounded-lg mr-3">
                      <span className="font-bold text-indigo-800">{section.code}</span>
                    </div>
                    <CardTitle className="text-xl">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-600 mb-4">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 mb-3">Standard Sections:</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {section.sections.map((subsection, i) => (
                        <div key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                          {subsection}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Editor Features */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Advanced Rich Text Editor
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Powered by TipTap, our editor provides professional document creation capabilities with full formatting support.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editorFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center text-gray-600">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
              <div className="space-y-6">
                <div className="flex items-center">
                  <div className="bg-blue-800 p-2 rounded-lg mr-4">
                    <Type className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Professional Formatting</h3>
                    <p className="text-blue-100 text-sm">Industry-standard formatting tools</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-800 p-2 rounded-lg mr-4">
                    <Grid className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Table Support</h3>
                    <p className="text-blue-100 text-sm">Advanced table creation and formatting</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-800 p-2 rounded-lg mr-4">
                    <Upload className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Media Integration</h3>
                    <p className="text-blue-100 text-sm">Drag-and-drop image uploads</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-800 p-2 rounded-lg mr-4">
                    <Eye className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Live Preview</h3>
                    <p className="text-blue-100 text-sm">Real-time WYSIWYG editing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Document Lifecycle */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Document Lifecycle
            </h2>
            <p className="text-xl text-gray-600">
              From creation to publication, manage every stage of your AIP documents
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Edit className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Create</h3>
              <p className="text-gray-600 text-sm">
                Start with templates or create from scratch using our rich editor
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Settings className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Review</h3>
              <p className="text-gray-600 text-sm">
                Collaborative review process with comments and approval workflows
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Approve</h3>
              <p className="text-gray-600 text-sm">
                Multi-level approval with digital signatures and compliance checking
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plane className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Publish</h3>
              <p className="text-gray-600 text-sm">
                Multi-format export and distribution to public portals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Key Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">ICAO Compliance</h4>
                    <p className="text-green-100 text-sm">Automatic validation against ICAO standards</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Collaboration</h4>
                    <p className="text-green-100 text-sm">Multi-user editing with conflict resolution</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Version Control</h4>
                    <p className="text-green-100 text-sm">Complete change history and rollback capabilities</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-300 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Templates</h4>
                    <p className="text-green-100 text-sm">Pre-built ICAO-compliant document templates</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Streamline Your AIP Creation Process
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Our document management system reduces AIP creation time by up to 70% while ensuring full compliance with international standards.
              </p>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">1</span>
                  </div>
                  <span className="text-gray-700">Choose from ICAO-compliant templates</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">2</span>
                  </div>
                  <span className="text-gray-700">Edit with professional rich text tools</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">3</span>
                  </div>
                  <span className="text-gray-700">Automatic compliance validation</span>
                </div>
                <div className="flex items-center">
                  <div className="bg-blue-100 w-8 h-8 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 font-bold text-sm">4</span>
                  </div>
                  <span className="text-gray-700">Export to multiple formats</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your Document Creation Process?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the power of professional AIP document management
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                Start Creating Documents
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
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