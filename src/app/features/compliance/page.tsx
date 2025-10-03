'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  Award,
  Shield,
  CheckCircle,
  AlertTriangle,
  BarChart,
  FileCheck,
  Globe,
  ArrowRight,
  Target,
  Zap,
  Eye,
  Settings
} from 'lucide-react';

export default function ComplianceFeature() {
  const complianceFrameworks = [
    {
      title: "ICAO Annex 15",
      description: "International Standards and Recommended Practices for Aeronautical Information Services",
      features: [
        "Mandatory sections validation",
        "Data quality requirements",
        "Coordinate reference system (WGS-84)",
        "Content standards enforcement"
      ]
    },
    {
      title: "EUROCONTROL Spec 3.0",
      description: "European Standard for Electronic AIP Specification",
      features: [
        "XML schema compliance",
        "Dublin Core metadata support",
        "Presentation standards (300 DPI, RGB)",
        "Quality levels (A, B, C)"
      ]
    }
  ];

  const validationTypes = [
    {
      icon: Target,
      title: "Data Quality Validation",
      description: "Accuracy, resolution, and integrity checks for all aeronautical data"
    },
    {
      icon: Globe,
      title: "Coordinate Validation",
      description: "WGS-84 compliance and format validation for geographic coordinates"
    },
    {
      icon: FileCheck,
      title: "Content Standards",
      description: "Structure, formatting, and mandatory section validation"
    },
    {
      icon: Shield,
      title: "Metadata Validation",
      description: "Dublin Core metadata and authority information verification"
    }
  ];

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-green-800 p-4 rounded-full">
                <Award className="h-12 w-12 text-green-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Compliance & Validation
            </h1>
            <p className="text-xl md:text-2xl text-green-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Automated compliance checking for ICAO Annex 15 and EUROCONTROL Specification 3.0 with real-time validation and quality assurance
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-green-900 hover:bg-green-50 px-8 py-4 text-lg font-semibold">
                  Check Compliance
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-green-900 px-8 py-4 text-lg font-semibold">
                  All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Compliance Frameworks */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              International Standards Compliance
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive validation against the most important aviation standards
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {complianceFrameworks.map((framework, index) => (
              <Card key={index} className="h-full hover:shadow-xl transition-shadow">
                <CardHeader>
                  <CardTitle className="text-2xl text-green-600 mb-2">{framework.title}</CardTitle>
                  <CardDescription className="text-base mb-4">{framework.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {framework.features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Types */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Comprehensive Validation Engine
            </h2>
            <p className="text-xl text-gray-600">
              Multi-layer validation ensuring your AIP meets all requirements
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {validationTypes.map((type, index) => {
              const IconComponent = type.icon;
              return (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                      <IconComponent className="h-6 w-6 text-green-600" />
                    </div>
                    <CardTitle className="text-xl mb-2">{type.title}</CardTitle>
                    <CardDescription className="text-gray-600">{type.description}</CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Real-time Compliance Dashboard */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Real-time Compliance Monitoring
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Monitor compliance status in real-time with detailed reports and actionable remediation plans.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Compliance Scoring</h3>
                    <p className="text-gray-600">Real-time scoring with detailed breakdown by category and priority</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Validation</h3>
                    <p className="text-gray-600">Real-time validation as you edit with immediate feedback</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <AlertTriangle className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Issue Detection</h3>
                    <p className="text-gray-600">Automatic detection of compliance issues with suggested fixes</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-green-900 to-emerald-900 rounded-2xl p-8 text-white">
              <h3 className="text-2xl font-bold mb-6">Compliance Dashboard</h3>
              <div className="space-y-6">
                <div className="bg-green-800 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm">Overall Compliance</span>
                    <span className="text-green-300 font-bold">94%</span>
                  </div>
                  <div className="w-full bg-green-900 rounded-full h-2">
                    <div className="bg-green-300 h-2 rounded-full w-11/12"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-300">47</div>
                    <div className="text-sm text-green-100">Checks Passed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-300">3</div>
                    <div className="text-sm text-green-100">Warnings</div>
                  </div>
                </div>
                <div className="bg-green-800 rounded-lg p-3">
                  <div className="text-sm text-green-300 mb-1">Next Action Required:</div>
                  <div className="text-xs text-green-100">Update magnetic variation data for 2025</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-green-900 to-emerald-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ensure Perfect Compliance Every Time
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Never worry about compliance issues again with our automated validation and monitoring system
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-green-900 hover:bg-green-50 px-8 py-4 text-lg font-semibold">
                Start Compliance Check
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-green-900 px-8 py-4 text-lg font-semibold">
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