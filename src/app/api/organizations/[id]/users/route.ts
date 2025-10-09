import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { SecurityUtils } from '@/lib/security';
import { emailService } from '@/lib/email';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();


    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') || '';
    const search = searchParams.get('search') || '';

    // Verify organization exists
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Build query
    const query: any = { organization: params.id };
    if (role) {
      query.role = role;
    }
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    // Get users with pagination
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('createdBy', 'name email')
        .select('-__v')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching organization users:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organization users' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();


    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const {
      email,
      firstName,
      lastName,
      role,
      permissions,
      preferences
    } = body;

    // Verify organization exists
    const organization = await Organization.findById(params.id);
    if (!organization) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: email, firstName, lastName, role' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['org_admin', 'editor', 'viewer'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role. Must be one of: org_admin, editor, viewer' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check organization user limits
    const currentUserCount = await User.countDocuments({ organization: params.id });
    if (currentUserCount >= organization.subscription.maxUsers) {
      return NextResponse.json(
        {
          success: false,
          error: `Organization has reached its user limit of ${organization.subscription.maxUsers}`
        },
        { status: 400 }
      );
    }

    // Get creating user
    const createdBy = await getOrCreateDefaultUser();

    // Generate secure temporary password
    const { password: temporaryPassword, hashedPassword } = SecurityUtils.generateSecurePassword(16);

    // Create new user
    const user = new User({
      email: email.toLowerCase(),
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      password: hashedPassword,
      role,
      organization: params.id,
      isActive: true,
      isTemporaryPassword: true,
      mustChangePassword: true,
      permissions: permissions || [],
      preferences: {
        theme: preferences?.theme || 'auto',
        language: preferences?.language || 'en',
        timezone: preferences?.timezone || 'UTC',
        notifications: {
          email: preferences?.notifications?.email ?? true,
          browser: preferences?.notifications?.browser ?? true,
          slack: preferences?.notifications?.slack ?? false,
        },
        editor: {
          autoSave: preferences?.editor?.autoSave ?? true,
          spellCheck: preferences?.editor?.spellCheck ?? true,
          wordWrap: preferences?.editor?.wordWrap ?? true,
        }
      },
      createdBy
    });

    const savedUser = await user.save();

    // Populate references for response
    await savedUser.populate('organization', 'name domain');
    await savedUser.populate('createdBy', 'name email');

    // Send welcome email with credentials
    try {
      const emailSent = await emailService.sendWelcomeEmail({
        organizationName: organization.name,
        organizationDomain: organization.domain,
        adminName: savedUser.name,
        adminEmail: savedUser.email,
        temporaryPassword,
        loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL
      });

      if (!emailSent) {
        console.warn('Failed to send welcome email to:', savedUser.email);
      }
    } catch (emailError) {
      console.error('Error sending welcome email:', emailError);
      // Don't fail user creation if email fails
    }

    return NextResponse.json({
      success: true,
      data: savedUser,
      message: 'User created successfully and welcome email sent'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    );
  }
}