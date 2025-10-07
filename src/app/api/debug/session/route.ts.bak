import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    return NextResponse.json({
      success: true,
      session,
      hasSession: !!session,
      user: session?.user || null,
    });
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get session' },
      { status: 500 }
    );
  }
}