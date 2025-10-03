'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PublicNav from '@/components/PublicNav';
import {
  Workflow,
  Users,
  CheckCircle,
  Clock,
  FileCheck,
  ArrowRight,
  UserCheck,
  AlertCircle,
  Calendar,
  Mail,
  Shield
} from 'lucide-react';

export default function WorkflowFeature() {
  const workflowTypes = [
    {
      title: "Critical Changes",
      description: "High-priority changes affecting safety or operational procedures",
      levels: ["Technical Review", "Safety Assessment", "Authority Approval", "Final Sign-off"],
      timeline: "5-7 days"
    },
    {
      title: "Essential Updates",
      description: "Important operational information updates",
      levels: ["Technical Review", "Operational Approval", "Final Sign-off"],
      timeline: "3-5 days"
    },
    {
      title: "Routine Changes",
      description: "Regular administrative and minor operational updates",
      levels: ["Technical Review", "Final Sign-off"],
      timeline: "1-2 days"
    }
  ];

  return (
    <>
      <PublicNav />
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white py-20">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-purple-800 p-4 rounded-full">
                <Workflow className="h-12 w-12 text-purple-300" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Workflow Management
            </h1>
            <p className="text-xl md:text-2xl text-purple-100 max-w-4xl mx-auto mb-8 leading-relaxed">
              Multi-level approval workflows with digital signatures, automated notifications, and deadline tracking for AIP publications
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link href="/auth/signin">
                <Button size="lg" variant="ghost" className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 text-lg font-semibold">
                  Manage Workflows
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/features/overview">
                <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 text-lg font-semibold">
                  All Features
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Workflow Types */}
      <div className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Configurable Approval Workflows
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Flexible workflow configurations based on change criticality and organizational requirements
            </p>
          </div>

          <div className="space-y-8">
            {workflowTypes.map((workflow, index) => (
              <Card key={index} className="hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <CardTitle className="text-2xl text-purple-600 mb-2">{workflow.title}</CardTitle>
                      <CardDescription className="text-base">{workflow.description}</CardDescription>
                    </div>
                    <div className="bg-purple-50 px-4 py-2 rounded-lg">
                      <div className="flex items-center text-purple-700">
                        <Clock className="h-4 w-4 mr-2" />
                        <span className="text-sm font-medium">{workflow.timeline}</span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                    {workflow.levels.map((level, i) => (
                      <div key={i} className="flex items-center flex-shrink-0">
                        <div className="bg-purple-100 px-4 py-2 rounded-lg min-w-max">
                          <span className="text-purple-800 font-medium text-sm">{level}</span>
                        </div>
                        {i < workflow.levels.length - 1 && (
                          <ArrowRight className="h-4 w-4 text-purple-400 mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Key Features */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Workflow Features
            </h2>
            <p className="text-xl text-gray-600">
              Comprehensive tools for efficient approval management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-blue-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <UserCheck className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl mb-2">Digital Signatures</CardTitle>
                <CardDescription>PKI-based digital signatures with certificate validation and audit trails</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-green-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl mb-2">Automated Notifications</CardTitle>
                <CardDescription>Email and in-app notifications for approvals, deadlines, and status changes</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-orange-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl mb-2">Deadline Tracking</CardTitle>
                <CardDescription>Automatic deadline monitoring with escalation for overdue approvals</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-purple-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl mb-2">Role-Based Assignment</CardTitle>
                <CardDescription>Automatic assignment based on roles, skills, and availability</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-red-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <CardTitle className="text-xl mb-2">Bottleneck Detection</CardTitle>
                <CardDescription>Identify and resolve workflow bottlenecks with performance analytics</CardDescription>
              </CardHeader>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <FileCheck className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl mb-2">Compliance Integration</CardTitle>
                <CardDescription>Built-in compliance validation at each workflow stage</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>

      {/* Call to Action */}
      <div className="py-20 bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Streamline Your Approval Process
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Reduce approval time by 60% with automated workflows and intelligent routing
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link href="/auth/signin">
              <Button size="lg" variant="ghost" className="bg-white text-purple-900 hover:bg-purple-50 px-8 py-4 text-lg font-semibold">
                Configure Workflows
              </Button>
            </Link>
            <Link href="/features/overview">
              <Button size="lg" variant="ghost" className="border-2 border-white text-white hover:bg-white hover:text-purple-900 px-8 py-4 text-lg font-semibold">
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