'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Cookie, ArrowLeft, CheckCircle, Save, RotateCcw, Info } from 'lucide-react';
import { useCookieConsent } from '@/hooks/useCookieConsent';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CookiePreferencesPage() {
  const {
    preferences,
    hasConsented,
    isLoaded,
    savePreferences,
    acceptAll,
    rejectAll,
    resetConsent
  } = useCookieConsent();

  const [localPreferences, setLocalPreferences] = useState({
    functional: false,
    analytics: false
  });

  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isLoaded && hasConsented) {
      setLocalPreferences({
        functional: preferences.functional,
        analytics: preferences.analytics
      });
    }
  }, [isLoaded, hasConsented, preferences]);

  const handleSave = () => {
    savePreferences(localPreferences);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAcceptAll = () => {
    acceptAll();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleRejectAll = () => {
    rejectAll();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset your cookie preferences? This will show the consent banner again on your next visit.')) {
      resetConsent();
      window.location.reload();
    }
  };

  if (!isLoaded) {
    return (
      <>
        <PublicNav />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <Cookie className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Loading cookie preferences...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PublicNav />
      <div className="min-h-screen bg-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <Link href="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 mb-6">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Button>
            </Link>
            <div className="flex items-center space-x-4 mb-4">
              <Cookie className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Cookie Preferences</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Manage your cookie preferences and control how we use cookies on this website
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Success Alert */}
          {showSuccess && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Your cookie preferences have been updated successfully. The page will reload to apply changes.
              </AlertDescription>
            </Alert>
          )}

          {/* Current Status */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Info className="mr-2 h-5 w-5 text-blue-600" />
                Current Status
              </CardTitle>
              <CardDescription>
                {hasConsented
                  ? `You have consented to cookies. Last updated: ${new Date(preferences.timestamp).toLocaleString()}`
                  : 'You have not yet provided cookie consent.'
                }
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Button
              onClick={handleAcceptAll}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Accept All
            </Button>
            <Button
              onClick={handleRejectAll}
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-50"
            >
              Reject Optional
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              className="border-gray-300"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset Preferences
            </Button>
          </div>

          {/* Cookie Categories */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Cookie Categories</h2>

            {/* Essential Cookies */}
            <Card className="bg-gray-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center">
                      Essential Cookies
                      <span className="ml-3 px-2 py-1 text-xs bg-gray-700 text-white rounded">
                        Always Active
                      </span>
                    </CardTitle>
                    <CardDescription className="mt-2">
                      These cookies are necessary for the website to function properly and cannot be disabled.
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    <div className="w-12 h-6 bg-gray-400 rounded-full flex items-center px-1 cursor-not-allowed">
                      <div className="w-4 h-4 bg-white rounded-full transform translate-x-6"></div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Session management and authentication</li>
                  <li>• Security and CSRF protection</li>
                  <li>• Account functionality</li>
                </ul>
              </CardContent>
            </Card>

            {/* Functional Cookies */}
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Functional Cookies</CardTitle>
                    <CardDescription className="mt-2">
                      Remember your preferences and choices for a personalized experience.
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setLocalPreferences(prev => ({ ...prev, functional: !prev.functional }))}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        localPreferences.functional ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle functional cookies"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        localPreferences.functional ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Theme preference (light/dark mode)</li>
                  <li>• Language and timezone settings</li>
                  <li>• View preferences (grid/list)</li>
                  <li>• UI customization</li>
                </ul>
              </CardContent>
            </Card>

            {/* Analytics Cookies */}
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Analytics Cookies</CardTitle>
                    <CardDescription className="mt-2">
                      Help us understand how you use the website to improve your experience.
                    </CardDescription>
                  </div>
                  <div className="ml-4">
                    <button
                      onClick={() => setLocalPreferences(prev => ({ ...prev, analytics: !prev.analytics }))}
                      className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                        localPreferences.analytics ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                      aria-label="Toggle analytics cookies"
                    >
                      <div className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                        localPreferences.analytics ? 'translate-x-6' : 'translate-x-0'
                      }`}></div>
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li>• Page views and navigation patterns</li>
                  <li>• Feature usage statistics</li>
                  <li>• Performance metrics</li>
                  <li>• Error tracking</li>
                </ul>
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Provider:</strong> Google Analytics
                    <br />
                    <strong>Privacy:</strong> IP anonymization enabled
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* No Advertising Notice */}
            <Card className="bg-green-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center text-green-900">
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Privacy Commitment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-800">
                  We do <strong>NOT</strong> use cookies for:
                </p>
                <ul className="text-sm text-green-800 space-y-1 mt-2">
                  <li>• Advertising or targeted marketing</li>
                  <li>• Third-party tracking across websites</li>
                  <li>• Social media tracking pixels</li>
                  <li>• Selling your data to third parties</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Save Button */}
          <div className="mt-8 flex flex-col sm:flex-row justify-end gap-4">
            <Link href="/legal/cookies">
              <Button variant="outline" className="w-full sm:w-auto">
                <Info className="mr-2 h-4 w-4" />
                View Cookie Policy
              </Button>
            </Link>
            <Button
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Preferences
            </Button>
          </div>

          {/* Additional Information */}
          <div className="mt-12 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Managing Cookies</h3>
            <div className="prose prose-sm text-gray-600">
              <p>
                You can also manage cookies through your browser settings. Most browsers allow you to:
              </p>
              <ul>
                <li>View and delete cookies</li>
                <li>Block third-party cookies</li>
                <li>Block cookies from specific sites</li>
                <li>Delete all cookies when closing the browser</li>
              </ul>
              <p className="mt-4">
                Please note that disabling essential cookies will prevent you from using the website.
                For more information, visit our{' '}
                <Link href="/legal/cookies" className="text-blue-600 hover:underline">
                  Cookie Policy
                </Link>{' '}
                or{' '}
                <Link href="/legal/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
