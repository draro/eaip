'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface BrandingConfig {
  logoUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  organizationName: string;
  favicon?: string;
  customCss?: string;
}

interface BrandingContextType {
  branding: BrandingConfig;
  updateBranding: (config: Partial<BrandingConfig>) => void;
  loading: boolean;
}

const defaultBranding: BrandingConfig = {
  primaryColor: '#2563eb', // Blue-600
  secondaryColor: '#1e40af', // Blue-700
  organizationName: 'eAIP System',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  updateBranding: () => {},
  loading: false,
});

export const useBranding = () => {
  const context = useContext(BrandingContext);
  if (!context) {
    throw new Error('useBranding must be used within a BrandingProvider');
  }
  return context;
};

interface BrandingProviderProps {
  children: React.ReactNode;
}

export const BrandingProvider: React.FC<BrandingProviderProps> = ({ children }) => {
  const { data: session } = useSession();
  const [branding, setBranding] = useState<BrandingConfig>(defaultBranding);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBranding = async () => {
      try {
        const user = session?.user as any;

        if (user?.organization?.id) {
          // Load organization branding
          const response = await fetch(`/api/organizations/${user.organization.id}/branding`);
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.branding) {
              setBranding({
                ...defaultBranding,
                organizationName: user.organization.name || defaultBranding.organizationName,
                ...data.branding,
              });
            }
          }
        } else {
          // Use default branding for users without organization
          setBranding(defaultBranding);
        }
      } catch (error) {
        console.error('Error loading branding:', error);
        setBranding(defaultBranding);
      } finally {
        setLoading(false);
      }
    };

    if (session !== undefined) {
      loadBranding();
    }
  }, [session]);

  // Apply CSS variables for theming
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', branding.primaryColor);
      root.style.setProperty('--secondary-color', branding.secondaryColor);

      // Apply custom CSS if provided
      if (branding.customCss) {
        let styleElement = document.getElementById('organization-branding');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'organization-branding';
          document.head.appendChild(styleElement);
        }
        styleElement.textContent = branding.customCss;
      }

      // Update favicon if provided
      if (branding.favicon) {
        let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
        if (!link) {
          link = document.createElement('link');
          link.rel = 'icon';
          document.getElementsByTagName('head')[0].appendChild(link);
        }
        link.href = branding.favicon;
      }
    }
  }, [branding]);

  const updateBranding = async (config: Partial<BrandingConfig>) => {
    try {
      const user = session?.user as any;

      if (user?.organization?.id) {
        const response = await fetch(`/api/organizations/${user.organization.id}/branding`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        });

        if (response.ok) {
          setBranding(prev => ({ ...prev, ...config }));
        }
      }
    } catch (error) {
      console.error('Error updating branding:', error);
    }
  };

  return (
    <BrandingContext.Provider
      value={{
        branding,
        updateBranding,
        loading,
      }}
    >
      {children}
    </BrandingContext.Provider>
  );
};