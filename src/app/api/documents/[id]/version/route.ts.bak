import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { gitService } from '@/lib/gitService';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const commit = searchParams.get('commit');

    if (!commit) {
      return NextResponse.json(
        { success: false, error: 'Commit hash is required' },
        { status: 400 }
      );
    }

    const document = await AIPDocument.findById(params.id).populate('organization');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Restore document from Git at the specified commit
    const restoredResult = await gitService.restoreDocument(
      document.organization._id.toString(),
      params.id,
      commit
    );

    if (!restoredResult.success) {
      return NextResponse.json(
        { success: false, error: restoredResult.error || 'Failed to restore document version' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: restoredResult.document
    });
  } catch (error) {
    console.error('Error fetching document version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document version' },
      { status: 500 }
    );
  }
}
