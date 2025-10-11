'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, Maximize2, Minimize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentViewerProps {
  fileId: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  onClose: () => void;
}

export default function DocumentViewer({
  fileId,
  fileName,
  fileType,
  mimeType,
  onClose,
}: DocumentViewerProps) {
  const [fileUrl, setFileUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewId, setViewId] = useState<string>('');
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());

  useEffect(() => {
    loadFile();
    return () => {
      // Update view duration when component unmounts
      if (viewId) {
        updateViewDuration();
      }
    };
  }, [fileId]);

  const loadFile = async () => {
    try {
      setLoading(true);
      setError('');

      // Get file URL for viewing
      const response = await fetch(`/api/dms/files/${fileId}/view`);
      if (!response.ok) {
        throw new Error('Failed to load file');
      }

      const data = await response.json();
      setFileUrl(data.url);

      // Track view
      trackView();
    } catch (err: any) {
      console.error('Error loading file:', err);
      setError(err.message || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const trackView = async () => {
    try {
      const response = await fetch(`/api/dms/files/${fileId}/track-view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewType: 'preview',
          ipAddress: '',
          userAgent: navigator.userAgent,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setViewId(data.viewId);
        setViewStartTime(Date.now());
      }
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  const updateViewDuration = async () => {
    if (!viewId) return;

    try {
      const duration = Math.floor((Date.now() - viewStartTime) / 1000); // in seconds
      await fetch(`/api/dms/files/${fileId}/track-view`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          viewId,
          duration,
          completedView: true,
        }),
      });
    } catch (err) {
      console.error('Error updating view duration:', err);
    }
  };

  const handleDownload = () => {
    window.open(`/api/dms/files/${fileId}/download`, '_blank');
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    updateViewDuration();
    onClose();
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadFile}>Retry</Button>
        </div>
      );
    }

    // PDF Viewer
    if (fileType === 'pdf' || mimeType === 'application/pdf') {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0"
          title={fileName}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        />
      );
    }

    // Image Viewer
    if (fileType === 'image' || mimeType.startsWith('image/')) {
      return (
        <div className="flex items-center justify-center h-full overflow-auto bg-gray-100">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
            style={{ transform: `scale(${zoom / 100})` }}
          />
        </div>
      );
    }

    // Video Viewer
    if (fileType === 'video' || mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <video
            src={fileUrl}
            controls
            className="max-w-full max-h-full"
            style={{ transform: `scale(${zoom / 100})` }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Audio Viewer
    if (fileType === 'audio' || mimeType.startsWith('audio/')) {
      return (
        <div className="flex items-center justify-center h-full">
          <audio src={fileUrl} controls className="w-full max-w-2xl">
            Your browser does not support the audio tag.
          </audio>
        </div>
      );
    }

    // Text/Document Viewer (limited support)
    if (mimeType.includes('text/') || mimeType.includes('json')) {
      return (
        <iframe
          src={fileUrl}
          className="w-full h-full border-0 bg-white"
          title={fileName}
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
        />
      );
    }

    // Fallback - Download only
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <p className="text-gray-600 mb-4">
          This file type cannot be previewed in the browser.
        </p>
        <Button onClick={handleDownload}>
          <Download className="w-4 h-4 mr-2" />
          Download File
        </Button>
      </div>
    );
  };

  return (
    <div
      className={`fixed bg-black bg-opacity-90 z-50 flex flex-col ${
        isFullscreen
          ? 'inset-0'
          : 'top-16 left-0 right-0 bottom-0 md:top-20 md:left-10 md:right-10 md:bottom-10'
      }`}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 truncate">{fileName}</h2>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          {(fileType === 'pdf' || fileType === 'image') && (
            <div className="flex items-center gap-1 border-r pr-2 mr-2">
              <Button size="sm" variant="ghost" onClick={handleZoomOut} disabled={zoom <= 50}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-gray-700 px-2">{zoom}%</span>
              <Button size="sm" variant="ghost" onClick={handleZoomIn} disabled={zoom >= 200}>
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Download Button */}
          <Button size="sm" variant="ghost" onClick={handleDownload}>
            <Download className="w-4 h-4" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>

          {/* Close Button */}
          <Button size="sm" variant="ghost" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden bg-gray-50">{renderContent()}</div>
    </div>
  );
}
