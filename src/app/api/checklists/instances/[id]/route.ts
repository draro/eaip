import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
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

    const instance = await ChecklistInstance.findById(params.id)
      .populate('template', 'title description')
      .populate('initiatedBy', 'name email')
      .populate({
        path: 'items.completedBy',
        select: 'name email',
      });

    if (!instance) {
      return NextResponse.json({ error: 'Instance not found' }, { status: 404 });
    }

    if (instance.organization.toString() !== user.organization?.toString() &&
        user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'You do not have permission to view this checklist' },
        { status: 403 }
      );
    }

    const totalItems = instance.items.length;
    const completedItems = instance.items.filter((item: any) => item.completed).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return NextResponse.json({
      instance: {
        ...instance.toObject(),
        progress,
        totalItems,
        completedItems,
      },
    });
  } catch (error: any) {
    console.error('Error fetching instance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instance', details: error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
        { error: 'You do not have permission to update this checklist' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { itemId, completed } = body;

    if (!itemId || typeof completed !== 'boolean') {
      return NextResponse.json(
        { error: 'Item ID and completed status are required' },
        { status: 400 }
      );
    }

    const itemIndex = instance.items.findIndex((item: any) => item.id === itemId);
    if (itemIndex === -1) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    const item = instance.items[itemIndex];
    const wasCompleted = item.completed;

    item.completed = completed;
    if (completed && !wasCompleted) {
      item.completedBy = user._id;
      item.completedAt = new Date();
    } else if (!completed) {
      item.completedBy = undefined;
      item.completedAt = undefined;
    }

    const allCompleted = instance.items.every((item: any) =>
      !item.required || item.completed
    );

    if (allCompleted && instance.status !== 'completed') {
      instance.status = 'completed';
      instance.completedAt = new Date();

      await DocumentActionLog.create({
        actionType: 'document_completed',
        userId: user._id,
        userName: user.name,
        userEmail: user.email,
        checklistInstanceId: instance._id,
        organization: user.organization,
        details: {
          title: instance.title,
          completedAt: instance.completedAt,
        },
        timestamp: new Date(),
      });
    } else if (!allCompleted && instance.status === 'completed') {
      instance.status = 'in_progress';
      instance.completedAt = undefined;
    }

    await instance.save();

    await DocumentActionLog.create({
      actionType: completed ? 'checkbox_ticked' : 'checkbox_unticked',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      itemId: itemId,
      organization: user.organization,
      details: {
        itemText: item.text,
        completed: completed,
      },
      timestamp: new Date(),
    });

    const updatedInstance = await ChecklistInstance.findById(instance._id)
      .populate('template', 'title description')
      .populate('initiatedBy', 'name email')
      .populate({
        path: 'items.completedBy',
        select: 'name email',
      });

    const totalItems = updatedInstance!.items.length;
    const completedItems = updatedInstance!.items.filter((item: any) => item.completed).length;
    const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    return NextResponse.json({
      message: 'Item updated successfully',
      instance: {
        ...updatedInstance!.toObject(),
        progress,
        totalItems,
        completedItems,
      },
    });
  } catch (error: any) {
    console.error('Error updating instance:', error);
    return NextResponse.json(
      { error: 'Failed to update instance', details: error.message },
      { status: 500 }
    );
  }
}
