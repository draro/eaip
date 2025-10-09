'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  Clock,
  Calendar,
  GitBranch,
  Eye,
  RotateCcw,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Zap,
  Settings,
  FileText
} from 'lucide-react';

export default function VersionControlFeature() {
  const airacFeatures = [
    {
      icon: Calendar,
      title: "28-Day AIRAC Cycles",
      description: "Automatic generation of AIRAC cycles following international standards"
    },
    {
      icon: Clock,
      title: "Effective Date Management",
      description: "Precise timing for document publication and amendment activation"
    },
    {
      icon: AlertTriangle,
      title: "Amendment Tracking",
      description: "Track urgency levels and ensure timely publication of critical changes"
    },
    {
      icon: Settings,
      title: "Publication Scheduling",
      description: "Automated scheduling aligned with AIRAC calendar and regulatory requirements"
    }
  ];

  const versionFeatures = [
    {
      icon: GitBranch,
      title: "Change Tracking",
      description: "Granular tracking of all document modifications with user attribution and timestamps"
    },
    {
      icon: Eye,
      title: "Visual Diff Viewer",
      description: "Side-by-side comparison of document versions with highlighted changes"
    },
    {
      icon: RotateCcw,
      title: "Rollback Support",
      description: "Safe rollback to previous versions with impact analysis and validation"
    },
    {
      icon: FileText,
      title: "Version Metadata",
      description: "Comprehensive version information including AIRAC cycles and publication dates"
    }
  ];

  return (
    <>
      <PublicNav />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-orange-900 via-orange-800 to-red-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-orange-800 p-4 rounded-full">
                <Clock className="h-12 w-12 text-orange-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Version Control & AIRAC Management
            </h1>
            <p className="text-xl md:text-2xl text-orange-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Comprehensive version tracking with AIRAC cycle automation, change visualization, and rollback capabilities
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-orange-900 hover:bg-orange-50 px-8 py-4 text-lg font-semibold">
                  Manage Versions
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-orange-900 px-8 py-4 text-lg font-semibold">
                  All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* AIRAC Management */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              AIRAC Cycle Automation
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Automated management of Aeronautical Information Regulation and Control cycles
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {airacFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-orange-600" />
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

      {/* Version Control Features */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Version Control
            </h2>
            <p className="text-xl text-gray-600">
              Professional version management with complete change tracking and rollback capabilities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {versionFeatures.map((feature, index) => {
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

      {/* AIRAC Timeline Visualization */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                AIRAC Timeline Management
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Visual timeline of AIRAC cycles with automatic scheduling and deadline tracking for all AIP publications.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Automatic Scheduling</h3>
                    <p className="text-gray-600">28-day cycles automatically calculated with proper AIRAC dating</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Deadline Alerts</h3>
                    <p className="text-gray-600">Automated notifications for upcoming AIRAC deadlines</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Tracking</h3>
                    <p className="text-gray-600">Ensure all publications meet AIRAC timing requirements</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-orange-900 to-red-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Current AIRAC Status</h3>
              <div className="space-y-4">
                <div className="bg-orange-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Current Cycle</span>
                    <span className="text-orange-300 font-bold">2501</span>
                  </div>
                  <div className="text-xs text-orange-100">Effective: 2025-01-16</div>
                </div>
                <div className="bg-orange-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Next Cycle</span>
                    <span className="text-orange-300 font-bold">2502</span>
                  </div>
                  <div className="text-xs text-orange-100">Effective: 2025-02-13</div>
                </div>
                <div className="bg-red-800 rounded-lg p-4">
                  <div className="text-sm text-red-300 mb-1">Deadline Alert:</div>
                  <div className="text-xs text-red-100">Amendment submission due in 5 days</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-orange-900 to-red-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Never Miss an AIRAC Deadline Again
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Automated AIRAC management ensures your AIP publications are always on schedule and compliant
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-orange-900 hover:bg-orange-50 px-8 py-4 text-lg font-semibold">
                Manage AIRAC Cycles
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-orange-900 px-8 py-4 text-lg font-semibold">
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