import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { IUser } from '@/types';

export interface AuthUser extends Omit<IUser, '_id'> {
  _id: string;
  organization?: {
    _id: string;
    name: string;
    domain: string;
    status: string;
  };
}

export class AuthError extends Error {
  constructor(message: string, public statusCode: number = 401) {
    super(message);
    this.name = 'AuthError';
  }
}

export async function authenticateUser(request: NextRequest): Promise<AuthUser> {
  try {
    await connectDB();

    // Check for email and password in headers (for API authentication)
    const email = request.headers.get('x-user-email');
    const password = request.headers.get('x-user-password');

    // Fallback to user ID for existing functionality
    const userId = request.headers.get('x-user-id') || 'default';

    let user;

    if (email && password) {
      // Authenticate with email and password
      user = await User.findOne({ email: email.toLowerCase() });

      if (!user || !user.verifyPassword(password)) {
        throw new AuthError('Invalid email or password', 401);
      }
    } else if (userId === 'default') {
      // Get default super admin user for testing
      const defaultEmail = 'admin@eaip.system';
      user = await User.findOne({ email: defaultEmail });

      if (!user) {
        throw new AuthError('Default user not found. Please run the reset script.', 404);
      }
    } else {
      user = await User.findById(userId);
    }

    if (!user) {
      throw new AuthError('User not found', 404);
    }

    if (!user.isActive) {
      throw new AuthError('User account is deactivated', 403);
    }

    // Populate organization if user has one
    if (user.organization) {
      await user.populate('organization', 'name domain status');

      if (user.organization && (user.organization as any).status === 'suspended') {
        throw new AuthError('Organization is suspended', 403);
      }
    }

    // Convert to plain object and transform _id
    const authUser = {
      ...user.toObject(),
      _id: user._id.toString(),
      organization: user.organization ? {
        _id: (user.organization as any)._id.toString(),
        name: (user.organization as any).name,
        domain: (user.organization as any).domain,
        status: (user.organization as any).status
      } : undefined
    };

    return authUser;
  } catch (error) {
    if (error instanceof AuthError) {
      throw error;
    }
    throw new AuthError('Authentication failed');
  }
}

export function requireRole(allowedRoles: string[]) {
  return (user: AuthUser) => {
    if (!allowedRoles.includes(user.role)) {
      throw new AuthError(`Access denied. Required roles: ${allowedRoles.join(', ')}`, 403);
    }
    return true;
  };
}

export function requireSuperAdmin(user: AuthUser) {
  return requireRole(['super_admin'])(user);
}

export function requireOrgAdmin(user: AuthUser) {
  return requireRole(['super_admin', 'org_admin'])(user);
}

export function requireEditor(user: AuthUser) {
  return requireRole(['super_admin', 'org_admin', 'editor'])(user);
}

export function requireOrganizationAccess(organizationId: string) {
  return (user: AuthUser) => {
    if (user.role === 'super_admin') {
      return true; // Super admin can access all organizations
    }

    if (!user.organization || user.organization._id !== organizationId) {
      throw new AuthError('Access denied to this organization', 403);
    }

    return true;
  };
}

export function requirePermission(permission: string) {
  return (user: AuthUser) => {
    if (user.role === 'super_admin' || user.permissions.includes('*')) {
      return true; // Super admin has all permissions
    }

    if (!user.permissions.includes(permission)) {
      throw new AuthError(`Missing required permission: ${permission}`, 403);
    }

    return true;
  };
}

export function canManageOrganization(user: AuthUser, organizationId: string): boolean {
  if (user.role === 'super_admin') return true;
  if (user.role === 'org_admin' && user.organization?._id === organizationId) return true;
  return false;
}

export function canEditDocuments(user: AuthUser): boolean {
  return ['super_admin', 'org_admin', 'editor'].includes(user.role);
}

export function canViewOrganization(user: AuthUser, organizationId: string): boolean {
  if (user.role === 'super_admin') return true;
  return user.organization?._id === organizationId;
}

export async function enforceDataIsolation(user: AuthUser, query: any = {}): Promise<any> {
  if (user.role === 'super_admin') {
    // Super admin can see all data
    return query;
  }

  if (!user.organization) {
    throw new AuthError('User not associated with any organization', 403);
  }

  // Add organization filter to query
  return {
    ...query,
    organization: user.organization._id
  };
}