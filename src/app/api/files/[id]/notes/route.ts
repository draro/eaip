import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentNote from '@/models/DocumentNote';
import File from '@/models/File';
import User from '@/models/User';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify file exists and user has access
    const file = await File.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view notes for this file' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const pageNumber = searchParams.get('pageNumber');
    const includePrivate = searchParams.get('includePrivate') === 'true';

    // Build query - user sees their own notes OR public notes
    let query: any = {
      document: params.id,
      documentType: 'file',
      organization: user.organization,
    };

    // Filter by page number if provided
    if (pageNumber) {
      query.pageNumber = parseInt(pageNumber);
    }

    // Show public notes AND user's own notes
    if (!includePrivate) {
      query.$or = [
        { isPublic: true },
        { createdBy: user._id }
      ];
    } else {
      // Only show user's own notes
      query.createdBy = user._id;
    }

    const notes = await DocumentNote.find(query)
      .populate('createdBy', 'name email')
      .sort({ pageNumber: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      notes,
      total: notes.length,
    });
  } catch (error: any) {
    console.error('Error fetching notes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notes', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Verify file exists and user has access
    const file = await File.findById(params.id);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    if (file.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to add notes to this file' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content, pageNumber, positionData, noteType, isPublic } = body;

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    // Create note
    const note = await DocumentNote.create({
      content: content.trim(),
      document: params.id,
      documentType: 'file',
      pageNumber: pageNumber ? parseInt(pageNumber) : undefined,
      positionData: positionData || undefined,
      noteType: noteType || 'text',
      organization: user.organization,
      createdBy: user._id,
      isPublic: isPublic === true,
    });

    // Populate creator info
    await note.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Note created successfully',
      note,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
