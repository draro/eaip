import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

export interface FileUploadResult {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface FileValidation {
  valid: boolean;
  error?: string;
}

export class FileStorageService {
  private baseUploadDir: string;

  constructor(baseUploadDir: string = 'public/uploads') {
    this.baseUploadDir = baseUploadDir;
  }

  async uploadFile(
    file: File,
    subDir?: string
  ): Promise<FileUploadResult> {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = path.extname(file.name);
      const filename = `${uuidv4()}${fileExtension}`;

      const uploadPath = subDir
        ? path.join(process.cwd(), this.baseUploadDir, subDir)
        : path.join(process.cwd(), this.baseUploadDir);

      const filePath = path.join(uploadPath, filename);

      await fs.mkdir(uploadPath, { recursive: true });
      await fs.writeFile(filePath, buffer);

      const urlPath = subDir ? `/uploads/${subDir}/${filename}` : `/uploads/${filename}`;

      return {
        id: uuidv4(),
        filename,
        originalName: file.name,
        url: urlPath,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  }

  async deleteFile(filename: string, subDir?: string): Promise<void> {
    try {
      const filePath = subDir
        ? path.join(process.cwd(), this.baseUploadDir, subDir, filename)
        : path.join(process.cwd(), this.baseUploadDir, filename);

      await fs.unlink(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  }

  async fileExists(filename: string, subDir?: string): Promise<boolean> {
    try {
      const filePath = subDir
        ? path.join(process.cwd(), this.baseUploadDir, subDir, filename)
        : path.join(process.cwd(), this.baseUploadDir, filename);

      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getFileInfo(filename: string, subDir?: string) {
    try {
      const filePath = subDir
        ? path.join(process.cwd(), this.baseUploadDir, subDir, filename)
        : path.join(process.cwd(), this.baseUploadDir, filename);

      const stats = await fs.stat(filePath);

      return {
        size: stats.size,
        createdAt: stats.birthtime,
        modifiedAt: stats.mtime,
      };
    } catch (error) {
      console.error('Error getting file info:', error);
      return null;
    }
  }

  validateFile(
    file: File,
    options: {
      maxSize?: number;
      allowedTypes?: string[];
      allowedExtensions?: string[];
    } = {}
  ): FileValidation {
    const {
      maxSize = 50 * 1024 * 1024,
      allowedTypes,
      allowedExtensions,
    } = options;

    if (allowedTypes && !allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not supported. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    if (allowedExtensions) {
      const ext = path.extname(file.name).toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        return {
          valid: false,
          error: `File extension not supported. Allowed extensions: ${allowedExtensions.join(', ')}`,
        };
      }
    }

    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      return {
        valid: false,
        error: `File size too large. Maximum size is ${maxSizeMB}MB.`,
      };
    }

    return { valid: true };
  }

  validateImageFile(file: File): FileValidation {
    return this.validateFile(file, {
      maxSize: 10 * 1024 * 1024,
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
    });
  }

  validateDocumentFile(file: File): FileValidation {
    return this.validateFile(file, {
      maxSize: 50 * 1024 * 1024,
      allowedTypes: [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
        'text/plain',
      ],
      allowedExtensions: ['.pdf', '.docx', '.doc', '.txt'],
    });
  }
}

export const fileStorage = new FileStorageService();
