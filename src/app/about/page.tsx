'use client';

import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plane, Shield, Globe, Users, Award, Target,
  CheckCircle, Zap, Lock, TrendingUp, ArrowRight
} from 'lucide-react';

export default function AboutPage() {
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
                  <Plane className="h-12 w-12 text-blue-300" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                About eAIP
              </h1>
              <p className="text-xl md:text-2xl text-blue-100 max-w-4xl mx-auto leading-relaxed">
                The world's most comprehensive Electronic Aeronautical Information Publication platform,
                trusted by Civil Aviation Authorities worldwide
              </p>
            </div>
          </div>
        </div>

        {/* Mission Section */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                To empower Civil Aviation Authorities with cutting-edge technology that ensures
                100% compliance, maximizes efficiency, and maintains the highest safety standards
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="text-center">
                <CardHeader>
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Shield className="h-8 w-8 text-blue-600" />
                  </div>
                  <CardTitle>Safety First</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Our platform ensures critical aeronautical information is accurate,
                    compliant, and always accessible to those who need it
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Globe className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle>Global Standards</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Full compliance with ICAO Annex 15 and EUROCONTROL Specification 3.0
                    ensures international compatibility
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardHeader>
                  <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                  <CardTitle>Trusted Worldwide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    Serving aviation authorities across multiple continents with
                    enterprise-grade reliability and support
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Why Choose Us */}
        <div className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Why Civil Aviation Authorities Choose eAIP
              </h2>
              <p className="text-xl text-gray-600">
                Proven results that transform AIP management
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="bg-green-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">100% Compliance Guaranteed</h3>
                    <p className="text-gray-600">
                      Automated validation ensures every document meets ICAO Annex 15 and
                      EUROCONTROL Spec 3.0 requirements
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">70% Faster Publication</h3>
                    <p className="text-gray-600">
                      Streamlined workflows and automation reduce AIP publication time from
                      weeks to days
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-purple-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <Lock className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Enterprise Security</h3>
                    <p className="text-gray-600">
                      SOC 2 compliant infrastructure with 256-bit encryption, role-based
                      access control, and complete audit trails
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="bg-orange-100 w-12 h-12 rounded-lg flex items-center justify-center mr-4 flex-shrink-0">
                    <TrendingUp className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Continuous Innovation</h3>
                    <p className="text-gray-600">
                      Regular updates with new features, compliance improvements, and
                      performance enhancements
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">By the Numbers</h3>
                <div className="space-y-6">
                  <div>
                    <div className="text-4xl font-bold text-blue-300 mb-2">100%</div>
                    <p className="text-blue-100">ICAO & EUROCONTROL Compliance</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-blue-300 mb-2">70%</div>
                    <p className="text-blue-100">Reduction in Publication Time</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-blue-300 mb-2">99.9%</div>
                    <p className="text-blue-100">System Uptime</p>
                  </div>
                  <div>
                    <div className="text-4xl font-bold text-blue-300 mb-2">24/7</div>
                    <p className="text-blue-100">Enterprise Support</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Our Technology */}
        <div className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Built on Modern Technology
              </h2>
              <p className="text-xl text-gray-600">
                Enterprise-grade infrastructure designed for reliability and scale
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardContent className="p-6">
                  <Award className="h-12 w-12 text-blue-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Cloud Native</h3>
                  <p className="text-sm text-gray-600">
                    Scalable cloud infrastructure with automatic backups and disaster recovery
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Shield className="h-12 w-12 text-green-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Secure by Design</h3>
                  <p className="text-sm text-gray-600">
                    End-to-end encryption, penetration tested, and SOC 2 compliant
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Target className="h-12 w-12 text-purple-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">API First</h3>
                  <p className="text-sm text-gray-600">
                    RESTful APIs for seamless integration with existing systems
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <Zap className="h-12 w-12 text-orange-600 mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">High Performance</h3>
                  <p className="text-sm text-gray-600">
                    Optimized for speed with sub-second response times
                  </p>
                </CardContent>
              </Card>
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
              Join leading aviation authorities worldwide who trust eAIP for their
              aeronautical information publication needs
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-blue-900 hover:bg-blue-50 px-8 py-4 text-lg font-semibold">
                  Request Demo
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-blue-900 px-8 py-4 text-lg font-semibold">
                  Contact Us
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}