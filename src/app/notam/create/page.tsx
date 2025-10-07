'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Bell, ArrowLeft, Save, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

const NOTAM_CATEGORIES = {
  A: 'Availability of facilities and services',
  C: 'Construction or work affecting movement area',
  D: 'Danger areas and air traffic advisory service',
  E: 'Equipment and services',
  F: 'Facilities and services',
  G: 'General',
  H: 'Helicopter operations',
  I: 'Instrument approach procedures',
  K: 'Miscellaneous',
  L: 'Lighting and marking systems',
  M: 'Maintenance',
  N: 'Navigation aids and systems',
  O: 'Obstacles',
  P: 'Personnel and training',
  R: 'Restricted areas and air traffic advisory service',
  S: 'Security',
  T: 'Temporary restrictions',
  U: 'Unserviceability',
  V: 'VFR flight restrictions',
  W: 'Weather information',
  X: 'Other',
};

export default function CreateNOTAMPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [organizations, setOrganizations] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    number: '',
    series: 'A',
    type: 'N' as 'N' | 'R' | 'C',
    scope: 'A',
    purpose: 'BO',
    location: '',
    category: 'A',
    traffic: 'IV',
    effectiveFrom: '',
    effectiveTo: '',
    schedule: '',
    text: '',
    lower: '',
    upper: '',
    coordinates: '',
    radius: '',
    organizationId: '',
  });

  useEffect(() => {
    // Fetch organizations for super admin
    if (session?.user && (session.user as any).role === 'super_admin') {
      fetchOrganizations();
    }
  }, [session]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const result = await response.json();
      if (result.success) {
        setOrganizations(result.data?.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await fetch('/api/notam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/notam/${data.notam._id}`);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create NOTAM');
      }
    } catch (error) {
      setError('An error occurred while creating the NOTAM');
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (status === 'loading') {
    return (
      <Layout user={session?.user as any}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin?callbackUrl=/notam/create');
    return null;
  }

  const user = session?.user as any;

  return (
    <Layout user={user}>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-6">
            <Link href="/notam">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to NOTAMs
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Bell className="h-8 w-8 mr-3 text-blue-600" />
              Create New NOTAM
            </h1>
            <p className="text-gray-600 mt-2">
              Create a new Notice to Airmen with ICAO Annex 15 compliance
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>NOTAM Identification</CardTitle>
                <CardDescription>Basic NOTAM identification and classification</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="series">Series *</Label>
                    <select
                      id="series"
                      value={formData.series}
                      onChange={(e) => handleChange('series', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="A">A Series</option>
                      <option value="B">B Series</option>
                      <option value="C">C Series</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="number">Number *</Label>
                    <Input
                      id="number"
                      type="number"
                      value={formData.number}
                      onChange={(e) => handleChange('number', e.target.value)}
                      placeholder="e.g., 1234"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type *</Label>
                    <select
                      id="type"
                      value={formData.type}
                      onChange={(e) => handleChange('type', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="N">N - New</option>
                      <option value="R">R - Replace</option>
                      <option value="C">C - Cancel</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="scope">Scope *</Label>
                    <select
                      id="scope"
                      value={formData.scope}
                      onChange={(e) => handleChange('scope', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="A">A - Aerodrome</option>
                      <option value="E">E - En-route</option>
                      <option value="W">W - Navigation warning</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="traffic">Traffic *</Label>
                    <select
                      id="traffic"
                      value={formData.traffic}
                      onChange={(e) => handleChange('traffic', e.target.value)}
                      className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                      required
                    >
                      <option value="IV">IV - International & Domestic</option>
                      <option value="I">I - International only</option>
                      <option value="V">V - Domestic only</option>
                      <option value="K">K - Checklist</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="purpose">Purpose Code *</Label>
                    <Input
                      id="purpose"
                      value={formData.purpose}
                      onChange={(e) => handleChange('purpose', e.target.value.toUpperCase())}
                      placeholder="e.g., BO"
                      maxLength={2}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2"
                    required
                  >
                    {Object.entries(NOTAM_CATEGORIES).map(([code, desc]) => (
                      <option key={code} value={code}>
                        {code} - {desc}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Location & Validity</CardTitle>
                <CardDescription>Geographic location and effective dates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {(session?.user as any)?.role === 'super_admin' && (
                  <div>
                    <Label htmlFor="organizationId">Organization *</Label>
                    <select
                      id="organizationId"
                      value={formData.organizationId}
                      onChange={(e) => handleChange('organizationId', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    >
                      <option value="">Select organization</option>
                      {organizations.map((org) => (
                        <option key={org._id} value={org._id}>
                          {org.name} ({org.domain})
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the organization this NOTAM belongs to
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">ICAO Location Code *</Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value.toUpperCase())}
                      placeholder="e.g., KJFK"
                      maxLength={4}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="coordinates">Coordinates</Label>
                    <Input
                      id="coordinates"
                      value={formData.coordinates}
                      onChange={(e) => handleChange('coordinates', e.target.value)}
                      placeholder="e.g., 404745N0735946W"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lower">Lower Limit</Label>
                    <Input
                      id="lower"
                      value={formData.lower}
                      onChange={(e) => handleChange('lower', e.target.value)}
                      placeholder="e.g., SFC or FL100"
                    />
                  </div>
                  <div>
                    <Label htmlFor="upper">Upper Limit</Label>
                    <Input
                      id="upper"
                      value={formData.upper}
                      onChange={(e) => handleChange('upper', e.target.value)}
                      placeholder="e.g., FL200 or UNL"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="radius">Radius (if applicable)</Label>
                  <Input
                    id="radius"
                    value={formData.radius}
                    onChange={(e) => handleChange('radius', e.target.value)}
                    placeholder="e.g., 5NM"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="effectiveFrom">Effective From *</Label>
                    <Input
                      id="effectiveFrom"
                      type="datetime-local"
                      value={formData.effectiveFrom}
                      onChange={(e) => handleChange('effectiveFrom', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="effectiveTo">Effective To</Label>
                    <Input
                      id="effectiveTo"
                      type="datetime-local"
                      value={formData.effectiveTo}
                      onChange={(e) => handleChange('effectiveTo', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="schedule">Schedule (optional)</Label>
                  <Input
                    id="schedule"
                    value={formData.schedule}
                    onChange={(e) => handleChange('schedule', e.target.value)}
                    placeholder="e.g., 0800-1800 MON-FRI"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>NOTAM Text</CardTitle>
                <CardDescription>Detailed description of the NOTAM</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="text"
                  value={formData.text}
                  onChange={(e) => handleChange('text', e.target.value)}
                  placeholder="Enter the NOTAM text..."
                  rows={8}
                  required
                  className="w-full"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Enter the NOTAM text in ICAO format. Be clear and concise.
                </p>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
              <Link href="/notam">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                <Save className="h-4 w-4 mr-2" />
                {creating ? 'Creating...' : 'Create NOTAM'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}