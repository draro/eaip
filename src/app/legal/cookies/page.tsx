'use client';

import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { Cookie, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookiePolicy() {
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
              <h1 className="text-4xl font-bold">Cookie Policy</h1>
            </div>
            <p className="text-blue-100 text-lg">
              Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="prose prose-lg max-w-none">
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. What Are Cookies?</h2>
              <p className="text-gray-700 mb-4">
                Cookies are small text files that are placed on your device when you visit our eAIP platform. They help us provide you with a better experience by remembering your preferences and enabling essential functionality.
              </p>
              <p className="text-gray-700">
                This Cookie Policy explains what cookies we use, why we use them, and how you can manage your cookie preferences.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Types of Cookies We Use</h2>

              <div className="space-y-8">
                <div className="border-l-4 border-blue-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Essential Cookies (Strictly Necessary)</h3>
                  <p className="text-gray-700 mb-3">
                    These cookies are necessary for the Service to function properly. They enable core functionality such as security, authentication, and accessibility.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="font-medium text-gray-900 mb-2">Examples:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li><code>next-auth.session-token</code> - Session management and authentication</li>
                      <li><code>next-auth.csrf-token</code> - Cross-site request forgery protection</li>
                      <li><code>next-auth.callback-url</code> - Authentication callback handling</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Duration:</strong> Session or as specified by NextAuth.js<br/>
                      <strong>Can be disabled:</strong> No (required for Service operation)
                    </p>
                  </div>
                </div>

                <div className="border-l-4 border-green-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Functional Cookies (Preferences)</h3>
                  <p className="text-gray-700 mb-3">
                    These cookies remember your preferences and choices to provide a personalized experience.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="font-medium text-gray-900 mb-2">Examples:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li><code>theme</code> - Your selected theme (light/dark mode)</li>
                      <li><code>language</code> - Your preferred language</li>
                      <li><code>timezone</code> - Your timezone setting</li>
                      <li><code>view-preference</code> - Grid/list view preferences</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Duration:</strong> 1 year<br/>
                      <strong>Can be disabled:</strong> Yes (but will reset preferences each visit)
                    </p>
                  </div>
                </div>

                <div className="border-l-4 border-purple-500 pl-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">2.3 Performance Cookies (Analytics)</h3>
                  <p className="text-gray-700 mb-3">
                    These cookies help us understand how users interact with the Service to improve performance and user experience.
                  </p>
                  <div className="bg-gray-50 rounded-lg p-4 mt-3">
                    <p className="font-medium text-gray-900 mb-2">Information collected:</p>
                    <ul className="list-disc pl-6 text-gray-700 space-y-1">
                      <li>Pages visited and features used</li>
                      <li>Time spent on pages</li>
                      <li>Navigation patterns</li>
                      <li>Error messages encountered</li>
                    </ul>
                    <p className="text-sm text-gray-600 mt-3">
                      <strong>Duration:</strong> 2 years<br/>
                      <strong>Can be disabled:</strong> Yes
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Cookies We Do NOT Use</h2>
              <p className="text-gray-700 mb-4">
                We want to be transparent about what we don't do:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li><strong>Advertising Cookies:</strong> We do not use cookies for targeted advertising</li>
                <li><strong>Third-Party Tracking:</strong> We do not allow third-party advertising trackers</li>
                <li><strong>Social Media Tracking:</strong> We do not use social media tracking pixels</li>
                <li><strong>Cross-Site Tracking:</strong> We do not track you across other websites</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Third-Party Cookies</h2>
              <p className="text-gray-700 mb-4">
                Some third-party services we use may set their own cookies:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="font-semibold text-gray-900 mb-2">Google Cloud Platform</p>
                  <p className="text-gray-700 text-sm">
                    For file storage and service infrastructure. Google may use cookies for service operation and security.
                  </p>
                  <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-sm">
                    Google Privacy Policy →
                  </a>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Managing Your Cookie Preferences</h2>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Browser Settings</h3>
              <p className="text-gray-700 mb-4">
                Most web browsers allow you to control cookies through their settings. You can:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-6 space-y-2">
                <li>View what cookies are stored and delete them individually</li>
                <li>Block third-party cookies</li>
                <li>Block all cookies from specific websites</li>
                <li>Delete all cookies when you close your browser</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <p className="font-semibold text-gray-900 mb-3">Popular Browser Cookie Settings:</p>
                <ul className="space-y-2 text-sm">
                  <li>
                    <strong>Chrome:</strong>{' '}
                    <a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Cookie settings guide
                    </a>
                  </li>
                  <li>
                    <strong>Firefox:</strong>{' '}
                    <a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Cookie settings guide
                    </a>
                  </li>
                  <li>
                    <strong>Safari:</strong>{' '}
                    <a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Cookie settings guide
                    </a>
                  </li>
                  <li>
                    <strong>Edge:</strong>{' '}
                    <a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      Cookie settings guide
                    </a>
                  </li>
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mt-6">
                <p className="font-semibold text-gray-900 mb-2">⚠️ Important Notice:</p>
                <p className="text-gray-700 text-sm">
                  Disabling essential cookies will prevent you from using the Service. The platform requires authentication cookies to function properly. Disabling functional cookies will reset your preferences on each visit.
                </p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Do Not Track (DNT)</h2>
              <p className="text-gray-700">
                We respect Do Not Track (DNT) browser signals. When DNT is enabled, we limit our use of optional cookies to essential functionality only. However, essential authentication cookies are still required for the Service to function.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookie Consent</h2>
              <p className="text-gray-700 mb-4">
                By using the eAIP Service, you consent to our use of essential cookies required for authentication and core functionality. For optional cookies:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>We will request your consent before setting non-essential cookies</li>
                <li>You can withdraw consent at any time through your browser settings</li>
                <li>Withdrawing consent will not affect the use of essential cookies</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Updates to This Policy</h2>
              <p className="text-gray-700">
                We may update this Cookie Policy from time to time. Material changes will be notified via email and posted on the Service. The "Last updated" date at the top indicates when the policy was last revised.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about our use of cookies, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">FLYCLIM</p>
                <p className="text-gray-700 mb-1"><strong>Email:</strong> <a href="mailto:privacy@flyclim.com" className="text-blue-600 hover:underline">privacy@flyclim.com</a></p>
                <p className="text-gray-700"><strong>Website:</strong> <a href="https://eaip.flyclim.com" className="text-blue-600 hover:underline">https://eaip.flyclim.com</a></p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                For more information about how we handle your personal data, please see our <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
