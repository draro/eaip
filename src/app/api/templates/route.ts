import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import dbConnect from '@/lib/mongodb';
import DocumentTemplate from '@/models/DocumentTemplate';

// GET /api/templates - List templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const user = session.user as any;
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    const query: any = {
      $or: [
        { isDefault: true },
        { organizationId: user.organizationId }
      ]
    };

    if (section) {
      query.section = section;
    }

    const templates = await DocumentTemplate.find(query).sort({ isDefault: -1, createdAt: -1 });

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

// POST /api/templates - Create template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;

    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    await dbConnect();

    const data = await request.json();

    const template = new DocumentTemplate({
      name: data.name,
      description: data.description,
      section: data.section,
      subsection: data.subsection,
      content: data.content,
      isDefault: false,
      organizationId: user.organizationId,
      createdBy: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });

    await template.save();

    return NextResponse.json({
      success: true,
      template,
      message: 'Template created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}