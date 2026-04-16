const config = require('../config');
const logger = require('../utils/logger');
const { sanitizeError } = require('../utils/sanitizer');

const HTTP_STATUS_MESSAGES = {
    400: 'Bad request. Please check your input and try again.',
    401: 'Authentication required. Please provide valid credentials.',
    402: 'Payment required. This action requires a valid payment.',
    403: 'Access denied. You do not have permission to perform this action.',
    404: 'Resource not found. The requested resource does not exist.',
    405: 'Method not allowed. This HTTP method is not supported for this endpoint.',
    408: 'Request timeout. The server timed out waiting for the request.',
    409: 'Conflict. The request could not be completed due to a conflict.',
    410: 'Gone. The requested resource is no longer available.',
    413: 'Payload too large. The request body exceeds the allowed size.',
    414: 'URI too long. The request URL is too long.',
    415: 'Unsupported media type. The request content type is not supported.',
    422: 'Unprocessable entity. The request data is invalid.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'Internal server error. Something went wrong on our end.',
    501: 'Not implemented. This feature is not yet available.',
    502: 'Bad gateway. The server received an invalid response.',
    503: 'Service unavailable. The server is temporarily unavailable.',
    504: 'Gateway timeout. The server did not respond in time.'
};

const errorHandler = (err, req, res, _next) => {
    const requestId = req.requestId || req.headers['x-request-id'];

    logger.error('Request error', {
        requestId,
        path: req.path,
        method: req.method,
        error: sanitizeError(err),
        ip: req.ip,
        userId: req.user?.id
    });

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'A record with this information already exists.',
            code: 'DUPLICATE_ENTRY'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. The related resource does not exist.',
            code: 'INVALID_REFERENCE'
        });
    }

    if (err.code === 'ER_LOCK_WAIT_TIMEOUT' || err.code === 'ER_LOCK_DEADLOCK') {
        return res.status(503).json({
            success: false,
            message: 'Database temporarily unavailable. Please try again.',
            code: 'DATABASE_LOCK_ERROR'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed. Please check your input.',
            errors: err.errors,
            code: 'VALIDATION_ERROR'
        });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token.',
            code: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please login again.',
            code: 'TOKEN_EXPIRED'
        });
    }

    if (err.message && err.message.includes('Access token')) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.',
            code: 'ACCESS_TOKEN_ERROR'
        });
    }

    if (err.message && (err.message.includes('permissions') || err.message.includes('access') || err.message.includes('forbidden'))) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to perform this action.',
            code: 'FORBIDDEN'
        });
    }

    if (err.message && (err.message.includes('not found') || err.message.includes('Invalid credentials'))) {
        return res.status(404).json({
            success: false,
            message: 'The requested resource was not found.',
            code: 'NOT_FOUND'
        });
    }

    if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        return res.status(409).json({
            success: false,
            message: 'A record with this information already exists.',
            code: 'DUPLICATE'
        });
    }

    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'Cross-origin request blocked by security policy.',
            code: 'CORS_ERROR'
        });
    }

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            message: 'Invalid JSON in request body.',
            code: 'INVALID_JSON'
        });
    }

    if (err.statusCode || err.status) {
        const statusCode = err.statusCode || err.status;
        return res.status(statusCode).json({
            success: false,
            message: err.message || HTTP_STATUS_MESSAGES[statusCode],
            code: err.code || 'ERROR'
        });
    }

    const statusCode = err.statusCode || err.status || 500;
    const genericMessage = HTTP_STATUS_MESSAGES[statusCode] || HTTP_STATUS_MESSAGES[500];
    const message = config.ENV === 'production' && statusCode === 500 
        ? genericMessage 
        : (err.message || genericMessage);

    res.status(statusCode).json({
        success: false,
        message,
        ...(config.ENV !== 'production' && { 
            code: 'INTERNAL_ERROR',
            stack: err.stack 
        })
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'The requested endpoint does not exist.',
        code: 'ENDPOINT_NOT_FOUND'
    });
};

class AppError extends Error {
    constructor(message, statusCode, code = 'APP_ERROR') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}

class ValidationError extends Error {
    constructor(message, errors = []) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.errors = errors;
        this.code = 'VALIDATION_ERROR';

        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthenticationError extends Error {
    constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthenticationError';
        this.statusCode = 401;
        this.code = 'AUTHENTICATION_ERROR';

        Error.captureStackTrace(this, this.constructor);
    }
}

class AuthorizationError extends Error {
    constructor(message = 'Access denied') {
        super(message);
        this.name = 'AuthorizationError';
        this.statusCode = 403;
        this.code = 'AUTHORIZATION_ERROR';

        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends Error {
    constructor(message = 'Resource not found') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
        this.code = 'NOT_FOUND';

        Error.captureStackTrace(this, this.constructor);
    }
}

class ConflictError extends Error {
    constructor(message = 'Resource already exists') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
        this.code = 'CONFLICT';

        Error.captureStackTrace(this, this.constructor);
    }
}

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { 
    errorHandler, 
    notFoundHandler, 
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
    asyncHandler,
    HTTP_STATUS_MESSAGES
};
