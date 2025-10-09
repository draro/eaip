'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell, ArrowLeft, Edit, Trash2, X, CheckCircle,
  Clock, MapPin, Calendar, AlertTriangle, FileText
} from 'lucide-react';
import Link from 'next/link';

interface NOTAM {
  _id: string;
  id: string;
  series: string;
  number: number;
  year: number;
  type: 'N' | 'R' | 'C';
  scope: string;
  purpose: string;
  location: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  schedule: string | null;
  text: string;
  category: string;
  traffic: string;
  lower: string | null;
  upper: string | null;
  coordinates: string | null;
  radius: string | null;
  status: 'active' | 'cancelled' | 'expired';
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
  };
  lastModified: string;
}

export default function NOTAMDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [notam, setNotam] = useState<NOTAM | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/notam');
      return;
    }
    if (status === 'authenticated' && params.id) {
      fetchNOTAM();
    }
  }, [status, params.id, router]);

  const fetchNOTAM = async () => {
    try {
      const response = await fetch(`/api/notam/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setNotam(data.notam);
      } else {
        router.push('/notam');
      }
    } catch (error) {
      console.error('Error fetching NOTAM:', error);
      router.push('/notam');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this NOTAM?')) {
      return;
    }

    setCancelling(true);
    try {
      const response = await fetch(`/api/notam/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (response.ok) {
        fetchNOTAM();
      } else {
        alert('Failed to cancel NOTAM');
      }
    } catch (error) {
      console.error('Error cancelling NOTAM:', error);
      alert('An error occurred while cancelling the NOTAM');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Cancelled</Badge>;
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

  if (status === 'loading' || loading) {
    return (
      <Layout user={session?.user as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!notam) {
    return null;
  }

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/notam">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to NOTAMs
              </Button>
            </Link>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  <Bell className="h-8 w-8 text-blue-600" />
                  {notam.id}
                  {getStatusBadge(notam.status)}
                  {getTypeBadge(notam.type)}
                </h1>
                <p className="text-gray-600 mt-2">NOTAM Details</p>
              </div>
              {notam.status === 'active' && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleCancel}
                    disabled={cancelling}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-2" />
                    {cancelling ? 'Cancelling...' : 'Cancel NOTAM'}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    NOTAM Text
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700 bg-gray-50 p-4 rounded-md">
                    {notam.text}
                  </pre>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Classification</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Series</p>
                      <p className="text-lg font-semibold text-gray-900">{notam.series}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Category</p>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 text-sm">
                        Category {notam.category}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Scope</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {notam.scope === 'A' && 'Aerodrome'}
                        {notam.scope === 'E' && 'En-route'}
                        {notam.scope === 'W' && 'Navigation Warning'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Traffic</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {notam.traffic === 'IV' && 'International & Domestic'}
                        {notam.traffic === 'I' && 'International'}
                        {notam.traffic === 'V' && 'Domestic'}
                        {notam.traffic === 'K' && 'Checklist'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Purpose</p>
                      <p className="text-lg font-semibold text-gray-900">{notam.purpose}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Metadata */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    Location
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">ICAO Code</p>
                    <p className="text-xl font-bold text-gray-900">{notam.location}</p>
                  </div>
                  {notam.coordinates && (
                    <div>
                      <p className="text-sm text-gray-600">Coordinates</p>
                      <p className="text-sm font-mono text-gray-900">{notam.coordinates}</p>
                    </div>
                  )}
                  {notam.radius && (
                    <div>
                      <p className="text-sm text-gray-600">Radius</p>
                      <p className="text-sm text-gray-900">{notam.radius}</p>
                    </div>
                  )}
                  {(notam.lower || notam.upper) && (
                    <div>
                      <p className="text-sm text-gray-600">Altitude</p>
                      <p className="text-sm text-gray-900">
                        {notam.lower || 'SFC'} - {notam.upper || 'UNL'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Validity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Effective From</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {new Date(notam.effectiveFrom).toLocaleString()}
                    </p>
                  </div>
                  {notam.effectiveTo && (
                    <div>
                      <p className="text-sm text-gray-600">Effective To</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {new Date(notam.effectiveTo).toLocaleString()}
                      </p>
                    </div>
                  )}
                  {notam.schedule && (
                    <div>
                      <p className="text-sm text-gray-600">Schedule</p>
                      <p className="text-sm text-gray-900">{notam.schedule}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Metadata</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Created By</p>
                    <p className="text-sm font-semibold text-gray-900">{notam.createdBy.name}</p>
                    <p className="text-xs text-gray-500">{notam.createdBy.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created At</p>
                    <p className="text-sm text-gray-900">
                      {new Date(notam.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Last Modified</p>
                    <p className="text-sm text-gray-900">
                      {new Date(notam.lastModified).toLocaleString()}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}