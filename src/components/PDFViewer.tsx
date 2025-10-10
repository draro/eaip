'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize,
  RotateCw,
  StickyNote,
} from 'lucide-react';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
  onAddNote?: (pageNumber: number, x: number, y: number) => void;
  notes?: Array<{
    _id: string;
    pageNumber?: number;
    positionData?: { x: number; y: number };
    content: string;
    createdBy: any;
    isPublic: boolean;
  }>;
}

export default function PDFViewer({
  fileUrl,
  fileName,
  onAddNote,
  notes = [],
}: PDFViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [addingNote, setAddingNote] = useState(false);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!addingNote || !onAddNote) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    onAddNote(currentPage, x, y);
    setAddingNote(false);
  };

  const currentPageNotes = notes.filter(
    (note) => note.pageNumber === currentPage
  );

  return (
    <Card className={isFullscreen ? 'fixed inset-0 z-50' : ''}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            PDF Viewer - {fileName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[60px] text-center">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            {onAddNote && (
              <Button
                variant={addingNote ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAddingNote(!addingNote)}
              >
                <StickyNote className="h-4 w-4 mr-2" />
                Add Note
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleFullscreen}>
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {addingNote && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            Click on the PDF to place a note at that location
          </div>
        )}

        <div className="relative border rounded-lg overflow-hidden bg-gray-100">
          <div
            className={`relative ${addingNote ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleCanvasClick}
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transformOrigin: 'center',
              transition: 'transform 0.2s',
            }}
          >
            <iframe
              src={`${fileUrl}#page=${currentPage}`}
              className="w-full h-[600px] border-0"
              title={fileName}
            />

            {currentPageNotes.map((note) => (
              <div
                key={note._id}
                className="absolute w-6 h-6 bg-yellow-400 rounded-full border-2 border-yellow-600 cursor-pointer hover:scale-110 transition-transform"
                style={{
                  left: `${note.positionData?.x || 0}%`,
                  top: `${note.positionData?.y || 0}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                title={note.content}
              >
                <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-yellow-100 border border-yellow-600 rounded px-2 py-1 text-xs whitespace-nowrap hidden hover:block z-10">
                  {note.content.substring(0, 50)}...
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        {currentPageNotes.length > 0 && (
          <div className="mt-4 space-y-2">
            <h4 className="text-sm font-semibold">Notes on this page:</h4>
            {currentPageNotes.map((note) => (
              <div
                key={note._id}
                className="p-3 bg-yellow-50 border border-yellow-200 rounded-md"
              >
                <p className="text-sm">{note.content}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                  <span>{note.createdBy?.name || 'Unknown'}</span>
                  {note.isPublic && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded">
                      Public
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
