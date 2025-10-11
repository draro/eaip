'use client';

import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
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
              <Shield className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Privacy Policy</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                FLYCLIM ("we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our eAIP platform ("Service").
              </p>
              <p className="text-gray-700">
                This policy complies with the EU General Data Protection Regulation (GDPR) and other applicable data protection laws.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, organization details, role</li>
                <li><strong>Profile Information:</strong> Avatar, preferences, timezone, language settings</li>
                <li><strong>Authentication Data:</strong> Password (encrypted), login credentials</li>
                <li><strong>Content Data:</strong> Aeronautical information, documents, NOTAM data you create or upload</li>
                <li><strong>Communication Data:</strong> Support requests, feedback, correspondence</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Usage Data:</strong> Pages viewed, features used, time spent, actions performed</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
                <li><strong>Log Data:</strong> Access times, error logs, performance metrics</li>
                <li><strong>Cookies:</strong> Session cookies, preference cookies (see our <Link href="/legal/cookies" className="text-blue-600 hover:underline">Cookie Policy</Link>)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use collected information for:</p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Service Provision:</strong> Operating and maintaining the eAIP platform</li>
                <li><strong>User Authentication:</strong> Verifying identity and managing access</li>
                <li><strong>Communication:</strong> Sending notifications, updates, and support responses</li>
                <li><strong>Improvement:</strong> Analyzing usage to enhance features and performance</li>
                <li><strong>Security:</strong> Detecting and preventing fraud, abuse, and security incidents</li>
                <li><strong>Compliance:</strong> Meeting legal obligations and regulatory requirements</li>
                <li><strong>Audit Trails:</strong> Maintaining records for compliance and accountability</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data Storage and Security</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Data Storage</h3>
              <p className="text-gray-700 mb-4">
                Your data is stored on secure servers provided by Google Cloud Platform. We implement organizational data isolation to ensure complete separation between different organizations' data.
              </p>

              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Security Measures</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>AES-256 encryption for data at rest</li>
                <li>TLS 1.3 encryption for data in transit</li>
                <li>Role-based access control (RBAC)</li>
                <li>Multi-factor authentication support</li>
                <li>Regular security audits and penetration testing</li>
                <li>Automated backup and disaster recovery</li>
                <li>24/7 security monitoring</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">
                We do not sell your personal data. We may share information only in the following circumstances:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Within Your Organization:</strong> With authorized users in your organization</li>
                <li><strong>Service Providers:</strong> With trusted third-party service providers who assist in operating the Service (e.g., Google Cloud, email services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice)</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights Under GDPR</h2>
              <p className="text-gray-700 mb-4">
                If you are in the European Economic Area (EEA), you have the following rights:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
                <li><strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
                <li><strong>Right to Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
                <li><strong>Right to Restriction:</strong> Limit how we use your data</li>
                <li><strong>Right to Data Portability:</strong> Receive your data in a machine-readable format</li>
                <li><strong>Right to Object:</strong> Object to certain types of processing</li>
                <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
              </ul>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">How to Exercise Your Rights</h4>
                <p className="text-gray-700 mb-3">
                  To exercise any of these rights or request data deletion, contact us at:
                </p>
                <div className="bg-white rounded-lg p-4 border border-blue-300">
                  <p className="text-gray-900 font-medium mb-1">Email:</p>
                  <a href="mailto:privacy@flyclim.com" className="text-blue-600 hover:underline text-lg font-semibold">
                    privacy@flyclim.com
                  </a>
                  <p className="text-sm text-gray-600 mt-3">
                    Please include your registered email address in your request. We will respond within 30 days.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="text-gray-700 mb-4">
                We retain your personal data for as long as necessary to provide the Service and fulfill the purposes outlined in this policy:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li><strong>Account Data:</strong> Retained while your account is active</li>
                <li><strong>Aeronautical Content:</strong> Retained according to ICAO and regulatory requirements</li>
                <li><strong>Audit Logs:</strong> Retained for 7 years for compliance purposes</li>
                <li><strong>Backup Data:</strong> Automatically deleted after 90 days</li>
              </ul>
              <p className="text-gray-700">
                After account termination, we provide a 30-day grace period to export your data. After this period, data is permanently deleted unless legal retention obligations apply.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Data Transfers</h2>
              <p className="text-gray-700">
                Your data may be transferred to and processed in countries outside your country of residence. We ensure adequate protection through:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mt-4 space-y-2">
                <li>Standard Contractual Clauses approved by the European Commission</li>
                <li>Data Processing Agreements with all service providers</li>
                <li>Compliance with GDPR transfer requirements</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. Material changes will be notified via email and posted on the Service at least 30 days before taking effect. The "Last updated" date at the top indicates when the policy was last revised.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <p className="text-gray-700 mb-4">
                For questions about this Privacy Policy or our data practices, please contact:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-3">FLYCLIM - Data Protection</p>
                <p className="text-gray-700 mb-1"><strong>Email:</strong> <a href="mailto:privacy@flyclim.com" className="text-blue-600 hover:underline">privacy@flyclim.com</a></p>
                <p className="text-gray-700 mb-1"><strong>Website:</strong> <a href="https://eaip.flyclim.com" className="text-blue-600 hover:underline">https://eaip.flyclim.com</a></p>
                <p className="text-gray-700 mt-4"><strong>EU Representative:</strong> Available upon request for GDPR compliance</p>
              </div>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Supervisory Authority</h2>
              <p className="text-gray-700">
                If you are in the EEA and believe we have not addressed your concerns adequately, you have the right to lodge a complaint with your local data protection supervisory authority.
              </p>
            </div>

            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                By using the eAIP Service, you acknowledge that you have read and understood this Privacy Policy.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
