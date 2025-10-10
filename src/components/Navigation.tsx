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
} from '@/components/ui/dropdown-menu';
import {
  Building2,
  FileText,
  Users,
  Settings,
  BarChart3,
  Globe,
  Shield,
  User,
  LogOut,
  Menu,
  ChevronDown,
  Home,
  PlusCircle,
  Eye,
  Bell,
  GitBranch,
  Calendar
} from 'lucide-react';

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
      title: 'Checklists',
      href: '/atc-dashboard',
      icon: FileText,
      roles: ['super_admin', 'atc', 'atc_supervisor', 'org_admin']
    },
    {
      title: 'Compliance',
      href: '/compliance',
      icon: Shield,
      roles: ['super_admin', 'org_admin', 'editor', 'viewer']
    },
    {
      title: 'Organization',
      href: '/organization/setup',
      icon: Building2,
      roles: ['org_admin']
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
      case 'super_admin': return 'bg-red-100 text-red-800';
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'atc_supervisor': return 'bg-orange-100 text-orange-800';
      case 'atc': return 'bg-cyan-100 text-cyan-800';
      case 'editor': return 'bg-blue-100 text-blue-800';
      case 'viewer': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isActiveRoute = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/auth/signin' });
  };

  const visibleItems = getVisibleItems();

  return (
    <nav className="sticky top-0 z-50 bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={user ? (user.role === 'super_admin' ? '/admin' : '/dashboard') : '/'}
              className="flex items-center"
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.organizationName}
                  className="h-7 w-auto"
                />
              ) : (
                <FileText className="h-7 w-7" style={{ color: branding.primaryColor }} />
              )}
              <span
                className="ml-2 text-lg font-bold"
                style={{ color: branding.primaryColor }}
              >
                {user?.organization?.name || branding.organizationName}
              </span>
            </Link>
          </div>

          {/* Desktop Navigation - Compact with More Menu */}
          <div className="hidden md:flex items-center flex-1 mx-2">
            <div className="flex items-center gap-0.5">
              {visibleItems.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const isActive = isActiveRoute(item.href);

                if (item.title === 'Organization' && user?.role === 'org_admin') {
                  return (
                    <DropdownMenu key="organization">
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={isActive ? "default" : "ghost"}
                          size="sm"
                          className={`px-1.5 py-1 h-8 text-xs ${
                            isActive ? 'text-white' : 'text-gray-600'
                          }`}
                          style={isActive ? { backgroundColor: branding.primaryColor } : {}}
                        >
                          <Icon className="w-4 h-4" />
                          <ChevronDown className="w-3 h-3 ml-0.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                          <Link href="/organization/setup" className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Setup
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/organization/users" className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Users
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/organization/analytics" className="flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            Analytics
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  );
                }

                return (
                  <Link key={item.href} href={item.href} title={item.title}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      size="sm"
                      className={`px-1.5 py-1 h-8 ${isActive ? 'text-white' : 'text-gray-600'}`}
                      style={isActive ? { backgroundColor: branding.primaryColor } : {}}
                    >
                      <Icon className="w-4 h-4" />
                    </Button>
                  </Link>
                );
              })}

              {visibleItems.length > 4 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="px-2 py-1 h-8 text-xs">
                      <Menu className="w-4 h-4" />
                      <ChevronDown className="w-3 h-3 ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {visibleItems.slice(4).map((item) => {
                      const Icon = item.icon;
                      const isActive = isActiveRoute(item.href);
                      return (
                        <DropdownMenuItem key={item.href} asChild>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-2 ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}
                          >
                            <Icon className="w-4 h-4" />
                            {item.title}
                          </Link>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Organization Badge (if applicable) */}
            {user?.organization && (
              <div className="hidden sm:block">
                <Badge variant="outline" className="text-xs">
                  {user.organization.name}
                </Badge>
              </div>
            )}

            {/* User Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium">{user?.name || 'User'}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium">{user?.name}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                  {user?.role && (
                    <Badge className={`mt-1 text-xs ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile Settings
                  </Link>
                </DropdownMenuItem>
                {user?.role === 'org_admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/organization/setup" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      Organization Settings
                    </Link>
                  </DropdownMenuItem>
                )}
                {user?.role === 'super_admin' && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      System Administration
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
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
                    <div className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                      <Icon className="w-5 h-5" />
                      <div>
                        <div className="font-medium">{item.title}</div>
                        {item.description && (
                          <div className="text-xs text-gray-500">{item.description}</div>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Mobile Organization Info */}
            {user?.organization && (
              <div className="mt-4 pt-4 border-t">
                <div className="px-3 py-2">
                  <div className="text-sm font-medium text-gray-900">Organization</div>
                  <div className="text-sm text-gray-600">{user.organization.name}</div>
                  <div className="text-xs text-gray-500">{user.organization.domain}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}