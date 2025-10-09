import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPVersion from '@/models/AIPVersion';
import AIPDocument from '@/models/AIPDocument';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      versionId,
      targetEnvironment,
      userId,
      publishOptions,
    } = body;

    if (!versionId || !targetEnvironment || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: versionId, targetEnvironment, userId' },
        { status: 400 }
      );
    }

    if (!['staging', 'production'].includes(targetEnvironment)) {
      return NextResponse.json(
        { success: false, error: 'Invalid target environment. Must be staging or production' },
        { status: 400 }
      );
    }

    const version = await AIPVersion.findById(versionId)
      .populate('documents', 'title sectionCode subsectionCode status content');

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

    const publishedDocuments = version.documents.filter((doc: any) => doc.status === 'published');
    const draftDocuments = version.documents.filter((doc: any) => doc.status === 'draft');

    if (publishedDocuments.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No published documents found in this version' },
        { status: 400 }
      );
    }

    const publishJob = {
      versionId,
      version: version.versionNumber,
      airacCycle: version.airacCycle,
      effectiveDate: version.effectiveDate,
      targetEnvironment,
      publishedBy: userId,
      publishedAt: new Date().toISOString(),
      documents: publishedDocuments.map((doc: any) => ({
        id: doc._id.toString(),
        title: doc.title,
        sectionCode: doc.sectionCode,
        subsectionCode: doc.subsectionCode,
        status: doc.status,
        hasContent: doc.content && doc.content.content && doc.content.content.length > 0,
      })),
      options: publishOptions || {
        generateStaticSite: true,
        updateNavigationIndex: true,
        notifyStakeholders: targetEnvironment === 'production',
      },
      metadata: {
        totalDocuments: version.documents.length,
        publishedDocuments: publishedDocuments.length,
        draftDocuments: draftDocuments.length,
        publishedBy: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
        },
      },
    };

    const responseData = {
      success: true,
      message: `Publish request for ${targetEnvironment} environment initiated successfully`,
      publishJob,
      nextSteps: [
        'Static site generation will begin',
        'Navigation index will be updated',
        targetEnvironment === 'production' ? 'Stakeholders will be notified' : 'Staging deployment will be updated',
        'Publication status will be tracked in the system',
      ],
    };

    console.log(`Publish request initiated for version ${version.versionNumber} to ${targetEnvironment} by ${user.name}`);

    if (targetEnvironment === 'production') {
      await AIPVersion.findByIdAndUpdate(versionId, {
        status: 'active',
      });

      await AIPVersion.updateMany(
        { _id: { $ne: versionId }, status: 'active' },
        { status: 'archived' }
      );
    }

    const webhookPayload = {
      event: 'version.publish.requested',
      versionId,
      targetEnvironment,
      publishedBy: userId,
      timestamp: new Date().toISOString(),
      data: publishJob,
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

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error processing publish request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process publish request' },
      { status: 500 }
    );
  }
}