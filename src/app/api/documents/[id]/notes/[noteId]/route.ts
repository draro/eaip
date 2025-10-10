import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentNote from '@/models/DocumentNote';
import User from '@/models/User';
import DocumentActionLog from '@/models/DocumentActionLog';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    const note = await DocumentNote.findById(params.noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== user._id.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You can only edit your own notes' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content, isPublic } = body;

    if (content !== undefined) {
      note.content = content.trim();
    }

    if (isPublic !== undefined) {
      note.isPublic = isPublic;
    }

    await note.save();

    await DocumentActionLog.create({
      actionType: 'note_updated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      documentId: params.id,
      organization: user.organization,
      details: {
        noteId: note._id.toString(),
        content: note.content.substring(0, 100),
      },
      timestamp: new Date(),
    });

    const populatedNote = await DocumentNote.findById(note._id)
      .populate('createdBy', 'name email')
      .lean();

    return NextResponse.json({
      message: 'Note updated successfully',
      note: populatedNote,
    });
  } catch (error: any) {
    console.error('Error updating note:', error);
    return NextResponse.json(
      { error: 'Failed to update note', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string; noteId: string } }
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

    const note = await DocumentNote.findById(params.noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    if (note.createdBy.toString() !== user._id.toString() && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You can only delete your own notes' },
        { status: 403 }
      );
    }

    await note.deleteOne();

    await DocumentActionLog.create({
      actionType: 'note_deleted',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      documentId: params.id,
      organization: user.organization,
      details: {
        noteId: params.noteId,
      },
      timestamp: new Date(),
    });

    return NextResponse.json({
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting note:', error);
    return NextResponse.json(
      { error: 'Failed to delete note', details: error.message },
      { status: 500 }
    );
  }
}
