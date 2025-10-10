'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FileUploader from '@/components/FileUploader';
import {
  File,
  FileText,
  Trash2,
  Download,
  Eye,
  Upload,
} from 'lucide-react';

interface DocumentFile {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

interface DocumentFileManagerProps {
  documentId?: string;
  files: DocumentFile[];
  onFileAdd?: (file: DocumentFile) => void;
  onFileRemove?: (fileId: string) => void;
  allowedTypes?: string;
  maxFileSize?: number;
}

export default function DocumentFileManager({
  documentId,
  files = [],
  onFileAdd,
  onFileRemove,
  allowedTypes = '.pdf,.docx,.doc,.txt',
  maxFileSize = 50 * 1024 * 1024,
}: DocumentFileManagerProps) {
  const [showUploader, setShowUploader] = useState(false);

  const handleUploadComplete = (result: any) => {
    if (result.success && result.data) {
      const newFile: DocumentFile = {
        ...result.data,
        uploadedAt: new Date().toISOString(),
      };
      onFileAdd?.(newFile);
      setShowUploader(false);
    }
  };

  const handleFileRemove = async (fileId: string) => {
    if (confirm('Are you sure you want to remove this file?')) {
      onFileRemove?.(fileId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) {
      return <FileText className="h-8 w-8 text-red-600" />;
    }
    if (mimeType.includes('word') || mimeType.includes('document')) {
      return <FileText className="h-8 w-8 text-blue-600" />;
    }
    return <File className="h-8 w-8 text-gray-600" />;
  };

  const getFileTypeBadge = (mimeType: string) => {
    if (mimeType.includes('pdf')) return 'PDF';
    if (mimeType.includes('word') || mimeType.includes('document')) return 'DOCX';
    if (mimeType.includes('text')) return 'TXT';
    return 'FILE';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <File className="h-5 w-5" />
            Document Files ({files.length})
          </CardTitle>
          <Button
            onClick={() => setShowUploader(!showUploader)}
            size="sm"
            variant={showUploader ? 'outline' : 'default'}
          >
            <Upload className="h-4 w-4 mr-2" />
            {showUploader ? 'Cancel' : 'Upload File'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showUploader && (
          <div className="mb-6">
            <FileUploader
              onFileSelect={() => {}}
              onUploadComplete={handleUploadComplete}
              accept={allowedTypes}
              maxSize={maxFileSize}
              uploadUrl="/api/upload"
              additionalData={{
                documentId: documentId || '',
                fileType: 'document',
              }}
              showPreview={false}
            />
          </div>
        )}

        {files.length === 0 ? (
          <div className="text-center py-8">
            <File className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No files uploaded yet</p>
            <p className="text-sm text-gray-500">Upload documents to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  {getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-gray-900 truncate">
                        {file.originalName}
                      </p>
                      <Badge variant="secondary">
                        {getFileTypeBadge(file.mimeType)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>{formatFileSize(file.size)}</span>
                      <span>
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.url, '_blank')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = file.url;
                      a.download = file.originalName;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileRemove(file.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
