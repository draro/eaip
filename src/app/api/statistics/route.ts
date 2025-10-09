import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import AIPDocument from '@/models/AIPDocument';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const organizationId = searchParams.get('organizationId');

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Base queries - filter by organization if provided
    const baseQuery = organizationId ? { organization: organizationId } : {};
    const baseOrgQuery = organizationId ? { _id: organizationId } : {};

    // Get overall statistics
    const [
      totalOrganizations,
      totalUsers,
      totalDocuments,
      activeUsers,
      activeOrganizations,
      recentActivity
    ] = await Promise.all([
      Organization.countDocuments(baseOrgQuery),
      User.countDocuments(baseQuery),
      AIPDocument.countDocuments(baseQuery),
      User.countDocuments({
        ...baseQuery,
        isActive: true,
        lastLoginAt: { $gte: startDate }
      }),
      Organization.countDocuments({
        ...baseOrgQuery,
        status: 'active'
      }),
      AIPDocument.find(baseQuery)
        .populate('updatedBy', 'name email')
        .populate('organization', 'name domain')
        .sort({ updatedAt: -1 })
        .limit(10)
        .select('title status updatedAt updatedBy organization')
    ]);

    // Get user distribution by role
    const usersByRole = await User.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    // Get document distribution by status
    const documentsByStatus = await AIPDocument.aggregate([
      { $match: baseQuery },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get organization subscription distribution
    const subscriptionDistribution = await Organization.aggregate([
      { $match: baseOrgQuery },
      { $group: { _id: '$subscription.plan', count: { $sum: 1 } } }
    ]);

    // Get growth trends over the period
    const growthTrends = await Promise.all([
      // Users created over time
      User.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      // Documents created over time
      AIPDocument.aggregate([
        {
          $match: {
            ...baseQuery,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ]),
      // Organizations created over time (only if not filtering by specific org)
      organizationId ? [] : Organization.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$createdAt'
              }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id': 1 } }
      ])
    ]);

    // Get top organizations by activity (if not filtering by specific org)
    let topOrganizations = [];
    if (!organizationId) {
      topOrganizations = await Organization.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: 'organization',
            as: 'users'
          }
        },
        {
          $lookup: {
            from: 'aipdocuments',
            localField: '_id',
            foreignField: 'organization',
            as: 'documents'
          }
        },
        {
          $addFields: {
            userCount: { $size: '$users' },
            documentCount: { $size: '$documents' },
            activityScore: {
              $add: [
                { $multiply: [{ $size: '$users' }, 2] },
                { $size: '$documents' }
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            domain: 1,
            status: 1,
            userCount: 1,
            documentCount: 1,
            activityScore: 1,
            createdAt: 1
          }
        },
        { $sort: { activityScore: -1 } },
        { $limit: 10 }
      ]);
    }

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalOrganizations,
          totalUsers,
          totalDocuments,
          activeUsers,
          activeOrganizations
        },
        distributions: {
          usersByRole: usersByRole.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
          documentsByStatus: documentsByStatus.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>),
          subscriptionPlans: subscriptionDistribution.reduce((acc, item) => {
            acc[item._id] = item.count;
            return acc;
          }, {} as Record<string, number>)
        },
        trends: {
          users: growthTrends[0],
          documents: growthTrends[1],
          organizations: growthTrends[2]
        },
        recentActivity,
        topOrganizations,
        period: {
          days: periodDays,
          startDate,
          endDate: new Date()
        }
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}