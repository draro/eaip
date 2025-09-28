import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

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

    // Check if domain already exists
    const existingOrg = await Organization.findOne({ domain: domain.toLowerCase() });
    if (existingOrg) {
      return NextResponse.json(
        { success: false, error: 'Domain already exists' },
        { status: 409 }
      );
    }

    // Get the user creating this organization (should be super admin)
    const userId = await getOrCreateDefaultUser();

    // Create new organization
    const organization = new Organization({
      name,
      domain: domain.toLowerCase(),
      country: country.toUpperCase(),
      icaoCode: icaoCode?.toUpperCase(),
      contact,
      settings: {
        ...settings,
        publicUrl: settings.publicUrl.toLowerCase()
      },
      subscription: {
        plan: subscription?.plan || 'basic',
        maxUsers: subscription?.maxUsers || 5,
        maxDocuments: subscription?.maxDocuments || 10,
        features: subscription?.features || []
      },
      createdBy: userId
    });

    await organization.save();

    return NextResponse.json({
      success: true,
      data: organization,
      message: 'Organization created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}