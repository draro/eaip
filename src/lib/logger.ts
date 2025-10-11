import * as winston from 'winston';
import { MongoDB } from 'winston-mongodb';

/**
 * Winston Structured Logging Configuration
 *
 * Security Finding Reference: C-003 (CRITICAL - CVSS 8.1)
 *
 * Replaces console.log with structured logging to MongoDB for:
 * - Security monitoring and incident response
 * - Compliance auditing (SOC 2, GDPR, ICAO)
 * - Performance monitoring
 * - Debugging and troubleshooting
 *
 * Access Control:
 * - super_admin: Access ALL logs (no filtering)
 * - org_admin: Access logs filtered by organizationId
 *
 * Environment Variables:
 * - LOG_LEVEL: Minimum log level (default: 'info')
 * - MONGODB_URI: MongoDB connection string for log storage
 * - NODE_ENV: Environment (development/production)
 */

// Custom log format for readable output
const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development (colorized and pretty)
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaString = '';
    if (Object.keys(meta).length > 0) {
      metaString = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled)
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'development' ? consoleFormat : customFormat,
    level: process.env.LOG_LEVEL || 'info',
  })
);

// MongoDB transport (only if MongoDB URI is configured)
if (process.env.MONGODB_URI) {
  transports.push(
    new MongoDB({
      db: process.env.MONGODB_URI,
      collection: 'auditlogs',
      level: 'info', // Only log info and above to database
      options: {
        useUnifiedTopology: true,
      },
      // Transform the log entry before saving to MongoDB
      metaKey: 'details',
      storeHost: false,
      capped: false,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports,
  exitOnError: false,
});

// Stream for Morgan HTTP logging
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
} as any;

/**
 * Structured logging interface with security context
 */
export interface LogContext {
  organizationId?: string | null;
  userId?: string | null;
  action?: string;
  resource?: string;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  duration?: number | null;
  statusCode?: number | null;
  method?: string | null;
  url?: string | null;
  tags?: string[];
  [key: string]: any;
}

/**
 * Security-aware logger with automatic PII redaction
 */
class SecureLogger {
  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext) {
    logger.info(message, this.sanitizeContext(context));
  }

  /**
   * Log a warning message
   */
  warn(message: string, context?: LogContext) {
    logger.warn(message, this.sanitizeContext(context));
  }

  /**
   * Log an error message
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorDetails = error instanceof Error
      ? {
          error: error.message,
          stack: error.stack,
          name: error.name,
        }
      : { error: String(error) };

    logger.error(message, {
      ...this.sanitizeContext(context),
      ...errorDetails,
    });
  }

  /**
   * Log a debug message (development only)
   */
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === 'development') {
      logger.debug(message, this.sanitizeContext(context));
    }
  }

  /**
   * Log an HTTP request
   */
  http(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['http', ...(context?.tags || [])],
    });
  }

  /**
   * Log a security event
   */
  security(message: string, context?: LogContext) {
    logger.warn(message, {
      ...this.sanitizeContext(context),
      tags: ['security', ...(context?.tags || [])],
    });
  }

  /**
   * Log an authentication event
   */
  auth(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['auth', ...(context?.tags || [])],
    });
  }

  /**
   * Log a database operation
   */
  database(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['database', ...(context?.tags || [])],
    });
  }

  /**
   * Log an API call to external service
   */
  api(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['api', 'external', ...(context?.tags || [])],
    });
  }

  /**
   * Log a compliance-related event
   */
  compliance(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['compliance', ...(context?.tags || [])],
    });
  }

  /**
   * Log a performance metric
   */
  performance(message: string, context?: LogContext) {
    logger.info(message, {
      ...this.sanitizeContext(context),
      tags: ['performance', ...(context?.tags || [])],
    });
  }

  /**
   * Sanitize context to remove sensitive information
   *
   * Redacts: passwords, tokens, API keys, secrets, credit cards, SSN, etc.
   */
  private sanitizeContext(context?: LogContext): LogContext {
    if (!context) return {};

    const sensitiveKeys = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'creditCard',
      'credit_card',
      'ssn',
      'socialSecurity',
      'authorization',
      'cookie',
      'session',
    ];

    const sanitized = { ...context };

    const recursiveSanitize = (obj: any): any => {
      if (typeof obj !== 'object' || obj === null) {
        return obj;
      }

      const result: any = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        const lowerKey = key.toLowerCase();

        // Check if key contains sensitive data
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          result[key] = recursiveSanitize(value);
        } else {
          result[key] = value;
        }
      }

      return result;
    };

    return recursiveSanitize(sanitized);
  }

  /**
   * Get child logger with default context
   *
   * Useful for adding default fields to all logs in a module
   */
  child(defaultContext: LogContext): SecureLogger {
    const childLogger = new SecureLogger();
    const originalMethods = {
      info: childLogger.info.bind(childLogger),
      warn: childLogger.warn.bind(childLogger),
      error: childLogger.error.bind(childLogger),
      debug: childLogger.debug.bind(childLogger),
    };

    childLogger.info = (message: string, context?: LogContext) => {
      originalMethods.info(message, { ...defaultContext, ...context });
    };

    childLogger.warn = (message: string, context?: LogContext) => {
      originalMethods.warn(message, { ...defaultContext, ...context });
    };

    childLogger.error = (message: string, error?: Error | unknown, context?: LogContext) => {
      originalMethods.error(message, error, { ...defaultContext, ...context });
    };

    childLogger.debug = (message: string, context?: LogContext) => {
      originalMethods.debug(message, { ...defaultContext, ...context });
    };

    return childLogger;
  }
}

// Export singleton instance
export const log = new SecureLogger();

// Export raw Winston logger for advanced use cases
export { logger as winstonLogger };

/**
 * Usage Examples:
 *
 * // Basic logging
 * log.info('User logged in successfully', {
 *   userId: user.id,
 *   organizationId: user.organizationId,
 *   action: 'login',
 *   resource: 'auth',
 * });
 *
 * // Error logging
 * log.error('Failed to create document', error, {
 *   userId: user.id,
 *   action: 'create',
 *   resource: 'documents',
 * });
 *
 * // HTTP request logging
 * log.http('API request received', {
 *   method: 'POST',
 *   url: '/api/documents',
 *   ipAddress: req.ip,
 *   userAgent: req.headers['user-agent'],
 *   statusCode: 201,
 *   duration: 152,
 * });
 *
 * // Security event logging
 * log.security('Failed login attempt detected', {
 *   ipAddress: req.ip,
 *   userId: user.id,
 *   action: 'login_failed',
 *   resource: 'auth',
 * });
 *
 * // Child logger with default context
 * const documentLogger = log.child({
 *   resource: 'documents',
 *   userId: user.id,
 *   organizationId: user.organizationId,
 * });
 *
 * documentLogger.info('Document created'); // Automatically includes default context
 */
