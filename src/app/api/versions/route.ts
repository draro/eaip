import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPVersion from '@/models/AIPVersion';
import { generateAiracCycle } from '@/lib/utils';
import { getOrCreateDefaultUser } from '@/lib/defaultUser';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');

    const filter: any = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;

    const versions = await AIPVersion.find(filter)
      .populate('createdBy', 'name email')
      .populate({
        path: 'documents',
        select: 'title sectionCode subsectionCode status',
        populate: {
          path: 'updatedBy',
          select: 'name email'
        }
      })
      .sort({ effectiveDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AIPVersion.countDocuments(filter);

    return NextResponse.json({
      success: true,
      data: versions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching versions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch versions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const {
      versionNumber,
      airacCycle,
      effectiveDate,
      description,
      createdBy,
    } = body;

    if (!versionNumber || !airacCycle || !effectiveDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get or create a default user if createdBy is not provided
    const userId = createdBy || await getOrCreateDefaultUser();

    const existingVersion = await AIPVersion.findOne({
      $or: [
        { versionNumber },
        { airacCycle },
      ],
    });

    if (existingVersion) {
      return NextResponse.json(
        { success: false, error: 'Version with this number or AIRAC cycle already exists' },
        { status: 409 }
      );
    }

    const version = await AIPVersion.create({
      versionNumber,
      airacCycle,
      effectiveDate: new Date(effectiveDate),
      description,
      createdBy: userId,
      status: 'draft',
      documents: [],
    });

    const populatedVersion = await AIPVersion.findById(version._id)
      .populate('createdBy', 'name email');

    return NextResponse.json(
      { success: true, data: populatedVersion },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating version:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create version' },
      { status: 500 }
    );
  }
}