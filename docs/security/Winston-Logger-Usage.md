# Winston Logger Usage Guide

## Overview

This guide demonstrates how to use the Winston structured logging system to replace `console.log` statements throughout the eAIP application.

**Security Finding Reference:** C-003 (CRITICAL - CVSS 8.1)

## Why Replace console.log?

**Security Risks:**
- Sensitive data (passwords, tokens, PII) can be logged accidentally
- Logs are not structured, making security analysis difficult
- No access control - anyone with log access sees everything
- Difficult to query and analyze for compliance audits

**Benefits of Winston:**
- Automatic PII redaction
- Structured logs in MongoDB
- Role-based access control (super_admin vs org_admin)
- Queryable for compliance and security audits
- Performance monitoring and alerting

## Basic Usage

### Import the Logger

```typescript
import { log } from '@/lib/logger';
```

### Replace console.log Statements

**Before (Insecure):**
```typescript
console.log('User logged in:', user);
console.log('Processing document:', documentId);
console.error('Database error:', error);
```

**After (Secure):**
```typescript
log.auth('User logged in successfully', {
  userId: user.id,
  organizationId: user.organizationId,
  action: 'login',
  resource: 'auth',
});

log.info('Processing document', {
  documentId,
  userId: user.id,
  action: 'process',
  resource: 'documents',
});

log.error('Database connection failed', error, {
  action: 'connect',
  resource: 'database',
});
```

## Log Levels

### 1. info() - General Information

Use for successful operations and normal application flow.

```typescript
log.info('Document created successfully', {
  documentId: document.id,
  userId: user.id,
  organizationId: user.organizationId,
  action: 'create',
  resource: 'documents',
  resourceId: document.id,
});
```

### 2. warn() - Warnings

Use for non-critical issues that should be investigated.

```typescript
log.warn('API response slow', {
  duration: 5432, // milliseconds
  url: '/api/documents/search',
  action: 'search',
  resource: 'documents',
  tags: ['performance', 'slow'],
});
```

### 3. error() - Errors

Use for errors and exceptions.

```typescript
try {
  await processDocument(doc);
} catch (error) {
  log.error('Failed to process document', error, {
    documentId: doc.id,
    userId: user.id,
    action: 'process',
    resource: 'documents',
  });
  throw error;
}
```

### 4. debug() - Debug Information

Use for detailed debugging (development only).

```typescript
log.debug('Fetching documents with filters', {
  filters: { status: 'published', type: 'AD' },
  userId: user.id,
});
```

## Specialized Log Methods

### auth() - Authentication Events

```typescript
// Successful login
log.auth('User login successful', {
  userId: user.id,
  email: user.email,
  organizationId: user.organizationId,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  action: 'login_success',
  resource: 'auth',
});

// Failed login
log.auth('Login attempt failed - invalid credentials', {
  email: email,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  action: 'login_failed',
  resource: 'auth',
  tags: ['security', 'failed_auth'],
});

// Password changed
log.auth('User password changed', {
  userId: user.id,
  action: 'password_change',
  resource: 'auth',
  tags: ['security'],
});
```

### security() - Security Events

```typescript
// Suspicious activity
log.security('Multiple failed login attempts detected', {
  email: email,
  attempts: 5,
  ipAddress: req.ip,
  action: 'brute_force_attempt',
  resource: 'auth',
  tags: ['security', 'brute_force'],
});

// Unauthorized access attempt
log.security('Unauthorized access attempt', {
  userId: user.id,
  requestedResource: '/admin/users',
  userRole: user.role,
  action: 'unauthorized_access',
  resource: 'access_control',
  tags: ['security', 'unauthorized'],
});

// Rate limit exceeded
log.security('Rate limit exceeded', {
  ipAddress: req.ip,
  endpoint: '/api/auth/login',
  attempts: 10,
  action: 'rate_limit_exceeded',
  resource: 'rate_limiting',
});
```

### http() - HTTP Requests

```typescript
// API request logging
log.http('API request received', {
  method: req.method,
  url: req.url,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  userId: user?.id,
  organizationId: user?.organizationId,
  requestId: req.headers['x-request-id'],
});

// API response logging
log.http('API response sent', {
  method: req.method,
  url: req.url,
  statusCode: 200,
  duration: Date.now() - startTime,
  userId: user?.id,
  requestId: req.headers['x-request-id'],
});
```

