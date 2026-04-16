const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const config = require('../config');

const logDir = path.join(process.cwd(), 'logs');

const SANITIZE_FIELDS = config.LOGGING?.SANITIZE_FIELDS || [
    'password', 'token', 'secret', 'authorization', 'cookie',
    'accessToken', 'refreshToken', 'newPassword', 'currentPassword',
    'oldPassword', 'confirmPassword', 'otp', 'pin', 'apiKey',
    'apiSecret', 'privateKey', 'creditCard', 'ssn', 'socialSecurity'
];

const sanitizeForLog = (data) => {
    if (!data) return data;
    
    if (typeof data === 'string') return data;
    
    const sanitized = JSON.parse(JSON.stringify(data));
    
    const maskSensitiveData = (obj) => {
        if (!obj || typeof obj !== 'object') return obj;
        
        for (const key of Object.keys(obj)) {
            const lowerKey = key.toLowerCase();
            const isSensitive = SANITIZE_FIELDS.some(field => 
                lowerKey.includes(field.toLowerCase())
            );
            
            if (isSensitive) {
                if (typeof obj[key] === 'string') {
                    obj[key] = '[REDACTED]';
                } else {
                    obj[key] = '[REDACTED]';
                }
            } else if (obj[key] && typeof obj[key] === 'object') {
                maskSensitiveData(obj[key]);
            }
        }
        
        return obj;
    };
    
    return maskSensitiveData(sanitized);
};

const customFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
    winston.format.errors({ stack: true }),
    winston.format((info) => {
        if (info.meta && typeof info.meta === 'object') {
            info.meta = sanitizeForLog(info.meta);
        }
        return info;
    })(),
    winston.format.json()
);

const consoleFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const sanitizedMeta = sanitizeForLog(meta);
        const metaStr = Object.keys(sanitizedMeta).length ? ` ${JSON.stringify(sanitizedMeta)}` : '';
        return `${timestamp} [${level}]: ${message}${metaStr}`;
    })
);

const logger = winston.createLogger({
    level: config.ENV === 'production' ? 'info' : 'debug',
    format: customFormat,
    defaultMeta: { 
        service: 'hrm-api',
        environment: config.ENV 
    },
    transports: [
        new DailyRotateFile({
            filename: path.join(logDir, 'error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: config.LOGGING.MAX_SIZE || '20m',
            maxFiles: config.LOGGING.MAX_FILES || '14d',
            format: customFormat
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'combined-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            maxSize: config.LOGGING.MAX_SIZE || '20m',
            maxFiles: config.LOGGING.MAX_FILES || '14d',
            format: customFormat
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'audit-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '50m',
            maxFiles: '30d',
            format: customFormat
        }),
        new DailyRotateFile({
            filename: path.join(logDir, 'security-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            level: 'warn',
            maxSize: '20m',
            maxFiles: '30d',
            format: customFormat
        })
    ]
});

if (config.ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat,
        level: 'debug'
    }));
}

logger.logSecurity = (message, meta = {}) => {
    const sanitizedMeta = sanitizeForLog(meta);
    logger.warn(`[SECURITY] ${message}`, { ...sanitizedMeta, logType: 'security' });
};

logger.logAuth = (message, meta = {}) => {
    const sanitizedMeta = sanitizeForLog(meta);
    logger.info(`[AUTH] ${message}`, { ...sanitizedMeta, logType: 'auth' });
};

logger.logAudit = (message, meta = {}) => {
    const sanitizedMeta = sanitizeForLog(meta);
    logger.info(`[AUDIT] ${message}`, { ...sanitizedMeta, logType: 'audit' });
};

logger.logPerformance = (operation, duration, meta = {}) => {
    const sanitizedMeta = sanitizeForLog(meta);
    logger.info(`[PERFORMANCE] ${operation} completed`, { 
        ...sanitizedMeta, 
        duration: `${duration}ms`,
        logType: 'performance' 
    });
};

logger.logApi = (req, res, duration) => {
    const sanitizedMeta = sanitizeForLog({
        method: req.method,
        url: req.originalUrl,
        statusCode: res.statusCode,
        userId: req.user?.id,
        requestId: req.requestId,
        ip: req.ip
    });
    
    logger.info('API Request', {
        ...sanitizedMeta,
        duration: `${duration}ms`,
        userAgent: req.get('user-agent'),
        logType: 'api'
    });
};

module.exports = logger;
