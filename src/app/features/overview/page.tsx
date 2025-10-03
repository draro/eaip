'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  FileText,
  Bell,
  Award,
  Workflow,
  Download,
  Clock,
  Shield,
  Globe,
  CheckCircle,
  ArrowRight,
  Plane,
  MapPin,
  Radio,
  Users,
  Lock,
  BarChart,
  Eye,
  Settings
} from 'lucide-react';

export default function FeaturesOverview() {
  const features = [
    {
      title: "Document Management",
      description: "ICAO-compliant AIP document creation with rich text editing, section management, and template support",
      icon: FileText,
      href: "/features/document-management",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      highlights: ["TipTap Rich Editor", "GEN/ENR/AD Sections", "Image Management", "Templates"]
    },
    {
      title: "NOTAM Integration",
      description: "Comprehensive NOTAM management system with ICAO standard compliance and automatic generation",
      icon: Bell,
      href: "/features/notam-management",
      color: "text-red-600",
      bgColor: "bg-red-50",
      highlights: ["ICAO Categories A-X", "Auto Generation", "AIP Integration", "Lifecycle Management"]
    },
    {
      title: "Compliance & Validation",
      description: "Automated compliance checking for ICAO Annex 15 and EUROCONTROL Specification 3.0",
      icon: Award,
      href: "/features/compliance",
      color: "text-green-600",
      bgColor: "bg-green-50",
      highlights: ["ICAO Annex 15", "EUROCONTROL Spec 3.0", "Data Quality", "Compliance Scoring"]
    },
    {
      title: "Workflow Management",
      description: "Multi-level approval workflows with digital signatures and automated notifications",
      icon: Workflow,
      href: "/features/workflow",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      highlights: ["Multi-level Approvals", "Digital Signatures", "Notifications", "Deadline Tracking"]
    },
    {
      title: "Export & Distribution",
      description: "Multi-format export capabilities with professional formatting and cloud integration",
      icon: Download,
      href: "/features/export",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      highlights: ["DOCX/PDF/XML/HTML", "Professional Format", "Bulk Operations", "Cloud Storage"]
    },
    {
      title: "Version Control",
      description: "AIRAC cycle management with version tracking and visual change comparison",
      icon: Clock,
      href: "/features/version-control",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      highlights: ["AIRAC Automation", "Change Tracking", "Visual Diff", "Rollback Support"]
    },
    {
      title: "Security & Multi-tenancy",
      description: "Enterprise-grade security with complete data isolation and role-based access control",
      icon: Shield,
      href: "/features/security",
      color: "text-gray-600",
      bgColor: "bg-gray-50",
      highlights: ["Data Isolation", "Role-Based Access", "Audit Trails", "Encryption"]
    },
    {
      title: "Public Portal",
      description: "Domain-based public portals for AIP publication and distribution to aviation community",
      icon: Globe,
      href: "/features/public-portal",
      color: "text-teal-600",
      bgColor: "bg-teal-50",
      highlights: ["Custom Domains", "Public Access", "Search & Filter", "Mobile Ready"]
    }
  ];

  const aviationFeatures = [
    {
      icon: MapPin,
      title: "Coordinate Validation",
      description: "DMS, Decimal, and ICAO format validation with WGS-84 compliance"
    },
    {
      icon: Radio,
      title: "Frequency Management",
      description: "VHF, UHF, HF band validation with radio frequency compliance"
    },
    {
      icon: Plane,
      title: "ICAO Identifiers",
      description: "Airports, navaids, waypoints, and runway designation validation"
    },
    {
      icon: Clock,
      title: "AIRAC Cycles",
      description: "Automated 28-day AIRAC cycle management and scheduling"
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
              <div className="flex items-center space-x-2">
                <Plane className="h-12 w-12 text-blue-300" />
                <span className="text-3xl font-bold">eAIP Features</span>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Complete Feature Overview
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Explore all features of our ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant eAIP management platform
            </p>
            <div className="flex justify-center">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Request Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Core Platform Features
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools for modern AIP management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Link key={index} href={feature.href}>
                  <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                    <CardHeader>
                      <div className={`w-16 h-16 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                        <IconComponent className={`h-8 w-8 ${feature.color}`} />
                      </div>
                      <CardTitle className="text-2xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-base text-gray-600">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="grid grid-cols-2 gap-2">
                        {feature.highlights.map((highlight, i) => (
                          <li key={i} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6">
                        <Button variant="outline" className="w-full group-hover:bg-blue-50 group-hover:border-blue-200">
                          Learn More
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aviation-Specific Features */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Aviation-Specific Validation
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built tools for aeronautical data management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aviationFeatures.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <IconComponent className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Platform Benefits */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why Aviation Authorities Choose eAIP
              </h2>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Compliant</h3>
                    <p className="text-gray-600">Full ICAO Annex 15 and EUROCONTROL Specification 3.0 compliance with automated validation</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <BarChart className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">70% Faster Publishing</h3>
                    <p className="text-gray-600">Reduce AIP publication time with automated workflows and multi-format exports</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Shield className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                    <p className="text-gray-600">Multi-tenant architecture with role-based access control and audit trails</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Users className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Organization</h3>
                    <p className="text-gray-600">Complete tenant isolation with custom branding and domain support</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">Platform Statistics</h3>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">99.9%</div>
                  <div className="text-sm">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">256-bit</div>
                  <div className="text-sm">Encryption</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">SOC 2</div>
                  <div className="text-sm">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">GDPR</div>
                  <div className="text-sm">Ready</div>
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
            Ready to See All Features in Action?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Schedule a personalized demo to explore how eAIP can transform your AIP management process
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                Request Demo
              </Button>
            </Link>
            <Link href="/">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}