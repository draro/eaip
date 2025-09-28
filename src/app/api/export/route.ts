import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import AIPVersion from '@/models/AIPVersion';
import ExportJob from '@/models/ExportJob';
import { DocxExporter } from '@/lib/exporters/docxExporter';
import { SimplePdfExporter } from '@/lib/exporters/simplePdfExporter';
import { XmlExporter, HtmlExporter } from '@/lib/exporters/xmlExporter';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      documentIds,
      format,
      versionId,
      requestedBy,
    } = body;

    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Document IDs are required' },
        { status: 400 }
      );
    }

    if (!['docx', 'pdf', 'xml', 'html'].includes(format)) {
      return NextResponse.json(
        { success: false, error: 'Invalid format. Must be docx, pdf, xml, or html' },
        { status: 400 }
      );
    }

    if (!versionId) {
      return NextResponse.json(
        { success: false, error: 'Version ID is required' },
        { status: 400 }
      );
    }

    // Get or create a default user if requestedBy is not provided
    const userId = requestedBy && requestedBy !== 'default-user' ? requestedBy : await getOrCreateDefaultUser();

    const exportJob = await ExportJob.create({
      type: format,
      documentIds,
      version: versionId,
      requestedBy: userId,
      status: 'pending',
    });

    const jobResponse = await processExportJob(exportJob._id.toString());

    return NextResponse.json({
      success: true,
      data: {
        jobId: exportJob._id,
        status: jobResponse.status,
        downloadUrl: jobResponse.downloadUrl,
        message: jobResponse.message,
      },
    });
  } catch (error) {
    console.error('Error creating export job:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create export job' },
      { status: 500 }
    );
  }
}

