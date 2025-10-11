'use client';

import Script from 'next/script';
import { useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';

interface GoogleAnalyticsProps {
  measurementId: string; // GA4 Measurement ID (e.g., G-XXXXXXXXXX)
}

export default function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const { preferences, hasConsented, isLoaded } = useCookieConsent();

  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;

    // Initialize gtag with default denied consent
    if (window.gtag) {
      window.gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'functionality_storage': 'denied',
        'ad_storage': 'denied',
        'ad_user_data': 'denied',
        'ad_personalization': 'denied',
        'wait_for_update': 500
      });

      // If user has consented, update consent
      if (hasConsented) {
        window.gtag('consent', 'update', {
          'analytics_storage': preferences.analytics ? 'granted' : 'denied',
          'functionality_storage': preferences.functional ? 'granted' : 'denied',
          'ad_storage': 'denied',
          'ad_user_data': 'denied',
          'ad_personalization': 'denied'
        });
      }
    }
  }, [preferences, hasConsented, isLoaded]);

  // Only load GA scripts if analytics are enabled
  if (!hasConsented || !preferences.analytics) {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            // Set consent mode default (denied by default)
            gtag('consent', 'default', {
              'analytics_storage': 'denied',
              'functionality_storage': 'denied',
              'ad_storage': 'denied',
              'ad_user_data': 'denied',
              'ad_personalization': 'denied',
              'wait_for_update': 500
            });

            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              anonymize_ip: true,
              cookie_flags: 'SameSite=None;Secure'
            });
          `,
        }}
      />
    </>
  );
}

