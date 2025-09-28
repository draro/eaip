import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { remoteStorage } from '@/lib/remoteStorage';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // In a real app, get userId from session
    const userId = await getOrCreateDefaultUser();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const userSettings = {
      companySettings: user.companySettings,
      preferences: user.preferences,
    };

    return NextResponse.json({
      success: true,
      data: userSettings,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { companySettings, preferences } = body;

    // In a real app, get userId from session
    const userId = await getOrCreateDefaultUser();

    const updateData: any = {};
    if (companySettings) updateData.companySettings = companySettings;
    if (preferences) updateData.preferences = preferences;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        companySettings: user.companySettings,
        preferences: user.preferences,
      },
    });
  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}