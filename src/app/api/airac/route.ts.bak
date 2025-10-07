import { NextRequest, NextResponse } from 'next/server';
import { AIRACManager } from '@/lib/airacManager';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const year = searchParams.get('year');
    const cycleId = searchParams.get('cycleId');

    switch (action) {
      case 'current':
        const currentCycle = AIRACManager.getCurrentAIRACCycle();
        return NextResponse.json({
          success: true,
          data: currentCycle,
        });

      case 'next':
        const nextCycle = AIRACManager.getNextAIRACCycle();
        return NextResponse.json({
          success: true,
          data: nextCycle,
        });

      case 'previous':
        const previousCycle = AIRACManager.getPreviousAIRACCycle();
        return NextResponse.json({
          success: true,
          data: previousCycle,
        });

      case 'year':
        if (!year) {
          return NextResponse.json(
            { success: false, error: 'Year parameter is required' },
            { status: 400 }
          );
        }
        const yearCycles = AIRACManager.getAIRACCyclesForYear(parseInt(year));
        return NextResponse.json({
          success: true,
          data: yearCycles,
        });

      case 'validate':
        if (!cycleId) {
          return NextResponse.json(
            { success: false, error: 'Cycle ID parameter is required' },
            { status: 400 }
          );
        }
        const validation = AIRACManager.validateAIRACCycle(cycleId);
        return NextResponse.json({
          success: true,
          data: validation,
        });

      case 'schedule':
        if (!cycleId) {
          return NextResponse.json(
            { success: false, error: 'Cycle ID parameter is required' },
            { status: 400 }
          );
        }
        const cycle = AIRACManager.getAIRACCycleById(cycleId);
        if (!cycle) {
          return NextResponse.json(
            { success: false, error: 'Invalid AIRAC cycle ID' },
            { status: 404 }
          );
        }
        const schedule = AIRACManager.getPublicationSchedule(cycle);
        return NextResponse.json({
          success: true,
          data: schedule,
        });

      default:
        // Generate AIRAC cycles for current and next year
        const currentYear = new Date().getFullYear();
        const cycles = AIRACManager.generateAIRACCycles(currentYear, currentYear + 1);
        return NextResponse.json({
          success: true,
          data: cycles,
        });
    }
  } catch (error) {
    console.error('Error handling AIRAC request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process AIRAC request' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, baseCycleId, amendmentNumber, effectiveDate } = body;

    if (action === 'create_amendment') {
      if (!baseCycleId || !amendmentNumber || !effectiveDate) {
        return NextResponse.json(
          { success: false, error: 'Missing required fields for amendment creation' },
          { status: 400 }
        );
      }

      const baseCycle = AIRACManager.getAIRACCycleById(baseCycleId);
      if (!baseCycle) {
        return NextResponse.json(
          { success: false, error: 'Invalid base AIRAC cycle ID' },
          { status: 404 }
        );
      }

      const amendment = AIRACManager.createAmendment(
        baseCycle,
        amendmentNumber,
        new Date(effectiveDate)
      );

      return NextResponse.json({
        success: true,
        data: amendment,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error creating AIRAC amendment:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create AIRAC amendment' },
      { status: 500 }
    );
  }
}