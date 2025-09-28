'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { ICompanySettings, IRemoteConnection } from '@/types';
import { Plus, Trash2, TestTube, Save, Building, Palette, Cloud } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function SettingsPage() {
  const [companySettings, setCompanySettings] = useState<ICompanySettings>({
    domain: '',
    name: '',
    authority: '',
    contact: {
      email: '',
      phone: '',
      address: '',
    },
    branding: {
      colors: {
        primary: '#1f2937',
        secondary: '#3b82f6',
      },
    },
    remoteConnections: [],
    defaultSettings: {
      language: 'en',
      timezone: 'UTC',
      airacStartDate: new Date(),
    },
  });

  const [preferences, setPreferences] = useState({
    theme: 'light' as 'light' | 'dark' | 'auto',
    language: 'en',
    notifications: {
      email: true,
      browser: true,
      slack: false,
    },
    editor: {
      autoSave: true,
      spellCheck: true,
      wordWrap: true,
    },
  });

  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/users/settings');
      const data = await response.json();

      if (data.success) {
        if (data.data.companySettings) {
          setCompanySettings(data.data.companySettings);
        }
        if (data.data.preferences) {
          setPreferences(data.data.preferences);
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companySettings,
          preferences,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Settings saved successfully!');
      } else {
        alert('Failed to save settings: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const addRemoteConnection = () => {
    const newConnection: IRemoteConnection = {
      id: uuidv4(),
      name: 'New Connection',
      type: 's3',
      endpoint: '',
      credentials: {},
      settings: {
        syncEnabled: false,
        autoBackup: false,
      },
      enabled: false,
    };

    setCompanySettings(prev => ({
      ...prev,
      remoteConnections: [...prev.remoteConnections, newConnection],
    }));
  };

  const updateRemoteConnection = (id: string, updates: Partial<IRemoteConnection>) => {
    setCompanySettings(prev => ({
      ...prev,
      remoteConnections: prev.remoteConnections.map(conn =>
        conn.id === id ? { ...conn, ...updates } : conn
      ),
    }));
  };

  const removeRemoteConnection = (id: string) => {
    setCompanySettings(prev => ({
      ...prev,
      remoteConnections: prev.remoteConnections.filter(conn => conn.id !== id),
    }));
  };

  const testRemoteConnection = async (id: string) => {
    setTesting(id);
    try {
      const response = await fetch('/api/users/remote-connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionId: id }),
      });

      const data = await response.json();

      if (data.success) {
        alert('Connection test successful!');
        // Update last sync time
        updateRemoteConnection(id, { lastSync: new Date(data.data.lastSync) });
      } else {
        alert('Connection test failed: ' + data.error);
      }
    } catch (error) {
      console.error('Failed to test connection:', error);
      alert('Connection test failed');
    } finally {
      setTesting(null);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={saveSettings} disabled={loading}>
          <Save className="h-4 w-4 mr-2" />
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="remote">
            <Cloud className="h-4 w-4 mr-2" />
            Remote Connections
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder="Aviation Authority"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={companySettings.domain}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      domain: e.target.value
                    }))}
                    placeholder="aviation.gov"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="authority">Authority</Label>
                <Input
                  id="authority"
                  value={companySettings.authority}
                  onChange={(e) => setCompanySettings(prev => ({
                    ...prev,
                    authority: e.target.value
                  }))}
                  placeholder="Civil Aviation Authority"
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="contact-email">Email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      value={companySettings.contact.email}
                      onChange={(e) => setCompanySettings(prev => ({
                        ...prev,
                        contact: { ...prev.contact, email: e.target.value }
                      }))}
                      placeholder="contact@aviation.gov"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone">Phone</Label>
                    <Input
                      id="contact-phone"
                      value={companySettings.contact.phone}
                      onChange={(e) => setCompanySettings(prev => ({
                        ...prev,
                        contact: { ...prev.contact, phone: e.target.value }
                      }))}
                      placeholder="+1 555 123 4567"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-address">Address</Label>
                    <Input
                      id="contact-address"
                      value={companySettings.contact.address}
                      onChange={(e) => setCompanySettings(prev => ({
                        ...prev,
                        contact: { ...prev.contact, address: e.target.value }
                      }))}
                      placeholder="123 Aviation Blvd"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remote" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Remote Connections</CardTitle>
              <Button onClick={addRemoteConnection} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Connection
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {companySettings.remoteConnections.map((connection) => (
                  <Card key={connection.id} className="p-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Input
                            value={connection.name}
                            onChange={(e) => updateRemoteConnection(connection.id, { name: e.target.value })}
                            className="w-48"
                          />
                          <Badge variant={connection.enabled ? 'default' : 'secondary'}>
                            {connection.enabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                          {connection.lastSync && (
                            <Badge variant="outline">
                              Last sync: {new Date(connection.lastSync).toLocaleString()}
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Switch
                            checked={connection.enabled}
                            onCheckedChange={(enabled) => updateRemoteConnection(connection.id, { enabled })}
                          />
                          <Button
                            onClick={() => testRemoteConnection(connection.id)}
                            size="sm"
                            variant="outline"
                            disabled={testing === connection.id}
                          >
                            <TestTube className="h-4 w-4 mr-2" />
                            {testing === connection.id ? 'Testing...' : 'Test'}
                          </Button>
                          <Button
                            onClick={() => removeRemoteConnection(connection.id)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label>Type</Label>
                          <select
                            className="w-full p-2 border rounded"
                            value={connection.type}
                            onChange={(e) => updateRemoteConnection(connection.id, {
                              type: e.target.value as 's3' | 'ftp' | 'git' | 'webdav'
                            })}
                          >
                            <option value="s3">Amazon S3</option>
                            <option value="ftp">FTP</option>
                            <option value="git">Git Repository</option>
                            <option value="webdav">WebDAV</option>
                          </select>
                        </div>
                        <div>
                          <Label>Endpoint</Label>
                          <Input
                            value={connection.endpoint}
                            onChange={(e) => updateRemoteConnection(connection.id, { endpoint: e.target.value })}
                            placeholder="s3.amazonaws.com"
                          />
                        </div>
                        <div>
                          <Label>Bucket/Path</Label>
                          <Input
                            value={connection.settings.bucket || ''}
                            onChange={(e) => updateRemoteConnection(connection.id, {
                              settings: { ...connection.settings, bucket: e.target.value }
                            })}
                            placeholder="eaip-documents"
                          />
                        </div>
                      </div>

                      {connection.type === 's3' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label>Access Key</Label>
                            <Input
                              type="password"
                              value={connection.credentials.accessKey || ''}
                              onChange={(e) => updateRemoteConnection(connection.id, {
                                credentials: { ...connection.credentials, accessKey: e.target.value }
                              })}
                              placeholder="AKIA..."
                            />
                          </div>
                          <div>
                            <Label>Secret Key</Label>
                            <Input
                              type="password"
                              value={connection.credentials.secretKey || ''}
                              onChange={(e) => updateRemoteConnection(connection.id, {
                                credentials: { ...connection.credentials, secretKey: e.target.value }
                              })}
                              placeholder="Secret key"
                            />
                          </div>
                          <div>
                            <Label>Region</Label>
                            <Input
                              value={connection.settings.region || ''}
                              onChange={(e) => updateRemoteConnection(connection.id, {
                                settings: { ...connection.settings, region: e.target.value }
                              })}
                              placeholder="us-east-1"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex gap-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={connection.settings.syncEnabled}
                            onCheckedChange={(syncEnabled) => updateRemoteConnection(connection.id, {
                              settings: { ...connection.settings, syncEnabled }
                            })}
                          />
                          <Label>Auto Sync</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={connection.settings.autoBackup}
                            onCheckedChange={(autoBackup) => updateRemoteConnection(connection.id, {
                              settings: { ...connection.settings, autoBackup }
                            })}
                          />
                          <Label>Auto Backup</Label>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}

                {companySettings.remoteConnections.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No remote connections configured. Click "Add Connection" to get started.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Branding & Colors</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <Input
                    id="primary-color"
                    type="color"
                    value={companySettings.branding.colors.primary}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      branding: {
                        ...prev.branding,
                        colors: { ...prev.branding.colors, primary: e.target.value }
                      }
                    }))}
                  />
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <Input
                    id="secondary-color"
                    type="color"
                    value={companySettings.branding.colors.secondary}
                    onChange={(e) => setCompanySettings(prev => ({
                      ...prev,
                      branding: {
                        ...prev.branding,
                        colors: { ...prev.branding.colors, secondary: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Email Notifications</Label>
                    <Switch
                      checked={preferences.notifications.email}
                      onCheckedChange={(email) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Browser Notifications</Label>
                    <Switch
                      checked={preferences.notifications.browser}
                      onCheckedChange={(browser) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, browser }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Slack Notifications</Label>
                    <Switch
                      checked={preferences.notifications.slack}
                      onCheckedChange={(slack) => setPreferences(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, slack }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-4">Editor</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto Save</Label>
                    <Switch
                      checked={preferences.editor.autoSave}
                      onCheckedChange={(autoSave) => setPreferences(prev => ({
                        ...prev,
                        editor: { ...prev.editor, autoSave }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Spell Check</Label>
                    <Switch
                      checked={preferences.editor.spellCheck}
                      onCheckedChange={(spellCheck) => setPreferences(prev => ({
                        ...prev,
                        editor: { ...prev.editor, spellCheck }
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Word Wrap</Label>
                    <Switch
                      checked={preferences.editor.wordWrap}
                      onCheckedChange={(wordWrap) => setPreferences(prev => ({
                        ...prev,
                        editor: { ...prev.editor, wordWrap }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}