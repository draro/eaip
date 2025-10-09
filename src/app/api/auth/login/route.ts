import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import crypto from 'crypto';

// Helper function to hash password
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + 'eAIP_salt_2025').digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('organization', 'name domain status');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const hashedInputPassword = hashPassword(password);
    if (user.password !== hashedInputPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 403 }
      );
    }

    // Check if organization is active (if user has one)
    if (user.organization && (user.organization as any).status === 'suspended') {
      return NextResponse.json(
        { success: false, error: 'Organization is suspended' },
        { status: 403 }
      );
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Return user data (excluding password)
    const userData = {
      _id: user._id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      organization: user.organization,
      avatar: user.avatar,
      permissions: user.permissions,
      preferences: user.preferences,
      lastLoginAt: user.lastLoginAt,
      isActive: user.isActive
    };

    return NextResponse.json({
      success: true,
      data: userData,
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Login endpoint available',
    usage: 'POST with { email, password } in body'
  });
}