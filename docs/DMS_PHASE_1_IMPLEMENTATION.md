# DMS Phase 1 Implementation - File/Folder Structure and Models

**Date**: October 10, 2025
**Status**: ✅ Complete

## Overview

Phase 1 establishes the foundation for the Document Management System (DMS) with a hierarchical file/folder structure, comprehensive data models, and basic API endpoints.

## Implementation Summary

### 1. Data Models Created

#### **Folder Model** (`src/models/Folder.ts`)
- Hierarchical folder structure with parent/child relationships
- Automatic path generation (`/parent/child/subfolder`)
- Organization-based isolation
- Role-based access control
- Metadata tracking (file count, subfolder count, total size)
- Text search indexing on name and description

**Key Fields**:
- `name`: Folder name (max 100 characters)
- `description`: Optional description (max 500 characters)
- `organization`: Organization ID (required)
- `parentFolder`: Parent folder reference (null for root)
- `path`: Auto-generated full path
- `isPublic`: Public access flag
- `allowedRoles`: Array of allowed user roles
- `metadata`: File count, subfolder count, total size

**Methods**:
- `getFullPath()`: Returns the complete folder path
- `isRootFolder()`: Checks if folder is at root level
- `canUserAccess(userRole)`: Validates user access permissions

#### **DMSFile Model** (`src/models/DMSFile.ts`)
- Enhanced file model with tags and folder support
- Version tracking with parent file references
- Download count and analytics
- Rich metadata support
- Multiple file type categorization
- Configurable role-based access

**Key Fields**:
- `filename`: System-generated unique filename
- `originalName`: User's original filename
- `filePath`: Server file path
- `storageUrl`: Public access URL
- `mimeType`: File MIME type
- `fileType`: Categorized type (document, image, pdf, excel, video, audio, other)
- `size`: File size in bytes (max 100MB)
- `organization`: Organization ID (required)
- `folder`: Parent folder reference (null for root)
- `uploadedBy`: User who uploaded the file
- `tags`: Array of searchable tags (max 20)
- `description`: Optional file description (max 1000 characters)
- `version`: Version number (default 1)
- `isLatest`: Flag for latest version
- `parentFile`: Reference to previous version
- `allowedRoles`: Array of allowed user roles
- `downloadCount`: Number of downloads
- `lastDownloadedAt`: Last download timestamp
- `metadata`: Pages, dimensions, duration, author, title, checksum

**Methods**:
- `getFileExtension()`: Returns file extension
- `isImage()`: Checks if file is an image
- `isPDF()`: Checks if file is a PDF
- `isDocument()`: Checks if file is a document
- `canUserAccess(userRole)`: Validates user access
- `incrementDownloadCount()`: Updates download statistics
- `addTags(tags)`: Adds tags to file
- `removeTags(tags)`: Removes tags from file

**Static Methods**:
- `findByTags(organizationId, tags)`: Search files by tags
- `getLatestFiles(organizationId, limit)`: Get recent files

### 2. API Endpoints Created

#### **Folders API** (`src/app/api/dms/folders/route.ts`)

**GET /api/dms/folders**
- Query parameters:
  - `parent`: Parent folder ID (use 'root' for root level)
  - `includeFiles`: Boolean to include files in response
- Returns folders and optionally files in specified location
- Filters by user role permissions
- Populates creator and updater information

**POST /api/dms/folders**
- Required fields: `name`
- Optional fields: `description`, `parentFolder`, `isPublic`, `allowedRoles`
- Requires org_admin, atc_supervisor, or atc role
- Validates parent folder existence and ownership
- Checks for duplicate folder names in same location
- Auto-generates folder path
- Updates parent folder metadata

**Authorization**:
- Only org_admin, atc_supervisor, and atc can create folders
- Users can only access folders in their organization
- Respects role-based access control

#### **Files API** (`src/app/api/dms/files/route.ts`)

**GET /api/dms/files**
- Query parameters:
  - `folder`: Folder ID (use 'root' for root level)
  - `tags`: Comma-separated list of tags
  - `search`: Text search query
  - `type`: File type filter
  - `limit`: Maximum number of results (default 50)
- Returns filtered files with populated metadata
- Filters by user role permissions

**POST /api/dms/files**
- Multipart form data upload
- Required: `file` (File object)
- Optional: `folderId`, `tags`, `description`, `allowedRoles`
- Requires org_admin, atc_supervisor, or atc role
- Maximum file size: 100MB
- Validates folder existence and ownership
- Generates unique filename with timestamp and random string
- Calculates SHA256 checksum
- Auto-categorizes file type based on MIME type
- Updates folder metadata on successful upload

**File Type Detection**:
- Images: `image/*`
- PDFs: `application/pdf`
- Documents: Word, OpenDocument text
- Excel: Spreadsheet files
- Video: `video/*`
- Audio: `audio/*`
- Other: All other types

