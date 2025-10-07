import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';

export async function GET() {
  try {
    await connectDB();

    const organizations = await Organization.find({
      status: 'active',
      'settings.enablePublicAccess': true
    })
      .select('name domain country icaoCode settings branding')
      .sort({ name: 1 });

    return NextResponse.json({
      success: true,
      data: organizations
    });
  } catch (error) {
    console.error('Error fetching public organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}