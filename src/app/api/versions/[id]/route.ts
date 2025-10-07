import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPVersion from '@/models/AIPVersion';
import AIPDocument from '@/models/AIPDocument';

export async function GET(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();


    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    const version = await AIPVersion.findById(params.id)
      .populate('createdBy', 'name email')
      .populate({
        path: 'documents',
        select: 'title sectionCode subsectionCode status createdAt updatedAt',
        populate: {
          path: 'updatedBy',
          select: 'name email',
        },
      });

    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: version,
    });
  } catch (error) {
    console.error('Error fetching version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch version' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();


    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    const body = await request.json();
    const {
      versionNumber,
      description,
      status,
      effectiveDate,
    } = body;

    const version = await AIPVersion.findById(params.id);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (versionNumber !== undefined) updateData.versionNumber = versionNumber;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate);

    if (status === 'active') {
      await AIPVersion.updateMany(
        { _id: { $ne: params.id }, status: 'active' },
        { status: 'archived' }
      );
    }

    const updatedVersion = await AIPVersion.findByIdAndUpdate(
      params.id,
      updateData,
      { new: true }
    )
      .populate('createdBy', 'name email')
      .populate('documents', 'title sectionCode subsectionCode status');

    if (status === 'published') {
      const webhookPayload = {
        event: 'version.published' as const,
        versionId: params.id,
        timestamp: new Date().toISOString(),
        data: {
          versionNumber: updatedVersion?.versionNumber,
          airacCycle: updatedVersion?.airacCycle,
          effectiveDate: updatedVersion?.effectiveDate,
          documentCount: updatedVersion?.documents.length,
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
    }

    return NextResponse.json({
      success: true,
      data: updatedVersion,
    });
  } catch (error) {
    console.error('Error updating version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update version' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params?: { id: string } }
) {
  try {
    await connectDB();


    if (!params?.id) {
      return NextResponse.json(
        { success: false, error: 'ID is required' },
        { status: 400 }
      );
    }
    const version = await AIPVersion.findById(params.id);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    if (version.status === 'active') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete active version' },
        { status: 400 }
      );
    }

    await AIPDocument.deleteMany({ version: params.id });
    await AIPVersion.findByIdAndDelete(params.id);

    return NextResponse.json({
      success: true,
      message: 'Version and associated documents deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete version' },
      { status: 500 }
    );
  }
}