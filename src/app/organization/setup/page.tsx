'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Layout from '@/components/Layout';
import DomainConfiguration from '@/components/DomainConfiguration';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Building2,
  Globe,
  Palette,
  Users,
  Settings,
  Upload,
  Eye,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  country: string;
  icaoCode?: string;
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logoUrl?: string;
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    website?: string;
  };
  settings: {
    publicUrl: string;
    timezone: string;
    language: string;
    enablePublicAccess: boolean;
    airacStartDate: Date;
  };
  subscription: {
    plan: string;
    maxUsers: number;
    maxDocuments: number;
    features: string[];
  };
  status: string;
}

export default function OrganizationSetup() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    country: '',
    icaoCode: '',
    contact: {
      email: '',
      phone: '',
      address: '',
      website: ''
    },
    branding: {
      primaryColor: '#1f2937',
      secondaryColor: '#3b82f6',
      logoUrl: ''
    },
    settings: {
      publicUrl: '',
      timezone: 'UTC',
      language: 'en',
      enablePublicAccess: true,
      airacStartDate: ''
    }
  });

  useEffect(() => {
    if (session) {
      fetchOrganization();
    }
  }, [session]);

  const fetchOrganization = async () => {
    try {
      setLoading(true);

      // Get organization ID from session - try different possible paths
      const user = session?.user as any;
      const orgId = user?.organizationId || user?.organization?.id || user?.organization?._id;

      if (!orgId) {
        console.error('No organization found in session', user);

        // If user is super_admin, try to get first organization
        if (user?.role === 'super_admin') {
          const orgsResponse = await fetch('/api/organizations');
          if (orgsResponse.ok) {
            const orgsData = await orgsResponse.json();
            if (orgsData.success && orgsData.data.organizations.length > 0) {
              const firstOrg = orgsData.data.organizations[0];
              setOrganization(firstOrg);
              setFormData({
                name: firstOrg.name,
                domain: firstOrg.domain,
                country: firstOrg.country,
                icaoCode: firstOrg.icaoCode || '',
                contact: firstOrg.contact,
                branding: firstOrg.branding,
                settings: {
                  ...firstOrg.settings,
                  airacStartDate: new Date(firstOrg.settings.airacStartDate).toISOString().split('T')[0]
                }
              });
              setLogoPreview(firstOrg.branding?.logoUrl || '');
              setLoading(false);
              return;
            }
          }
        }

        setLoading(false);
        return;
      }

      const response = await fetch(`/api/organizations/${orgId}`);

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.data);
        setFormData({
          name: data.data.name,
          domain: data.data.domain,
          country: data.data.country,
          icaoCode: data.data.icaoCode || '',
          contact: data.data.contact,
          branding: data.data.branding,
          settings: {
            ...data.data.settings,
            airacStartDate: new Date(data.data.settings.airacStartDate).toISOString().split('T')[0]
          }
        });
        setLogoPreview(data.data.branding.logoUrl || '');
      }
    } catch (error) {
      console.error('Error fetching organization:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section as keyof typeof prev] as any),
        [field]: value
      }
    }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveChanges = async () => {
    console.log('Save changes clicked');
    try {
      setSaving(true);

      // Upload logo if a new file was selected
      let logoUrl = formData.branding.logoUrl;
      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append('logo', logoFile);

        const uploadResponse = await fetch('/api/upload/logo', {
          method: 'POST',
          body: logoFormData
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          logoUrl = uploadData.url;
        }
      }

      // Update organization
      const updateData = {
        ...formData,
        branding: {
          ...formData.branding,
          logoUrl
        },
        settings: {
          ...formData.settings,
          airacStartDate: new Date(formData.settings.airacStartDate)
        }
      };

      // Get organization ID
      const user = session?.user as any;
      const orgId = organization?._id || user?.organizationId || user?.organization?.id || user?.organization?._id;

      console.log('Organization ID for update:', orgId);
      console.log('Update data:', updateData);

      if (!orgId) {
        console.error('No organization ID available for update');
        alert('No organization ID found. Please reload the page and try again.');
        return;
      }

      const response = await fetch(`/api/organizations/${orgId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        await fetchOrganization(); // Refresh data
        alert('Organization settings saved successfully!');
      } else {
        const errorData = await response.json();
        console.error('Server error:', errorData);
        alert(`Failed to save changes: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      alert(`Error saving changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  const timezones = [
    'UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London',
    'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo', 'Asia/Shanghai',
    'Australia/Sydney', 'Pacific/Auckland'
  ];

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' },
    { value: 'de', label: 'German' },
    { value: 'it', label: 'Italian' },
    { value: 'pt', label: 'Portuguese' }
  ];

  // Check authentication
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!session) {
    router.push('/auth/signin?callbackUrl=/organization/setup');
    return null;
  }

  const user = session.user as any;

  // Check permissions
  if (!['super_admin', 'org_admin'].includes(user.role)) {
    return (
      <Layout user={{
        name: user.name || 'User',
        email: user.email || '',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="min-h-screen bg-gray-50 p-6">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">
                  You don't have permission to access organization settings.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout user={{
        name: user.name || 'User',
        email: user.email || '',
        role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: user.organization
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || '',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Organization Setup</h1>
            <p className="text-gray-600">Configure your organization settings and branding</p>
          </div>
          <div className="flex items-center gap-3">
            {organization?.status && (
              <Badge className={
                organization.status === 'active' ? 'bg-green-100 text-green-800' :
                organization.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                'bg-red-100 text-red-800'
              }>
                {organization.status}
              </Badge>
            )}
            <Button
              onClick={saveChanges}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        {/* Subscription Info */}
        {organization && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Subscription Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Plan</Label>
                  <Badge className="mt-1">{organization.subscription.plan}</Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Users</Label>
                  <p className="text-lg font-semibold">{organization.subscription.maxUsers}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Max Documents</Label>
                  <p className="text-lg font-semibold">{organization.subscription.maxDocuments}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Features</Label>
                  <p className="text-sm text-gray-600">{organization.subscription.features.length} included</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Configuration Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-1 text-xs">
              <Building2 className="w-3 h-3" />
              General
            </TabsTrigger>
            <TabsTrigger value="branding" className="flex items-center gap-1 text-xs">
              <Palette className="w-3 h-3" />
              Branding
            </TabsTrigger>
            <TabsTrigger value="domain" className="flex items-center gap-1 text-xs">
              <Globe className="w-3 h-3" />
              Domain
            </TabsTrigger>
            <TabsTrigger value="public" className="flex items-center gap-1 text-xs">
              <Eye className="w-3 h-3" />
              Public
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-1 text-xs">
              <Settings className="w-3 h-3" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Information</CardTitle>
                <CardDescription>
                  Basic information about your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Organization Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Your Organization Name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      value={formData.domain}
                      onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                      placeholder="yourdomain.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="country">Country Code</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value.toUpperCase() }))}
                      placeholder="US, GB, FR, etc."
                      maxLength={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="icaoCode">ICAO Code (Optional)</Label>
                    <Input
                      id="icaoCode"
                      value={formData.icaoCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, icaoCode: e.target.value.toUpperCase() }))}
                      placeholder="ICAO"
                      maxLength={4}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contact Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.contact.email}
                        onChange={(e) => handleInputChange('contact', 'email', e.target.value)}
                        placeholder="contact@yourdomain.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.contact.phone}
                        onChange={(e) => handleInputChange('contact', 'phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={formData.contact.address}
                        onChange={(e) => handleInputChange('contact', 'address', e.target.value)}
                        placeholder="Your organization address"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="website">Website (Optional)</Label>
                      <Input
                        id="website"
                        value={formData.contact.website}
                        onChange={(e) => handleInputChange('contact', 'website', e.target.value)}
                        placeholder="https://yourdomain.com"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="branding" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Branding</CardTitle>
                <CardDescription>
                  Customize your organization's visual identity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo Upload */}
                <div>
                  <Label>Organization Logo</Label>
                  <div className="mt-2 flex items-start gap-4">
                    <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo preview" className="w-full h-full object-contain rounded-lg" />
                      ) : (
                        <div className="text-center">
                          <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">No logo</p>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="mb-2"
                      />
                      <p className="text-sm text-gray-600">
                        Upload a logo for your organization. Recommended size: 200x200px, max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Color Settings */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={formData.branding.primaryColor}
                        onChange={(e) => handleInputChange('branding', 'primaryColor', e.target.value)}
                        className="w-12 h-10 border rounded"
                      />
                      <Input
                        value={formData.branding.primaryColor}
                        onChange={(e) => handleInputChange('branding', 'primaryColor', e.target.value)}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex items-center gap-2 mt-2">
                      <input
                        type="color"
                        value={formData.branding.secondaryColor}
                        onChange={(e) => handleInputChange('branding', 'secondaryColor', e.target.value)}
                        className="w-12 h-10 border rounded"
                      />
                      <Input
                        value={formData.branding.secondaryColor}
                        onChange={(e) => handleInputChange('branding', 'secondaryColor', e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>

                {/* Preview */}
                <div>
                  <Label>Brand Preview</Label>
                  <div
                    className="mt-2 p-6 rounded-lg border"
                    style={{
                      backgroundColor: formData.branding.primaryColor,
                      color: 'white'
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {logoPreview && (
                        <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain bg-white rounded p-1" />
                      )}
                      <h3 className="text-xl font-bold">{formData.name || 'Your Organization'}</h3>
                    </div>
                    <Button
                      style={{ backgroundColor: formData.branding.secondaryColor }}
                      className="text-white"
                    >
                      Sample Button
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="public" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Public eAIP Access</CardTitle>
                <CardDescription>
                  Configure public access to your electronic AIP
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="publicUrl">Public eAIP URL</Label>
                  <Input
                    id="publicUrl"
                    value={formData.settings.publicUrl}
                    onChange={(e) => handleInputChange('settings', 'publicUrl', e.target.value)}
                    placeholder="eaip.yourdomain.com"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    This will be the public URL where your eAIP is accessible
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Public Access</Label>
                    <p className="text-sm text-gray-600">
                      Allow public access to your published eAIP documents
                    </p>
                  </div>
                  <Switch
                    checked={formData.settings.enablePublicAccess}
                    onCheckedChange={(checked) => handleInputChange('settings', 'enablePublicAccess', checked)}
                  />
                </div>

                {formData.settings.enablePublicAccess && formData.settings.publicUrl && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-blue-900">Public Access Enabled</h4>
                        <p className="text-sm text-blue-700 mb-2">
                          Your eAIP will be accessible at:
                        </p>
                        <code className="bg-blue-100 px-2 py-1 rounded text-sm">
                          https://{formData.settings.publicUrl}
                        </code>
                        <p className="text-xs text-blue-600 mt-2">
                          Only published documents will be visible to the public
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
                <CardDescription>
                  Configure operational settings for your organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={formData.settings.timezone}
                      onValueChange={(value) => handleInputChange('settings', 'timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map(tz => (
                          <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="language">Default Language</Label>
                    <Select
                      value={formData.settings.language}
                      onValueChange={(value) => handleInputChange('settings', 'language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="airacStartDate">AIRAC Cycle Start Date</Label>
                    <Input
                      id="airacStartDate"
                      type="date"
                      value={formData.settings.airacStartDate}
                      onChange={(e) => handleInputChange('settings', 'airacStartDate', e.target.value)}
                    />
                    <p className="text-sm text-gray-600 mt-1">
                      Set the base date for AIRAC cycle calculations
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Domain Configuration Tab */}
          <TabsContent value="domain" className="space-y-6">
            <DomainConfiguration
              organizationDomain={organization?.domain}
              onDomainUpdate={(domain) => {
                setFormData(prev => ({ ...prev, domain }));
                saveChanges();
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
      </div>
    </Layout>
  );
}