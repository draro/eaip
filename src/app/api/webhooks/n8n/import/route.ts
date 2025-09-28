import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import User from '@/models/User';

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
      userId,
      source,
      metadata,
    } = body;

    if (!title || !sectionCode || !subsectionCode || !versionId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const version = await AIPVersion.findById(versionId);
    if (!version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const existingDoc = await AIPDocument.findOne({
      sectionCode,
      subsectionCode,
      version: versionId,
    });

    let document;

    if (existingDoc) {
      document = await AIPDocument.findByIdAndUpdate(
        existingDoc._id,
        {
          title,
          content: content || { type: 'doc', content: [] },
          updatedBy: userId,
          updatedAt: new Date(),
        },
        { new: true }
      ).populate('version', 'versionNumber airacCycle')
        .populate('updatedBy', 'name email');

      console.log(`Updated existing document: ${document.title} via n8n import from ${source || 'unknown'}`);
    } else {
      document = await AIPDocument.create({
        title,
        sectionCode,
        subsectionCode,
        content: content || { type: 'doc', content: [] },
        version: versionId,
        createdBy: userId,
        updatedBy: userId,
        airacCycle: version.airacCycle,
        effectiveDate: version.effectiveDate,
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

      document = populatedDocument;

      console.log(`Created new document: ${document.title} via n8n import from ${source || 'unknown'}`);
    }

    const responsePayload = {
      event: existingDoc ? 'document.imported.updated' : 'document.imported.created',
      docId: document._id.toString(),
      title: document.title,
      sectionCode: document.sectionCode,
      subsectionCode: document.subsectionCode,
      timestamp: new Date().toISOString(),
      source: source || 'n8n',
      metadata: metadata || {},
    };

    return NextResponse.json({
      success: true,
      data: document,
      message: existingDoc ? 'Document updated successfully' : 'Document created successfully',
      payload: responsePayload,
    });
  } catch (error) {
    console.error('Error processing n8n import:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process import' },
      { status: 500 }
    );
  }
}