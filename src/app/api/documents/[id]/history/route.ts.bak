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

    const document = await AIPDocument.findById(params.id).populate('organization');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get Git history
    const history = await gitService.getDocumentHistory(
      document.organization._id.toString(),
      params.id,
      50
    );

    return NextResponse.json({
      success: true,
      data: {
        documentId: params.id,
        documentTitle: document.title,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching document history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document history' },
      { status: 500 }
    );
  }
}
