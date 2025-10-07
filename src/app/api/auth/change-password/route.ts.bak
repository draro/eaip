import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SecurityUtils } from '@/lib/security';

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body: ChangePasswordRequest = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate input
    if (!currentPassword || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { success: false, error: 'New passwords do not match' },
        { status: 400 }
      );
    }

    // Validate new password strength
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

    // Find user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check account lock status
    if (user.isAccountLocked()) {
      const lockExpires = new Date(user.lockedUntil).toLocaleTimeString();
      return NextResponse.json({
        success: false,
        error: `Account is locked due to too many failed attempts. Try again after ${lockExpires}.`
      }, { status: 423 });
    }

    // Verify current password (unless it's a temporary password and mustChangePassword is true)
    if (!user.mustChangePassword || !user.isTemporaryPassword) {
      const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        await user.incrementLoginAttempts();
        return NextResponse.json(
          { success: false, error: 'Current password is incorrect' },
          { status: 400 }
        );
      }
    }

    // Hash new password
    const hashedNewPassword = await SecurityUtils.hashPassword(newPassword);

    // Update user
    await User.findByIdAndUpdate(user._id, {
      password: hashedNewPassword,
      isTemporaryPassword: false,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      $unset: {
        lockedUntil: 1,
        passwordResetToken: 1,
        passwordResetExpires: 1
      }
    });

    console.log('Password changed successfully for user:', SecurityUtils.sanitizeLogInput(user.email));

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}