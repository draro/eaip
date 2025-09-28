import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const document = await AIPDocument.findById(params.id)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      content,
      status,
      updatedBy,
    } = body;

    const document = await AIPDocument.findById(params.id);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    // Get or create a default user if updatedBy is not provided
    const userId = updatedBy || await getOrCreateDefaultUser();

    const updateData: any = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (status !== undefined) updateData.status = status;

    const updatedDocument = await AIPDocument.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )
      .populate('version', 'versionNumber airacCycle')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    const webhookPayload = {
      event: 'document.updated' as const,
      docId: params.id,
      title: updatedDocument?.title,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
      data: {
        sectionCode: updatedDocument?.sectionCode,
        subsectionCode: updatedDocument?.subsectionCode,
        status: updatedDocument?.status,
        contentChanged: content !== undefined,
      },
    };

    try {
      if (process.env.N8N_WEBHOOK_URL) {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
      }
    } catch (webhookError) {
      console.error('Failed to send webhook:', webhookError);
    }

    return NextResponse.json({
      success: true,
      data: updatedDocument,
    });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const document = await AIPDocument.findById(params.id);
    if (!document) {
      return NextResponse.json(
        { success: false, error: 'Document not found' },
        { status: 404 }
      );
    }

    await AIPDocument.findByIdAndDelete(params.id);

    const webhookPayload = {
      event: 'document.deleted' as const,
      docId: params.id,
      title: document.title,
      timestamp: new Date().toISOString(),
      data: {
        sectionCode: document.sectionCode,
        subsectionCode: document.subsectionCode,
      },
    };

    try {
      if (process.env.N8N_WEBHOOK_URL) {
        await fetch(process.env.N8N_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhookPayload),
        });
      }
    } catch (webhookError) {
      console.error('Failed to send webhook:', webhookError);
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}