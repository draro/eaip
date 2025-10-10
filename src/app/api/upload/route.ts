import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { fileStorage } from '@/lib/fileStorage';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import User from '@/models/User';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = fileType === 'document'
      ? fileStorage.validateDocumentFile(file)
      : fileStorage.validateImageFile(file);

    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const subDir = fileType === 'logo' ? 'logos' : undefined;
    const uploadResult = await fileStorage.uploadFile(file, subDir);

    if (documentId) {
      await connectDB();

      let userId;
      if (session?.user?.id) {
        userId = session.user.id;
      } else {
        userId = await getOrCreateDefaultUser();
      }

      const imageData = {
        ...uploadResult,
        uploadedBy: userId,
      };

      await AIPDocument.findByIdAndUpdate(documentId, {
        $push: { images: imageData },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        url: uploadResult.url,
        id: uploadResult.id,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        mimeType: uploadResult.mimeType,
      },
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}