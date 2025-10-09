'use client';

import React from 'react';
import Navigation from '@/components/Navigation';
import { BrandingProvider } from '@/contexts/BrandingContext';

interface LayoutProps {
  children: React.ReactNode;
  user?: {
    name: string;
    email: string;
    role: 'super_admin' | 'org_admin' | 'editor' | 'viewer';
    organization?: {
      name: string;
      domain: string;
    };
  };
}

export default function Layout({ children, user }: LayoutProps) {
  return (
    <BrandingProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation user={user} />
        <main className="flex-1">
          {children}
        </main>
      </div>
    </BrandingProvider>
  );
}