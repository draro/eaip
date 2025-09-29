'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  Users,
  FileText,
  Settings,
  BarChart3,
  Globe,
  Shield,
  UserPlus,
  PlusCircle,
  Activity
} from 'lucide-react';
import Link from 'next/link';
import Layout from '@/components/Layout';

interface User {
  _id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'org_admin' | 'editor' | 'viewer';
  organization?: {
    _id: string;
    name: string;
    domain: string;
  };
}

interface DashboardStats {
  users: number;
  documents: number;
  organizations?: number;
  activity: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({ users: 0, documents: 0, activity: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin?callbackUrl=/dashboard');
      return;
    }

    // Redirect super admin to admin panel
    const user = session.user as any;
    if (user?.role === 'super_admin') {
      router.push('/admin');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      // Get stats based on user role
      const user = session.user as any;
      if (user.role === 'org_admin') {
        setStats({ users: 8, documents: 23, activity: 34 });
      } else {
        setStats({ users: 3, documents: 12, activity: 15 });
      }
      setLoading(false);
    }
  }, [session]);

  // Show loading while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = session.user as any;

  const getRoleBasedActions = () => {
    if (!user) return [];

    switch (user.role) {
      case 'super_admin':
        return [
          {
            title: 'Manage Organizations',
            description: 'Create and manage organizations',
            icon: Building2,
            href: '/admin',
            color: 'bg-purple-500'
          },
          {
            title: 'System Analytics',
            description: 'View system-wide statistics',
            icon: BarChart3,
            href: '/admin/analytics',
            color: 'bg-blue-500'
          },
          {
            title: 'Global Settings',
            description: 'Configure system settings',
            icon: Settings,
            href: '/admin/settings',
            color: 'bg-gray-500'
          }
        ];

      case 'org_admin':
        return [
          {
            title: 'Organization Setup',
            description: 'Configure your organization',
            icon: Building2,
            href: '/organization/setup',
            color: 'bg-blue-500'
          },
          {
            title: 'Manage Users',
            description: 'Add and manage team members',
            icon: Users,
            href: '/organization/users',
            color: 'bg-green-500'
          },
          {
            title: 'Public eAIP',
            description: 'View your public eAIP site',
            icon: Globe,
            href: '/organization/public',
            color: 'bg-indigo-500'
          },
          {
            title: 'Analytics',
            description: 'View organization analytics',
            icon: BarChart3,
            href: '/organization/analytics',
            color: 'bg-purple-500'
          }
        ];

      case 'editor':
        return [
          {
            title: 'Create Document',
            description: 'Create new AIP document',
            icon: PlusCircle,
            href: '/documents/create',
            color: 'bg-green-500'
          },
          {
            title: 'My Documents',
            description: 'View and edit your documents',
            icon: FileText,
            href: '/documents',
            color: 'bg-blue-500'
          },
          {
            title: 'Document Versions',
            description: 'Manage document versions',
            icon: Activity,
            href: '/documents/versions',
            color: 'bg-orange-500'
          }
        ];

      case 'viewer':
        return [
          {
            title: 'Browse Documents',
            description: 'View published documents',
            icon: FileText,
            href: '/documents',
            color: 'bg-blue-500'
          },
          {
            title: 'Public eAIP',
            description: 'View public eAIP site',
            icon: Globe,
            href: '/public',
            color: 'bg-indigo-500'
          }
        ];

      default:
        return [];
    }
  };

  const getWelcomeMessage = () => {
    if (!user) return '';

    switch (user.role) {
      case 'super_admin':
        return `Welcome back, ${user.name}! You have full system access to manage all organizations.`;
      case 'org_admin':
        return `Welcome back, ${user.name}! Manage your organization and team from here.`;
      case 'editor':
        return `Welcome back, ${user.name}! Ready to create and edit AIP documents?`;
      case 'viewer':
        return `Welcome back, ${user.name}! Browse and view the latest AIP documents.`;
      default:
        return `Welcome back, ${user.name}!`;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const actions = getRoleBasedActions();

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || 'user@example.com',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <Badge className={getRoleBadgeColor(user?.role || '')}>
                <Shield className="w-3 h-3 mr-1" />
                {user?.role?.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <p className="text-gray-600">{getWelcomeMessage()}</p>
            {user?.organization && (
              <p className="text-sm text-blue-600 mt-1">
                Organization: {user.organization.name}
              </p>
            )}
          </div>
          <div className="text-right text-sm text-gray-500">
            <div>Logged in as: {user?.email}</div>
            <div>{new Date().toLocaleDateString()}</div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {user?.role === 'super_admin' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.organizations}</div>
                <p className="text-xs text-muted-foreground">Total organizations</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {user?.role === 'super_admin' ? 'Total Users' : 'Team Members'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.users}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'super_admin' ? 'Across all organizations' : 'In your organization'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.documents}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'super_admin' ? 'System wide' : 'In your organization'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activity}%</div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with the most common tasks for your role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {actions.map((action, index) => (
                <Link key={index} href={action.href}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white group-hover:scale-110 transition-transform`}>
                        <action.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">{action.description}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              {user?.role === 'super_admin'
                ? 'Latest system activity across all organizations'
                : 'Latest activity in your organization'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                {
                  action: 'Document updated',
                  item: 'ENR 1.1 - General Rules',
                  user: 'John Smith',
                  time: '2 hours ago'
                },
                {
                  action: 'User added',
                  item: 'New editor: Jane Doe',
                  user: 'Admin User',
                  time: '4 hours ago'
                },
                {
                  action: 'Document published',
                  item: 'AD 2.1 - Airport Information',
                  user: 'Mike Johnson',
                  time: '1 day ago'
                }
              ].map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-b-0">
                  <div>
                    <div className="font-medium">{activity.action}</div>
                    <div className="text-sm text-gray-600">{activity.item}</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>by {activity.user}</div>
                    <div>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </Layout>
  );
}