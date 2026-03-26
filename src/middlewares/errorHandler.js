const config = require('../config');

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
    422: 'Unprocessable entity. The request data is invalid.',
    429: 'Too many requests. Please slow down and try again later.',
    500: 'Internal server error. Something went wrong on our end.',
    501: 'Not implemented. This feature is not yet available.',
    502: 'Bad gateway. The server received an invalid response.',
    503: 'Service unavailable. The server is temporarily unavailable.',
    504: 'Gateway timeout. The server did not respond in time.'
};

const errorHandler = (err, req, res, _next) => {
    console.error(`[${new Date().toISOString()}] Error:`, {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            success: false,
            message: 'A record with this information already exists.'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Invalid reference. The related resource does not exist.'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed. Please check your input.',
            errors: err.errors
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid authentication token.'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success: false,
            message: 'Your session has expired. Please login again.'
        });
    }

    if (err.message && (err.message.includes('Access token') || err.message.includes('Invalid token'))) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired access token.'
        });
    }

    if (err.message && (err.message.includes('permissions') || err.message.includes('access') || err.message.includes('forbidden'))) {
        return res.status(403).json({
            success: false,
            message: 'You do not have permission to perform this action.'
        });
    }

    if (err.message && (err.message.includes('not found') || err.message.includes('Invalid credentials'))) {
        return res.status(404).json({
            success: false,
            message: 'The requested resource was not found.'
        });
    }

    if (err.message && (err.message.includes('already exists') || err.message.includes('Duplicate'))) {
        return res.status(409).json({
            success: false,
            message: 'A record with this information already exists.'
        });
    }

    const statusCode = err.statusCode || err.status || 500;
    const genericMessage = HTTP_STATUS_MESSAGES[statusCode] || HTTP_STATUS_MESSAGES[500];
    const message = config.ENV === 'production' && statusCode === 500 
        ? genericMessage 
        : (err.message || genericMessage);

    res.status(statusCode).json({
        success: false,
        message
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        success: false,
        message: 'The requested endpoint does not exist.'
    });
};

class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;

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
    asyncHandler,
    HTTP_STATUS_MESSAGES
};
