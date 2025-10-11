'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import {
  Shield,
  Lock,
  Key,
  Eye,
  Database,
  CheckCircle,
  ArrowRight,
  Plane,
  Users,
  FileText,
  Server,
  AlertTriangle,
  Clock,
  Building2,
  Globe
} from 'lucide-react';

export default function SecurityFeatures() {
  const securityFeatures = [
    {
      title: "Data Isolation & Multi-tenancy",
      description: "Complete organizational data separation with secure multi-tenant architecture",
      icon: Database,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      features: [
        "Per-organization data isolation",
        "Separate database schemas per tenant",
        "No cross-tenant data access",
        "Dedicated encryption keys per organization"
      ]
    },
    {
      title: "Role-Based Access Control",
      description: "Granular permission system with hierarchical role management",
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      features: [
        "Super Admin, Org Admin, ATC Supervisor, ATC, Editor, Viewer roles",
        "Custom workflow-specific roles (Reviewer, Approver)",
        "Granular permission assignments",
        "Resource-level access control"
      ]
    },
    {
      title: "End-to-End Encryption",
      description: "Data protection at rest and in transit with industry-standard encryption",
      icon: Lock,
      color: "text-green-600",
      bgColor: "bg-green-50",
      features: [
        "AES-256 encryption for data at rest",
        "TLS 1.3 for data in transit",
        "Encrypted file storage in Google Cloud",
        "Encrypted database connections"
      ]
    },
    {
      title: "Authentication & Session Management",
      description: "Secure authentication with modern session management",
      icon: Key,
      color: "text-red-600",
      bgColor: "bg-red-50",
      features: [
        "NextAuth.js secure authentication",
        "JWT-based session tokens",
        "Password hashing with bcrypt",
        "Account lockout after failed attempts",
        "Temporary password system",
        "Password reset with secure tokens"
      ]
    },
    {
      title: "Comprehensive Audit Trails",
      description: "Full activity logging and audit trail for compliance and accountability",
      icon: Eye,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      features: [
        "Action logs for all user operations",
        "Document view and download tracking",
        "Workflow transition history",
        "File version history",
        "User authentication logs",
        "Approval and rejection tracking"
      ]
    },
    {
      title: "DMS Security & Version Control",
      description: "Secure document management with complete version tracking",
      icon: FileText,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      features: [
        "Signed URLs with time-based expiration",
        "File access permission checks",
        "Complete version history",
        "Checksum verification (SHA-256)",
        "Approval workflow for sensitive files",
        "Granular role-based file access"
      ]
    }
  ];

  const complianceStandards = [
    {
      icon: Shield,
      title: "GDPR Compliant",
      description: "Full compliance with EU General Data Protection Regulation"
    },
    {
      icon: Lock,
      title: "SOC 2 Type II",
      description: "Security, availability, and confidentiality controls"
    },
    {
      icon: Globe,
      title: "ISO 27001",
      description: "Information security management system certification"
    },
    {
      icon: Server,
      title: "Data Residency",
      description: "Flexible data hosting options in multiple regions"
    }
  ];

  const securityPractices = [
    {
      title: "Security Architecture",
      points: [
        "Zero-trust architecture",
        "Defense in depth strategy",
        "Secure by design principles",
        "Regular security assessments"
      ]
    },
    {
      title: "Data Protection",
      points: [
        "Automated encrypted backups",
        "Point-in-time recovery",
        "Geographic redundancy",
        "Disaster recovery plan"
      ]
    },
    {
      title: "Infrastructure Security",
      points: [
        "Google Cloud Platform infrastructure",
        "DDoS protection",
        "Network segmentation",
        "Intrusion detection systems"
      ]
    },
    {
      title: "Operational Security",
      points: [
        "24/7 security monitoring",
        "Regular penetration testing",
        "Vulnerability management program",
        "Security incident response plan"
      ]
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
                  <Shield className="h-12 w-12 text-blue-300" />
                  <span className="text-3xl font-bold">Security & Multi-tenancy</span>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                Enterprise-Grade Security Built for Aviation
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto mb-8 leading-relaxed">
                Complete data isolation, role-based access control, and comprehensive audit trails for secure AIP management
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

        {/* Security Features Grid */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Comprehensive Security Features
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Multi-layered security approach protecting your sensitive aeronautical data
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                return (
                  <Card key={index} className="h-full hover:shadow-xl transition-all duration-300">
                    <CardHeader>
                      <div className={`w-16 h-16 ${feature.bgColor} rounded-lg flex items-center justify-center mb-4`}>
                        <IconComponent className={`h-8 w-8 ${feature.color}`} />
                      </div>
                      <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                      <CardDescription className="text-sm text-gray-600">{feature.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.features.map((item, i) => (
                          <li key={i} className="flex items-start text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compliance Standards */}
        <div className="py-20 bg-blue-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Compliance & Certifications
              </h2>
              <p className="text-xl text-gray-600">
                Meeting international security and privacy standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {complianceStandards.map((standard, index) => {
                const IconComponent = standard.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="bg-white w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <IconComponent className="h-10 w-10 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{standard.title}</h3>
                    <p className="text-gray-600 text-sm">{standard.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Security Practices */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Security Best Practices
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Proactive security measures and continuous monitoring
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {securityPractices.map((practice, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{practice.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {practice.points.map((point, i) => (
                        <li key={i} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-blue-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Data Privacy & GDPR */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
              <div className="text-center mb-10">
                <Shield className="h-16 w-16 text-blue-600 mx-auto mb-6" />
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  GDPR Compliance & Data Privacy
                </h2>
                <p className="text-lg text-gray-600">
                  Your data protection rights are our priority
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Your Rights</h3>
                  <ul className="space-y-3">
                    <li className="flex items-start text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Right to access your personal data</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Right to rectification of inaccurate data</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Right to erasure ("right to be forgotten")</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Right to data portability</span>
                    </li>
                    <li className="flex items-start text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                      <span>Right to object to processing</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Data Deletion</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <p className="text-gray-700 mb-4">
                      To request deletion of your personal data or exercise any of your GDPR rights:
                    </p>
                    <div className="bg-white rounded-lg p-4 border border-blue-300">
                      <p className="font-semibold text-gray-900 mb-2">Contact FLYCLIM:</p>
                      <p className="text-sm text-gray-600 mb-2">
                        Send an email to:{' '}
                        <a href="mailto:privacy@flyclim.com" className="text-blue-600 hover:underline font-medium">
                          privacy@flyclim.com
                        </a>
                      </p>
                      <p className="text-sm text-gray-600">
                        Include your registered email address in your request. We will process your request within 30 days.
                      </p>
                    </div>
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
              Security You Can Trust
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Learn more about our security architecture and compliance measures
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Request Demo
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                  View All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
