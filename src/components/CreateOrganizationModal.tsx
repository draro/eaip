'use client';

import React, { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrganizationCreated: () => void;
}

export default function CreateOrganizationModal({
  isOpen,
  onClose,
  onOrganizationCreated
}: CreateOrganizationModalProps) {
  const [isLoading, setIsLoading] = useState(false);
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
    }
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

  const handleInputChange = (field: string, value: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        onOrganizationCreated();
        onClose();
        setFormData({
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
          }
        });
      } else {
        alert(result.error || 'Failed to create organization');
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Create New Organization</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="e.g. Austria Control"
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
                placeholder="e.g. austro-control"
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
                placeholder="e.g. LOWW"
                maxLength={4}
              />
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
                  placeholder="contact@organization.com"
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
                  placeholder="+43 1 17030 0"
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
                placeholder="Full address including city and postal code"
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
                placeholder="https://eaip.organization.com"
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
                  onChange={(e) => handleInputChange('subscription.maxUsers', e.target.value)}
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
                  onChange={(e) => handleInputChange('subscription.maxDocuments', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}