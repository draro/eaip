'use client';

import Link from 'next/link';
import { Plane, Mail, MapPin, Globe } from 'lucide-react';
import Image from 'next/image';

export default function PublicFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Column */}
          <div className="col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <Image
                src="/icon-192.png"
                alt="FlyClim Logo"
                width={120}
                height={60}
                className="h-8 w-auto"
                priority
              />
              <span className="text-2xl font-bold text-white">eAIP</span>
            </Link>
            <p className="text-sm text-gray-400 mb-4">
              ICAO Annex 15 & EUROCONTROL Spec 3.0 compliant eAIP management platform for civil aviation authorities.
            </p>
            <div className="flex space-x-4">
              <a href="https://flyclim.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                <Globe className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/features/overview" className="hover:text-white transition-colors">Features Overview</Link></li>
              <li><Link href="/features/security" className="hover:text-white transition-colors">Security & Privacy</Link></li>
              <li><Link href="/features/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
              <li><Link href="/features/workflow" className="hover:text-white transition-colors">Workflow</Link></li>
              <li><Link href="/features/export" className="hover:text-white transition-colors">Export</Link></li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/auth/signin" className="hover:text-white transition-colors">Request Demo</Link></li>
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className="text-white font-semibold mb-4">Legal & Privacy</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/legal/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/legal/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/legal/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
              <li><Link href="/legal/cookie-preferences" className="hover:text-white transition-colors">Cookie Preferences</Link></li>
              <li>
                <a href="mailto:privacy@flyclim.com" className="hover:text-white transition-colors flex items-center">
                  <Mail className="h-3 w-3 mr-1" />
                  Data Deletion Request
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* GDPR Compliance Notice */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <h4 className="text-white font-semibold mb-3 flex items-center">
              <Globe className="h-5 w-5 mr-2" />
              GDPR Compliance & Your Rights
            </h4>
            <p className="text-sm text-gray-400 mb-4">
              We are committed to protecting your personal data and respecting your privacy rights under the General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-300 font-medium mb-2">Your Data Rights:</p>
                <ul className="text-gray-400 space-y-1 text-xs">
                  <li>• Right to access your data</li>
                  <li>• Right to rectification</li>
                  <li>• Right to erasure ("right to be forgotten")</li>
                  <li>• Right to data portability</li>
                </ul>
              </div>
              <div>
                <p className="text-gray-300 font-medium mb-2">Exercise Your Rights:</p>
                <p className="text-gray-400 text-xs mb-2">
                  To request data deletion or exercise any GDPR rights, contact:
                </p>
                <a
                  href="mailto:privacy@flyclim.com"
                  className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
                >
                  <Mail className="h-4 w-4 mr-1" />
                  privacy@flyclim.com
                </a>
                <p className="text-gray-500 text-xs mt-2">
                  Include your registered email address. Response within 30 days.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-sm text-gray-500">
              © {currentYear} FLYCLIM. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <span>Powered by FLYCLIM</span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                Lisbon, Portugal
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Badges */}
        <div className="border-t border-gray-800 pt-6 mt-6">
          <div className="flex flex-wrap justify-center items-center gap-6 text-xs text-gray-600">
            <span className="flex items-center space-x-1">
              <span className="font-semibold text-gray-400">GDPR</span>
              <span>Compliant</span>
            </span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center space-x-1">
              <span className="font-semibold text-gray-400">ICAO Annex 15</span>
              <span>Certified</span>
            </span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center space-x-1">
              <span className="font-semibold text-gray-400">EUROCONTROL Spec 3.0</span>
              <span>Compatible</span>
            </span>
            <span className="text-gray-700">•</span>
            <span className="flex items-center space-x-1">
              <span className="font-semibold text-gray-400">ISO 27001</span>
              <span>Security</span>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
