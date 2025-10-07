import { NextRequest, NextResponse } from 'next/server';
import { generateAiracCycle, parseAiracCycle } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    const count = parseInt(searchParams.get('count') || '1');

    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const cycles = [];

    for (let i = 0; i < count; i++) {
      const cycleDate = new Date(baseDate);
      cycleDate.setDate(cycleDate.getDate() + (i * 28)); // AIRAC cycles are 28 days apart

      const airacCycle = generateAiracCycle(cycleDate);
      const effectiveDate = parseAiracCycle(airacCycle);

      cycles.push({
        airacCycle,
        effectiveDate: effectiveDate.toISOString(),
        versionNumber: `v${airacCycle}`,
      });
    }

    return NextResponse.json({
      success: true,
      data: cycles,
    });
  } catch (error) {
    console.error('Error generating AIRAC cycles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate AIRAC cycles' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { airacCycle } = body;

    if (!airacCycle) {
      return NextResponse.json(
        { success: false, error: 'AIRAC cycle is required' },
        { status: 400 }
      );
    }

    const effectiveDate = parseAiracCycle(airacCycle);
    const versionNumber = `v${airacCycle}`;

    return NextResponse.json({
      success: true,
      data: {
        airacCycle,
        effectiveDate: effectiveDate.toISOString(),
        versionNumber,
        isValid: !isNaN(effectiveDate.getTime()),
      },
    });
  } catch (error) {
    console.error('Error validating AIRAC cycle:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid AIRAC cycle format' },
      { status: 400 }
    );
  }
}