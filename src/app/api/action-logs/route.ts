import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentActionLog from '@/models/DocumentActionLog';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const checklistInstanceId = searchParams.get('checklistInstanceId');
    const userId = searchParams.get('userId');
    const actionType = searchParams.get('actionType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const query: any = {
      organization: user.organization,
    };

    if (documentId) {
      query.documentId = documentId;
    }

    if (checklistInstanceId) {
      query.checklistInstanceId = checklistInstanceId;
    }

    if (userId) {
      query.userId = userId;
    }

    if (actionType) {
      query.actionType = actionType;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = new Date(startDate);
      }
      if (endDate) {
        query.timestamp.$lte = new Date(endDate);
      }
    }

    if (user.role !== 'super_admin' && user.role !== 'org_admin') {
      query.userId = user._id;
    }

    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      DocumentActionLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      DocumentActionLog.countDocuments(query),
    ]);

    return NextResponse.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching action logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch action logs', details: error.message },
      { status: 500 }
    );
  }
}
