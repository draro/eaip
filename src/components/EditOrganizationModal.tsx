'use client';

import React, { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

interface Organization {
  _id: string;
  name: string;
  domain: string;
  country: string;
  icaoCode?: string;
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
    plan: string;
    maxUsers: number;
    maxDocuments: number;
  };
  features?: {
    document_management: boolean;
    checklists: boolean;
    file_upload: boolean;
    word_conversion: boolean;
    pdf_viewer: boolean;
    pdf_annotations: boolean;
    git_versioning: boolean;
    review_workflow: boolean;
    approval_workflow: boolean;
    realtime_collaboration: boolean;
    export_pdf: boolean;
    export_docx: boolean;
  };
  modules?: {
    eaip: boolean;
    notam: boolean;
    airac: boolean;
    compliance: boolean;
    workflow: boolean;
    checklists: boolean;
    publicViewer: boolean;
  };
  status: string;
  createdAt: string;
  statistics?: {
    totalUsers: number;
    totalDocuments: number;
    activeUsers: number;
  };
}

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  organization: Organization | null;
  onOrganizationUpdated: () => void;
}

export default function EditOrganizationModal({
  isOpen,
  onClose,
  organization,
  onOrganizationUpdated
}: EditOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    country: '',
    icaoCode: '',
    contact: {
      email: '',
      phone: '',
      address: ''
    },
    settings: {
      publicUrl: '',
      timezone: 'UTC',
      language: 'en'
    },
    subscription: {
      plan: 'basic',
      maxUsers: 5,
      maxDocuments: 10
    },
    features: {
      document_management: true,
      checklists: true,
      file_upload: true,
      word_conversion: true,
      pdf_viewer: true,
      pdf_annotations: true,
      git_versioning: true,
      review_workflow: true,
      approval_workflow: true,
      realtime_collaboration: true,
      export_pdf: true,
      export_docx: true,
    },
    modules: {
      eaip: true,
      notam: true,
      airac: true,
      compliance: true,
      workflow: true,
      checklists: true,
      publicViewer: true,
    },
    status: 'active'
  });

  const countries = [
    'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
    'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
    'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'US', 'CA'
  ];

  const subscriptionPlans = [
    { value: 'basic', label: 'Basic', maxUsers: 5, maxDocuments: 10 },
    { value: 'professional', label: 'Professional', maxUsers: 25, maxDocuments: 50 },
    { value: 'enterprise', label: 'Enterprise', maxUsers: 100, maxDocuments: 200 }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'suspended', label: 'Suspended' },
    { value: 'trial', label: 'Trial' }
  ];

  useEffect(() => {
    if (organization && isOpen) {
      setFormData({
        name: organization.name,
        domain: organization.domain,
        country: organization.country,
        icaoCode: organization.icaoCode || '',
        contact: {
          email: organization.contact.email,
          phone: organization.contact.phone,
          address: organization.contact.address
        },
        settings: {
          publicUrl: organization.settings.publicUrl,
          timezone: organization.settings.timezone,
          language: organization.settings.language
        },
        subscription: {
          plan: organization.subscription.plan,
          maxUsers: organization.subscription.maxUsers,
          maxDocuments: organization.subscription.maxDocuments
        },
        features: organization.features || {
          document_management: true,
          checklists: true,
          file_upload: true,
          word_conversion: true,
          pdf_viewer: true,
          pdf_annotations: true,
          git_versioning: true,
          review_workflow: true,
          approval_workflow: true,
          realtime_collaboration: true,
          export_pdf: true,
          export_docx: true,
        },
        modules: organization.modules || {
          eaip: true,
          notam: true,
          airac: true,
          compliance: true,
          workflow: true,
          checklists: true,
          publicViewer: true,
        },
        status: organization.status
      });
    }
  }, [organization, isOpen]);

  const handleInputChange = (field: string, value: string | number) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as any,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handlePlanChange = (plan: string) => {
    const selectedPlan = subscriptionPlans.find(p => p.value === plan);
    if (selectedPlan) {
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          plan,
          maxUsers: selectedPlan.maxUsers,
          maxDocuments: selectedPlan.maxDocuments
        }
      }));
    }
  };

  const handleFeatureToggle = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: !prev.features[feature as keyof typeof prev.features],
      },
    }));
  };

  const handleModuleToggle = (module: string) => {
    setFormData((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [module]: !prev.modules[module as keyof typeof prev.modules],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organization._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onOrganizationUpdated();
        onClose();
      } else {
        alert(result.error || 'Failed to update organization');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!organization) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/organizations/${organization._id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        onOrganizationUpdated();
        onClose();
        setShowDeleteConfirm(false);
      } else {
        alert(result.error || 'Failed to delete organization');
      }
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Failed to delete organization');
    } finally {
      setIsLoading(false);
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

  if (!isOpen || !organization) return null;

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-red-600">Delete Organization</h2>
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Are you sure you want to delete <strong>{organization.name}</strong>?
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-yellow-800 text-sm">
                <strong>Warning:</strong> This action cannot be undone. The organization can only be deleted if it has no users or documents.
              </p>
            </div>

            {organization.statistics && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Users:</span>
                  <span className={organization.statistics.totalUsers > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    {organization.statistics.totalUsers}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Documents:</span>
                  <span className={organization.statistics.totalDocuments > 0 ? 'text-red-600 font-medium' : 'text-gray-600'}>
                    {organization.statistics.totalDocuments}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Organization'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Fixed Header */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Edit Organization</h2>
            <div className="flex items-center gap-2 mt-2">
              <Badge className={getStatusColor(organization.status)}>
                {organization.status}
              </Badge>
              <span className="text-sm text-gray-500">
                Created {new Date(organization.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 pt-4 space-y-6" style={{ scrollBehavior: 'smooth' }}>

        {/* Statistics Card */}
        {organization.statistics && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Organization Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-blue-600">{organization.statistics.totalUsers}</div>
                <div className="text-sm text-gray-600">Total Users</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{organization.statistics.totalDocuments}</div>
                <div className="text-sm text-gray-600">Documents</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">{organization.statistics.activeUsers}</div>
                <div className="text-sm text-gray-600">Active Users</div>
              </div>
            </div>
          </div>
        )}
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain *
              </label>
              <input
                type="text"
                required
                value={formData.domain}
                onChange={(e) => handleInputChange('domain', e.target.value.toLowerCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country *
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                  {formData.country || 'Select Country'}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 max-h-60 overflow-y-auto">
                  {countries.map((country) => (
                    <DropdownMenuItem
                      key={country}
                      onClick={() => handleInputChange('country', country)}
                    >
                      {country}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ICAO Code
              </label>
              <input
                type="text"
                value={formData.icaoCode}
                onChange={(e) => handleInputChange('icaoCode', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength={4}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                  {statusOptions.find(s => s.value === formData.status)?.label || 'Select Status'}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {statusOptions.map((status) => (
                    <DropdownMenuItem
                      key={status.value}
                      onClick={() => handleInputChange('status', status.value)}
                    >
                      {status.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.contact.email}
                  onChange={(e) => handleInputChange('contact.email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  required
                  value={formData.contact.phone}
                  onChange={(e) => handleInputChange('contact.phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <Textarea
                required
                value={formData.contact.address}
                onChange={(e) => handleInputChange('contact.address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          </div>

          {/* Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Organization Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Public URL *
              </label>
              <input
                type="url"
                required
                value={formData.settings.publicUrl}
                onChange={(e) => handleInputChange('settings.publicUrl', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                    {formData.settings.timezone}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.timezone', 'UTC')}>
                      UTC
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.timezone', 'Europe/Vienna')}>
                      Europe/Vienna
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.timezone', 'Europe/London')}>
                      Europe/London
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.timezone', 'America/New_York')}>
                      America/New_York
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Language
                </label>
                <DropdownMenu>
                  <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                    {formData.settings.language === 'en' ? 'English' : formData.settings.language}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.language', 'en')}>
                      English
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.language', 'de')}>
                      German
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleInputChange('settings.language', 'fr')}>
                      French
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Subscription Plan</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plan
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left">
                  {subscriptionPlans.find(p => p.value === formData.subscription.plan)?.label || 'Select Plan'}
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {subscriptionPlans.map((plan) => (
                    <DropdownMenuItem
                      key={plan.value}
                      onClick={() => handlePlanChange(plan.value)}
                    >
                      <div>
                        <div className="font-medium">{plan.label}</div>
                        <div className="text-xs text-gray-500">
                          {plan.maxUsers} users, {plan.maxDocuments} documents
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Users
                </label>
                <input
                  type="number"
                  value={formData.subscription.maxUsers}
                  onChange={(e) => handleInputChange('subscription.maxUsers', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Documents
                </label>
                <input
                  type="number"
                  value={formData.subscription.maxDocuments}
                  onChange={(e) => handleInputChange('subscription.maxDocuments', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Features</h3>
            <p className="text-sm text-gray-600">
              Select which features will be available for this organization
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-document_management"
                  checked={formData.features.document_management}
                  onCheckedChange={() => handleFeatureToggle('document_management')}
                />
                <label
                  htmlFor="feature-document_management"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Document Management
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-checklists"
                  checked={formData.features.checklists}
                  onCheckedChange={() => handleFeatureToggle('checklists')}
                />
                <label
                  htmlFor="feature-checklists"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Checklists
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-file_upload"
                  checked={formData.features.file_upload}
                  onCheckedChange={() => handleFeatureToggle('file_upload')}
                />
                <label
                  htmlFor="feature-file_upload"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  File Upload
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-word_conversion"
                  checked={formData.features.word_conversion}
                  onCheckedChange={() => handleFeatureToggle('word_conversion')}
                />
                <label
                  htmlFor="feature-word_conversion"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Word Conversion
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-pdf_viewer"
                  checked={formData.features.pdf_viewer}
                  onCheckedChange={() => handleFeatureToggle('pdf_viewer')}
                />
                <label
                  htmlFor="feature-pdf_viewer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  PDF Viewer
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-pdf_annotations"
                  checked={formData.features.pdf_annotations}
                  onCheckedChange={() => handleFeatureToggle('pdf_annotations')}
                />
                <label
                  htmlFor="feature-pdf_annotations"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  PDF Annotations
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-git_versioning"
                  checked={formData.features.git_versioning}
                  onCheckedChange={() => handleFeatureToggle('git_versioning')}
                />
                <label
                  htmlFor="feature-git_versioning"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Git Versioning
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-review_workflow"
                  checked={formData.features.review_workflow}
                  onCheckedChange={() => handleFeatureToggle('review_workflow')}
                />
                <label
                  htmlFor="feature-review_workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Review Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-approval_workflow"
                  checked={formData.features.approval_workflow}
                  onCheckedChange={() => handleFeatureToggle('approval_workflow')}
                />
                <label
                  htmlFor="feature-approval_workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Approval Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-realtime_collaboration"
                  checked={formData.features.realtime_collaboration}
                  onCheckedChange={() => handleFeatureToggle('realtime_collaboration')}
                />
                <label
                  htmlFor="feature-realtime_collaboration"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Realtime Collaboration
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-export_pdf"
                  checked={formData.features.export_pdf}
                  onCheckedChange={() => handleFeatureToggle('export_pdf')}
                />
                <label
                  htmlFor="feature-export_pdf"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Export PDF
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="feature-export_docx"
                  checked={formData.features.export_docx}
                  onCheckedChange={() => handleFeatureToggle('export_docx')}
                />
                <label
                  htmlFor="feature-export_docx"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Export DOCX
                </label>
              </div>
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Modules</h3>
            <p className="text-sm text-gray-600">
              Select which modules will be available for this organization
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-eaip"
                  checked={formData.modules.eaip}
                  onCheckedChange={() => handleModuleToggle('eaip')}
                />
                <label
                  htmlFor="module-eaip"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  eAIP
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-notam"
                  checked={formData.modules.notam}
                  onCheckedChange={() => handleModuleToggle('notam')}
                />
                <label
                  htmlFor="module-notam"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  NOTAM
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-airac"
                  checked={formData.modules.airac}
                  onCheckedChange={() => handleModuleToggle('airac')}
                />
                <label
                  htmlFor="module-airac"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  AIRAC
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-compliance"
                  checked={formData.modules.compliance}
                  onCheckedChange={() => handleModuleToggle('compliance')}
                />
                <label
                  htmlFor="module-compliance"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Compliance
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-workflow"
                  checked={formData.modules.workflow}
                  onCheckedChange={() => handleModuleToggle('workflow')}
                />
                <label
                  htmlFor="module-workflow"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Workflow
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-checklists"
                  checked={formData.modules.checklists}
                  onCheckedChange={() => handleModuleToggle('checklists')}
                />
                <label
                  htmlFor="module-checklists"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Checklists
                </label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="module-publicViewer"
                  checked={formData.modules.publicViewer}
                  onCheckedChange={() => handleModuleToggle('publicViewer')}
                />
                <label
                  htmlFor="module-publicViewer"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Public Viewer
                </label>
              </div>
            </div>
          </div>

        </form>

        {/* Fixed Footer with Action Buttons */}
        <div className="border-t border-gray-200 p-6 pt-4 bg-gray-50">
          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Delete Organization
            </button>

            <div className="flex space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSubmit}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 'Update Organization'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}