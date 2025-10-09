'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building2,
  Users,
  FileText,
  Settings,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  BarChart3
} from 'lucide-react';
import Layout from '@/components/Layout';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  country: string;
  icaoCode?: string;
  status: 'active' | 'suspended' | 'trial';
  contact: {
    email: string;
    phone: string;
    address: string;
  };
  settings: {
    publicUrl: string;
    timezone: string;
    language: string;
  };
  subscription: {
    plan: 'basic' | 'professional' | 'enterprise';
    maxUsers: number;
    maxDocuments: number;
  };
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  statistics?: {
    totalUsers: number;
    totalDocuments: number;
    activeUsers: number;
    recentActivity: Array<{
      _id: string;
      title: string;
      status: string;
      updatedAt: string;
      updatedBy: {
        name: string;
      };
    }>;
  };
}

export default function OrganizationDetailsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id as string;

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    // Check if user has permission to view this organization
    const user = session.user as any;
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/organizations/${organizationId}`);

      if (response.ok) {
        const result = await response.json();
        setOrganization(result.data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load organization');
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
      setError('Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'professional': return 'bg-blue-100 text-blue-800';
      case 'basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Show loading while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = session.user as any;

  if (loading) {
    return (
      <Layout user={{
        name: user.name || 'Super Admin',
        email: user.email || 'admin@eaip.system',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout user={{
        name: user.name || 'Super Admin',
        email: user.email || 'admin@eaip.system',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
            <div className="mt-6">
              <Button onClick={() => router.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!organization) {
    return (
      <Layout user={{
        name: user.name || 'Super Admin',
        email: user.email || 'admin@eaip.system',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-8">
              <p className="text-gray-500">Organization not found</p>
              <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={{
      name: user.name || 'Super Admin',
      email: user.email || 'admin@eaip.system',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
                <p className="text-gray-600">Organization Details</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(organization.status)}>
                {organization.status}
              </Badge>
              <Badge className={getPlanColor(organization.subscription.plan)}>
                {organization.subscription.plan}
              </Badge>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Organization Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Domain</label>
                  <p className="font-medium">{organization.domain}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Country</label>
                  <p className="font-medium">{organization.country}</p>
                </div>
                {organization.icaoCode && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">ICAO Code</label>
                    <p className="font-medium">{organization.icaoCode}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-500">Created</label>
                  <p className="font-medium">{new Date(organization.createdAt).toLocaleDateString()}</p>
                </div>
                {organization.createdBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created By</label>
                    <p className="font-medium">{organization.createdBy.name} ({organization.createdBy.email})</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span>{organization.contact.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span>{organization.contact.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 mt-1" />
                  <span>{organization.contact.address}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Subscription & Settings */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Plan</label>
                  <p className="font-medium capitalize">{organization.subscription.plan}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Max Users</label>
                  <p className="font-medium">{organization.subscription.maxUsers}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Max Documents</label>
                  <p className="font-medium">{organization.subscription.maxDocuments}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Public URL</label>
                  <p className="font-medium">{organization.settings.publicUrl}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timezone</label>
                  <p className="font-medium">{organization.settings.timezone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Language</label>
                  <p className="font-medium">{organization.settings.language}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          {organization.statistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.statistics.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {organization.statistics.activeUsers} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{organization.statistics.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">total documents</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Usage</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round((organization.statistics.totalUsers / organization.subscription.maxUsers) * 100)}%
                  </div>
                  <p className="text-xs text-muted-foreground">user capacity</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Activity */}
          {organization.statistics?.recentActivity && organization.statistics.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest document updates in this organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {organization.statistics.recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{activity.title || 'Untitled Document'}</div>
                        <div className="text-sm text-gray-600">
                          by {activity.updatedBy?.name || 'Unknown User'}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={getStatusColor(activity.status || 'unknown')}>
                          {activity.status || 'unknown'}
                        </Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          {activity.updatedAt ? new Date(activity.updatedAt).toLocaleDateString() : 'Unknown date'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
            <Button onClick={() => router.push('/admin')}>
              Back to Admin Dashboard
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}