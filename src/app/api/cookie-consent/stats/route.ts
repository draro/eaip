import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import CookieConsent from '@/models/CookieConsent';
import mongoose from 'mongoose';

// GET - Get cookie consent statistics (org_admin only)
export async function GET(req: NextRequest) {
  try {
    await connectDB();

    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Only org_admin and super_admin can view statistics
    if (!['org_admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized. Only organization admins can view consent statistics.' },
        { status: 403 }
      );
    }

    // Get user's organization from User model
    const User = (await import('@/models/User')).default;
    const user = await User.findById(session.user.id).select('organization');

    if (!user || !user.organization) {
      return NextResponse.json(
        { error: 'User organization not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(req.url);
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    if (startDateParam) {
      startDate = new Date(startDateParam);
    }
    if (endDateParam) {
      endDate = new Date(endDateParam);
    }

    const organizationId = new mongoose.Types.ObjectId(user.organization.toString());

    // Get overall statistics
    const stats = await (CookieConsent as any).getConsentStats(
      organizationId,
      startDate,
      endDate
    );

    // Get consent trend over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const trend = await CookieConsent.aggregate([
      {
        $match: {
          organization: organizationId,
          consentedAt: { $gte: startDate || thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$consentedAt' }
          },
          count: { $sum: 1 },
          acceptedFunctional: {
            $sum: { $cond: ['$preferences.functional', 1, 0] }
          },
          acceptedAnalytics: {
            $sum: { $cond: ['$preferences.analytics', 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get breakdown by preference combination
    const breakdown = await CookieConsent.aggregate([
      {
        $match: {
          organization: organizationId,
          consentedAt: { $gte: startDate || thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            functional: '$preferences.functional',
            analytics: '$preferences.analytics'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate percentages
    const total = stats.total || 1; // Avoid division by zero
    const percentages = {
      functional: ((stats.acceptedFunctional / total) * 100).toFixed(2),
      analytics: ((stats.acceptedAnalytics / total) * 100).toFixed(2),
      all: ((stats.acceptedAll / total) * 100).toFixed(2)
    };

    return NextResponse.json({
      success: true,
      statistics: {
        total: stats.total,
        acceptedFunctional: stats.acceptedFunctional,
        acceptedAnalytics: stats.acceptedAnalytics,
        acceptedAll: stats.acceptedAll,
        percentages
      },
      trend,
      breakdown,
      period: {
        startDate: startDate?.toISOString() || thirtyDaysAgo.toISOString(),
        endDate: endDate?.toISOString() || new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching consent statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch consent statistics' },
      { status: 500 }
    );
  }
}
