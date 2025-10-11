'use client';

import { useState, useEffect } from 'react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Cookie, Settings, CheckCircle, Info } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsentBanner() {
  const {
    hasConsented,
    preferences,
    isLoaded,
    acceptAll,
    rejectAll,
    savePreferences
  } = useCookieConsent();

  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [customPreferences, setCustomPreferences] = useState({
    functional: false,
    analytics: false
  });

  useEffect(() => {
    if (isLoaded && !hasConsented) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => setShowBanner(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, hasConsented]);

  const handleAcceptAll = () => {
    acceptAll();
    setShowBanner(false);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowBanner(false);
  };

  const handleCustomize = () => {
    setCustomPreferences({
      functional: preferences.functional,
      analytics: preferences.analytics
    });
    setShowPreferences(true);
  };

  const handleSavePreferences = () => {
    savePreferences(customPreferences);
    setShowPreferences(false);
    setShowBanner(false);
  };

  if (!isLoaded || hasConsented) {
    return null;
  }

  return (
    <>
      {/* Cookie Consent Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-blue-500 shadow-2xl animate-in slide-in-from-bottom duration-300">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start space-x-4 flex-1">
                <div className="bg-blue-100 p-3 rounded-lg flex-shrink-0">
                  <Cookie className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    We value your privacy
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    We use cookies to enhance your browsing experience, provide personalized content, and analyze our traffic.
                    Essential cookies are required for the site to function properly. You can choose to accept all cookies or customize your preferences.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link href="/legal/cookies" className="text-xs text-blue-600 hover:underline inline-flex items-center">
                      <Info className="h-3 w-3 mr-1" />
                      Cookie Policy
                    </Link>
                    <span className="text-gray-300">|</span>
                    <Link href="/legal/privacy" className="text-xs text-blue-600 hover:underline">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  className="w-full sm:w-auto border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Reject Optional
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCustomize}
                  className="w-full sm:w-auto border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Customize
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Preferences Modal */}
      <Dialog open={showPreferences} onOpenChange={setShowPreferences}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center text-2xl">
              <Settings className="mr-2 h-6 w-6 text-blue-600" />
              Cookie Preferences
            </DialogTitle>
            <DialogDescription>
              Choose which types of cookies you want to allow. Essential cookies cannot be disabled as they are required for the site to function.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Essential Cookies */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h4 className="font-semibold text-gray-900">Essential Cookies</h4>
                    <span className="ml-2 px-2 py-0.5 text-xs bg-gray-700 text-white rounded">Required</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies are necessary for the website to function properly. They enable core functionality such as security, authentication, and accessibility.
                  </p>
                  <p className="text-xs text-gray-500">
                    Examples: Session management, CSRF protection, authentication tokens
                  </p>
                </div>
                <div className="ml-4">
                  <div className="w-12 h-6 bg-gray-400 rounded-full flex items-center px-1 cursor-not-allowed">
                    <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Functional Cookies */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Functional Cookies</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies remember your preferences and choices to provide a personalized experience.
                  </p>
                  <p className="text-xs text-gray-500">
                    Examples: Theme preference (light/dark mode), language settings, timezone, view preferences
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setCustomPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      customPreferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                      customPreferences.functional ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics Cookies */}
            <div className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    These cookies help us understand how users interact with the website to improve performance and user experience.
                  </p>
                  <p className="text-xs text-gray-500">
                    Examples: Page views, feature usage, navigation patterns, error tracking (Google Analytics)
                  </p>
                </div>
                <div className="ml-4">
                  <button
                    onClick={() => setCustomPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                    className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                      customPreferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                      customPreferences.analytics ? 'translate-x-6' : 'translate-x-0'
                    }`}></div>
                  </button>
                </div>
              </div>
            </div>

            {/* No Advertising Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-900 mb-1">No Advertising or Tracking</h4>
                  <p className="text-sm text-green-700">
                    We do not use cookies for advertising purposes or third-party tracking across other websites.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPreferences(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSavePreferences}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Preferences
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500 text-center">
              You can change your cookie preferences at any time through your browser settings or by visiting our{' '}
              <Link href="/legal/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
              </Link>
              .
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
