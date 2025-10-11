import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
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

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    const files = await DMSFile.find({
      organization: user.organization,
      isLatest: true,
    })
      .sort({ uploadedAt: -1 })
      .limit(limit)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name path')
      .lean();

    const accessibleFiles = files.filter((file: any) => {
      if (user.role === 'super_admin') return true;
      return file.allowedRoles.includes(user.role);
    });

    return NextResponse.json({ files: accessibleFiles });
  } catch (error: any) {
    console.error('Error fetching latest files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch latest files', details: error.message },
      { status: 500 }
    );
  }
}
