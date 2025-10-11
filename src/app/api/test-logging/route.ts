import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/logger';

/**
 * Test endpoint to verify Winston logging is working
 *
 * GET /api/test-logging
 *
 * This endpoint creates several test log entries to verify that:
 * 1. Winston is properly configured
 * 2. Logs are being written to MongoDB
 * 3. Different log levels work correctly
 * 4. PII redaction is working
 *
 * After calling this endpoint, check:
 * - Console output (should see logs in development)
 * - MongoDB collection: db.auditlogs.find()
 * - Logs viewer UI: /admin/logs
 */
export async function GET(req: NextRequest) {
  const testId = Date.now();

  try {
    // Log 1: Info log
    log.info('Test logging endpoint called', {
      testId,
      action: 'test_logging',
      resource: 'logging',
      ipAddress: req.ip || req.headers.get('x-forwarded-for') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
      method: req.method,
      url: req.url,
      tags: ['test', 'api']
    });

    // Log 2: Auth event (simulated)
    log.auth('Simulated login event for testing', {
      testId,
      action: 'login_test',
      resource: 'auth',
      userId: null,
      organizationId: null,
      ipAddress: req.ip || 'unknown',
      tags: ['test', 'auth']
    });

    // Log 3: Security event (simulated)
    log.security('Simulated security event for testing', {
      testId,
      action: 'security_test',
      resource: 'security',
      ipAddress: req.ip || 'unknown',
      tags: ['test', 'security']
    });

    // Log 4: Warning
    log.warn('Test warning message', {
      testId,
      action: 'test_warning',
      resource: 'logging',
      tags: ['test', 'warning']
    });

    // Log 5: Error (simulated)
    const testError = new Error('This is a test error - ignore it');
    log.error('Test error message', testError, {
      testId,
      action: 'test_error',
      resource: 'logging',
      tags: ['test', 'error']
    });

    // Log 6: Performance metric (simulated)
    log.performance('Simulated slow operation', {
      testId,
      action: 'slow_operation',
      resource: 'performance',
      duration: 5432,
      tags: ['test', 'performance', 'slow']
    });

    // Log 7: Database operation (simulated)
    log.database('Simulated database query', {
      testId,
      action: 'query',
      resource: 'database',
      duration: 156,
      tags: ['test', 'database']
    });

    // Log 8: Test PII redaction
    log.info('Testing PII redaction', {
      testId,
      action: 'test_pii',
      resource: 'logging',
      password: 'this-should-be-redacted', // Should be [REDACTED]
      apiKey: 'sk_test_12345', // Should be [REDACTED]
      token: 'bearer_token_here', // Should be [REDACTED]
      normalField: 'this should be visible',
      tags: ['test', 'pii']
    });

    return NextResponse.json({
      success: true,
      message: 'Test logs created successfully!',
      testId,
      logsCreated: 8,
      instructions: {
        mongoShell: [
          'Connect to MongoDB:',
          '  mongo eaip',
          '',
          'View logs:',
          `  db.auditlogs.find({ testId: ${testId} }).pretty()`,
          '',
          'Count all logs:',
          '  db.auditlogs.count()',
          '',
          'View recent logs:',
          '  db.auditlogs.find().sort({ timestamp: -1 }).limit(10).pretty()'
        ],
        webUI: [
          'View in logs viewer:',
          '  1. Navigate to /admin/logs',
          '  2. Login as super_admin or org_admin',
          '  3. Search for testId or look for recent logs',
          '  4. You should see 8 test log entries'
        ],
        checkEnv: [
          'If logs are not appearing:',
          '  1. Check MONGODB_URI is set in .env',
          '  2. Check MongoDB is running',
          '  3. Check console output for Winston errors',
          '  4. Restart your Next.js server'
        ]
      },
      environment: {
        mongodb_uri_set: !!process.env.MONGODB_URI,
        node_env: process.env.NODE_ENV,
        log_level: process.env.LOG_LEVEL || 'info'
      }
    });

  } catch (error: any) {
    log.error('Failed to create test logs', error, {
      testId,
      action: 'test_logging_failed',
      resource: 'logging'
    });

    return NextResponse.json({
      success: false,
      error: 'Failed to create test logs',
      details: error.message,
      environment: {
        mongodb_uri_set: !!process.env.MONGODB_URI,
        node_env: process.env.NODE_ENV,
        log_level: process.env.LOG_LEVEL || 'info'
      }
    }, { status: 500 });
  }
}
