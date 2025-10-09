'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plane, Menu, X } from 'lucide-react';
import { useState } from 'react';
import Image from "next/image";

export default function PublicNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features/overview' },
    { name: 'Document Management', href: '/features/document-management' },
    { name: 'NOTAM', href: '/features/notam-management' },
    { name: 'Compliance', href: '/features/compliance' },
    { name: 'Workflow', href: '/features/workflow' },
    { name: 'Export', href: '/features/export' },
    { name: 'Version Control', href: '/features/version-control' },
  ];

  return (
    <nav className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Image
                src="/icon-192.png"
                alt="FlyClim Logo"
                width={120}
                height={60}
                className="h-8 w-auto"
                priority
              />
            <span className="text-2xl font-bold text-gray-900">eAIP</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <Link href="/">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                Home
              </Button>
            </Link>

            <div className="relative group">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                Features
              </Button>
              <div className="absolute left-0 mt-2 w-64 bg-white rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-2">
                  <Link href="/features/overview" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Features Overview
                  </Link>
                  <Link href="/features/document-management" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Document Management
                  </Link>
                  <Link href="/features/notam-management" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    NOTAM Management
                  </Link>
                  <Link href="/features/compliance" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Compliance & Validation
                  </Link>
                  <Link href="/features/workflow" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Workflow Management
                  </Link>
                  <Link href="/features/export" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Export & Distribution
                  </Link>
                  <Link href="/features/version-control" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600">
                    Version Control
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/about">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                About
              </Button>
            </Link>

            <Link href="/contact">
              <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
                Contact
              </Button>
            </Link>
          </div>

          {/* Reserved Area Button */}
          <div className="hidden lg:flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">
                Reserved Area
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Request Demo
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Home
            </Link>
            <Link href="/features/overview" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Features Overview
            </Link>
            <Link href="/features/document-management" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Document Management
            </Link>
            <Link href="/features/notam-management" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              NOTAM Management
            </Link>
            <Link href="/features/compliance" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Compliance
            </Link>
            <Link href="/features/workflow" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Workflow
            </Link>
            <Link href="/features/export" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Export
            </Link>
            <Link href="/features/version-control" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Version Control
            </Link>
            <Link href="/about" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              About
            </Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
              Contact
            </Link>
            <div className="border-t border-gray-200 mt-4 pt-4 px-3 space-y-2">
              <Link href="/auth/signin" className="block">
                <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
                  Reserved Area
                </Button>
              </Link>
              <Link href="/auth/signin" className="block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Request Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}