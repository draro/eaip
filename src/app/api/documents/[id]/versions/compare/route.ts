import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import { gitDocumentService } from '@/lib/gitDocumentService';
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

    const searchParams = req.nextUrl.searchParams;
    const hash1 = searchParams.get('hash1');
    const hash2 = searchParams.get('hash2');

    if (!hash1 || !hash2) {
      return NextResponse.json(
        { error: 'Both hash1 and hash2 are required' },
        { status: 400 }
      );
    }

    const comparison = await gitDocumentService.compareVersions(hash1, hash2);

    return NextResponse.json({ comparison });
  } catch (error: any) {
    console.error('Error comparing versions:', error);
    return NextResponse.json(
      { error: 'Failed to compare versions', details: error.message },
      { status: 500 }
    );
  }
}
