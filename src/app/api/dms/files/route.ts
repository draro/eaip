import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DMSFile from '@/models/DMSFile';
import Folder from '@/models/Folder';
import User from '@/models/User';
import crypto from 'crypto';
import { uploadToGCS, generateGCSPath } from '@/lib/googleCloudStorage';

function getFileType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'document';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'excel';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

function calculateChecksum(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const folderId = searchParams.get('folder');
    const tags = searchParams.get('tags')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const fileType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    const query: any = {
      organization: user.organization,
      isLatest: true,
    };

    if (folderId === 'root' || !folderId) {
      query.folder = null;
    } else if (folderId) {
      query.folder = folderId;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags.map(tag => tag.toLowerCase().trim()) };
    }

    if (fileType) {
      query.fileType = fileType;
    }

    if (search) {
      query.$text = { $search: search };
    }

    const files = await DMSFile.find(query)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name path')
      .sort({ uploadedAt: -1 })
      .limit(limit);

    const accessibleFiles = files.filter(file =>
      file.canUserAccess(user.role)
    );

    return NextResponse.json({ files: accessibleFiles, total: accessibleFiles.length });
  } catch (error: any) {
    console.error('Error fetching files:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!['org_admin', 'atc_supervisor', 'atc'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only org_admin, atc_supervisor, and atc can upload files' },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folderId = formData.get('folderId') as string;
    const tags = formData.get('tags') as string;
    const description = formData.get('description') as string;
    const allowedRoles = formData.get('allowedRoles') as string;
    const approvalRequired = formData.get('approvalRequired') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (file.size > 104857600) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    let folder = null;
    if (folderId && folderId !== 'root') {
      folder = await Folder.findById(folderId);
      if (!folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }
      if (folder.organization.toString() !== user.organization?.toString()) {
        return NextResponse.json(
          { error: 'Folder belongs to different organization' },
          { status: 403 }
        );
      }
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const checksum = calculateChecksum(buffer);

    // Generate GCS path
    const gcsPath = generateGCSPath(
      user.organization?.toString() || '',
      folderId === 'root' ? null : folderId,
      file.name
    );

    // Upload to Google Cloud Storage
    const gcsResult = await uploadToGCS({
      destination: gcsPath,
      file: buffer,
      contentType: file.type,
      metadata: {
        originalName: file.name,
        uploadedBy: user._id.toString(),
        organization: user.organization?.toString() || '',
        checksum,
      },
      makePublic: false, // Keep files private by default
    });

    const parsedTags = tags ? tags.split(',').map(tag => tag.toLowerCase().trim()) : [];
    const parsedRoles = allowedRoles
      ? JSON.parse(allowedRoles)
      : ['org_admin', 'atc_supervisor', 'atc', 'editor'];

    const dmsFile = await DMSFile.create({
      filename: file.name,
      originalName: file.name,
      filePath: gcsPath, // Store GCS path
      storageUrl: gcsResult.url, // Store signed URL
      gcsUrl: gcsResult.gsUrl, // Store gs:// URL
      mimeType: file.type,
      fileType: getFileType(file.type),
      size: file.size,
      organization: user.organization,
      folder: folder?._id || null,
      uploadedBy: user._id,
      tags: parsedTags,
      description: description || '',
      allowedRoles: parsedRoles,
      approvalRequired,
      approvalStatus: approvalRequired ? 'pending' : undefined,
      approvalHistory: approvalRequired
        ? [
            {
              action: 'submitted',
              by: user._id,
              at: new Date(),
              comments: 'File submitted for approval',
            },
          ]
        : [],
      metadata: {
        checksum,
        gcsPath,
      },
    });

    if (folder) {
      await Folder.findByIdAndUpdate(folder._id, {
        $inc: {
          'metadata.fileCount': 1,
          'metadata.totalSize': file.size,
        },
      });
    }

    const populatedFile = await DMSFile.findById(dmsFile._id)
      .populate('uploadedBy', 'name email role')
      .populate('folder', 'name path');

    return NextResponse.json(populatedFile, { status: 201 });
  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}
