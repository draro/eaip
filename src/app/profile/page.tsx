'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User, Mail, Building2, Shield, Save, Eye, EyeOff } from 'lucide-react';
import Layout from '@/components/Layout';

interface UserProfile {
  _id: string;
  name: string;
  email: string;
  role: string;
  organization?: {
    name: string;
    domain: string;
  };
  createdAt: string;
  lastLoginAt?: string;
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPasswordForm, setShowPasswordForm] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check authentication
  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/signin?callbackUrl=/profile');
      return;
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users/profile');
      if (response.ok) {
        const result = await response.json();
        setProfile(result.data);
        setName(result.data.name);
      } else {
        setError('Failed to load profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const result = await response.json();

      if (result.success) {
        setProfile(prev => prev ? { ...prev, name } : null);
        setSuccess('Profile updated successfully');
        // Update session
        await update({ name });
      } else {
        setError(result.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setShowPasswordForm(false);
      } else {
        setError(result.error || 'Failed to change password');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setError('Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <Layout user={{
        name: session.user.name || 'User',
        email: session.user.email || 'user@example.com',
        role: (session.user as any).role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
        organization: (session.user as any).organization
      }}>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  const user = session.user as any;

  return (
    <Layout user={{
      name: user.name || 'User',
      email: user.email || 'user@example.com',
      role: user.role as 'super_admin' | 'org_admin' | 'editor' | 'viewer',
      organization: user.organization
    }}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your account settings and preferences</p>
            </div>
          </div>

          {/* Alerts */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Info Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="mt-1"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile?.email || ''}
                      disabled
                      className="mt-1 bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed. Contact your administrator.
                    </p>
                  </div>

                  <div>
                    <Label>Role</Label>
                    <div className="mt-1">
                      <Badge className={getRoleColor(profile?.role || '')}>
                        <Shield className="w-3 h-3 mr-1" />
                        {profile?.role?.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Role is assigned by your administrator.
                    </p>
                  </div>

                  {profile?.organization && (
                    <div>
                      <Label>Organization</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-gray-500" />
                          <div>
                            <div className="font-medium">{profile.organization.name}</div>
                            <div className="text-sm text-gray-500">{profile.organization.domain}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Account Info Sidebar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Member Since</Label>
                  <p className="text-sm text-gray-600">
                    {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm text-gray-600">
                    {profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleDateString() : 'Never'}
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Account ID</Label>
                  <p className="text-xs text-gray-500 font-mono break-all">{profile?._id}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Password Change Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your password and security preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showPasswordForm ? (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Password</Label>
                    <p className="text-sm text-gray-600">
                      Last changed: Unknown
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowPasswordForm(true)}
                  >
                    Change Password
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword">Current Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                    <div className="relative mt-1">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-gray-400" />
                        ) : (
                          <Eye className="h-4 w-4 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowPasswordForm(false);
                        setCurrentPassword('');
                        setNewPassword('');
                        setConfirmPassword('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      {saving ? 'Changing...' : 'Change Password'}
                    </Button>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}