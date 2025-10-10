import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentNote from '@/models/DocumentNote';
import ChecklistInstance from '@/models/ChecklistInstance';
import DocumentFile from '@/models/DocumentFile';
import User from '@/models/User';
import DocumentActionLog from '@/models/DocumentActionLog';

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

    const searchParams = req.nextUrl.searchParams;
    const documentType = searchParams.get('type') || 'checklist_instance';
    const pageNumber = searchParams.get('page');

    const query: any = {
      document: params.id,
      documentType,
      $or: [{ isPublic: true }, { createdBy: user._id }],
    };

    if (pageNumber) {
      query.pageNumber = parseInt(pageNumber);
    }

    const notes = await DocumentNote.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ notes });
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

    const body = await req.json();
    const {
      content,
      documentType = 'checklist_instance',
      pageNumber,
      positionData,
      noteType = 'text',
      isPublic = false,
    } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Note content is required' },
        { status: 400 }
      );
    }

    let document: any;
    if (documentType === 'checklist_instance') {
      document = await ChecklistInstance.findById(params.id);
    } else if (documentType === 'file') {
      document = await DocumentFile.findById(params.id);
    }

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (
      document.organization?.toString() !== user.organization?.toString() &&
      user.role !== 'super_admin'
    ) {
      return NextResponse.json(
        { error: 'You do not have permission to add notes to this document' },
        { status: 403 }
      );
    }

    const note = await DocumentNote.create({
      content: content.trim(),
      document: params.id,
      documentType,
      pageNumber,
      positionData,
      noteType,
      organization: user.organization,
      createdBy: user._id,
      isPublic,
    });

    await DocumentActionLog.create({
      actionType: 'note_added',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      documentId: params.id,
      organization: user.organization,
      details: {
        noteId: note._id.toString(),
        content: content.substring(0, 100),
        isPublic,
        pageNumber,
      },
      timestamp: new Date(),
    });

    const populatedNote = await DocumentNote.findById(note._id)
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({
      message: 'Note created successfully',
      note: populatedNote,
    });
  } catch (error: any) {
    console.error('Error creating note:', error);
    return NextResponse.json(
      { error: 'Failed to create note', details: error.message },
      { status: 500 }
    );
  }
}
