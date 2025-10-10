import { NextRequest, NextResponse } from 'next/server';
import { withAuth, createErrorResponse } from '@/lib/apiMiddleware';
import { AIRACCycleManager } from '@/lib/airacCycleManager';

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can activate AIRAC cycles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { airacCycle } = body;

    if (!airacCycle) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: airacCycle (e.g., "2024-10")' },
        { status: 400 }
      );
    }

    const result = await AIRACCycleManager.activateAIRACCycle(airacCycle);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `AIRAC cycle ${airacCycle} activated successfully`,
        data: {
          publishedDocuments: result.publishedCount,
          archivedDocuments: result.archivedCount
        }
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to activate AIRAC cycle',
          details: {
            publishedDocuments: result.publishedCount,
            archivedDocuments: result.archivedCount,
            errors: result.errors
          }
        },
        { status: 400 }
      );
    }

  } catch (error) {
    return createErrorResponse(error, 'Failed to activate AIRAC cycle');
  }
});

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'upcoming') {
      const count = parseInt(searchParams.get('count') || '3');
      const upcoming = await AIRACCycleManager.getUpcomingAIRACCycles(count);
      return NextResponse.json({
        success: true,
        data: upcoming
      });
    }

    if (!['super_admin', 'org_admin'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Only administrators can perform this action' },
        { status: 403 }
      );
    }

    if (action === 'check_pending') {
      const result = await AIRACCycleManager.checkAndActivatePendingCycles();
      return NextResponse.json({
        success: result.errors.length === 0,
        data: {
          activatedCycles: result.activated,
          errors: result.errors
        }
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use: check_pending or upcoming' },
      { status: 400 }
    );

  } catch (error) {
    return createErrorResponse(error, 'Failed to check AIRAC cycle status');
  }
});
