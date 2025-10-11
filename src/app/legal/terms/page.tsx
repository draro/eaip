'use client';

import Link from 'next/link';
import PublicNav from '@/components/PublicNav';
import PublicFooter from '@/components/PublicFooter';
import { FileText, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
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
              <FileText className="h-10 w-10" />
              <h1 className="text-4xl font-bold">Terms of Service</h1>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                By accessing and using the eAIP platform ("Service") provided by FLYCLIM ("we," "us," or "our"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to these Terms of Service, please do not use our Service.
              </p>
              <p className="text-gray-700">
                The Service is an Aeronautical Information Publication (AIP) management platform designed for civil aviation authorities, air navigation service providers, and related organizations.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Use License</h2>
              <p className="text-gray-700 mb-4">
                Subject to your compliance with these Terms, we grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Service for your organization's aeronautical information management purposes.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.1 Permitted Use</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Create, edit, and publish aeronautical information publications</li>
                <li>Manage NOTAM (Notices to Airmen) in compliance with ICAO standards</li>
                <li>Collaborate with authorized team members within your organization</li>
                <li>Export and distribute AIP documents in approved formats</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">2.2 Restrictions</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-2">
                <li>You may not sublicense, sell, or redistribute access to the Service</li>
                <li>You may not reverse engineer or attempt to extract source code</li>
                <li>You may not use the Service for unlawful purposes</li>
                <li>You may not interfere with or disrupt the Service's operation</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. User Accounts and Responsibilities</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.1 Account Registration</h3>
              <p className="text-gray-700 mb-4">
                To access the Service, your organization must register for an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Provide accurate, current, and complete information during registration</li>
                <li>Maintain and promptly update your account information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Notify us immediately of any unauthorized use of your account</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700">
                You are responsible for all activities that occur under your account. We recommend using strong passwords and enabling any available security features.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Data and Content</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.1 Your Content</h3>
              <p className="text-gray-700 mb-4">
                You retain all rights to the aeronautical information, documents, and data you upload or create using the Service ("Your Content"). You grant us a limited license to host, store, and process Your Content solely to provide the Service.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.2 Content Responsibilities</h3>
              <p className="text-gray-700 mb-4">
                You are solely responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>The accuracy and completeness of aeronautical information published</li>
                <li>Compliance with ICAO Annex 15 and applicable aviation regulations</li>
                <li>Obtaining necessary rights to any third-party content you upload</li>
                <li>The safety implications of published aeronautical information</li>
              </ul>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">4.3 Data Protection</h3>
              <p className="text-gray-700">
                We implement industry-standard security measures to protect Your Content. For details, see our <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Service Availability and Support</h2>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.1 Service Level</h3>
              <p className="text-gray-700 mb-4">
                We strive to maintain 99.9% uptime for the Service. Scheduled maintenance will be announced in advance when possible.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">5.2 Support</h3>
              <p className="text-gray-700">
                Technical support is provided based on your subscription tier. Enterprise customers receive priority support with dedicated assistance.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Fees and Payment</h2>
              <p className="text-gray-700 mb-4">
                Access to the Service is provided on a subscription basis. Fees are determined by your subscription plan and are billed according to the agreed payment schedule.
              </p>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">6.1 Payment Terms</h3>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>Fees are non-refundable except as required by law</li>
                <li>Failure to pay may result in suspension of Service access</li>
                <li>We reserve the right to modify pricing with 30 days' notice</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Intellectual Property</h2>
              <p className="text-gray-700 mb-4">
                The Service, including its software, user interface, and documentation, is owned by FLYCLIM and protected by intellectual property laws. Our trademarks and logos may not be used without prior written consent.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Limitation of Liability</h2>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4 space-y-2">
                <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
                <li>WE ARE NOT LIABLE FOR THE ACCURACY OF AERONAUTICAL INFORMATION PUBLISHED USING THE SERVICE</li>
                <li>WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
                <li>OUR TOTAL LIABILITY SHALL NOT EXCEED THE FEES PAID IN THE 12 MONTHS PRECEDING THE CLAIM</li>
              </ul>
              <p className="text-gray-700">
                Nothing in these Terms excludes or limits liability for death or personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold FLYCLIM harmless from any claims, damages, losses, and expenses (including legal fees) arising from your use of the Service, Your Content, or violation of these Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Termination</h2>
              <p className="text-gray-700 mb-4">
                Either party may terminate this agreement with 30 days' written notice. We may immediately suspend or terminate your access if you breach these Terms.
              </p>
              <p className="text-gray-700">
                Upon termination, you may export Your Content for a period of 30 days. After this period, we may delete Your Content in accordance with our data retention policy.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Changes to Terms</h2>
              <p className="text-gray-700">
                We reserve the right to modify these Terms at any time. Material changes will be notified via email and posted on the Service at least 30 days before taking effect. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Governing Law</h2>
              <p className="text-gray-700">
                These Terms are governed by and construed in accordance with the laws of Portugal, without regard to conflict of law provisions. Any disputes shall be resolved in the courts of Lisbon, Portugal.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <p className="text-gray-900 font-semibold mb-2">FLYCLIM</p>
                <p className="text-gray-700">Email: <a href="mailto:legal@flyclim.com" className="text-blue-600 hover:underline">legal@flyclim.com</a></p>
                <p className="text-gray-700">Website: <a href="https://eaip.flyclim.com" className="text-blue-600 hover:underline">https://eaip.flyclim.com</a></p>
              </div>
            </section>

            <div className="border-t border-gray-200 pt-8">
              <p className="text-sm text-gray-500">
                By using the eAIP Service, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>
      </div>
      <PublicFooter />
    </>
  );
}
