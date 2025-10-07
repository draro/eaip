import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import { SecurityUtils } from '@/lib/security';
import { emailService } from '@/lib/email';
import { gitService } from '@/lib/gitService';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';

    // Build query
    const query: any = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { domain: { $regex: search, $options: 'i' } },
        { country: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) {
      query.status = status;
    }

    const skip = (page - 1) * limit;

    // Get organizations with pagination
    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .populate('createdBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Organization.countDocuments(query)
    ]);

    // Get user counts for each organization
    const orgIds = organizations.map(org => org._id);
    const userCounts = await User.aggregate([
      { $match: { organization: { $in: orgIds } } },
      { $group: { _id: '$organization', count: { $sum: 1 } } }
    ]);

    const userCountMap = userCounts.reduce((acc, item) => {
      acc[item._id.toString()] = item.count;
      return acc;
    }, {} as Record<string, number>);

    const organizationsWithStats = organizations.map(org => ({
      ...org.toObject(),
      userCount: userCountMap[org._id.toString()] || 0
    }));

    return NextResponse.json({
      success: true,
      data: {
        organizations: organizationsWithStats,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      name,
      domain,
      country,
      icaoCode,
      contact,
      settings,
      subscription
    } = body;

    // Validate required fields
    if (!name || !domain || !country || !contact?.email || !contact?.phone || !contact?.address || !settings?.publicUrl) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract first and last name from contact email or use defaults
    const emailLocalPart = contact.email.split('@')[0];
    const defaultFirstName = 'Organization';
    const defaultLastName = 'Administrator';

    // Check if domain already exists
    const existingOrg = await Organization.findOne({ domain: domain.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Get the user creating this organization (should be super admin)
    let userId;
    try {
      userId = await getOrCreateDefaultUser();
    } catch (userError) {
      console.error('Error getting default user:', userError);
      // Continue without createdBy for now
      userId = null;
    }

    // Generate slug from name
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Create new organization
    const organizationData = {
      name,
      slug,
      domain: domain.toLowerCase(),
      country: country.toUpperCase(),
      icaoCode: icaoCode?.toUpperCase(),
      contact,
      settings: {
        ...settings,
        publicUrl: settings.publicUrl.toLowerCase(),
        airacStartDate: settings.airacStartDate || new Date('2024-01-01'), // Default AIRAC start date
        enablePublicAccess: settings.enablePublicAccess !== false // Default to true
      },
      subscription: {
        plan: subscription?.plan || 'basic',
        maxUsers: subscription?.maxUsers || 5,
        maxDocuments: subscription?.maxDocuments || 10,
        features: subscription?.features || []
      },
      status: 'active',
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b'
      }
    };

    // Only add createdBy if we have a valid userId
    if (userId) {
      organizationData.createdBy = userId;
    }

    const organization = new Organization(organizationData);

    const savedOrg = await organization.save();
    console.log('Organization created successfully:', savedOrg._id);

    // Initialize Git repository for the organization
    const gitResult = await gitService.initializeOrgRepository(
      savedOrg._id.toString(),
      savedOrg.name,
      savedOrg.slug
    );

    if (!gitResult.success) {
      console.error('Failed to initialize Git repository:', gitResult.error);
      // Don't fail the entire operation, but log the error
    } else {
      console.log('Git repository initialized successfully:', gitResult.repoPath);
    }

    // Create organization admin user with secure temporary password
    const { password: temporaryPassword, hashedPassword } = SecurityUtils.generateSecurePassword(16);

    const firstName = contact.firstName || defaultFirstName;
    const lastName = contact.lastName || defaultLastName;

    const adminUser = new User({
      email: contact.email,
      name: `${firstName} ${lastName}`.trim(),
      firstName: firstName,
      lastName: lastName,
      password: hashedPassword,
      role: 'org_admin',
      organization: savedOrg._id,
      isActive: true,
      isTemporaryPassword: true,
      mustChangePassword: true,
      permissions: ['org.manage', 'users.manage', 'documents.manage'],
      preferences: {
        theme: 'auto',
        language: settings.language || 'en',
        timezone: settings.timezone || 'UTC',
        notifications: {
          email: true,
          browser: true,
          slack: false
        },
        editor: {
          autoSave: true,
          spellCheck: true,
          wordWrap: true
        }
      }
    });

    // Add createdBy if we have a valid userId
    if (userId) {
      adminUser.createdBy = userId;
    }

    try {
      const savedUser = await adminUser.save();
      console.log('Organization admin created successfully:', savedUser._id);

      // Send welcome email with temporary credentials
      const emailSent = await emailService.sendWelcomeEmail({
        organizationName: name,
        organizationDomain: domain,
        adminName: adminUser.name,
        adminEmail: contact.email,
        temporaryPassword,
        loginUrl: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        supportEmail: process.env.SUPPORT_EMAIL
      });

      if (!emailSent) {
        console.warn('Failed to send welcome email to:', contact.email);
      }

      // Remove password from response data
      const responseData = {
        ...savedOrg.toObject(),
        adminUser: {
          _id: savedUser._id,
          email: savedUser.email,
          name: savedUser.name,
          role: savedUser.role
        }
      };

      return NextResponse.json({
        success: true,
        data: responseData,
        message: `Organization created successfully. ${emailSent ? 'Welcome email sent to admin.' : 'Please contact admin manually with login credentials.'}`
      }, { status: 201 });

    } catch (userError) {
      console.error('Error creating organization admin:', userError);

      // Clean up - delete the organization if user creation failed
      try {
        await Organization.findByIdAndDelete(savedOrg._id);
        console.log('Cleaned up organization after user creation failure');
      } catch (cleanupError) {
        console.error('Failed to cleanup organization:', cleanupError);
      }

      return NextResponse.json({
        success: false,
        error: 'Failed to create organization administrator. Please try again.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}