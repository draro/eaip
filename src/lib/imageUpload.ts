import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface UploadResult {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
}

export async function uploadImageToLocal(
  file: File,
  uploadDir: string = 'public/uploads'
): Promise<UploadResult> {
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;
    const uploadPath = path.join(process.cwd(), uploadDir);
    const filePath = path.join(uploadPath, filename);

    await fs.mkdir(uploadPath, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return {
      id: uuidv4(),
      filename,
      originalName: file.name,
      url: `/uploads/${filename}`,
      size: file.size,
      mimeType: file.type,
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

export async function deleteImageFromLocal(filename: string, uploadDir: string = 'public/uploads'): Promise<void> {
  try {
    const filePath = path.join(process.cwd(), uploadDir, filename);
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'File type not supported. Please upload JPEG, PNG, GIF, or WebP images.',
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Please upload images smaller than 10MB.',
    };
  }

  return { valid: true };
}