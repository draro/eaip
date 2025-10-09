import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { RemoteStorageConfig, IRemoteConnection } from '@/types';

export class RemoteStorageService {
  private s3Client: S3Client | null = null;
  private config: RemoteStorageConfig | null = null;

  constructor() {
    this.initializeFromEnv();
  }

  private initializeFromEnv() {
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      this.config = {
        provider: 's3',
        credentials: {
          accessKey: process.env.AWS_ACCESS_KEY_ID,
          secretKey: process.env.AWS_SECRET_ACCESS_KEY,
          region: process.env.AWS_REGION || 'us-east-1',
          bucket: process.env.AWS_S3_BUCKET || 'eaip-uploads',
        },
        settings: {
          pathPrefix: 'eaip/',
          enableVersioning: true,
          enableEncryption: true,
          retentionDays: 365,
        },
      };

      this.s3Client = new S3Client({
        region: this.config.credentials.region,
        credentials: {
          accessKeyId: this.config.credentials.accessKey,
          secretAccessKey: this.config.credentials.secretKey,
        },
      });
    }
  }

  public configureConnection(connection: IRemoteConnection) {
    if (connection.type === 's3' && connection.enabled) {
      this.config = {
        provider: 's3',
        credentials: {
          accessKey: connection.credentials.accessKey!,
          secretKey: connection.credentials.secretKey!,
          region: connection.settings.region || 'us-east-1',
          bucket: connection.settings.bucket!,
        },
        settings: {
          pathPrefix: connection.settings.basePath || 'eaip/',
          enableVersioning: true,
          enableEncryption: true,
          retentionDays: 365,
        },
      };

      this.s3Client = new S3Client({
        region: this.config.credentials.region,
        credentials: {
          accessKeyId: this.config.credentials.accessKey,
          secretAccessKey: this.config.credentials.secretKey,
        },
      });
    }
  }

  public async uploadFile(
    key: string,
    buffer: Buffer,
    mimeType: string,
    metadata?: Record<string, string>
  ): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error('Remote storage not configured');
    }

    const fullKey = `${this.config.settings.pathPrefix}${key}`;

    const command = new PutObjectCommand({
      Bucket: this.config.credentials.bucket,
      Key: fullKey,
      Body: buffer,
      ContentType: mimeType,
      Metadata: metadata,
      ServerSideEncryption: this.config.settings.enableEncryption ? 'AES256' : undefined,
    });

    await this.s3Client.send(command);
    return fullKey;
  }

  public async downloadFile(key: string): Promise<Buffer> {
    if (!this.s3Client || !this.config) {
      throw new Error('Remote storage not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.credentials.bucket,
      Key: key,
    });

    const response = await this.s3Client.send(command);
    if (!response.Body) {
      throw new Error('File not found');
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body as ReadableStream;
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return Buffer.from(result);
  }

  public async deleteFile(key: string): Promise<void> {
    if (!this.s3Client || !this.config) {
      throw new Error('Remote storage not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.config.credentials.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  public async listFiles(prefix?: string): Promise<string[]> {
    if (!this.s3Client || !this.config) {
      throw new Error('Remote storage not configured');
    }

    const fullPrefix = prefix
      ? `${this.config.settings.pathPrefix}${prefix}`
      : this.config.settings.pathPrefix;

    const command = new ListObjectsV2Command({
      Bucket: this.config.credentials.bucket,
      Prefix: fullPrefix,
    });

    const response = await this.s3Client.send(command);
    return response.Contents?.map(obj => obj.Key!) || [];
  }

  public async getSignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.s3Client || !this.config) {
      throw new Error('Remote storage not configured');
    }

    const command = new GetObjectCommand({
      Bucket: this.config.credentials.bucket,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }

  public async pushDocumentVersion(
    documentId: string,
    versionId: string,
    documentData: any,
    userId: string
  ): Promise<string> {
    const key = `documents/${documentId}/versions/${versionId}.json`;
    const buffer = Buffer.from(JSON.stringify(documentData, null, 2));

    const metadata = {
      'document-id': documentId,
      'version-id': versionId,
      'uploaded-by': userId,
      'upload-time': new Date().toISOString(),
    };

    return await this.uploadFile(key, buffer, 'application/json', metadata);
  }

  public async pushExportedFile(
    documentId: string,
    versionId: string,
    format: string,
    buffer: Buffer,
    userId: string
  ): Promise<string> {
    const timestamp = Date.now();
    const key = `exports/${documentId}/${versionId}/${timestamp}.${format}`;

    const mimeTypes: Record<string, string> = {
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf',
      'xml': 'application/xml',
      'html': 'text/html',
    };

    const metadata = {
      'document-id': documentId,
      'version-id': versionId,
      'format': format,
      'exported-by': userId,
      'export-time': new Date().toISOString(),
    };

    return await this.uploadFile(key, buffer, mimeTypes[format] || 'application/octet-stream', metadata);
  }

  public async syncToRemote(connection: IRemoteConnection): Promise<boolean> {
    try {
      this.configureConnection(connection);

      // Test connection by listing files
      await this.listFiles();

      // Update last sync time
      return true;
    } catch (error) {
      console.error('Remote sync failed:', error);
      return false;
    }
  }

  public isConfigured(): boolean {
    return this.s3Client !== null && this.config !== null;
  }

  public getConfig(): RemoteStorageConfig | null {
    return this.config;
  }
}

export const remoteStorage = new RemoteStorageService();