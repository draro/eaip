import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AIPDocument from '@/models/AIPDocument';

export async function GET() {
  try {
    await connectDB();

    const documents = await AIPDocument.find({
      status: 'published'
    })
      .populate('organization', 'name domain')
      .select('title type section status effectiveDate publishedAt organization')
      .sort({ publishedAt: -1 })
      .limit(50);

    return NextResponse.json({
      success: true,
      data: documents
    });
  } catch (error) {
    console.error('Error fetching public documents:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}