async function processExportJob(jobId: string) {
  try {
    const job = await ExportJob.findById(jobId)
      .populate('version', 'versionNumber airacCycle effectiveDate')
      .populate('requestedBy', 'name email');

    if (!job) {
      throw new Error('Export job not found');
    }

    await ExportJob.findByIdAndUpdate(jobId, { status: 'processing' });

    const documents = await AIPDocument.find({
      _id: { $in: job.documentIds },
    }).populate('version', 'versionNumber airacCycle effectiveDate');

    if (documents.length === 0) {
      throw new Error('No documents found for export');
    }

    let exportedData: Buffer | string;
    let fileExtension: string;
    let mimeType: string;

    if (job.type === 'docx') {
      exportedData = await exportToDocx(documents);
      fileExtension = 'docx';
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (job.type === 'pdf') {
      exportedData = await exportToPdf(documents);
      fileExtension = 'html'; // Using HTML for now, change to 'pdf' when using real PDF library
      mimeType = 'text/html'; // Change to 'application/pdf' when using real PDF library
    } else if (job.type === 'xml') {
      exportedData = await exportToXml(documents);
      fileExtension = 'xml';
      mimeType = 'application/xml';
    } else if (job.type === 'html') {
      exportedData = await exportToHtml(documents);
      fileExtension = 'html';
      mimeType = 'text/html';
    } else {
      throw new Error('Unsupported export format');
    }

    const exportDir = path.join(process.cwd(), 'public', 'exports');
    await fs.mkdir(exportDir, { recursive: true });

    const filename = `${job.version.versionNumber}-${Date.now()}.${fileExtension}`;
    const filePath = path.join(exportDir, filename);

    if (typeof exportedData === 'string') {
      await fs.writeFile(filePath, exportedData, 'utf8');
    } else {
      await fs.writeFile(filePath, exportedData);
    }

    const downloadUrl = `/exports/${filename}`;

    await ExportJob.findByIdAndUpdate(jobId, {
      status: 'completed',
      downloadUrl,
      completedAt: new Date(),
    });

    const webhookPayload = {
      event: 'export.completed' as const,
      exportJobId: jobId,
      timestamp: new Date().toISOString(),
      data: {
        format: job.type,
        documentCount: documents.length,
        downloadUrl,
        requestedBy: job.requestedBy,
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

    return {
      status: 'completed',
      downloadUrl,
      message: 'Export completed successfully',
    };
  } catch (error) {
    console.error('Error processing export job:', error);

    await ExportJob.findByIdAndUpdate(jobId, {
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      status: 'failed',
      message: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

async function exportToDocx(documents: any[]): Promise<Buffer> {
  const exporter = new DocxExporter();

  if (documents.length === 1) {
    const doc = documents[0];
    return await exporter.export(doc.content, {
      title: doc.title,
      sectionCode: doc.sectionCode,
      subsectionCode: doc.subsectionCode,
      version: doc.version.versionNumber,
      airacCycle: doc.version.airacCycle,
      effectiveDate: doc.version.effectiveDate.toISOString().split('T')[0],
    });
  } else {
    const combinedContent = {
      type: 'doc',
      content: documents.flatMap(doc => [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `${doc.sectionCode} ${doc.subsectionCode} - ${doc.title}` }],
        },
        ...doc.content.content || [],
        { type: 'paragraph', content: [] }, // spacer
      ]),
    };

    return await exporter.export(combinedContent, {
      title: 'Combined AIP Documents',
      sectionCode: 'MULTI',
      subsectionCode: 'ALL',
      version: documents[0].version.versionNumber,
      airacCycle: documents[0].version.airacCycle,
      effectiveDate: documents[0].version.effectiveDate.toISOString().split('T')[0],
    });
  }
}

async function exportToPdf(documents: any[]): Promise<Buffer> {
  const exporter = new SimplePdfExporter();

  if (documents.length === 1) {
    const doc = documents[0];
    return await exporter.export(doc.content, {
      title: doc.title,
      sectionCode: doc.sectionCode,
      subsectionCode: doc.subsectionCode,
      version: doc.version.versionNumber,
      airacCycle: doc.version.airacCycle,
      effectiveDate: doc.version.effectiveDate.toISOString().split('T')[0],
    });
  } else {
    const combinedContent = {
      type: 'doc',
      content: documents.flatMap(doc => [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `${doc.sectionCode} ${doc.subsectionCode} - ${doc.title}` }],
        },
        ...doc.content.content || [],
        { type: 'paragraph', content: [] }, // spacer
      ]),
    };

    return await exporter.export(combinedContent, {
      title: 'Combined AIP Documents',
      sectionCode: 'MULTI',
      subsectionCode: 'ALL',
      version: documents[0].version.versionNumber,
      airacCycle: documents[0].version.airacCycle,
      effectiveDate: documents[0].version.effectiveDate.toISOString().split('T')[0],
    });
  }
}

async function exportToXml(documents: any[]): Promise<string> {
  const exporter = new XmlExporter();

  if (documents.length === 1) {
    const doc = documents[0];
    return exporter.export(doc.content, {
      title: doc.title,
      sectionCode: doc.sectionCode,
      subsectionCode: doc.subsectionCode,
      version: doc.version.versionNumber,
      airacCycle: doc.version.airacCycle,
      effectiveDate: doc.version.effectiveDate.toISOString().split('T')[0],
    });
  } else {
    const combinedContent = {
      type: 'doc',
      content: documents.flatMap(doc => [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `${doc.sectionCode} ${doc.subsectionCode} - ${doc.title}` }],
        },
        ...doc.content.content || [],
      ]),
    };

    return exporter.export(combinedContent, {
      title: 'Combined AIP Documents',
      sectionCode: 'MULTI',
      subsectionCode: 'ALL',
      version: documents[0].version.versionNumber,
      airacCycle: documents[0].version.airacCycle,
      effectiveDate: documents[0].version.effectiveDate.toISOString().split('T')[0],
    });
  }
}

async function exportToHtml(documents: any[]): Promise<string> {
  const exporter = new HtmlExporter();

  if (documents.length === 1) {
    const doc = documents[0];
    return exporter.export(doc.content, {
      title: doc.title,
      sectionCode: doc.sectionCode,
      subsectionCode: doc.subsectionCode,
      version: doc.version.versionNumber,
      airacCycle: doc.version.airacCycle,
      effectiveDate: doc.version.effectiveDate.toISOString().split('T')[0],
    });
  } else {
    const combinedContent = {
      type: 'doc',
      content: documents.flatMap(doc => [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: `${doc.sectionCode} ${doc.subsectionCode} - ${doc.title}` }],
        },
        ...doc.content.content || [],
      ]),
    };

    return exporter.export(combinedContent, {
      title: 'Combined AIP Documents',
      sectionCode: 'MULTI',
      subsectionCode: 'ALL',
      version: documents[0].version.versionNumber,
      airacCycle: documents[0].version.airacCycle,
      effectiveDate: documents[0].version.effectiveDate.toISOString().split('T')[0],
    });
  }
}