### database() - Database Operations

```typescript
// Slow query warning
log.database('Slow database query detected', {
  collection: 'documents',
  operation: 'find',
  duration: 2500,
  query: { status: 'published' },
  tags: ['performance', 'slow_query'],
});

// Database error
log.database('Database operation failed', error, {
  collection: 'users',
  operation: 'update',
  documentId: userId,
});
```

### performance() - Performance Metrics

```typescript
// Track operation duration
const startTime = Date.now();
await expensiveOperation();
const duration = Date.now() - startTime;

log.performance('Document processing completed', {
  documentId: doc.id,
  duration,
  action: 'process',
  resource: 'documents',
  tags: duration > 1000 ? ['slow'] : [],
});
```

### compliance() - Compliance Events

```typescript
// GDPR data export
log.compliance('User data exported', {
  userId: user.id,
  requestedBy: user.id,
  dataTypes: ['profile', 'documents', 'activity'],
  action: 'data_export',
  resource: 'gdpr',
  tags: ['gdpr', 'data_export'],
});

// Data retention policy applied
log.compliance('Old documents archived', {
  count: 150,
  olderThan: '7 years',
  action: 'archive',
  resource: 'data_retention',
  tags: ['compliance', 'retention'],
});
```

## Context Fields

Always include these fields when available:

### Required Fields
- `message`: Clear description of the event
- `action`: What action was performed (e.g., 'create', 'update', 'delete', 'login')
- `resource`: What resource was affected (e.g., 'documents', 'users', 'auth')

### Recommended Fields
- `userId`: ID of the user performing the action
- `organizationId`: ID of the organization (for multi-tenant filtering)
- `resourceId`: ID of the specific resource affected
- `ipAddress`: IP address of the request
- `userAgent`: Browser/client information
- `duration`: Time taken for operation (milliseconds)
- `statusCode`: HTTP status code
- `tags`: Array of tags for categorization

### Example with All Fields

```typescript
log.info('Document updated successfully', {
  // Required
  action: 'update',
  resource: 'documents',

  // Recommended
  userId: user.id,
  organizationId: user.organizationId,
  resourceId: document.id,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  requestId: req.headers['x-request-id'],
  duration: 156,
  statusCode: 200,
  tags: ['documents', 'update'],

  // Custom
  documentType: document.type,
  changes: ['title', 'content'],
});
```

## API Route Example

