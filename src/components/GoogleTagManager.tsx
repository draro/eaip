'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface GoogleTagManagerProps {
  gtmId: string; // GTM Container ID (e.g., GTM-XXXXXXX)
}

declare global {
  interface Window {
    dataLayer?: any[];
  }
}

export default function GoogleTagManager({ gtmId }: GoogleTagManagerProps) {
  const { preferences, hasConsented, isLoaded } = useCookieConsent();

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Initialize dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];

    // Set default consent state (denied by default for GDPR compliance)
    window.dataLayer.push({
      event: 'consent_default',
      consent: {
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
      }
    });

    // If user has consented, update consent immediately
    if (hasConsented) {
      window.dataLayer.push({
        event: 'consent_update',
        consent: {
          'analytics_storage': preferences.analytics ? 'granted' : 'denied',
          'functionality_storage': preferences.functional ? 'granted' : 'denied',
          'ad_storage': 'denied', // We don't use advertising
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        }
      });
    }
  }, [preferences, hasConsented, isLoaded]);

  if (!gtmId) {
    console.warn('GTM ID is not provided. Google Tag Manager will not be loaded.');
    return null;
  }

  return (
    <>
      {/* Google Tag Manager - Head */}
      <Script
        id="gtm-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
          `,
        }}
      />

      {/* Google Tag Manager - Body (noscript fallback) */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
          height="0"
          width="0"
          style={{ display: 'none', visibility: 'hidden' }}
        />
      </noscript>
    </>
  );
}

/**
 * Helper function to push custom events to GTM dataLayer
 * Use this throughout your application to track user actions
 *
 * @example
 * pushToDataLayer('document_created', { documentType: 'AIP', documentId: '123' });
 */
export function pushToDataLayer(event: string, data?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event,
      ...data,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Helper function to set user properties in GTM dataLayer
 * Call this when user logs in to track user attributes
 *
 * @example
 * setUserProperties({ userId: '123', userRole: 'org_admin', organization: 'ABC Airways' });
 */
export function setUserProperties(properties: {
  userId?: string;
  userRole?: string;
  organization?: string;
  organizationType?: string;
  [key: string]: any;
}) {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'user_properties_set',
      user: properties
    });
  }
}

/**
 * Helper function to clear user properties (on logout)
 */
export function clearUserProperties() {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: 'user_properties_cleared',
      user: {}
    });
  }
}
