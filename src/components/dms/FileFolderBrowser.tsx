'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Folder as FolderIcon,
  File,
  FolderPlus,
  Upload,
  Search,
  Download,
  Eye,
  MoreVertical,
  ChevronRight,
  Home,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  FileSpreadsheet,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Folder {
  _id: string;
  name: string;
  description?: string;
  path: string;
  parentFolder?: string;
  metadata: {
    fileCount: number;
    subfolderCount: number;
    totalSize: number;
  };
  createdBy: {
    name: string;
    email: string;
  };
  createdAt: string;
}

interface DMSFile {
  _id: string;
  filename: string;
  originalName: string;
  filePath: string;
  mimeType: string;
  fileType: string;
  size: number;
  tags: string[];
  description?: string;
  uploadedBy: {
    name: string;
    email: string;
    role: string;
  };
  uploadedAt: string;
  downloadCount: number;
  folder?: {
    name: string;
    path: string;
  };
}

interface FileFolderBrowserProps {
  userRole: string;
  onFileSelect?: (file: DMSFile) => void;
  onFolderSelect?: (folder: Folder) => void;
}

export default function FileFolderBrowser({
  userRole,
  onFileSelect,
  onFolderSelect,
}: FileFolderBrowserProps) {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<DMSFile[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'Home' },
  ]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const canUpload = ['org_admin', 'atc_supervisor', 'atc'].includes(userRole);

  useEffect(() => {
    loadFolderContents();
  }, [currentFolder]);

  const loadFolderContents = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/dms/folders?parent=${currentFolder}&includeFiles=true`
      );
      if (response.ok) {
        const data = await response.json();
        setFolders(data.folders || []);
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
    } finally {
      setLoading(false);
    }
  };

  const navigateToFolder = (folderId: string, folderName: string) => {
    setCurrentFolder(folderId);
    const newBreadcrumbs = [...breadcrumbs, { id: folderId, name: folderName }];
    setBreadcrumbs(newBreadcrumbs);
  };

  const navigateToBreadcrumb = (index: number) => {
    const breadcrumb = breadcrumbs[index];
    setCurrentFolder(breadcrumb.id);
    setBreadcrumbs(breadcrumbs.slice(0, index + 1));
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'image':
        return <ImageIcon className="w-5 h-5 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />;
      case 'document':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'audio':
        return <Music className="w-5 h-5 text-pink-500" />;
      default:
        return <File className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDownload = (file: DMSFile) => {
    window.open(file.filePath, '_blank');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>File Manager</CardTitle>
          <div className="flex gap-2">
            {canUpload && (
              <>
                <Button size="sm" variant="outline">
                  <FolderPlus className="w-4 h-4 mr-2" />
                  New Folder
                </Button>
                <Button size="sm">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload File
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 mt-4 text-sm text-gray-600">
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.id}>
              {index > 0 && <ChevronRight className="w-4 h-4" />}
              <button
                onClick={() => navigateToBreadcrumb(index)}
                className="hover:text-blue-600 hover:underline flex items-center gap-1"
              >
                {index === 0 && <Home className="w-4 h-4" />}
                {crumb.name}
              </button>
            </React.Fragment>
          ))}
        </div>

        {/* Search */}
        <div className="relative mt-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files and folders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </CardHeader>

      <CardContent>
        {/* Folders */}
        {folders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Folders</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {folders.map((folder) => (
                <div
                  key={folder._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer group"
                  onClick={() => navigateToFolder(folder._id, folder.name)}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <FolderIcon className="w-5 h-5 text-yellow-500" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{folder.name}</p>
                      <p className="text-xs text-gray-500">
                        {folder.metadata.fileCount} files, {folder.metadata.subfolderCount}{' '}
                        folders
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => onFolderSelect?.(folder)}>
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Files */}
        {files.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Files</h3>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file._id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 group"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.fileType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatFileSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                        <span>•</span>
                        <span>by {file.uploadedBy.name}</span>
                      </div>
                      {file.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {file.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{file.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file)}
                      className="opacity-0 group-hover:opacity-100"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onFileSelect?.(file)}>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDownload(file)}>
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {folders.length === 0 && files.length === 0 && (
          <div className="text-center py-12">
            <FolderIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">This folder is empty</p>
            {canUpload && (
              <p className="text-sm text-gray-400 mt-2">
                Upload files or create folders to get started
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
