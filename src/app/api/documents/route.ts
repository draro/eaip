import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import { generateAiracCycle } from '@/lib/utils';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const versionId = searchParams.get('versionId');
    const status = searchParams.get('status');
    const sectionCode = searchParams.get('sectionCode');

    const filter: any = {};
    if (versionId) filter.version = versionId;
    if (status) filter.status = status;
    if (sectionCode) filter.sectionCode = sectionCode;

    const skip = (page - 1) * limit;

    const documents = await AIPDocument.find(filter)
      .populate('version', 'versionNumber airacCycle')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AIPDocument.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: documents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      title,
      sectionCode,
      subsectionCode,
      content,
      versionId,
      createdBy,
      effectiveDate,
    } = body;

    if (!title || !sectionCode || !subsectionCode || !versionId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create a default user if createdBy is not provided
    const userId = createdBy || await getOrCreateDefaultUser();

    const version = await AIPVersion.findById(versionId);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    const existingDoc = await AIPDocument.findOne({
      sectionCode,
      subsectionCode,
      version: versionId,
    });

    if (existingDoc) {
      return NextResponse.json(
        { success: false, error: 'Document with this section and subsection already exists for this version' },
        { status: 409 }
      );
    }

    const document = await AIPDocument.create({
      title,
      sectionCode,
      subsectionCode,
      content: content || { type: 'doc', content: [] },
      version: versionId,
      createdBy: userId,
      updatedBy: userId,
      airacCycle: version.airacCycle,
      effectiveDate: effectiveDate || version.effectiveDate,
      autoNumbering: {
        enabled: true,
        prefix: sectionCode,
        currentNumber: 1,
      },
      images: [],
    });

    await AIPVersion.findByIdAndUpdate(versionId, {
      $push: { documents: document._id },
    });

    const populatedDocument = await AIPDocument.findById(document._id)
      .populate('version', 'versionNumber airacCycle')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    const webhookPayload = {
      event: 'document.created' as const,
      docId: document._id.toString(),
      title: document.title,
      updatedBy: userId,
      timestamp: new Date().toISOString(),
      data: {
        sectionCode: document.sectionCode,
        subsectionCode: document.subsectionCode,
        status: document.status,
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

    return NextResponse.json(
      { success: true, data: populatedDocument },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create document' },
      { status: 500 }
    );
  }
}