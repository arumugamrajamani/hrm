const config = require('../config');

const SANITIZE_FIELDS = config.LOGGING.SANITIZE_FIELDS || [
    'password',
    'token',
    'secret',
    'authorization',
    'cookie',
    'accessToken',
    'refreshToken',
    'newPassword',
    'currentPassword',
    'oldPassword',
    'confirmPassword',
    'otp',
    'pin',
    'apiKey',
    'apiSecret',
    'privateKey',
    'creditCard',
    'ssn',
    'socialSecurity'
];

const MASK_CHAR = config.LOGGING.MASK_CHAR || '*';

const sanitizeValue = (value, fieldName) => {
    if (!value) return value;
    
    const lowerFieldName = fieldName.toLowerCase();
    const shouldSanitize = SANITIZE_FIELDS.some(field => 
        lowerFieldName.includes(field.toLowerCase())
    );
    
    if (!shouldSanitize) return value;
    
    if (typeof value === 'string') {
        if (value.length <= 4) {
            return MASK_CHAR.repeat(value.length);
        }
        return value.substring(0, 2) + MASK_CHAR.repeat(value.length - 4) + value.substring(value.length - 2);
    }
    
    if (typeof value === 'object') {
        return '[REDACTED]';
    }
    
    return value;
};

const sanitizeObject = (obj, parentKey = '') => {
    if (!obj || typeof obj !== 'object') {
        return obj;
    }
    
    const sanitized = Array.isArray(obj) ? [] : {};
    
    for (const key of Object.keys(obj)) {
        const value = obj[key];
        const fullKey = parentKey ? `${parentKey}.${key}` : key;
        
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            sanitized[key] = sanitizeObject(value, fullKey);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map((item, index) => {
                if (item && typeof item === 'object') {
                    return sanitizeObject(item, `${fullKey}[${index}]`);
                }
                return sanitizeValue(item, fullKey);
            });
        } else {
            sanitized[key] = sanitizeValue(value, fullKey);
        }
    }
    
    return sanitized;
};

const sanitizeRequest = (req) => {
    const sanitized = {
        method: req.method,
        url: req.originalUrl || req.url,
        path: req.path,
        params: req.params,
        query: req.query,
        headers: sanitizeHeaders(req.headers),
        ip: req.ip || req.connection?.remoteAddress,
        timestamp: new Date().toISOString()
    };
    
    if (req.body && Object.keys(req.body).length > 0) {
        sanitized.body = sanitizeObject(req.body);
    }
    
    return sanitized;
};

const sanitizeHeaders = (headers) => {
    if (!headers) return {};
    
    const sanitized = { ...headers };
    
    const sensitiveHeaders = [
        'authorization',
        'cookie',
        'x-api-key',
        'x-auth-token',
        'x-csrf-token',
        'x-request-id'
    ];
    
    for (const header of sensitiveHeaders) {
        if (sanitized[header]) {
            if (typeof sanitized[header] === 'string') {
                sanitized[header] = '[REDACTED]';
            }
        }
    }
    
    return sanitized;
};

const sanitizeError = (error) => {
    if (!error) return null;
    
    return {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: config.ENV !== 'production' ? error.stack : undefined
    };
};

const sanitizeLog = (data) => {
    if (!data) return data;
    
    if (typeof data === 'string') {
        return data;
    }
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeLog(item));
    }
    
    return sanitizeObject(data);
};

const requestSanitizer = (req, res, next) => {
    const startTime = Date.now();
    
    req.sanitizedRequest = sanitizeRequest(req);
    req.requestStartTime = startTime;
    
    const originalJson = res.json.bind(res);
    res.json = (body) => {
        return originalJson(body);
    };
    
    next();
};

const responseSanitizer = (req, res, next) => {
    const originalJson = res.json.bind(res);
    
    res.json = (body) => {
        if (body && body.data) {
            const sanitizedData = sanitizeResponseData(body.data);
            body = { ...body, data: sanitizedData };
        }
        
        return originalJson(body);
    };
    
    next();
};

const sanitizeResponseData = (data) => {
    if (!data) return data;
    
    if (Array.isArray(data)) {
        return data.map(item => sanitizeResponseData(item));
    }
    
    if (typeof data === 'object') {
        const sanitized = { ...data };
        
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];
        
        for (const field of sensitiveFields) {
            if (sanitized[field] !== undefined) {
                delete sanitized[field];
            }
        }
        
        for (const key of Object.keys(sanitized)) {
            if (sanitized[key] && typeof sanitized[key] === 'object') {
                sanitized[key] = sanitizeResponseData(sanitized[key]);
            }
        }
        
        return sanitized;
    }
    
    return data;
};

const logSanitized = (level, message, data = {}) => {
    const sanitizedData = sanitizeLog(data);
    logger[level](message, sanitizedData);
};

module.exports = {
    sanitizeValue,
    sanitizeObject,
    sanitizeRequest,
    sanitizeHeaders,
    sanitizeError,
    sanitizeLog,
    requestSanitizer,
    responseSanitizer,
    sanitizeResponseData,
    logSanitized,
    SANITIZE_FIELDS
};
