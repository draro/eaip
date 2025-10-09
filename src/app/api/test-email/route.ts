import { NextRequest, NextResponse } from 'next/server';
import { emailService } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emailTo, name, password } = body;

    if (!emailTo || !name || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: emailTo, name, password' },
        { status: 400 }
      );
    }

    // Test the email service with the n8n webhook
    const success = await emailService.sendWelcomeEmail({
      organizationName: 'Test Organization',
      organizationDomain: 'test.eaip.com',
      adminName: name,
      adminEmail: emailTo,
      temporaryPassword: password,
      loginUrl: 'http://localhost:3000/auth/signin',
      supportEmail: 'support@eaip.com'
    });

    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully via n8n webhook'
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to send test email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in test email endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}