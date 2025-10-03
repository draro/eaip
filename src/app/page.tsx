'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  FileText,
  Download,
  Users,
  Shield,
  Globe,
  CheckCircle,
  Zap,
  Lock,
  Workflow,
  Plane,
  MapPin,
  Bell,
  Award,
  Clock,
  ArrowRight,
  Radio
} from 'lucide-react';

export default function HomePage() {
  // Public landing page for Civil Aviation Authorities
  return (
    <>
      <PublicNav />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="flex items-center space-x-2">
                <Plane className="h-12 w-12 text-blue-300" />
                <span className="text-4xl font-bold">eAIP</span>
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Electronic AIP Management
              <span className="block text-blue-300">for Civil Aviation Authorities</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Complete ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant solution for creating,
              managing, and publishing aeronautical information publications with enterprise-grade security and workflow management.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Explore Features
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Key Benefits */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose Our eAIP Solution?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Trusted by aviation authorities worldwide for secure, compliant, and efficient AIP management
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">100% Compliant</h3>
              <p className="text-gray-600">
                Full ICAO Annex 15 and EUROCONTROL Specification 3.0 compliance with automated validation
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">70% Faster</h3>
              <p className="text-gray-600">
                Reduce AIP publication time with automated workflows, compliance checking, and multi-format exports
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Enterprise Security</h3>
              <p className="text-gray-600">
                Multi-tenant architecture with role-based access control, audit trails, and data encryption
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Core Features Grid */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete AIP Management Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to create, manage, and publish aeronautical information
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

            {/* Document Management */}
            <Link href="/features/document-management">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <FileText className="h-8 w-8 mr-3 text-blue-600 group-hover:scale-110 transition-transform" />
                    Document Management
                  </CardTitle>
                  <CardDescription className="text-base">
                    ICAO-compliant AIP document creation and management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Rich text editor with TipTap</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />GEN, ENR, AD section support</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Image upload and management</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Template-based creation</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* NOTAM Integration */}
            <Link href="/features/notam-management">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Bell className="h-8 w-8 mr-3 text-red-600 group-hover:scale-110 transition-transform" />
                    NOTAM Integration
                  </CardTitle>
                  <CardDescription className="text-base">
                    Comprehensive NOTAM creation and management system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />ICAO standard compliance</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Automatic NOTAM generation</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Categories A-X support</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />AIP change integration</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Compliance & Validation */}
            <Link href="/features/compliance">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Award className="h-8 w-8 mr-3 text-green-600 group-hover:scale-110 transition-transform" />
                    Compliance & Validation
                  </CardTitle>
                  <CardDescription className="text-base">
                    Automated compliance checking and quality assurance
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />ICAO Annex 15 validation</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />EUROCONTROL Spec 3.0</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Data quality checking</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Compliance scoring</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Workflow Management */}
            <Link href="/features/workflow">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Workflow className="h-8 w-8 mr-3 text-purple-600 group-hover:scale-110 transition-transform" />
                    Workflow Management
                  </CardTitle>
                  <CardDescription className="text-base">
                    Multi-level approval workflows with digital signatures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Multi-level approvals</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Digital signatures</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Automated notifications</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Deadline tracking</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Export & Distribution */}
            <Link href="/features/export">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Download className="h-8 w-8 mr-3 text-indigo-600 group-hover:scale-110 transition-transform" />
                    Export & Distribution
                  </CardTitle>
                  <CardDescription className="text-base">
                    Multi-format export with professional formatting
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />DOCX, PDF, XML, HTML</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Professional formatting</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Bulk export operations</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Cloud storage integration</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

            {/* Version Control */}
            <Link href="/features/version-control">
              <Card className="h-full hover:shadow-xl transition-all duration-300 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Clock className="h-8 w-8 mr-3 text-orange-600 group-hover:scale-110 transition-transform" />
                    Version Control
                  </CardTitle>
                  <CardDescription className="text-base">
                    AIRAC cycle management and version tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />AIRAC cycle automation</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Change tracking</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Visual diff viewer</li>
                    <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" />Rollback capabilities</li>
                  </ul>
                </CardContent>
              </Card>
            </Link>

          </div>
        </div>
      </div>

      {/* AIRAC & Aviation Features */}
      <div className="py-20 bg-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Aviation-Specific Features
            </h2>
            <p className="text-xl text-gray-600">
              Purpose-built for aeronautical information management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <MapPin className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Coordinate Validation</h3>
              <p className="text-gray-600 text-sm">
                DMS, Decimal, and ICAO format validation with WGS-84 compliance
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Radio className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Frequency Management</h3>
              <p className="text-gray-600 text-sm">
                VHF, UHF, HF band validation with radio frequency compliance
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Plane className="h-10 w-10 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">ICAO Identifiers</h3>
              <p className="text-gray-600 text-sm">
                Airports, navaids, waypoints, and runway designation validation
              </p>
            </div>

            <div className="text-center">
              <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Clock className="h-10 w-10 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">AIRAC Cycles</h3>
              <p className="text-gray-600 text-sm">
                Automated 28-day AIRAC cycle management and scheduling
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Enterprise */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Enterprise Security & Multi-Tenancy
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                Built for aviation authorities with the highest security requirements and complete organizational isolation.
              </p>
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Lock className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Isolation</h3>
                    <p className="text-gray-600">Complete tenant separation with encrypted storage and secure access controls</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Role-Based Access</h3>
                    <p className="text-gray-600">Granular permissions with audit trails for super admin, org admin, editor, and viewer roles</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Globe className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Domain Management</h3>
                    <p className="text-gray-600">Custom domains with DNS verification and SSL certificates for public portals</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">99.9%</div>
                  <div className="text-sm">Uptime SLA</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">SOC 2</div>
                  <div className="text-sm">Compliant</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-300 mb-2">256-bit</div>
                  <div className="text-sm">Encryption</div>
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

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to Transform Your AIP Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join aviation authorities worldwide who trust our platform for their aeronautical information publications.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                Request Demo
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                Learn More
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Plane className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">eAIP</span>
              </div>
              <p className="text-gray-400">
                Professional eAIP management platform for Civil Aviation Authorities worldwide.
              </p>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features/document-management" className="hover:text-white transition-colors">Document Management</Link></li>
                <li><Link href="/features/notam-management" className="hover:text-white transition-colors">NOTAM Integration</Link></li>
                <li><Link href="/features/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
                <li><Link href="/features/workflow" className="hover:text-white transition-colors">Workflow</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features/security" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="/features/export" className="hover:text-white transition-colors">Export</Link></li>
                <li><Link href="/features/version-control" className="hover:text-white transition-colors">Version Control</Link></li>
                <li><Link href="/features/public-portal" className="hover:text-white transition-colors">Public Portal</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/auth/signin" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/features/overview" className="hover:text-white transition-colors">Overview</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 eAIP Platform. ICAO Annex 15 & EUROCONTROL Spec 3.0 Compliant.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}