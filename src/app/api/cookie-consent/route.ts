import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import CookieConsent from '@/models/CookieConsent';
import { randomBytes } from 'crypto';

// POST - Record cookie consent
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const body = await req.json();

    const { preferences, policyVersion } = body;

    if (!preferences || !policyVersion) {
      return NextResponse.json(
        { error: 'Preferences and policy version are required' },
        { status: 400 }
      );
    }

    // Validate preferences structure
    if (
      typeof preferences.essential !== 'boolean' ||
      typeof preferences.functional !== 'boolean' ||
      typeof preferences.analytics !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid preferences format' },
        { status: 400 }
      );
    }

    // Get user info
    const userId = session?.user?.id;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    // Generate or get session ID from cookie
    let sessionId: string | undefined;
    const sessionCookie = req.cookies.get('eaip_session_id');

    if (sessionCookie) {
      sessionId = sessionCookie.value;
    } else if (!userId) {
      // Generate new session ID for anonymous users
      sessionId = randomBytes(32).toString('hex');
    }

    // Create consent record
    const consentData: any = {
      preferences: {
        essential: true, // Always true
        functional: preferences.functional,
        analytics: preferences.analytics
      },
      policyVersion,
      ipAddress,
      userAgent,
      consentedAt: new Date()
    };

    if (userId) {
      consentData.userId = userId;
      // Note: organization will be set via user lookup if needed
    } else if (sessionId) {
      consentData.sessionId = sessionId;
    }

    const consent = await CookieConsent.create(consentData);

    // Set session cookie for anonymous users
    const response = NextResponse.json({
      success: true,
      consentId: consent._id,
      message: 'Cookie consent recorded successfully'
    });

    if (sessionId && !userId) {
      response.cookies.set('eaip_session_id', sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
      });
    }

    return response;
  } catch (error) {
    console.error('Error recording cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to record cookie consent' },
      { status: 500 }
    );
  }
}

// GET - Retrieve user's latest cookie consent
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const sessionId = req.cookies.get('eaip_session_id')?.value;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'No user or session identifier found' },
        { status: 401 }
      );
    }

    // Find latest consent
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else if (sessionId) {
      query.sessionId = sessionId;
    }

    const consent = await CookieConsent.findOne(query)
      .sort({ consentedAt: -1 })
      .select('preferences policyVersion consentedAt updatedAt');

    if (!consent) {
      return NextResponse.json(
        { success: true, hasConsent: false },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      hasConsent: true,
      consent: {
        preferences: consent.preferences,
        policyVersion: consent.policyVersion,
        consentedAt: consent.consentedAt,
        updatedAt: consent.updatedAt
      }
    });
  } catch (error) {
    console.error('Error retrieving cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve cookie consent' },
      { status: 500 }
    );
  }
}

// DELETE - Withdraw cookie consent (GDPR right to withdraw)
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const sessionId = req.cookies.get('eaip_session_id')?.value;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'No user or session identifier found' },
        { status: 401 }
      );
    }

    // Delete all consent records for this user/session
    const query: any = {};
    if (userId) {
      query.userId = userId;
    } else if (sessionId) {
      query.sessionId = sessionId;
    }

    const result = await CookieConsent.deleteMany(query);

    const response = NextResponse.json({
      success: true,
      message: 'Cookie consent withdrawn successfully',
      deletedCount: result.deletedCount
    });

    // Clear session cookie
    if (sessionId && !userId) {
      response.cookies.delete('eaip_session_id');
    }

    return response;
  } catch (error) {
    console.error('Error withdrawing cookie consent:', error);
    return NextResponse.json(
      { error: 'Failed to withdraw cookie consent' },
      { status: 500 }
    );
  }
}
