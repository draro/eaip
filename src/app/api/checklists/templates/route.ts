import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import connectDB from '@/lib/mongodb';
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
    const search = searchParams.get('search') || '';
    const tags = searchParams.getAll('tags');
    const role = searchParams.get('role');

    const query: any = {
      organization: user.organization,
      isActive: true,
    };

    if (user.role !== 'super_admin' && user.role !== 'org_admin') {
      query.allowedRoles = { $in: [user.role] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { keywords: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (role) {
      query.allowedRoles = { $in: [role] };
    }

    const templates = await ChecklistTemplate.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates', details: error.message },
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

    if (!['super_admin', 'org_admin', 'atc_supervisor'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Only org_admin and atc_supervisor can create templates' },
        { status: 403 }
      );
    }

    const organization = user.organization;
    if (!organization.hasFeature('checklists')) {
      return NextResponse.json(
        { error: 'Checklists feature is not enabled for this organization' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, description, items, allowedRoles, tags, keywords } = body;

    if (!title || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Title and at least one checklist item are required' },
        { status: 400 }
      );
    }

    const template = await ChecklistTemplate.create({
      title,
      description,
      organization: user.organization,
      items: items.map((item: any, index: number) => ({
        id: item.id || `item-${Date.now()}-${index}`,
        text: item.text,
        order: item.order ?? index,
        required: item.required ?? true,
      })),
      allowedRoles: allowedRoles || ['atc'],
      tags: tags || [],
      keywords: keywords || [],
      createdBy: user._id,
      updatedBy: user._id,
      isActive: true,
    });

    await DocumentActionLog.create({
      actionType: 'template_created',
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      documentId: template._id,
      organization: user.organization,
      details: {
        title: template.title,
        itemsCount: template.items.length,
      },
      timestamp: new Date(),
    });

    const populatedTemplate = await ChecklistTemplate.findById(template._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    return NextResponse.json({
      message: 'Template created successfully',
      template: populatedTemplate,
    });
  } catch (error: any) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template', details: error.message },
      { status: 500 }
    );
  }
}