**Storage**:
- Files stored in `public/uploads/dms/`
- Filename format: `{timestamp}-{random}.{ext}`
- Public access via `/uploads/dms/{filename}`

### 3. UI Component Created

#### **FileFolderBrowser Component** (`src/components/dms/FileFolderBrowser.tsx`)

**Features**:
- Hierarchical navigation with breadcrumbs
- Folder and file listing in grid/list layout
- Visual file type icons
- Tag display with badges
- File size and date formatting
- Upload/download capabilities
- Context menus with actions
- Role-based UI permissions
- Search functionality
- Empty state handling

**Props**:
- `userRole`: Current user's role
- `onFileSelect`: Callback when file is selected
- `onFolderSelect`: Callback when folder is selected

**User Actions**:
- Navigate folders by clicking
- Create new folders (admin roles)
- Upload files (admin roles)
- Download files
- View file/folder details
- Search files and folders

### 4. Database Indexes

**Folder Indexes**:
- `organization + parentFolder`: Fast folder listing
- `organization + path`: Unique constraint, path validation
- `createdBy`: User's folders
- Text index on `name + description`: Search

**DMSFile Indexes**:
- `organization + folder`: Files in folder
- `organization + uploadedAt`: Recent files
- `organization + tags`: Tag-based search
- `organization + fileType`: Type filtering
- `uploadedBy + uploadedAt`: User's uploads
- `tags + organization`: Tag search optimization
- Text index on `originalName + description + tags`: Full-text search

### 5. Security Features

**Access Control**:
- Organization-level data isolation
- Role-based folder access
- Role-based file access
- Upload restricted to org_admin, atc_supervisor, atc
- Folder creation restricted to org_admin, atc_supervisor, atc

**Data Validation**:
- Folder name length limits
- File size limits (100MB)
- Tag count limits (20 tags)
- Description length limits
- Path uniqueness validation
- Parent folder validation

**File Security**:
- SHA256 checksum calculation
- Unique filename generation
- MIME type validation
- File extension preservation

## Technical Details

### Storage Architecture
```
public/uploads/dms/
  └── {timestamp}-{random}.{ext}
```

### Folder Path Format
```
/root
/root/subfolder
/root/subfolder/child
```

### Database Schema

**Collections**:
- `folders`: Folder hierarchy
- `dmsfiles`: File metadata and references

**Relationships**:
- Folder → Organization (many-to-one)
- Folder → Folder (self-referencing, parent-child)
- DMSFile → Organization (many-to-one)
- DMSFile → Folder (many-to-one)
- DMSFile → User (many-to-one, uploadedBy)
- DMSFile → DMSFile (self-referencing, version history)

## API Usage Examples

### Create Root Folder
```bash
POST /api/dms/folders
{
  "name": "Flight Manuals",
  "description": "Aircraft flight manuals and procedures",
  "isPublic": false,
  "allowedRoles": ["org_admin", "atc_supervisor", "atc"]
}
```

### Create Subfolder
```bash
POST /api/dms/folders
{
  "name": "Boeing 737",
  "parentFolder": "folder_id",
  "description": "B737 specific documents"
}
```

### Upload File with Tags
```bash
POST /api/dms/files
Content-Type: multipart/form-data

file: [File object]
folderId: "folder_id"
tags: "manual,b737,flight-ops,procedures"
description: "Boeing 737 Flight Operations Manual v2.1"
allowedRoles: ["org_admin", "atc_supervisor", "atc"]
```

### Search Files by Tags
```bash
GET /api/dms/files?tags=manual,b737&limit=20
```

### List Folder Contents
```bash
GET /api/dms/folders?parent=folder_id&includeFiles=true
```

## File Type Support

### Supported File Types
- **Documents**: .doc, .docx, .odt
- **PDFs**: .pdf
- **Images**: .jpg, .jpeg, .png, .gif, .svg, .webp
- **Excel**: .xls, .xlsx, .ods
- **Videos**: .mp4, .avi, .mov, .webm
- **Audio**: .mp3, .wav, .ogg, .m4a
- **Other**: All other file types

## Next Steps (Phase 2)

- File upload UI with drag-and-drop
- Tag input component with autocomplete
- Folder creation modal
- File preview functionality
- Bulk operations (multi-select, bulk download)
- Advanced search with filters
- File sharing and permissions management

## Notes

- All timestamps use ISO 8601 format
- File sizes are in bytes
- Checksums use SHA256 algorithm
- Tags are case-insensitive and trimmed
- Paths are auto-generated and cannot be manually set
- Root level items have `folder: null` or `parentFolder: null`

---

**Phase 1 Status**: ✅ Complete
**Next Phase**: Phase 2 - File Upload UI with Tags for ATC Roles
