import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
import ChecklistInstance from '@/models/ChecklistInstance';
import ChecklistTemplate from '@/models/ChecklistTemplate';
import User from '@/models/User';
import Organization from '@/models/Organization';
import DocumentActionLog from '@/models/DocumentActionLog';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).populate('organization');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get('status');
    const templateId = searchParams.get('templateId');

    const query: any = {
      organization: user.organization,
    };

    if (user.role !== 'super_admin' && user.role !== 'org_admin') {
      query.initiatedBy = user._id;
    }

    if (status) {
      query.status = status;
    }

    if (templateId) {
      query.template = templateId;
    }

    const instances = await ChecklistInstance.find(query)
      .populate('template', 'title description')
      .populate('initiatedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const instancesWithProgress = instances.map((instance: any) => {
      const totalItems = instance.items.length;
      const completedItems = instance.items.filter((item: any) => item.completed).length;
      const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

      return {
        ...instance,
        progress,
        totalItems,
        completedItems,
      };
    });

    return NextResponse.json({ instances: instancesWithProgress });
  } catch (error: any) {
    console.error('Error fetching instances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch instances', details: error.message },
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

    const user = await User.findById(session.user.id).populate('organization');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const organization = user.organization;
    if (!organization.hasFeature('checklists')) {
      return NextResponse.json(
        { error: 'Checklists feature is not enabled for this organization' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { templateId } = body;

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const template = await ChecklistTemplate.findById(templateId);
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    if (template.organization.toString() !== user.organization._id.toString()) {
      return NextResponse.json(
        { error: 'Template does not belong to your organization' },
        { status: 403 }
      );
    }

    if (!template.allowedRoles.includes(user.role) &&
        !['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to use this template' },
        { status: 403 }
      );
    }

    const instance = await ChecklistInstance.create({
      template: template._id,
      title: template.title,
      description: template.description,
      organization: user.organization,
      items: template.items.map((item: any) => ({
        id: item.id,
        text: item.text,
        order: item.order,
        required: item.required,
        completed: false,
      })),
      status: 'in_progress',
      initiatedBy: user._id,
      initiatedAt: new Date(),
    });

    await DocumentActionLog.create({
      actionType: 'instance_initiated',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      checklistInstanceId: instance._id,
      organization: user.organization,
      details: {
        title: instance.title,
        templateId: template._id.toString(),
        itemsCount: instance.items.length,
      },
      timestamp: new Date(),
    });

    const populatedInstance = await ChecklistInstance.findById(instance._id)
      .populate('template', 'title description')
      .populate('initiatedBy', 'name email');

    return NextResponse.json({
      message: 'Checklist instance created successfully',
      instance: populatedInstance,
    });
  } catch (error: any) {
    console.error('Error creating instance:', error);
    return NextResponse.json(
      { error: 'Failed to create instance', details: error.message },
      { status: 500 }
    );
  }
}
