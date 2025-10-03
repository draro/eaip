'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  Bell,
  Plane,
  AlertTriangle,
  Calendar,
  FileText,
  CheckCircle,
  ArrowRight,
  MapPin,
  Clock,
  Radio,
  Shield,
  Zap,
  Globe,
  Settings,
  Eye
} from 'lucide-react';

export default function NOTAMManagementFeature() {
  const features = [
    {
      icon: Bell,
      title: "ICAO Standard Compliance",
      description: "Full compliance with ICAO Annex 15 standards for NOTAM format, structure, and content validation"
    },
    {
      icon: Zap,
      title: "Automatic Generation",
      description: "Automatically generate NOTAMs from AIP document changes with proper categorization and formatting"
    },
    {
      icon: Calendar,
      title: "Lifecycle Management",
      description: "Complete NOTAM lifecycle support including creation, replacement, cancellation, and archiving"
    },
    {
      icon: Globe,
      title: "Multi-format Export",
      description: "Export NOTAMs in ICAO standard format, XML, and integration with external NOTAM systems"
    },
    {
      icon: MapPin,
      title: "Geographic Integration",
      description: "Coordinate validation and geographic boundary support with WGS-84 compliance"
    },
    {
      icon: Settings,
      title: "Category Management",
      description: "Support for all ICAO NOTAM categories (A-X) with automatic classification and validation"
    }
  ];

  const categories = [
    { code: 'A', title: 'Availability', description: 'Availability of facilities and services' },
    { code: 'C', title: 'Construction', description: 'Construction or work affecting movement area' },
    { code: 'D', title: 'Danger Areas', description: 'Danger areas and air traffic advisory service' },
    { code: 'E', title: 'Equipment', description: 'Equipment and services' },
    { code: 'F', title: 'Facilities', description: 'Facilities and services' },
    { code: 'G', title: 'General', description: 'General information' },
    { code: 'I', title: 'Instrument', description: 'Instrument approach procedures' },
    { code: 'L', title: 'Lighting', description: 'Lighting and marking systems' },
    { code: 'N', title: 'Navigation', description: 'Navigation aids and systems' },
    { code: 'O', title: 'Obstacles', description: 'Obstacles affecting aviation' },
    { code: 'R', title: 'Restricted', description: 'Restricted areas and air traffic advisory service' },
    { code: 'S', title: 'Security', description: 'Security-related information' }
  ];

  const notamStructure = [
    { field: 'Q-line', description: 'Traffic applicability, purpose, scope, coordinates, and operational details' },
    { field: 'A-line', description: 'Location identifier (ICAO 4-letter airport code)' },
    { field: 'B-line', description: 'Effective from date and time (YYMMDDHHMM format)' },
    { field: 'C-line', description: 'Effective until date and time (PERM if permanent)' },
    { field: 'D-line', description: 'Schedule of applicability (if not continuous)' },
    { field: 'E-line', description: 'NOTAM text describing the condition or change' },
    { field: 'F-line', description: 'Lower limit of applicability' },
    { field: 'G-line', description: 'Upper limit of applicability' }
  ];

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-red-900 via-red-800 to-pink-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-red-800 p-4 rounded-full">
                <Bell className="h-12 w-12 text-red-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              NOTAM Management
            </h1>
            <p className="text-xl md:text-2xl text-red-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive NOTAM creation and management system with full ICAO compliance and automatic generation from AIP changes
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-red-900 hover:bg-red-50 px-8 py-4 text-lg font-semibold">
                  Create NOTAMs
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-red-900 px-8 py-4 text-lg font-semibold">
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
              Complete NOTAM Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and distribute NOTAMs in compliance with ICAO standards
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-red-600" />
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

      {/* ICAO Categories */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ICAO NOTAM Categories
            </h2>
            <p className="text-xl text-gray-600">
              Complete support for all ICAO standard NOTAM categories with automatic classification
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center mb-2">
                    <div className="bg-red-100 w-10 h-10 rounded-lg flex items-center justify-center mr-3">
                      <span className="font-bold text-red-700">{category.code}</span>
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {category.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* NOTAM Structure */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                ICAO Standard Format
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Our NOTAM system follows the exact ICAO format specification with automatic field validation and formatting.
              </p>
              <div className="space-y-4">
                {notamStructure.map((field, index) => (
                  <div key={index} className="flex items-start">
                    <div className="bg-red-100 px-3 py-1 rounded-lg mr-4 flex-shrink-0">
                      <span className="font-mono text-red-800 text-sm font-bold">{field.field}</span>
                    </div>
                    <div>
                      <p className="text-gray-700 text-sm">{field.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-red-900 to-pink-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Example NOTAM Format</h3>
              <div className="bg-red-800 rounded-lg p-4 font-mono text-sm space-y-2">
                <div><span className="text-red-300">A0123/24</span></div>
                <div><span className="text-red-300">Q)</span> <span className="text-red-100">IV/BO/A/M/A/000/999/1234N01234W005</span></div>
                <div><span className="text-red-300">A)</span> <span className="text-red-100">EGLL</span></div>
                <div><span className="text-red-300">B)</span> <span className="text-red-100">2501150800</span></div>
                <div><span className="text-red-300">C)</span> <span className="text-red-100">2501151800</span></div>
                <div><span className="text-red-300">E)</span> <span className="text-red-100">RWY 09L/27R CLSD FOR MAINTENANCE</span></div>
              </div>
              <div className="mt-4 text-red-100 text-sm">
                <p>Automatically generated and validated format ensuring ICAO compliance</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automation & Integration */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Automatic NOTAM Generation
            </h2>
            <p className="text-xl text-gray-600">
              Seamlessly integrate with AIP document changes to automatically generate required NOTAMs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <FileText className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AIP Change Detection</h3>
              <p className="text-gray-600 text-sm">
                Automatically detect changes in AIP documents that require NOTAM publication
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Settings className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Auto Classification</h3>
              <p className="text-gray-600 text-sm">
                Intelligent categorization based on change type and affected systems
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <CheckCircle className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Validation</h3>
              <p className="text-gray-600 text-sm">
                Automatic ICAO format validation and compliance checking
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Globe className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Distribution</h3>
              <p className="text-gray-600 text-sm">
                Automatic distribution to NOTAM systems and public portals
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* NOTAM Lifecycle */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">NOTAM Lifecycle Management</h3>
              <div className="space-y-4">
                <div className="flex items-center">
                  <div className="bg-green-800 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">N</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">New NOTAM</h4>
                    <p className="text-green-100 text-sm">Create new NOTAMs with full validation</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-800 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">R</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Replace NOTAM</h4>
                    <p className="text-green-100 text-sm">Replace existing NOTAMs with updated information</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className="bg-green-800 w-8 h-8 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <div>
                    <h4 className="font-semibold">Cancel NOTAM</h4>
                    <p className="text-green-100 text-sm">Cancel NOTAMs with proper documentation</p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Complete Lifecycle Support
              </h2>
              <p className="text-xl text-gray-600 mb-6">
                Manage the entire NOTAM lifecycle from creation to cancellation with full audit trails and compliance tracking.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Automatic Expiry</h4>
                    <p className="text-gray-600 text-sm">Automatic handling of NOTAM expiration and archiving</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Change Tracking</h4>
                    <p className="text-gray-600 text-sm">Complete audit trail of all NOTAM modifications</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Batch Operations</h4>
                    <p className="text-gray-600 text-sm">Process multiple NOTAMs efficiently with bulk operations</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Integration Ready</h4>
                    <p className="text-gray-600 text-sm">API integration with external NOTAM distribution systems</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-red-900 to-pink-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Streamline Your NOTAM Operations
          </h2>
          <p className="text-xl text-red-100 mb-8">
            Reduce NOTAM processing time by 80% with automated generation and ICAO-compliant formatting
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-red-900 hover:bg-red-50 px-8 py-4 text-lg font-semibold">
                Start Managing NOTAMs
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-red-900 px-8 py-4 text-lg font-semibold">
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