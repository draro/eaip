import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { versionDiffService } from '@/lib/versionDiff';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { fromVersionId, toVersionId, documentId } = body;

    if (!fromVersionId || !toVersionId || !documentId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: fromVersionId, toVersionId, documentId' },
        { status: 400 }
      );
    }

    // Get documents for both versions
    const fromDocument = await AIPDocument.findOne({
      _id: documentId,
      version: fromVersionId
    });

    const toDocument = await AIPDocument.findOne({
      _id: documentId,
      version: toVersionId
    });

    if (!fromDocument || !toDocument) {
      return NextResponse.json(
        { success: false, error: 'Documents not found for specified versions' },
        { status: 404 }
      );
    }

    // Check if diff already exists
    let diff = await versionDiffService.getDiff(fromVersionId, toVersionId, documentId);

    if (!diff) {
      // Generate new diff
      const userId = await getOrCreateDefaultUser();
      diff = await versionDiffService.generateDiff(fromDocument, toDocument, userId);
    }

    return NextResponse.json({
      success: true,
      data: diff,
    });
  } catch (error) {
    console.error('Error generating version diff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate version diff' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');
    const fromVersionId = searchParams.get('fromVersionId');
    const toVersionId = searchParams.get('toVersionId');

    if (documentId && fromVersionId && toVersionId) {
      // Get specific diff
      const diff = await versionDiffService.getDiff(fromVersionId, toVersionId, documentId);

      if (!diff) {
        return NextResponse.json(
          { success: false, error: 'Diff not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: diff,
      });
    } else if (documentId) {
      // Get document history
      const history = await versionDiffService.getDocumentHistory(documentId);

      return NextResponse.json({
        success: true,
        data: history,
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error fetching version diff:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version diff' },
      { status: 500 }
    );
  }
}