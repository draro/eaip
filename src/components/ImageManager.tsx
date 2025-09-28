'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, Trash2, Eye, Download, Image as ImageIcon } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface ImageData {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  uploadedBy: {
    name: string;
    email: string;
  };
}

interface ImageManagerProps {
  documentId: string;
  images: ImageData[];
  onImageAdd?: (image: ImageData) => void;
  onImageRemove?: (imageId: string) => void;
}

export default function ImageManager({ documentId, images, onImageAdd, onImageRemove }: ImageManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageData | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentId', documentId);
      formData.append('uploadedBy', '507f1f77bcf86cd799439011'); // TODO: Get from auth context

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        const newImage: ImageData = {
          ...result.data,
          uploadedAt: new Date().toISOString(),
          uploadedBy: {
            name: 'Current User', // TODO: Get from auth context
            email: 'user@example.com',
          },
        };
        onImageAdd?.(newImage);
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleImageRemove = async (imageId: string) => {
    if (confirm('Are you sure you want to remove this image?')) {
      // TODO: Implement API call to remove image
      onImageRemove?.(imageId);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Manage Images ({images.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Image Manager</DialogTitle>
            <DialogDescription>
              Upload and manage images for this document. Images can be inserted into the editor via drag-and-drop.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                    <p className="text-sm text-gray-600">Uploading...</p>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports JPEG, PNG, GIF, WebP (max 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>

            {images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <Card key={image.id} className="overflow-hidden">
                    <div className="aspect-video bg-gray-100 relative">
                      <img
                        src={image.url}
                        alt={image.originalName}
                        className="w-full h-full object-cover cursor-pointer"
                        onClick={() => setSelectedImage(image)}
                      />
                      <div className="absolute top-2 right-2 flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setSelectedImage(image)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleImageRemove(image.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <CardContent className="p-3">
                      <p className="text-sm font-medium truncate" title={image.originalName}>
                        {image.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.size)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(image.uploadedAt)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No images uploaded yet</p>
                <p className="text-sm text-gray-500">Upload images to get started</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Preview Modal */}
      {selectedImage && (
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>{selectedImage.originalName}</DialogTitle>
              <DialogDescription>
                Uploaded by {selectedImage.uploadedBy.name} on {formatDate(selectedImage.uploadedAt)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="max-h-96 overflow-hidden rounded-lg">
                <img
                  src={selectedImage.url}
                  alt={selectedImage.originalName}
                  className="w-full h-auto"
                />
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">File name:</span> {selectedImage.filename}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {formatFileSize(selectedImage.size)}
                </div>
                <div>
                  <span className="font-medium">Type:</span> {selectedImage.mimeType}
                </div>
                <div>
                  <span className="font-medium">URL:</span>
                  <a
                    href={selectedImage.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline ml-1"
                  >
                    View original
                  </a>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(selectedImage.url);
                    alert('Image URL copied to clipboard');
                  }}
                >
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.open(selectedImage.url, '_blank')}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleImageRemove(selectedImage.id);
                    setSelectedImage(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}