import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentReader from '@/models/DocumentReader';
import User from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Get recent readers (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const readers = await DocumentReader.find({
      document: params.id,
      documentType: 'checklist_instance',
      organization: user.organization,
      openedAt: { $gte: twentyFourHoursAgo },
    })
      .populate('user', 'name email')
      .sort({ openedAt: -1 })
      .limit(50)
      .lean();

    // Group by user and get latest read time
    const readerMap = new Map();
    readers.forEach((reader: any) => {
      const userId = reader.user._id.toString();
      if (!readerMap.has(userId) || reader.openedAt > readerMap.get(userId).openedAt) {
        readerMap.set(userId, {
          userId: reader.user._id,
          name: reader.user.name,
          email: reader.user.email,
          lastOpenedAt: reader.openedAt,
        });
      }
    });

    const uniqueReaders = Array.from(readerMap.values());

    return NextResponse.json({
      readers: uniqueReaders,
      totalReads: readers.length,
    });
  } catch (error: any) {
    console.error('Error fetching readers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch readers', details: error.message },
      { status: 500 }
    );
  }
}
