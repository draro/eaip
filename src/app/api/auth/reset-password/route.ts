import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SecurityUtils } from '@/lib/security';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// POST /api/auth/reset-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if this is a password reset request or forgot password request
    if ('email' in body) {
      return handleForgotPassword(body as ForgotPasswordRequest);
    } else {
      return handleResetPassword(body as ResetPasswordRequest);
    }
  } catch (error) {
    console.error('Error in password reset:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleForgotPassword(body: ForgotPasswordRequest) {
  const { email } = body;

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email is required' },
      { status: 400 }
    );
  }

  await connectDB();

  // Find user by email
  const user = await User.findOne({
    email: email.toLowerCase(),
    isActive: true
  }).populate('organization', 'name');

  // Always return success to prevent email enumeration attacks
  const successResponse = NextResponse.json({
    success: true,
    message: 'If an account with that email exists, you will receive password reset instructions.'
  });

  if (!user) {
    console.log('Password reset requested for non-existent email:', SecurityUtils.sanitizeLogInput(email));
    return successResponse;
  }

  // Check if account is locked
  if (user.isAccountLocked()) {
    console.log('Password reset requested for locked account:', SecurityUtils.sanitizeLogInput(email));
    return successResponse;
  }

  try {
    // Generate reset token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const emailSent = await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.organization?.name || 'eAIP System'
    );

    if (!emailSent) {
      console.error('Failed to send password reset email to:', SecurityUtils.sanitizeLogInput(email));
    }

    console.log('Password reset email sent to:', SecurityUtils.sanitizeLogInput(email));
    return successResponse;

  } catch (error) {
    console.error('Error sending password reset email:', error);
    return successResponse; // Still return success to prevent information leakage
  }
}

async function handleResetPassword(body: ResetPasswordRequest) {
  const { token, newPassword, confirmPassword } = body;

  if (!token || !newPassword || !confirmPassword) {
    return NextResponse.json(
      { success: false, error: 'All fields are required' },
      { status: 400 }
    );
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json(
      { success: false, error: 'Passwords do not match' },
      { status: 400 }
    );
  }

  // Validate password strength
  const passwordValidation = SecurityUtils.validatePasswordStrength(newPassword);
  if (!passwordValidation.isValid) {
    return NextResponse.json({
      success: false,
      error: 'Password does not meet security requirements',
      details: {
        errors: passwordValidation.errors,
        suggestions: passwordValidation.suggestions,
        score: passwordValidation.score
      }
    }, { status: 400 });
  }

  await connectDB();

  // Hash the token to compare with stored version
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid reset token
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
    isActive: true
  });

  if (!user) {
    return NextResponse.json(
      { success: false, error: 'Password reset token is invalid or has expired' },
      { status: 400 }
    );
  }

  try {
    // Hash new password
    const hashedPassword = await SecurityUtils.hashPassword(newPassword);

    // Update user password and clear reset fields
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      isTemporaryPassword: false,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1,
        lockedUntil: 1
      }
    });

    console.log('Password reset successfully for user:', SecurityUtils.sanitizeLogInput(user.email));

    return NextResponse.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset password. Please try again.' },
      { status: 500 }
    );
  }
}

// GET /api/auth/reset-password?token=xxx - Validate reset token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Reset token is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Hash the token to compare with stored version
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with valid reset token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
      isActive: true
    }).select('email');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Password reset token is invalid or has expired' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Reset token is valid',
      data: {
        email: user.email
      }
    });

  } catch (error) {
    console.error('Error validating reset token:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}