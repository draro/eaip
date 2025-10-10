'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useBranding } from '@/contexts/BrandingContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Building2, FileText, Users, Settings, ChartBar as BarChart3, Globe, Shield, User, LogOut, Menu, ChevronDown, Bell, GitBranch, Calendar, SquareCheck as CheckSquare, Eye, X } from 'lucide-react';

interface NavigationProps {
  user?: {
    name: string;
    email: string;
    role: 'super_admin' | 'org_admin' | 'atc_supervisor' | 'atc' | 'editor' | 'viewer';
    organization?: {
      name: string;
      domain: string;
    };
  };
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  roles: string[];
}

export default function Navigation({ user }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { branding } = useBranding();

  // Define navigation items based on roles
  const navigationItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: user?.role === 'super_admin' ? '/admin' : (user?.role === 'atc' || user?.role === 'atc_supervisor') ? '/atc-dashboard' : '/dashboard',
      icon: BarChart3,
      roles: ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor', 'viewer']
    },
    {
      title: 'Documents',
      href: '/documents',
      icon: FileText,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'Checklists',
      href: '/atc-dashboard',
      icon: CheckSquare,
      roles: ['super_admin', 'atc', 'atc_supervisor', 'org_admin']
    },
    {
      title: 'NOTAM',
      href: '/notam',
      icon: Bell,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'AIRAC',
      href: '/airac',
      icon: Calendar,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'Workflow',
      href: '/workflow',
      icon: GitBranch,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'Compliance',
      href: '/compliance',
      icon: Shield,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'Public',
      href: '/public',
      icon: Globe,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    }
  ];

  const getVisibleItems = () => {
    if (!user) return [];
    return navigationItems.filter(item => item.roles.includes(user.role));
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin': return 'bg-red-500 text-white';
      case 'org_admin': return 'bg-purple-500 text-white';
      case 'atc_supervisor': return 'bg-orange-500 text-white';
      case 'atc': return 'bg-cyan-500 text-white';
      case 'editor': return 'bg-blue-500 text-white';
      case 'viewer': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'org_admin': return 'Org Admin';
      case 'atc_supervisor': return 'ATC Supervisor';
      case 'atc': return 'ATC';
      case 'editor': return 'Editor';
      case 'viewer': return 'Viewer';
      default: return role;
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href === '/dashboard') return pathname === '/dashboard';
    if (href === '/atc-dashboard') return pathname === '/atc-dashboard';
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const visibleItems = getVisibleItems();

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <Link
              href={user ? (user.role === 'super_admin' ? '/admin' : (user.role === 'atc' || user.role === 'atc_supervisor') ? '/atc-dashboard' : '/dashboard') : '/'}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.organizationName}
                  className="h-8 w-auto"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <span className="text-xl font-bold text-gray-900">
                    {user?.organization?.name || branding.organizationName || 'eAIP'}
                  </span>
                </div>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveRoute(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    size="sm"
                    className={`flex items-center gap-2 ${
                      isActive
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.title}</span>
                  </Button>
                </Link>
              );
            })}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 hover:bg-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="hidden md:block text-right">
                      <div className="text-sm font-medium text-gray-900">{user?.name || 'User'}</div>
                      <div className="text-xs text-gray-500">{user?.email}</div>
                    </div>
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold shadow-sm">
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <DropdownMenuLabel>
                  <div className="flex flex-col gap-1">
                    <div className="font-medium text-gray-900">{user?.name}</div>
                    <div className="text-xs text-gray-500 font-normal">{user?.email}</div>
                    {user?.role && (
                      <Badge className={`${getRoleColor(user.role)} mt-1 w-fit text-xs`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    )}
                    {user?.organization && (
                      <div className="text-xs text-gray-500 mt-1">
                        {user.organization.name}
                      </div>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'org_admin' && (
                  <>
                    <DropdownMenuItem asChild>
                      <Link href="/organization/setup" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Organization Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/organization/users" className="flex items-center gap-2 cursor-pointer">
                        <Users className="w-4 h-4" />
                        Manage Users
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
                {user?.role === 'super_admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Shield className="w-4 h-4" />
                      System Administration
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t">
            <div className="space-y-1">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <div
                      className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.title}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
