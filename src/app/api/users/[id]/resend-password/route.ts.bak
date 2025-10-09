import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { SecurityUtils } from '@/lib/security';
import { emailService } from '@/lib/email';
import crypto from 'crypto';

// Use the same hash function as NextAuth
function hashPassword(password: string): string {
  return crypto
    .createHash('sha256')
    .update(password + 'eAIP_salt_2025')
    .digest('hex');
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const user = await User.findById(params.id).populate('organization');

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new temporary password using SecurityUtils (for strong password generation)
    const { password: temporaryPassword } = SecurityUtils.generateSecurePassword(16);

    // Hash it using the same method as NextAuth (SHA256)
    const hashedPassword = hashPassword(temporaryPassword);

    // Update user with new password and set temporary flags
    user.password = hashedPassword;
    user.isTemporaryPassword = true;
    user.mustChangePassword = true;
    await user.save();

    // Send email with new credentials
    const emailSent = await emailService.sendPasswordResetEmail({
      userName: user.name,
      userEmail: user.email,
      temporaryPassword,
      loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      organizationName: user.role === 'super_admin' ? 'eAIP System' : (user.organization?.name || 'eAIP System'),
      supportEmail: process.env.SUPPORT_EMAIL
    });

    if (!emailSent) {
      console.warn('Failed to send password reset email to:', user.email);
      return NextResponse.json({
        success: true,
        data: {
          temporaryPassword, // Return password so admin can manually share it
          user: {
            id: user._id,
            name: user.name,
            email: user.email
          }
        },
        message: 'Password reset successfully, but email delivery failed. Please share the password manually.',
        emailSent: false
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      },
      message: 'Password reset successfully. Email sent to user.',
      emailSent: true
    });

  } catch (error) {
    console.error('Error resending password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend password' },
      { status: 500 }
    );
  }
}
