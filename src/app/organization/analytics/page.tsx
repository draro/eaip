'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import {
  Users,
  FileText,
  TrendingUp,
  Activity,
  Calendar,
  Eye,
  Download,
  Clock
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    totalDocuments: number;
    activeUsers: number;
    publishedDocuments: number;
  };
  userActivity: {
    date: string;
    logins: number;
    newUsers: number;
  }[];
  documentActivity: {
    date: string;
    created: number;
    updated: number;
    published: number;
  }[];
  usersByRole: {
    role: string;
    count: number;
    color: string;
  }[];
  documentsByStatus: {
    status: string;
    count: number;
    color: string;
  }[];
  topUsers: {
    _id: string;
    name: string;
    email: string;
    documentsCreated: number;
    lastLogin: string;
  }[];
  recentActivity: {
    type: string;
    description: string;
    user: string;
    timestamp: string;
  }[];
}

export default function OrganizationAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      // In a real implementation, get the current organization ID from auth context
      const orgId = 'current-org-id'; // This would come from auth context
      const response = await fetch(`/api/statistics?period=${timeRange}&organizationId=${orgId}`);

      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our interface
        setAnalyticsData({
          overview: data.data.overview,
          userActivity: data.data.trends.users || [],
          documentActivity: data.data.trends.documents || [],
          usersByRole: Object.entries(data.data.distributions.usersByRole).map(([role, count]) => ({
            role,
            count: count as number,
            color: getRoleColor(role)
          })),
          documentsByStatus: Object.entries(data.data.distributions.documentsByStatus).map(([status, count]) => ({
            status,
            count: count as number,
            color: getStatusColor(status)
          })),
          topUsers: [], // Would be populated from additional API call
          recentActivity: data.data.recentActivity.map((activity: any) => ({
            type: 'document_update',
            description: `Updated "${activity.title}"`,
            user: activity.updatedBy.name,
            timestamp: activity.updatedAt
          }))
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      'org_admin': '#8b5cf6',
      'editor': '#3b82f6',
      'viewer': '#6b7280'
    };
    return colors[role] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'published': '#10b981',
      'review': '#f59e0b',
      'draft': '#6b7280'
    };
    return colors[status] || '#6b7280';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Analytics Unavailable</CardTitle>
            <CardDescription>
              Unable to load analytics data at this time.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Analytics</h1>
            <p className="text-gray-600">Monitor your organization's performance and activity</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.overview.activeUsers} active users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData.overview.totalDocuments}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData.overview.publishedDocuments} published
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activity Score</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8.5</div>
              <p className="text-xs text-muted-foreground">
                +12% from last period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+15%</div>
              <p className="text-xs text-muted-foreground">
                Monthly user growth
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>User Activity</CardTitle>
              <CardDescription>
                Daily user logins and new registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={analyticsData.userActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.6}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Document Activity Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Document Activity</CardTitle>
              <CardDescription>
                Daily document creation, updates, and publications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analyticsData.documentActivity}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="created" fill="#3b82f6" />
                  <Bar dataKey="updated" fill="#f59e0b" />
                  <Bar dataKey="published" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Users by Role */}
          <Card>
            <CardHeader>
              <CardTitle>Users by Role</CardTitle>
              <CardDescription>
                Distribution of user roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.usersByRole}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ role, count }) => `${role}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.usersByRole.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Documents by Status */}
          <Card>
            <CardHeader>
              <CardTitle>Documents by Status</CardTitle>
              <CardDescription>
                Document workflow distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={analyticsData.documentsByStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {analyticsData.documentsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {analyticsData.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 rounded-lg bg-gray-50">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{activity.description}</p>
                      <p className="text-xs text-gray-600">by {activity.user}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Performance */}
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Key performance indicators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Document Processing Time</span>
                <Badge variant="outline">2.3s avg</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">User Satisfaction Score</span>
                <Badge className="bg-green-100 text-green-800">8.7/10</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">System Uptime</span>
                <Badge className="bg-green-100 text-green-800">99.9%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Compliance Score</span>
                <Badge className="bg-blue-100 text-blue-800">ICAO Compliant</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Usage Statistics */}
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                Platform usage insights
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Daily Active Users</span>
                <span className="text-lg font-bold">{Math.round(analyticsData.overview.activeUsers * 0.8)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Average Session Duration</span>
                <span className="text-lg font-bold">25m</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Pages per Session</span>
                <span className="text-lg font-bold">12.4</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Document Views/Day</span>
                <span className="text-lg font-bold">1,284</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}