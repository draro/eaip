import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import Folder from '@/models/Folder';
import User from '@/models/User';

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
    const parentFolderId = searchParams.get('parent');
    const includeFiles = searchParams.get('includeFiles') === 'true';

    const query: any = {
      organization: user.organization,
    };

    if (parentFolderId === 'root' || !parentFolderId) {
      query.parentFolder = null;
    } else {
      query.parentFolder = parentFolderId;
    }

    const folders = await Folder.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ name: 1 });

    const accessibleFolders = folders.filter(folder =>
      folder.canUserAccess(user.role)
    );

    let files = [];
    if (includeFiles) {
      const DMSFile = (await import('@/models/DMSFile')).default;
      const fileQuery: any = {
        organization: user.organization,
        isLatest: true,
      };

      if (parentFolderId === 'root' || !parentFolderId) {
        fileQuery.folder = null;
      } else {
        fileQuery.folder = parentFolderId;
      }

      files = await DMSFile.find(fileQuery)
        .populate('uploadedBy', 'name email')
        .sort({ uploadedAt: -1 });
    }

    return NextResponse.json({
      folders: accessibleFolders,
      files,
      parent: parentFolderId || 'root',
    });
  } catch (error: any) {
    console.error('Error fetching folders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch folders', details: error.message },
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
        { error: 'Only org_admin, atc_supervisor, and atc can create folders' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, parentFolder, isPublic, allowedRoles } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Folder name is required' },
        { status: 400 }
      );
    }

    let path = `/${name}`;
    if (parentFolder) {
      const parent = await Folder.findById(parentFolder);
      if (!parent) {
        return NextResponse.json(
          { error: 'Parent folder not found' },
          { status: 404 }
        );
      }
      if (parent.organization.toString() !== user.organization?.toString()) {
        return NextResponse.json(
          { error: 'Parent folder belongs to different organization' },
          { status: 403 }
        );
      }
      path = `${parent.path}/${name}`;
    }

    const existingFolder = await Folder.findOne({
      organization: user.organization,
      path,
    });

    if (existingFolder) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      );
    }

    const folder = await Folder.create({
      name,
      description,
      organization: user.organization,
      parentFolder: parentFolder || null,
      path,
      createdBy: user._id,
      updatedBy: user._id,
      isPublic: isPublic || false,
      allowedRoles: allowedRoles || ['org_admin', 'atc_supervisor', 'atc', 'editor'],
    });

    if (parentFolder) {
      await Folder.findByIdAndUpdate(parentFolder, {
        $inc: { 'metadata.subfolderCount': 1 },
      });
    }

    const populatedFolder = await Folder.findById(folder._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json(populatedFolder, { status: 201 });
  } catch (error: any) {
    console.error('Error creating folder:', error);
    return NextResponse.json(
      { error: 'Failed to create folder', details: error.message },
      { status: 500 }
    );
  }
}
