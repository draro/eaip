'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import FileUploader from '@/components/FileUploader';
import { FileText, Upload, CheckCircle2 } from 'lucide-react';

interface DocumentImporterProps {
  onImportComplete: (data: any) => void;
}

export default function DocumentImporter({ onImportComplete }: DocumentImporterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<string>('tiptap');
  const [importing, setImporting] = useState(false);
  const [importSuccess, setImportSuccess] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setImportSuccess(false);
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('importType', importType);

      const response = await fetch('/api/documents/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        setImportSuccess(true);
        onImportComplete(result.data);

        setTimeout(() => {
          setIsOpen(false);
          setSelectedFile(null);
          setImportSuccess(false);
        }, 1500);
      } else {
        alert(`Import failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Import Document
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Document</DialogTitle>
          <DialogDescription>
            Import content from Word (DOCX) or PDF files into your document editor
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {importSuccess ? (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-3 text-green-700">
                  <CheckCircle2 className="h-8 w-8" />
                  <div>
                    <p className="font-semibold">Import Successful!</p>
                    <p className="text-sm">Content has been imported into the editor</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="import-type">Import Format</Label>
                  <Select value={importType} onValueChange={setImportType}>
                    <SelectTrigger id="import-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiptap">
                        Rich Text (Recommended) - Preserves formatting
                      </SelectItem>
                      <SelectItem value="html">HTML - Basic formatting</SelectItem>
                      <SelectItem value="text">Plain Text - No formatting</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {importType === 'tiptap' && 'Best for DOCX files with headings, lists, and tables'}
                    {importType === 'html' && 'Imports as HTML markup'}
                    {importType === 'text' && 'Imports plain text only, no formatting'}
                  </p>
                </div>

                <FileUploader
                  onFileSelect={handleFileSelect}
                  accept=".docx,.doc,.pdf"
                  maxSize={50 * 1024 * 1024}
                  showPreview={false}
                />
              </div>

              {selectedFile && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Selected File
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Filename:</span>
                        <span className="font-medium">{selectedFile.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size:</span>
                        <span className="font-medium">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Type:</span>
                        <span className="font-medium">
                          {selectedFile.name.endsWith('.docx')
                            ? 'Word Document'
                            : selectedFile.name.endsWith('.pdf')
                            ? 'PDF Document'
                            : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsOpen(false);
                    setSelectedFile(null);
                  }}
                  disabled={importing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={!selectedFile || importing}
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Import Document
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
