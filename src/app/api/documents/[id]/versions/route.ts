import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import { gitDocumentService } from '@/lib/gitDocumentService';
import ChecklistInstance from '@/models/ChecklistInstance';
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
    const documentType = searchParams.get('type') || 'checklist_instance';

    const instance = await ChecklistInstance.findById(params.id);
    if (!instance) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (
      instance.organization.toString() !== user.organization?.toString() &&
      user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to view this document history' },
        { status: 403 }
      );
    }

    const versions = await gitDocumentService.getVersionHistory(
      params.id,
      documentType as 'checklist_instance' | 'file'
    );

    return NextResponse.json({ versions });
  } catch (error: any) {
    console.error('Error fetching version history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch version history', details: error.message },
      { status: 500 }
    );
  }
}
