import { NextRequest, NextResponse } from 'next/server';
import { AuthUser, AuthError } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export type AuthenticatedHandler = (
  request: NextRequest,
  context: { params?: any; user: AuthUser }
) => Promise<NextResponse>;

export function withAuth(handler: AuthenticatedHandler) {
  return async (request: NextRequest, context: { params?: any }) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session || !session.user) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized - Please sign in' },
          { status: 401 }
        );
      }

      // Get full user data from database
      await connectDB();
      const dbUser = await User.findOne({ email: session.user.email })
        .populate('organization', 'name domain status _id')
        .lean();

      if (!dbUser) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      if (!dbUser.isActive) {
        return NextResponse.json(
          { success: false, error: 'User account is deactivated' },
          { status: 403 }
        );
      }

      // Format user object
      const user = {
        _id: dbUser._id.toString(),
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role,
        organization: dbUser.organization ? {
          _id: (dbUser.organization as any)._id.toString(),
          name: (dbUser.organization as any).name,
          domain: (dbUser.organization as any).domain,
          status: (dbUser.organization as any).status
        } : undefined
      };

      return await handler(request, { ...context, user });
    } catch (error) {
      if (error instanceof AuthError) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: error.statusCode }
        );
      }

      console.error('Authentication error:', error);
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}

export function withRoleAuth(allowedRoles: string[]) {
  return function (handler: AuthenticatedHandler) {
    return withAuth(async (request, context) => {
      const { user } = context;

      if (!allowedRoles.includes(user.role)) {
        return NextResponse.json(
          {
            success: false,
            error: `Access denied. Required roles: ${allowedRoles.join(', ')}`
          },
          { status: 403 }
        );
      }

      return await handler(request, context);
    });
  };
}

export function withSuperAdminAuth(handler: AuthenticatedHandler) {
  return withRoleAuth(['super_admin'])(handler);
}

export function withOrgAdminAuth(handler: AuthenticatedHandler) {
  return withRoleAuth(['super_admin', 'org_admin'])(handler);
}

export function withEditorAuth(handler: AuthenticatedHandler) {
  return withRoleAuth(['super_admin', 'org_admin', 'editor'])(handler);
}

export function withOrganizationAuth(handler: AuthenticatedHandler) {
  return withAuth(async (request, context) => {
    const { user, params } = context;
    const organizationId = params?.id || params?.organizationId;

    if (!organizationId) {
      return NextResponse.json(
        { success: false, error: 'Organization ID required' },
        { status: 400 }
      );
    }

    // Super admin can access all organizations
    if (user.role === 'super_admin') {
      return await handler(request, context);
    }

    // Other users can only access their own organization
    if (!user.organization || user.organization._id !== organizationId) {
      return NextResponse.json(
        { success: false, error: 'Access denied to this organization' },
        { status: 403 }
      );
    }

    return await handler(request, context);
  });
}

export function createErrorResponse(error: any, defaultMessage: string = 'An error occurred') {
  console.error('API Error:', error);

  if (error instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.statusCode }
    );
  }

  if (error.name === 'ValidationError') {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }

  if (error.code === 11000) {
    // MongoDB duplicate key error
    const field = Object.keys(error.keyPattern || {})[0];
    return NextResponse.json(
      { success: false, error: `${field} already exists` },
      { status: 409 }
    );
  }

  return NextResponse.json(
    { success: false, error: defaultMessage },
    { status: 500 }
  );
}

export function validateRequiredFields(body: any, requiredFields: string[]) {
  const missingFields = requiredFields.filter(field => {
    const value = field.split('.').reduce((obj, key) => obj?.[key], body);
    return value === undefined || value === null || value === '';
  });

  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
}

export function paginateQuery(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '10')));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function buildSearchQuery(searchTerm: string, searchFields: string[]) {
  if (!searchTerm) return {};

  return {
    $or: searchFields.map(field => ({
      [field]: { $regex: searchTerm, $options: 'i' }
    }))
  };
}