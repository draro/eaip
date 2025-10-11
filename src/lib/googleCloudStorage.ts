import { Storage } from '@google-cloud/storage';

// Initialize Google Cloud Storage
let storage: Storage | null = null;

export function getGCSClient(): Storage {
  if (storage) {
    return storage;
  }

  // Check if credentials are provided
  if (!process.env.GCS_PROJECT_ID || !process.env.GCS_BUCKET_NAME) {
    throw new Error('Google Cloud Storage credentials not configured');
  }

  // Initialize with credentials from environment variables
  if (process.env.GCS_CREDENTIALS_JSON) {
    // Use JSON credentials (recommended for production)
    const credentials = JSON.parse(process.env.GCS_CREDENTIALS_JSON);
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      credentials,
    });
  } else if (process.env.GCS_KEY_FILE) {
    // Use key file path (for local development)
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
      keyFilename: process.env.GCS_KEY_FILE,
    });
  } else {
    // Use default credentials (for GCP environment)
    storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
    });
  }

  return storage;
}

export interface UploadOptions {
  bucketName?: string;
  destination: string;
  file: Buffer | Uint8Array;
  contentType?: string;
  metadata?: Record<string, string>;
  makePublic?: boolean;
}

/**
 * Upload a file to Google Cloud Storage
 */
export async function uploadToGCS(options: UploadOptions): Promise<{
  success: boolean;
  url: string;
  gsUrl: string;
  publicUrl?: string;
}> {
  const storage = getGCSClient();
  const bucketName = options.bucketName || process.env.GCS_BUCKET_NAME!;
  const bucket = storage.bucket(bucketName);
  const file = bucket.file(options.destination);

  try {
    // Upload file
    await file.save(options.file, {
      contentType: options.contentType,
      metadata: {
        metadata: options.metadata || {},
      },
      resumable: false,
    });

    // Make public if requested
    if (options.makePublic) {
      await file.makePublic();
    }

    // Get URLs
    const gsUrl = `gs://${bucketName}/${options.destination}`;
    const publicUrl = options.makePublic
      ? `https://storage.googleapis.com/${bucketName}/${options.destination}`
      : undefined;

    // Get signed URL (valid for 1 hour) for private files
    const [signedUrl] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return {
      success: true,
      url: signedUrl,
      gsUrl,
      publicUrl,
    };
  } catch (error) {
    console.error('Error uploading to GCS:', error);
    throw error;
  }
}

/**
 * Get a signed URL for a file (valid for specified duration)
 */
export async function getSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60,
  bucketName?: string
): Promise<string> {
  const storage = getGCSClient();
  const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
  const file = bucket.file(filePath);

  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresInMinutes * 60 * 1000,
  });

  return url;
}

/**
 * Delete a file from Google Cloud Storage
 */
export async function deleteFromGCS(
  filePath: string,
  bucketName?: string
): Promise<boolean> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
    const file = bucket.file(filePath);

    await file.delete();
    return true;
  } catch (error) {
    console.error('Error deleting from GCS:', error);
    return false;
  }
}

/**
 * Move a file within Google Cloud Storage
 */
export async function moveFileInGCS(
  sourcePath: string,
  destinationPath: string,
  bucketName?: string
): Promise<boolean> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);

    await sourceFile.move(destinationFile);
    return true;
  } catch (error) {
    console.error('Error moving file in GCS:', error);
    return false;
  }
}

/**
 * Copy a file within Google Cloud Storage
 */
export async function copyFileInGCS(
  sourcePath: string,
  destinationPath: string,
  bucketName?: string
): Promise<boolean> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);

    await sourceFile.copy(destinationFile);
    return true;
  } catch (error) {
    console.error('Error copying file in GCS:', error);
    return false;
  }
}

/**
 * Check if a file exists in Google Cloud Storage
 */
export async function fileExistsInGCS(
  filePath: string,
  bucketName?: string
): Promise<boolean> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
    const file = bucket.file(filePath);

    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error('Error checking file existence in GCS:', error);
    return false;
  }
}

/**
 * Get file metadata from Google Cloud Storage
 */
export async function getFileMetadata(
  filePath: string,
  bucketName?: string
): Promise<any> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);
    const file = bucket.file(filePath);

    const [metadata] = await file.getMetadata();
    return metadata;
  } catch (error) {
    console.error('Error getting file metadata from GCS:', error);
    return null;
  }
}

/**
 * List files in a directory (folder)
 */
export async function listFilesInFolder(
  folderPath: string,
  bucketName?: string
): Promise<string[]> {
  try {
    const storage = getGCSClient();
    const bucket = storage.bucket(bucketName || process.env.GCS_BUCKET_NAME!);

    const [files] = await bucket.getFiles({
      prefix: folderPath,
    });

    return files.map((file) => file.name);
  } catch (error) {
    console.error('Error listing files in GCS:', error);
    return [];
  }
}

/**
 * Generate a unique file path for DMS document uploads
 * Structure: organizations/{orgId}/documents/{folderId}/{file}
 */
export function generateGCSPath(
  organizationId: string,
  folderId: string | null,
  filename: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

  if (folderId && folderId !== 'root') {
    return `organizations/${organizationId}/documents/folders/${folderId}/${timestamp}-${randomString}-${safeFilename}`;
  } else {
    return `organizations/${organizationId}/documents/root/${timestamp}-${randomString}-${safeFilename}`;
  }
}

/**
 * Generate path for organization logos
 * Structure: common/logos/{orgId}/{file}
 */
export function generateLogoPath(organizationId: string, filename: string): string {
  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `common/logos/${organizationId}/${timestamp}-${safeFilename}`;
}

/**
 * Generate path for organization assets (other than logos)
 * Structure: organizations/{orgId}/assets/{type}/{file}
 */
export function generateAssetPath(
  organizationId: string,
  assetType: 'avatar' | 'banner' | 'icon' | 'other',
  filename: string
): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `organizations/${organizationId}/assets/${assetType}/${timestamp}-${randomString}-${safeFilename}`;
}
