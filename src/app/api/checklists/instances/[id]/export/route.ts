import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import User from '@/models/User';
import { ChecklistPdfExporter } from '@/lib/exporters/checklistPdfExporter';
import { ChecklistDocxExporter } from '@/lib/exporters/checklistDocxExporter';
import DocumentActionLog from '@/models/DocumentActionLog';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get export format from query params
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'pdf'; // pdf or docx

    if (!['pdf', 'docx'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be "pdf" or "docx"' },
        { status: 400 }
      );
    }

    // Fetch checklist instance with populated fields
    const instance = await ChecklistInstance.findById(params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('items.checkedBy', 'name email')
      .lean();

    if (!instance) {
      return NextResponse.json({ error: 'Checklist not found' }, { status: 404 });
    }

    // Verify user has access
    if (instance.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to export this checklist' },
        { status: 403 }
      );
    }

    // Prepare export options
    const exportOptions = {
      title: instance.title,
      description: instance.description,
      createdBy: {
        name: (instance.createdBy as any)?.name || 'Unknown',
        email: (instance.createdBy as any)?.email || '',
      },
      assignedTo: instance.assignedTo ? {
        name: (instance.assignedTo as any)?.name || 'Unknown',
        email: (instance.assignedTo as any)?.email || '',
      } : undefined,
      completedAt: instance.completedAt,
      dueDate: instance.dueDate,
      items: instance.items.map((item: any) => ({
        id: item._id.toString(),
        text: item.text,
        checked: item.checked || false,
        checkedBy: item.checkedBy ? {
          name: item.checkedBy.name || 'Unknown',
          email: item.checkedBy.email || '',
        } : undefined,
        checkedAt: item.checkedAt,
      })),
      metadata: {
        version: instance.version?.toString(),
        airacCycle: instance.airacCycle,
        effectiveDate: instance.effectiveDate?.toISOString(),
      },
    };

    // Generate export based on format
    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    if (format === 'pdf') {
      const exporter = new ChecklistPdfExporter();
      buffer = await exporter.export(exportOptions);
      contentType = 'application/pdf';
      filename = `${instance.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.pdf`;
    } else {
      const exporter = new ChecklistDocxExporter();
      buffer = await exporter.export(exportOptions);
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      filename = `${instance.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.docx`;
    }

    // Log export action
    try {
      await DocumentActionLog.create({
        actionType: 'exported',
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        checklistInstanceId: instance._id,
        organization: user.organization,
        details: {
          title: instance.title,
          format: format.toUpperCase(),
          itemsCount: instance.items.length,
          completedItems: instance.items.filter((item: any) => item.checked).length,
        },
        timestamp: new Date(),
      });
    } catch (logError) {
      console.error('Failed to log export action:', logError);
      // Don't fail the export if logging fails
    }

    // Return file as download
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error('Error exporting checklist:', error);
    return NextResponse.json(
      { error: 'Failed to export checklist', details: error.message },
      { status: 500 }
    );
  }
}
