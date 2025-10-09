'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Plus, Bell, Search, Filter, Calendar, MapPin,
  AlertTriangle, CheckCircle, Clock, XCircle
} from 'lucide-react';
import Link from 'next/link';

interface NOTAM {
  _id: string;
  id: string;
  series: string;
  number: number;
  year: number;
  type: 'N' | 'R' | 'C';
  category: string;
  location: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  text: string;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function NOTAMPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notams, setNotams] = useState<NOTAM[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/notam');
      return;
    }
    if (status === 'authenticated') {
      fetchNOTAMs();
    }
  }, [status, router]);

  const fetchNOTAMs = async () => {
    try {
      const response = await fetch('/api/notam');
      if (response.ok) {
        const data = await response.json();
        setNotams(data.notams || []);
      }
    } catch (error) {
      console.error('Error fetching NOTAMs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>;
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'N':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">New</Badge>;
      case 'R':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Replace</Badge>;
      case 'C':
        return <Badge variant="outline" className="bg-red-50 text-red-700">Cancel</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const filteredNOTAMs = notams.filter(notam => {
    const matchesSearch = searchTerm === '' ||
      notam.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notam.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notam.text.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || notam.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || notam.category === filterCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (status === 'loading' || loading) {
    return (
      <Layout user={session?.user as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <Bell className="h-8 w-8 mr-3 text-blue-600" />
                  NOTAM Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage Notices to Airmen (NOTAM) with ICAO Annex 15 compliance
                </p>
              </div>
              <Link href="/notam/create">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="h-5 w-5 mr-2" />
                  Create NOTAM
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total NOTAMs</p>
                      <p className="text-2xl font-bold text-gray-900">{notams.length}</p>
                    </div>
                    <Bell className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active</p>
                      <p className="text-2xl font-bold text-green-600">
                        {notams.filter(n => n.status === 'active').length}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Expired</p>
                      <p className="text-2xl font-bold text-gray-600">
                        {notams.filter(n => n.status === 'expired').length}
                      </p>
                    </div>
                    <Clock className="h-8 w-8 text-gray-600" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Cancelled</p>
                      <p className="text-2xl font-bold text-red-600">
                        {notams.filter(n => n.status === 'cancelled').length}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search NOTAMs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="expired">Expired</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="all">All Categories</option>
                  <option value="A">A - Availability</option>
                  <option value="C">C - Construction</option>
                  <option value="D">D - Danger areas</option>
                  <option value="E">E - Equipment</option>
                  <option value="L">L - Lighting</option>
                  <option value="N">N - Navigation aids</option>
                  <option value="R">R - Restricted areas</option>
                  <option value="S">S - Security</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* NOTAM List */}
          {filteredNOTAMs.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No NOTAMs found</h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all' || filterCategory !== 'all'
                    ? 'Try adjusting your filters'
                    : 'Get started by creating your first NOTAM'}
                </p>
                {!searchTerm && filterStatus === 'all' && filterCategory === 'all' && (
                  <Link href="/notam/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create NOTAM
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredNOTAMs.map((notam) => (
                <Card key={notam._id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {notam.id}
                          </CardTitle>
                          {getStatusBadge(notam.status)}
                          {getTypeBadge(notam.type)}
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            Category {notam.category}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {notam.location}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(notam.effectiveFrom).toLocaleString()}
                          </span>
                          {notam.effectiveTo && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              Until: {new Date(notam.effectiveTo).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Link href={`/notam/${notam._id}`}>
                        <Button variant="outline" size="sm">View Details</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 whitespace-pre-wrap">{notam.text}</p>
                    <div className="mt-4 pt-4 border-t border-gray-200 text-sm text-gray-600">
                      Created by {notam.createdBy.name} on {new Date(notam.createdAt).toLocaleDateString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}