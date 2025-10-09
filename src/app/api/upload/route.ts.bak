import { NextRequest, NextResponse } from 'next/server';
import { uploadImageToLocal, validateImageFile } from '@/lib/imageUpload';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentId = formData.get('documentId') as string;
    const uploadedBy = formData.get('uploadedBy') as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    const validation = validateImageFile(file);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const uploadResult = await uploadImageToLocal(file);

    if (documentId) {
      await connectDB();
      // Get or create a default user if uploadedBy is not provided
      const userId = uploadedBy && uploadedBy !== 'default-user' ? uploadedBy : await getOrCreateDefaultUser();

      const imageData = {
        ...uploadResult,
        uploadedAt: new Date(),
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