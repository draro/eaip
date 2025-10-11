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
  Grid3x3,
  List,
  Columns,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FileUploadModal from './FileUploadModal';
import CreateFolderModal from './CreateFolderModal';
import DocumentViewer from './DocumentViewer';

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
  viewCount?: number;
  approvalRequired?: boolean;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  folder?: {
    _id?: string;
    name: string;
    path: string;
  };
}

interface FileFolderBrowserProps {
  userRole: string;
  onFileSelect?: (file: DMSFile) => void;
  onFolderSelect?: (folder: Folder) => void;
}

type ViewMode = 'grid' | 'list' | 'columns';

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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [draggedFile, setDraggedFile] = useState<DMSFile | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<DMSFile | null>(null);

  const canUpload = ['super_admin', 'org_admin', 'atc_supervisor', 'atc', 'editor'].includes(userRole);

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

  const getFileIcon = (fileType: string, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-8 h-8' : 'w-5 h-5';
    switch (fileType) {
      case 'image':
        return <ImageIcon className={`${sizeClass} text-blue-500`} />;
      case 'pdf':
        return <FileText className={`${sizeClass} text-red-500`} />;
      case 'document':
        return <FileText className={`${sizeClass} text-blue-600`} />;
      case 'excel':
        return <FileSpreadsheet className={`${sizeClass} text-green-600`} />;
      case 'video':
        return <Video className={`${sizeClass} text-purple-500`} />;
      case 'audio':
        return <Music className={`${sizeClass} text-pink-500`} />;
      default:
        return <File className={`${sizeClass} text-gray-500`} />;
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
    // Use the download API endpoint which will handle GCS signed URLs
    window.open(`/api/dms/files/${file._id}/download`, '_blank');
  };

  const handleView = (e: React.MouseEvent, file: DMSFile) => {
    e.stopPropagation();
    setViewingFile(file);
  };

  const getApprovalBadge = (file: DMSFile) => {
    if (!file.approvalRequired) return null;

    const statusConfig = {
      pending: { color: 'bg-amber-100 text-amber-800 border-amber-300', label: 'Pending Approval' },
      approved: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected' },
    };

    const config = statusConfig[file.approvalStatus || 'pending'];
    return (
      <Badge className={`${config.color} text-xs border`}>
        {config.label}
      </Badge>
    );
  };

  const getCurrentFolderName = (): string => {
    if (breadcrumbs.length === 0) return 'Home';
    return breadcrumbs[breadcrumbs.length - 1].name;
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, file: DMSFile) => {
    setDraggedFile(file);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML);
  };

  const handleDragEnd = () => {
    setDraggedFile(null);
    setDropTarget(null);
  };

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(folderId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDropTarget(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    setDropTarget(null);

    if (!draggedFile) return;

    // Don't move if already in the same folder
    const currentFileFolderId = draggedFile.folder?._id || 'root';
    if (currentFileFolderId === targetFolderId) {
      setDraggedFile(null);
      return;
    }

    try {
      const response = await fetch(`/api/dms/files/${draggedFile._id}/move`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetFolderId }),
      });

      if (response.ok) {
        // Reload folder contents
        await loadFolderContents();
      } else {
        alert('Failed to move file');
      }
    } catch (error) {
      console.error('Error moving file:', error);
      alert('Failed to move file');
    }

    setDraggedFile(null);
  };

  // View renderers
  const renderGridView = () => (
    <>
      {/* Folders */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <FolderIcon className="w-4 h-4" />
            Folders
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {folders.map((folder) => (
              <div
                key={folder._id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  dropTarget === folder._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => navigateToFolder(folder._id, folder.name)}
                onDragOver={(e) => handleDragOver(e, folder._id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder._id)}
              >
                <div className="flex flex-col items-center text-center">
                  <FolderIcon className="w-16 h-16 text-yellow-500 mb-2" />
                  <p className="font-medium text-gray-900 text-sm truncate w-full">
                    {folder.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {folder.metadata.fileCount} items
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files */}
      {files.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <File className="w-4 h-4" />
            Files
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {files.map((file) => (
              <div
                key={file._id}
                draggable={canUpload}
                onDragStart={(e) => handleDragStart(e, file)}
                onDragEnd={handleDragEnd}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all group relative ${
                  draggedFile?._id === file._id
                    ? 'opacity-50 border-dashed'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {/* Approval Badge */}
                {getApprovalBadge(file) && (
                  <div className="absolute top-2 right-2 z-10">
                    {getApprovalBadge(file)}
                  </div>
                )}

                {/* View Button */}
                <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-7 w-7 p-0"
                    onClick={(e) => handleView(e, file)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex flex-col items-center text-center" onClick={() => onFileSelect?.(file)}>
                  {getFileIcon(file.fileType, 'lg')}
                  <p className="font-medium text-gray-900 text-sm truncate w-full mt-2">
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatFileSize(file.size)}</p>
                  {file.tags.length > 0 && (
                    <div className="flex gap-1 mt-2 flex-wrap justify-center">
                      {file.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  {file.viewCount !== undefined && file.viewCount > 0 && (
                    <p className="text-xs text-gray-400 mt-1">
                      {file.viewCount} {file.viewCount === 1 ? 'view' : 'views'}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  const renderListView = () => (
    <div className="space-y-2">
      {/* Folders */}
      {folders.map((folder) => (
        <div
          key={folder._id}
          className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all cursor-pointer group ${
            dropTarget === folder._id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
          onClick={() => navigateToFolder(folder._id, folder.name)}
          onDragOver={(e) => handleDragOver(e, folder._id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, folder._id)}
        >
          <div className="flex items-center gap-3 flex-1">
            <FolderIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{folder.name}</p>
              <p className="text-xs text-gray-500">
                {folder.metadata.fileCount} files, {folder.metadata.subfolderCount} folders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{formatDate(folder.createdAt)}</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
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
        </div>
      ))}

      {/* Files */}
      {files.map((file) => (
        <div
          key={file._id}
          draggable={canUpload}
          onDragStart={(e) => handleDragStart(e, file)}
          onDragEnd={handleDragEnd}
          className={`flex items-center justify-between p-3 border-2 rounded-lg transition-all group ${
            draggedFile?._id === file._id
              ? 'opacity-50 border-dashed border-gray-300'
              : 'border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {getFileIcon(file.fileType)}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900 truncate">{file.originalName}</p>
                {getApprovalBadge(file)}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{formatFileSize(file.size)}</span>
                <span>•</span>
                <span>{formatDate(file.uploadedAt)}</span>
                <span>•</span>
                <span>by {file.uploadedBy.name}</span>
                {file.viewCount !== undefined && file.viewCount > 0 && (
                  <>
                    <span>•</span>
                    <span>{file.viewCount} views</span>
                  </>
                )}
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
              onClick={(e) => handleView(e, file)}
              className="opacity-0 group-hover:opacity-100"
              title="View in app"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(file)}
              className="opacity-0 group-hover:opacity-100"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleView(e as any, file); }}>
                  <Eye className="w-4 h-4 mr-2" />
                  View in App
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
  );

  const renderColumnsView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Folders Column */}
      {folders.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Folders</h3>
          <div className="space-y-2">
            {folders.map((folder) => (
              <div
                key={folder._id}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  dropTarget === folder._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => navigateToFolder(folder._id, folder.name)}
                onDragOver={(e) => handleDragOver(e, folder._id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder._id)}
              >
                <div className="flex items-center gap-2">
                  <FolderIcon className="w-5 h-5 text-yellow-500" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{folder.name}</p>
                    <p className="text-xs text-gray-500">{folder.metadata.fileCount} items</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Columns */}
      <div className={folders.length > 0 ? 'md:col-span-2' : 'md:col-span-3'}>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Files</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {files.map((file) => (
            <div
              key={file._id}
              draggable={canUpload}
              onDragStart={(e) => handleDragStart(e, file)}
              onDragEnd={handleDragEnd}
              className={`p-3 border-2 rounded-lg cursor-pointer transition-all group ${
                draggedFile?._id === file._id
                  ? 'opacity-50 border-dashed'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => onFileSelect?.(file)}
            >
              <div className="flex items-start gap-3">
                {getFileIcon(file.fileType)}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{file.originalName}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  {file.tags.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {file.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>File Manager</CardTitle>
            <div className="flex gap-2">
              {/* View Mode Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  className="rounded-none"
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  className="rounded-none border-l"
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <List className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'columns' ? 'default' : 'ghost'}
                  className="rounded-none border-l"
                  onClick={() => setViewMode('columns')}
                  title="Columns View"
                >
                  <Columns className="w-4 h-4" />
                </Button>
              </div>

              {canUpload && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowCreateFolderModal(true)}
                  >
                    <FolderPlus className="w-4 h-4 mr-2" />
                    New Folder
                  </Button>
                  <Button size="sm" onClick={() => setShowUploadModal(true)}>
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
          {/* Render based on view mode */}
          {viewMode === 'grid' && renderGridView()}
          {viewMode === 'list' && renderListView()}
          {viewMode === 'columns' && renderColumnsView()}

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

      {/* Modals */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUploadComplete={loadFolderContents}
        currentFolderId={currentFolder}
      />

      <CreateFolderModal
        isOpen={showCreateFolderModal}
        onClose={() => setShowCreateFolderModal(false)}
        onCreateComplete={loadFolderContents}
        parentFolderId={currentFolder}
        parentFolderName={getCurrentFolderName()}
      />

      {/* Document Viewer */}
      {viewingFile && (
        <DocumentViewer
          fileId={viewingFile._id}
          fileName={viewingFile.originalName}
          fileType={viewingFile.fileType}
          mimeType={viewingFile.mimeType}
          onClose={() => setViewingFile(null)}
        />
      )}
    </>
  );
}
