import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { documentConverter } from '@/lib/documentConverter';
import { fileStorage } from '@/lib/fileStorage';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const importType = formData.get('importType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = fileStorage.validateDocumentFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let result;

    if (file.type.includes('word') || file.name.endsWith('.docx')) {
      if (importType === 'html') {
        result = await documentConverter.convertDocxToHtml(buffer);
      } else if (importType === 'text') {
        result = await documentConverter.convertDocxToText(buffer);
      } else {
        result = await documentConverter.convertDocxToTipTap(buffer);
      }
    } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
      result = await documentConverter.parsePdf(buffer);
    } else {
      return NextResponse.json(
        { success: false, error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Conversion failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        content: result.metadata || result.html || result.text,
        text: result.text,
        html: result.html,
        metadata: result.metadata,
        originalFileName: file.name,
      },
    });
  } catch (error) {
    console.error('Document import error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import document' },
      { status: 500 }
    );
  }
}
