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
        const org = await Organization.findById(user.organization._id).select('+aiApiKey');
        if (org) {
          settings.companySettings = {
            domain: org.domain,
            name: org.name,
            authority: org.name,
            contact: org.contact,
            branding: {
              colors: {
                primary: org.branding?.primaryColor || '#1f2937',
                secondary: org.branding?.secondaryColor || '#3b82f6',
              },
              textColor: org.branding?.textColor || '#000000',
              fontFamily: org.branding?.fontFamily || 'Inter, system-ui, sans-serif',
              fontSize: org.branding?.fontSize || '16px',
              footerText: org.branding?.footerText || 'This electronic AIP is published in accordance with ICAO Annex 15.',
              logoUrl: org.branding?.logoUrl,
            },
            remoteConnections: [],
            defaultSettings: {
              ...org.settings,
              enableExport: org.settings?.enableExport !== false,
              allowedExportFormats: org.settings?.allowedExportFormats || ['pdf', 'docx'],
            },
            aiProvider: org.aiProvider || 'claude',
            aiApiKey: org.aiApiKey || '',
            aiModel: org.aiModel || 'claude-sonnet-4-5-20250929',
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
          aiProvider: 'claude',
          aiApiKey: '',
          aiModel: 'claude-sonnet-4-5-20250929',
        };
      }
    } else {
      // Regular users and org_admin get organization settings
      const dbUser = await User.findById(user._id);
      if (dbUser?.organization) {
        const org = await Organization.findById(dbUser.organization).select(user.role === 'org_admin' ? '+aiApiKey' : '');
        if (org) {
          settings.companySettings = {
            domain: org.domain,
            name: org.name,
            authority: org.name,
            contact: org.contact,
            branding: {
              colors: {
                primary: org.branding?.primaryColor || '#1f2937',
                secondary: org.branding?.secondaryColor || '#3b82f6',
              },
              textColor: org.branding?.textColor || '#000000',
              fontFamily: org.branding?.fontFamily || 'Inter, system-ui, sans-serif',
              fontSize: org.branding?.fontSize || '16px',
              footerText: org.branding?.footerText || 'This electronic AIP is published in accordance with ICAO Annex 15.',
              logoUrl: org.branding?.logoUrl,
            },
            remoteConnections: [],
            defaultSettings: {
              ...org.settings,
              enableExport: org.settings?.enableExport !== false,
              allowedExportFormats: org.settings?.allowedExportFormats || ['pdf', 'docx'],
            },
          };

          // Include AI settings for org_admin
          if (user.role === 'org_admin') {
            settings.companySettings.aiProvider = org.aiProvider || 'claude';
            settings.companySettings.aiApiKey = org.aiApiKey || '';
            settings.companySettings.aiModel = org.aiModel || 'claude-sonnet-4-5-20250929';
          }
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
        const org = await Organization.findById(user.organization._id).select('+aiApiKey');
        if (org) {
          // Update organization branding and settings
          if (companySettings.branding) {
            org.branding = {
              ...org.branding,
              primaryColor: companySettings.branding.colors?.primary || org.branding?.primaryColor,
              secondaryColor: companySettings.branding.colors?.secondary || org.branding?.secondaryColor,
              textColor: companySettings.branding.textColor || org.branding?.textColor,
              fontFamily: companySettings.branding.fontFamily || org.branding?.fontFamily,
              fontSize: companySettings.branding.fontSize || org.branding?.fontSize,
              footerText: companySettings.branding.footerText || org.branding?.footerText,
              logoUrl: org.branding?.logoUrl, // Preserve existing logoUrl
            };
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
          // Update AI settings
          if (companySettings.aiProvider) {
            org.aiProvider = companySettings.aiProvider;
          }
          if (companySettings.aiApiKey !== undefined) {
            org.aiApiKey = companySettings.aiApiKey;
          }
          if (companySettings.aiModel) {
            org.aiModel = companySettings.aiModel;
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
                aiProvider: org.aiProvider,
                aiApiKey: org.aiApiKey,
                aiModel: org.aiModel,
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