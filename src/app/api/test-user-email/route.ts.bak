import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, userEmail, userName, temporaryPassword } = body;

    if (!userEmail || !userName || !temporaryPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userEmail, userName, temporaryPassword' },
        { status: 400 }
      );
    }

    // Test the email service with user credentials
    const success = await emailService.sendWelcomeEmail({
      organizationName: 'Test Organization',
      organizationDomain: 'test.eaip.com',
      adminName: userName,
      adminEmail: userEmail,
      temporaryPassword,
      loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      supportEmail: process.env.SUPPORT_EMAIL
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'User credentials email sent successfully via n8n webhook'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send user credentials email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test user email endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}