const winston = require('winston');
const { MongoDB } = require('winston-mongodb');
require('dotenv').config(); // Load environment variables from .env

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
const transports = [];

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
            level: 'info',
            options: {
                useUnifiedTopology: true,
            },
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
    write: (message) => {
        logger.info(message.trim());
    },
};

// Security-aware logger with automatic PII redaction
class SecureLogger {
    info(message, context) {
        logger.info(message, this.sanitizeContext(context));
    }

    warn(message, context) {
        logger.warn(message, this.sanitizeContext(context));
    }

    error(message, error, context) {
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

    debug(message, context) {
        if (process.env.NODE_ENV === 'development') {
            logger.debug(message, this.sanitizeContext(context));
        }
    }

    http(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['http', ...(context?.tags || [])],
        });
    }

    security(message, context) {
        logger.warn(message, {
            ...this.sanitizeContext(context),
            tags: ['security', ...(context?.tags || [])],
        });
    }

    auth(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['auth', ...(context?.tags || [])],
        });
    }

    database(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['database', ...(context?.tags || [])],
        });
    }

    api(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['api', 'external', ...(context?.tags || [])],
        });
    }

    compliance(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['compliance', ...(context?.tags || [])],
        });
    }

    performance(message, context) {
        logger.info(message, {
            ...this.sanitizeContext(context),
            tags: ['performance', ...(context?.tags || [])],
        });
    }

    sanitizeContext(context) {
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

        const recursiveSanitize = (obj) => {
            if (typeof obj !== 'object' || obj === null) {
                return obj;
            }

            const result = Array.isArray(obj) ? [] : {};

            for (const [key, value] of Object.entries(obj)) {
                const lowerKey = key.toLowerCase();

                if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
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

    child(defaultContext) {
        const childLogger = new SecureLogger();
        const originalMethods = {
            info: childLogger.info.bind(childLogger),
            warn: childLogger.warn.bind(childLogger),
            error: childLogger.error.bind(childLogger),
            debug: childLogger.debug.bind(childLogger),
        };

        childLogger.info = (message, context) => {
            originalMethods.info(message, { ...defaultContext, ...context });
        };

        childLogger.warn = (message, context) => {
            originalMethods.warn(message, { ...defaultContext, ...context });
        };

        childLogger.error = (message, error, context) => {
            originalMethods.error(message, error, { ...defaultContext, ...context });
        };

        childLogger.debug = (message, context) => {
            originalMethods.debug(message, { ...defaultContext, ...context });
        };

        return childLogger;
    }
}

// Export logger instances
const log = new SecureLogger();

module.exports = {
    log,
    winstonLogger: logger,
};