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

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { newPassword } = body;

    // Find user
    const user = await User.findById(params.id).populate('organization', 'name domain');
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    let temporaryPassword: string;

    // If newPassword is provided, generate new password, otherwise use existing logic
    if (newPassword) {
      const { password: newTempPassword, hashedPassword } = SecurityUtils.generateSecurePassword(16);
      temporaryPassword = newTempPassword;

      // Update user with new password
      await User.findByIdAndUpdate(params.id, {
        password: hashedPassword,
        isTemporaryPassword: true,
        mustChangePassword: true,
        failedLoginAttempts: 0,
        lastPasswordReset: new Date()
      });
    } else {
      // For resending email without changing password, we need to generate a new temp password
      // since we can't recover the original one (it's hashed)
      const { password: newTempPassword, hashedPassword } = SecurityUtils.generateSecurePassword(16);
      temporaryPassword = newTempPassword;

      await User.findByIdAndUpdate(params.id, {
        password: hashedPassword,
        isTemporaryPassword: true,
        mustChangePassword: true,
        failedLoginAttempts: 0
      });
    }

    // Send welcome/credentials email
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
        console.warn('Failed to resend email to:', user.email);
        return NextResponse.json({
          success: false,
          message: 'Email could not be sent. Please check your email configuration.',
          temporaryPassword // Include password in response if email fails
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: 'Email sent successfully to user'
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      return NextResponse.json({
        success: false,
        message: 'Email could not be sent. Please check your email configuration.',
        temporaryPassword, // Include password in response if email fails
        error: emailError.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error resending email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resend email' },
      { status: 500 }
    );
  }
}