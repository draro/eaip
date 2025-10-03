import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Organization from '@/models/Organization';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { withAuth } from '@/lib/apiMiddleware';
import { remoteStorage } from '@/lib/remoteStorage';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    let settings: any = {};

    // Super admin gets organization settings if they have one selected, or default settings
    if (user.role === 'super_admin') {
      if (user.organization) {
        const org = await Organization.findById(user.organization._id);
        if (org) {
          settings.companySettings = {
            domain: org.domain,
            name: org.name,
            authority: org.name,
            contact: org.contact,
            branding: org.branding || {
              colors: {
                primary: '#1f2937',
                secondary: '#3b82f6',
              },
            },
            remoteConnections: [],
            defaultSettings: org.settings,
          };
        }
      } else {
        // Default settings for super admin without organization
        settings.companySettings = {
          domain: '',
          name: 'eAIP System',
          authority: 'System Administrator',
          contact: { email: '', phone: '', address: '' },
          branding: {
            colors: {
              primary: '#1f2937',
              secondary: '#3b82f6',
            },
          },
          remoteConnections: [],
          defaultSettings: { language: 'en', timezone: 'UTC' },
        };
      }
    } else {
      // Regular users get organization settings
      const dbUser = await User.findById(user._id);
      if (dbUser?.organization) {
        const org = await Organization.findById(dbUser.organization);
        if (org) {
          settings.companySettings = {
            domain: org.domain,
            name: org.name,
            authority: org.name,
            contact: org.contact,
            branding: org.branding,
            remoteConnections: [],
            defaultSettings: org.settings,
          };
        }
      }
      settings.preferences = dbUser?.preferences;
    }

    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
});

export const PUT = withAuth(async (request: NextRequest, { user }) => {
  try {
    await connectDB();

    const body = await request.json();
    const { companySettings, preferences } = body;

    // Super admin or org admin can update organization settings
    if (user.role === 'super_admin' || user.role === 'org_admin') {
      if (companySettings && user.organization) {
        const org = await Organization.findById(user.organization._id);
        if (org) {
          // Update organization branding and settings
          if (companySettings.branding) {
            org.branding = companySettings.branding;
          }
          if (companySettings.contact) {
            org.contact = companySettings.contact;
          }
          if (companySettings.name) {
            org.name = companySettings.name;
          }
          if (companySettings.defaultSettings) {
            org.settings = {
              ...org.settings,
              ...companySettings.defaultSettings,
            };
          }

          await org.save();

          return NextResponse.json({
            success: true,
            data: {
              companySettings: {
                domain: org.domain,
                name: org.name,
                authority: org.name,
                contact: org.contact,
                branding: org.branding,
                defaultSettings: org.settings,
              },
              preferences,
            },
            message: 'Organization settings updated successfully',
          });
        }
      }
    }

    // Regular users can only update preferences
    if (preferences) {
      const dbUser = await User.findByIdAndUpdate(
        user._id,
        { preferences },
        { new: true, runValidators: true }
      );

      return NextResponse.json({
        success: true,
        data: {
          preferences: dbUser?.preferences,
        },
      });
    }

    return NextResponse.json({
      success: false,
      error: 'No valid updates provided',
    }, { status: 400 });

  } catch (error) {
    console.error('Error updating user settings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
});