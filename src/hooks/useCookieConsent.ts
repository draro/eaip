'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CookiePreferences,
  CookieConsentState,
  DEFAULT_PREFERENCES,
  COOKIE_CONSENT_KEY,
  COOKIE_POLICY_VERSION,
  CookieCategory
} from '@/types/cookieConsent';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

export function useCookieConsent() {
  const [consentState, setConsentState] = useState<CookieConsentState>({
    hasConsented: false,
    preferences: DEFAULT_PREFERENCES
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Load consent from localStorage on mount
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (stored) {
          const parsed: CookieConsentState = JSON.parse(stored);

          // Check if policy version has changed
          if (parsed.preferences.version !== COOKIE_POLICY_VERSION) {
            // Policy updated, reset consent
            setConsentState({
              hasConsented: false,
              preferences: DEFAULT_PREFERENCES
            });
          } else {
            setConsentState(parsed);
            // Apply consent to Google Analytics
            updateGoogleAnalyticsConsent(parsed.preferences);
          }
        }
      } catch (error) {
        console.error('Error loading cookie consent:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadConsent();
  }, []);

  // Save consent to localStorage
  const saveConsent = useCallback((preferences: CookiePreferences) => {
    try {
      const newState: CookieConsentState = {
        hasConsented: true,
        preferences: {
          ...preferences,
          timestamp: Date.now(),
          version: COOKIE_POLICY_VERSION
        }
      };

      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newState));
      setConsentState(newState);

      // Update Google Analytics consent
      updateGoogleAnalyticsConsent(newState.preferences);

      // Reload page to apply preferences
      window.location.reload();
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  }, []);

  // Accept all cookies
  const acceptAll = useCallback(() => {
    saveConsent({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: Date.now(),
      version: COOKIE_POLICY_VERSION
    });
  }, [saveConsent]);

  // Reject optional cookies (keep only essential)
  const rejectAll = useCallback(() => {
    saveConsent({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: Date.now(),
      version: COOKIE_POLICY_VERSION
    });
  }, [saveConsent]);

  // Save custom preferences
  const savePreferences = useCallback((preferences: Partial<CookiePreferences>) => {
    saveConsent({
      essential: true, // Always true
      functional: preferences.functional ?? false,
      analytics: preferences.analytics ?? false,
      timestamp: Date.now(),
      version: COOKIE_POLICY_VERSION
    });
  }, [saveConsent]);

  // Update category preference
  const updateCategory = useCallback((category: CookieCategory, enabled: boolean) => {
    if (category === 'essential') return; // Cannot disable essential

    savePreferences({
      ...consentState.preferences,
      [category]: enabled
    });
  }, [consentState.preferences, savePreferences]);

  // Reset consent (for testing or policy updates)
  const resetConsent = useCallback(() => {
    try {
      localStorage.removeItem(COOKIE_CONSENT_KEY);
      setConsentState({
        hasConsented: false,
        preferences: DEFAULT_PREFERENCES
      });

      // Reset Google Analytics consent
      updateGoogleAnalyticsConsent(DEFAULT_PREFERENCES);
    } catch (error) {
      console.error('Error resetting cookie consent:', error);
    }
  }, []);

  return {
    ...consentState,
    isLoaded,
    acceptAll,
    rejectAll,
    savePreferences,
    updateCategory,
    resetConsent
  };
}

// Update consent for both Google Analytics (gtag) and Google Tag Manager (dataLayer)
function updateGoogleAnalyticsConsent(preferences: CookiePreferences) {
  if (typeof window === 'undefined') return;

  const consentUpdate = {
    'analytics_storage': preferences.analytics ? 'granted' : 'denied',
    'functionality_storage': preferences.functional ? 'granted' : 'denied',
    'ad_storage': 'denied', // We don't use advertising
    'ad_user_data': 'denied',
    'ad_personalization': 'denied'
  };

  // Update for Google Analytics (gtag.js) - Direct GA4 integration
  if (window.gtag) {
    window.gtag('consent', 'update', consentUpdate);
  }

  // Update for Google Tag Manager (dataLayer)
  if (window.dataLayer) {
    window.dataLayer.push({
      event: 'consent_update',
      consent: consentUpdate
    });
  }
}
