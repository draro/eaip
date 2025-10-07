import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { SecurityUtils } from '@/lib/security';
import { emailService } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    // Find user
    const user = await User.findById(params.id).populate('organization', 'name domain');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate new secure temporary password
    const { password: temporaryPassword, hashedPassword } = SecurityUtils.generateSecurePassword(16);

    // Update user with new password
    await User.findByIdAndUpdate(params.id, {
      password: hashedPassword,
      isTemporaryPassword: true,
      mustChangePassword: true,
      failedLoginAttempts: 0,
      lastPasswordReset: new Date()
    });

    // Send password reset email
    try {
      const emailSent = await emailService.sendWelcomeEmail({
        organizationName: user.organization.name,
        organizationDomain: user.organization.domain,
        adminName: user.name,
        adminEmail: user.email,
        temporaryPassword,
        loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL
      });

      if (!emailSent) {
        console.warn('Failed to send password reset email to:', user.email);
        return NextResponse.json({
          success: true,
          message: 'Password reset successfully, but email could not be sent. Please provide the user with this temporary password.',
          temporaryPassword // Include password in response if email fails
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully and email sent to user'
      });
    } catch (emailError) {
      console.error('Error sending password reset email:', emailError);
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully, but email could not be sent. Please provide the user with this temporary password.',
        temporaryPassword // Include password in response if email fails
      });
    }
  } catch (error) {
    console.error('Error resetting user password:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset user password' },
      { status: 500 }
    );
  }
}