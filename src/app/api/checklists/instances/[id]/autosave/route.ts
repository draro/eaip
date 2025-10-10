import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import User from '@/models/User';
import mongoose from 'mongoose';

const AutosaveDraftSchema = new mongoose.Schema({
  checklistInstanceId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  draftContent: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  lastSavedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

AutosaveDraftSchema.index({ checklistInstanceId: 1, userId: 1 }, { unique: true });

const AutosaveDraft = mongoose.models.AutosaveDraft ||
  mongoose.model('AutosaveDraft', AutosaveDraftSchema);

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

    const instance = await ChecklistInstance.findById(params.id);
    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instance.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to autosave this checklist' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { draftContent } = body;

    if (!draftContent) {
      return NextResponse.json(
        { error: 'Draft content is required' },
        { status: 400 }
      );
    }

    const draft = await AutosaveDraft.findOneAndUpdate(
      {
        checklistInstanceId: params.id,
        userId: user._id,
      },
      {
        draftContent,
        lastSavedAt: new Date(),
      },
      {
        upsert: true,
        new: true,
      }
    );

    return NextResponse.json({
      message: 'Draft saved successfully',
      lastSavedAt: draft.lastSavedAt,
    });
  } catch (error: any) {
    console.error('Error saving draft:', error);
    return NextResponse.json(
      { error: 'Failed to save draft', details: error.message },
      { status: 500 }
    );
  }
}

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

    const draft = await AutosaveDraft.findOne({
      checklistInstanceId: params.id,
      userId: user._id,
    });

    if (!draft) {
      return NextResponse.json({ draft: null });
    }

    return NextResponse.json({ draft });
  } catch (error: any) {
    console.error('Error fetching draft:', error);
    return NextResponse.json(
      { error: 'Failed to fetch draft', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await AutosaveDraft.deleteOne({
      checklistInstanceId: params.id,
      userId: user._id,
    });

    return NextResponse.json({
      message: 'Draft deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting draft:', error);
    return NextResponse.json(
      { error: 'Failed to delete draft', details: error.message },
      { status: 500 }
    );
  }
}
