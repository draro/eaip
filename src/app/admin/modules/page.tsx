'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Bell, Calendar, Shield, GitBranch, CheckSquare, Globe, Loader2, Save } from 'lucide-react';

interface Organization {
  _id: string;
  name: string;
  country: string;
  status: string;
  modules: {
    eaip: boolean;
    notam: boolean;
    airac: boolean;
    compliance: boolean;
    workflow: boolean;
    checklists: boolean;
    publicViewer: boolean;
  };
}

const moduleDefinitions = [
  { key: 'eaip', name: 'eAIP Document Management', icon: FileText, description: 'Manage electronic Aeronautical Information Publication' },
  { key: 'notam', name: 'NOTAM Management', icon: Bell, description: 'Create and manage NOTAMs' },
  { key: 'airac', name: 'AIRAC Cycles', icon: Calendar, description: 'Manage AIRAC cycle schedules' },
  { key: 'compliance', name: 'Compliance Monitoring', icon: Shield, description: 'ICAO and Eurocontrol compliance' },
  { key: 'workflow', name: 'Approval Workflows', icon: GitBranch, description: 'Document review and approval' },
  { key: 'checklists', name: 'ATC Checklists', icon: CheckSquare, description: 'Checklist templates and instances' },
  { key: 'publicViewer', name: 'Public Viewer', icon: Globe, description: 'Public-facing eAIP viewer' },
];

export default function ModuleManagementPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>('');
  const [modules, setModules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      const org = organizations.find(o => o._id === selectedOrg);
      if (org) {
        setModules(org.modules || {
          eaip: true,
          notam: true,
          airac: true,
          compliance: true,
          workflow: true,
          checklists: true,
          publicViewer: true,
        });
      }
    }
  }, [selectedOrg, organizations]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (data.success) {
        setOrganizations(data.organizations);
        if (data.organizations.length > 0) {
          setSelectedOrg(data.organizations[0]._id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleKey: string) => {
    setModules((prev: any) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey],
    }));
  };

  const handleSave = async () => {
    if (!selectedOrg) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/organizations/${selectedOrg}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modules }),
      });

      const data = await response.json();
      if (data.success) {
        alert('Module settings saved successfully!');
        fetchOrganizations();
      } else {
        alert(`Failed to save: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to save modules:', error);
      alert('Failed to save module settings');
    } finally {
      setSaving(false);
    }
  };

  const selectedOrgData = organizations.find(o => o._id === selectedOrg);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Module Management</h1>
          <p className="text-gray-600 mt-2">
            Enable or disable modules for organizations
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Select Organization</CardTitle>
                <CardDescription>Choose an organization to manage its modules</CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select organization" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map((org) => (
                      <SelectItem key={org._id} value={org._id}>
                        <div className="flex items-center gap-2">
                          <span>{org.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {org.country}
                          </Badge>
                          <Badge
                            variant={org.status === 'active' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {org.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedOrg && selectedOrgData && (
              <Card>
                <CardHeader>
                  <CardTitle>Enabled Modules</CardTitle>
                  <CardDescription>
                    Configure which modules are available for {selectedOrgData.name}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {moduleDefinitions.map((module) => {
                    const Icon = module.icon;
                    const isEnabled = modules[module.key] !== false;

                    return (
                      <div
                        key={module.key}
                        className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`p-2 rounded-lg ${isEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <Label className="text-base font-semibold cursor-pointer">
                              {module.name}
                            </Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {module.description}
                            </p>
                            <Badge
                              variant={isEnabled ? 'default' : 'secondary'}
                              className="mt-2"
                            >
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={() => handleModuleToggle(module.key)}
                        />
                      </div>
                    );
                  })}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const org = organizations.find(o => o._id === selectedOrg);
                        if (org) setModules(org.modules);
                      }}
                    >
                      Reset
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
