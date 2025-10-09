import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { gitService } from '@/lib/gitService';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();

    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'Document ID is required' },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const fromCommit = searchParams.get('from');
    const toCommit = searchParams.get('to') || 'HEAD';
    const comparePrevious = searchParams.get('comparePrevious') === 'true';

    const document = await AIPDocument.findById(params.id).populate('organization');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    let diff;

    if (comparePrevious) {
      // Compare with previous version
      diff = await gitService.compareWithPrevious(
        document.organization._id.toString(),
        params.id
      );

      if (!diff) {
        return NextResponse.json({
          success: true,
          data: {
            message: 'No previous version available for comparison',
            diff: null
          }
        });
      }
    } else if (fromCommit) {
      // Compare specific commits
      diff = await gitService.getDiff(
        document.organization._id.toString(),
        fromCommit,
        toCommit
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Either provide "from" commit or set "comparePrevious=true"' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        documentId: params.id,
        documentTitle: document.title,
        diff
      }
    });
  } catch (error) {
    console.error('Error fetching document diff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document diff' },
      { status: 500 }
    );
  }
}
