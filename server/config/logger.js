// Production-Grade Logging System
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Custom log format
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
);

// Console format (human-readable)
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// Create logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    transports: [
        // Console output
        new winston.transports.Console({
            format: consoleFormat
        }),
        
        // All logs file
        new winston.transports.File({
            filename: path.join(logsDir, 'app.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Error logs file
        new winston.transports.File({
            filename: path.join(logsDir, 'error.log'),
            level: 'error',
            maxsize: 10485760, // 10MB
            maxFiles: 5,
            tailable: true
        }),
        
        // Payment logs file (separate for audit)
        new winston.transports.File({
            filename: path.join(logsDir, 'payments.log'),
            maxsize: 10485760, // 10MB
            maxFiles: 10,
            tailable: true
        })
    ]
});

// Payment-specific logger
logger.logPayment = (action, data) => {
    logger.info(`[PAYMENT] ${action}`, {
        ...data,
        timestamp: new Date().toISOString(),
        type: 'payment_audit'
    });
};

// Security logger
logger.logSecurity = (event, data) => {
    logger.warn(`[SECURITY] ${event}`, {
        ...data,
        timestamp: new Date().toISOString(),
        type: 'security_event'
    });
};

// Production-safe logging (no sensitive data)
logger.safeLo = (level, message, data = {}) => {
    // Remove sensitive fields
    const sanitized = { ...data };
    delete sanitized.password;
    delete sanitized.cvv;
    delete sanitized.cardNumber;
    delete sanitized.token;
    
    logger[level](message, sanitized);
};

module.exports = logger;
