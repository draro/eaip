'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2, Users, FileText, TrendingUp, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import CreateOrganizationModal from '@/components/CreateOrganizationModal';
import EditOrganizationModal from '@/components/EditOrganizationModal';
import UserAssignmentModal from '@/components/UserAssignmentModal';
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
  userCount: number;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
  statistics?: {
    totalUsers: number;
    totalDocuments: number;
    activeUsers: number;
  };
}

interface Statistics {
  overview: {
    totalOrganizations: number;
    totalUsers: number;
    totalDocuments: number;
    activeUsers: number;
    activeOrganizations: number;
  };
  distributions: {
    usersByRole: Record<string, number>;
    documentsByStatus: Record<string, number>;
    subscriptionPlans: Record<string, number>;
  };
  recentActivity: Array<{
    _id: string;
    title: string;
    status: string;
    updatedAt: string;
    updatedBy: {
      name: string;
    };
    organization: {
      name: string;
    };
  }>;
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState<Organization | null>(null);

  // Check authentication and role
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/admin');
      return;
    }

    const user = session.user as any;
    if (user?.role !== 'super_admin') {
      router.push('/dashboard');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [orgsResponse, statsResponse] = await Promise.all([
        fetch('/api/organizations'),
        fetch('/api/statistics')
      ]);

      if (orgsResponse.ok) {
        const orgsData = await orgsResponse.json();
        setOrganizations(orgsData.data?.organizations || []);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStatistics(statsData.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const handleEditOrganization = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedOrganization(result.data);
        setShowEditModal(true);
      } else {
        console.error('Failed to fetch organization details');
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

  const handleViewOrganization = (organizationId: string) => {
    // For now, redirect to organization details page
    window.open(`/organization/${organizationId}`, '_blank');
  };

  const handleManageUsers = async (organizationId: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}`);
      if (response.ok) {
        const result = await response.json();
        setSelectedOrganization(result.data);
        setShowUserModal(true);
      } else {
        console.error('Failed to fetch organization details');
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.domain.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !statusFilter || org.status === statusFilter;
    const matchesPlan = !planFilter || org.subscription.plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Show loading while checking authentication
  if (status === 'loading' || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const user = session.user as any;
  if (user?.role !== 'super_admin') {
    return null;
  }

  return (
    <Layout user={{
      name: user.name || 'Super Admin',
      email: user.email || 'admin@eaip.system',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Super Admin Dashboard</h1>
              <p className="text-gray-600">Manage organizations and monitor system activity</p>
            </div>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </div>

          {/* Statistics Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Organizations</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.overview.totalOrganizations}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.overview.activeOrganizations} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.overview.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.overview.activeUsers} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Documents</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.overview.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    {statistics.distributions.documentsByStatus.published || 0} published
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enterprise Plans</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.distributions.subscriptionPlans.enterprise || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round((statistics.distributions.subscriptionPlans.enterprise || 0) / statistics.overview.totalOrganizations * 100)}% of total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+12%</div>
                  <p className="text-xs text-muted-foreground">vs last month</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Organizations List */}
          <Card>
            <CardHeader>
              <CardTitle>Organizations</CardTitle>
              <CardDescription>
                Manage and monitor all organizations in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter || "all"} onValueChange={(value) => setStatusFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={planFilter || "all"} onValueChange={(value) => setPlanFilter(value === "all" ? "" : value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plans</SelectItem>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Organizations Table */}
              <div className="space-y-4">
                {filteredOrganizations.map((org) => (
                  <div key={org._id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{org.name}</h3>
                          <Badge className={getStatusColor(org.status)}>
                            {org.status}
                          </Badge>
                          <Badge className={getPlanColor(org.subscription.plan)}>
                            {org.subscription.plan}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Domain:</span> {org.domain}
                          </div>
                          <div>
                            <span className="font-medium">Country:</span> {org.country}
                          </div>
                          <div>
                            <span className="font-medium">Users:</span> {org.userCount}/{org.subscription.maxUsers}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span> {new Date(org.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrganization(org._id)}
                        >
                          View Details
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManageUsers(org._id)}
                        >
                          Manage Users
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOrganization(org._id)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {filteredOrganizations.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No organizations found matching your filters.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {statistics?.recentActivity && statistics.recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest document updates across all organizations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statistics.recentActivity.map((activity) => (
                    <div key={activity._id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div>
                        <div className="font-medium">{activity.title || 'Untitled Activity'}</div>
                        <div className="text-sm text-gray-600">
                          by {activity.updatedBy?.name || 'Unknown User'} in {activity.organization?.name || 'Unknown Organization'}
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
        </div>
      </div>

      {/* Create Organization Modal */}
      <CreateOrganizationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrganizationCreated={fetchDashboardData}
      />

      {/* Edit Organization Modal */}
      <EditOrganizationModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
        onOrganizationUpdated={fetchDashboardData}
      />

      {/* User Assignment Modal */}
      <UserAssignmentModal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          setSelectedOrganization(null);
        }}
        organization={selectedOrganization}
        onUsersUpdated={fetchDashboardData}
      />
    </Layout>
  );
}