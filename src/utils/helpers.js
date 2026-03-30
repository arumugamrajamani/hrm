const config = require('../config');

const successResponse = (res, data, message = 'Success', statusCode = 200, meta = null) => {
    const response = {
        success: true,
        message,
        data
    };

    if (meta !== null) {
        response.meta = meta;
    }

    return res.status(statusCode).json(response);
};

const errorResponse = (res, message = 'Error', statusCode = 500, error = null) => {
    const response = {
        success: false,
        message
    };

    if (error && process.env.NODE_ENV !== 'production') {
        response.error = {
            name: error.name,
            message: error.message,
            stack: error.stack
        };
    }

    return res.status(statusCode).json(response);
};

const paginatedResponse = (res, data, pagination, message = 'Success') => {
    return res.status(200).json({
        success: true,
        message,
        data,
        meta: {
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages
            }
        }
    });
};

const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toISOString();
};

const isPasswordExpired = (passwordChangedAt) => {
    if (!passwordChangedAt) return true;
    
    const expiryDate = new Date(passwordChangedAt);
    expiryDate.setDate(expiryDate.getDate() + config.SECURITY.PASSWORD_EXPIRY_DAYS);
    
    return new Date() > expiryDate;
};

const getDaysUntilPasswordExpiry = (passwordChangedAt) => {
    if (!passwordChangedAt) return 0;
    
    const expiryDate = new Date(passwordChangedAt);
    expiryDate.setDate(expiryDate.getDate() + config.SECURITY.PASSWORD_EXPIRY_DAYS);
    
    const now = new Date();
    const diffTime = expiryDate - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
};

const sanitizeUser = (user) => {
    const { password, ...sanitized } = user;
    return sanitized;
};

const parseJSON = (jsonString, defaultValue = null) => {
    try {
        return JSON.parse(jsonString);
    } catch {
        return defaultValue;
    }
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse,
    formatDate,
    isPasswordExpired,
    getDaysUntilPasswordExpiry,
    sanitizeUser,
    parseJSON
};
