export type CookieCategory = 'essential' | 'functional' | 'analytics';

export interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  functional: boolean;
  analytics: boolean;
  timestamp: number;
  version: string; // Policy version
}

export interface CookieConsentState {
  hasConsented: boolean;
  preferences: CookiePreferences;
}

export const DEFAULT_PREFERENCES: CookiePreferences = {
  essential: true,
  functional: false,
  analytics: false,
  timestamp: Date.now(),
  version: '1.0.0'
};

export const COOKIE_CONSENT_KEY = 'eaip_cookie_consent';
export const COOKIE_POLICY_VERSION = '1.0.0';
