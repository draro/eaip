import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import DocumentNote from '@/models/DocumentNote';
import User from '@/models/User';

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

    // Find note
    const note = await DocumentNote.findById(params.noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify note belongs to the checklist
    if (note.document.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Note does not belong to this checklist' },
        { status: 400 }
      );
    }

    // Verify user can edit (only creator can edit their own notes)
    if (!note.canEdit(user._id.toString())) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this note' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { content, isPublic, positionData, pageNumber } = body;

    // Update allowed fields
    if (content !== undefined) {
      if (!content || content.trim().length === 0) {
        return NextResponse.json(
          { error: 'Note content cannot be empty' },
          { status: 400 }
        );
      }
      note.content = content.trim();
    }

    if (isPublic !== undefined) {
      note.isPublic = isPublic === true;
    }

    if (positionData !== undefined) {
      note.positionData = positionData;
    }

    if (pageNumber !== undefined) {
      note.pageNumber = pageNumber ? parseInt(pageNumber) : undefined;
    }

    await note.save();
    await note.populate('createdBy', 'name email');

    return NextResponse.json({
      success: true,
      message: 'Note updated successfully',
      note,
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

    // Find note
    const note = await DocumentNote.findById(params.noteId);
    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Verify note belongs to the checklist
    if (note.document.toString() !== params.id) {
      return NextResponse.json(
        { error: 'Note does not belong to this checklist' },
        { status: 400 }
      );
    }

    // Verify user can delete (only creator or org_admin can delete)
    const canDelete = note.canEdit(user._id.toString()) ||
                     user.role === 'org_admin' ||
                     user.role === 'super_admin';

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this note' },
        { status: 403 }
      );
    }

    await note.deleteOne();

    return NextResponse.json({
      success: true,
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
