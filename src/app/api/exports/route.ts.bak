import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ExportJob from '@/models/ExportJob';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const skip = (page - 1) * limit;

    const exports = await ExportJob.find()
      .populate('version', 'versionNumber airacCycle')
      .populate('requestedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ExportJob.countDocuments();

    return NextResponse.json({
      success: true,
      data: exports,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching exports:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch exports' },
      { status: 500 }
    );
  }
}