Complete example of logging in an API route:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/authOptions';
import { log } from '@/lib/logger';
import connectDB from '@/lib/mongodb';
import Document from '@/models/Document';

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // Log request
    log.http('Create document request received', {
      method: 'POST',
      url: '/api/documents',
      ipAddress: req.ip,
      userAgent: req.headers.get('user-agent'),
      requestId,
    });

    // Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      log.security('Unauthenticated document creation attempt', {
        ipAddress: req.ip,
        action: 'create_unauthorized',
        resource: 'documents',
        requestId,
        tags: ['security', 'unauthorized'],
      });

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = session.user;

    await connectDB();

    const body = await req.json();
    const { title, content, type } = body;

    // Validate input
    if (!title || !content || !type) {
      log.warn('Invalid document creation request', {
        userId: user.id,
        organizationId: user.organizationId,
        missing: [
          !title && 'title',
          !content && 'content',
          !type && 'type',
        ].filter(Boolean),
        action: 'create_invalid',
        resource: 'documents',
        requestId,
      });

      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create document
    const document = await Document.create({
      title,
      content,
      type,
      createdBy: user.id,
      organization: user.organizationId,
    });

    const duration = Date.now() - startTime;

    // Log success
    log.info('Document created successfully', {
      documentId: document.id,
      userId: user.id,
      organizationId: user.organizationId,
      documentType: type,
      action: 'create',
      resource: 'documents',
      resourceId: document.id,
      ipAddress: req.ip,
      requestId,
      duration,
      statusCode: 201,
      tags: ['documents', 'create'],
    });

    return NextResponse.json(
      { success: true, data: document },
      { status: 201 }
    );

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log error
    log.error('Document creation failed', error, {
      userId: session?.user?.id,
      organizationId: session?.user?.organizationId,
      action: 'create_failed',
      resource: 'documents',
      ipAddress: req.ip,
      requestId,
      duration,
      statusCode: 500,
      tags: ['documents', 'error'],
    });

    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
```

## Child Logger for Modules

For modules that always log with the same context, create a child logger:

```typescript
// In a service module
import { log } from '@/lib/logger';

export class DocumentService {
  private logger: typeof log;

  constructor(userId: string, organizationId: string) {
    // Create child logger with default context
    this.logger = log.child({
      userId,
      organizationId,
      resource: 'documents',
    });
  }

  async processDocument(documentId: string) {
    // Automatically includes userId, organizationId, and resource
    this.logger.info('Processing document', {
      documentId,
      action: 'process',
    });

    try {
      // ... processing logic
      this.logger.info('Document processed successfully', {
        documentId,
        action: 'process_success',
      });
    } catch (error) {
      this.logger.error('Document processing failed', error, {
        documentId,
        action: 'process_failed',
      });
      throw error;
    }
  }
}
```

## Querying Logs

### Super Admin (All Logs)

```typescript
import AuditLog from '@/models/AuditLog';

// Get all error logs from last 24 hours
const errors = await AuditLog.find({
  level: 'error',
  timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
}).sort({ timestamp: -1 }).limit(100);

// Get all failed login attempts
const failedLogins = await AuditLog.find({
  action: 'login_failed',
  tags: 'security',
}).sort({ timestamp: -1 });
```

### Org Admin (Organization-Filtered Logs)

```typescript
// Get organization logs only
const orgLogs = await AuditLog.findForOrganization(
  user.organizationId,
  {
    level: 'error',
    timestamp: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  },
  { limit: 100 }
);
```

## Automatic PII Redaction

Sensitive fields are automatically redacted:

```typescript
// This log entry
log.info('User registered', {
  email: 'user@example.com',
  password: 'MyPassword123!', // Automatically redacted
  apiKey: 'sk_live_1234567890', // Automatically redacted
  name: 'John Doe', // Not sensitive, kept
});

// Is stored as
{
  email: 'user@example.com',
  password: '[REDACTED]',
  apiKey: '[REDACTED]',
  name: 'John Doe',
}
```

Redacted fields:
- password
- token
- apiKey / api_key
- secret
- creditCard / credit_card
- ssn
- socialSecurity
- authorization
- cookie
- session

## Migration Checklist

To replace console.log statements in a file:

1. [ ] Import logger: `import { log } from '@/lib/logger';`
2. [ ] Find all `console.log` statements
3. [ ] Determine appropriate log level (info, warn, error, debug)
4. [ ] Determine specialized method (auth, security, http, etc.)
5. [ ] Add context fields (userId, organizationId, action, resource)
6. [ ] Test logging works
7. [ ] Verify sensitive data is redacted
8. [ ] Remove original console.log statements

## Best Practices

✅ **DO:**
- Always include userId and organizationId when available
- Use descriptive action names (e.g., 'create', 'update', 'delete', 'login')
- Add tags for categorization
- Log both successes and failures
- Include duration for performance monitoring
- Use specialized methods (auth, security, etc.)

❌ **DON'T:**
- Don't log passwords or tokens directly
- Don't use console.log anymore
- Don't log excessive debug information in production
- Don't forget error stack traces
- Don't omit organizationId (breaks org_admin filtering)

## Performance Considerations

- Logging to MongoDB is asynchronous and non-blocking
- Console logs still appear in development for debugging
- Production logs are written to MongoDB only
- Logs older than 90 days are automatically deleted (configurable)

## Compliance Benefits

- SOC 2 Type II: Audit trail requirement ✅
- GDPR: Data access logging requirement ✅
- ICAO Annex 15: Change tracking requirement ✅
- EUROCONTROL: Security monitoring requirement ✅

## Support

For questions or issues:
1. Check this guide
2. Review Security Audit Report (Finding C-003)
3. Contact security team
