const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis').default;
const config = require('../config');
const logger = require('../utils/logger');

let redisClient = null;
let redisStore = null;

const initRedisStore = async () => {
    if (redisStore) return redisStore;

    try {
        const redis = require('redis');
        const redisUrl = config.REDIS_URL || `redis://${config.REDIS.HOST}:${config.REDIS.PORT}`;
        
        redisClient = redis.createClient({
            url: redisUrl,
            legacyMode: false
        });

        redisClient.on('error', (err) => {
            logger.error('Rate limiter Redis error', { error: err.message });
        });

        await redisClient.connect();

        redisStore = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: 'rl:'
        });
        
        logger.info('Rate limiter Redis store initialized');
        return redisStore;
    } catch (error) {
        logger.warn('Failed to initialize Redis for rate limiter, using memory store', { error: error.message });
        return null;
    }
};

const getClientIP = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return req.ip || req.connection?.remoteAddress || 'unknown';
};

const authLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.AUTH_WINDOW_MS,
    max: config.RATE_LIMIT.AUTH_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes',
        retryAfter: Math.ceil(config.RATE_LIMIT.AUTH_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `auth:${getClientIP(req)}:${req.body?.email || 'unknown'}`;
    },
    skip: (req) => req.path === '/health'
});

const otpLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.OTP_WINDOW_MS,
    max: config.RATE_LIMIT.OTP_MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 1 minute',
        retryAfter: Math.ceil(config.RATE_LIMIT.OTP_WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `otp:${getClientIP(req)}:${req.body?.email || 'unknown'}`;
    },
    skip: (req) => req.path === '/health'
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again after 1 hour',
        retryAfter: 3600
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `pwdreset:${getClientIP(req)}:${req.body?.email || 'unknown'}`;
    }
});

const generalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests. Please try again later',
        retryAfter: Math.ceil(config.RATE_LIMIT.WINDOW_MS / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `general:${getClientIP(req)}`;
    },
    skip: (req) => req.path === '/health' || req.path === '/api-docs'
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5000,
    message: {
        success: false,
        message: 'API rate limit exceeded. Please try again later.',
        retryAfter: 60
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return `api:${getClientIP(req)}`;
    }
});

const createUserLimiter = () => {
    return rateLimit({
        windowMs: config.RATE_LIMIT.USER_WINDOW_MS,
        max: config.RATE_LIMIT.USER_MAX_REQUESTS,
        message: {
            success: false,
            message: 'Too many requests. Please try again later',
            retryAfter: Math.ceil(config.RATE_LIMIT.USER_WINDOW_MS / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.id;
            if (userId) {
                return `user:${userId}`;
            }
            return `ip:${getClientIP(req)}`;
        },
        skip: (req) => req.path === '/health'
    });
};

const createAuthenticatedUserLimiter = () => {
    return rateLimit({
        windowMs: config.RATE_LIMIT.USER_WINDOW_MS,
        max: config.RATE_LIMIT.USER_MAX_REQUESTS,
        message: {
            success: false,
            message: 'Rate limit exceeded. Please slow down.',
            retryAfter: Math.ceil(config.RATE_LIMIT.USER_WINDOW_MS / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            const endpoint = req.path.replace(/^\/api\/v1\//, '');
            return `auth-user:${userId}:${endpoint}`;
        },
        skip: (req) => !req.user
    });
};

const createEndpointLimiter = (options = {}) => {
    const {
        windowMs = 60000,
        max = 100,
        keyPrefix = 'endpoint'
    } = options;

    return rateLimit({
        windowMs,
        max,
        message: {
            success: false,
            message: 'Too many requests to this endpoint',
            retryAfter: Math.ceil(windowMs / 1000)
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return `${keyPrefix}:${req.method}:${req.path}`;
        },
        skip: (req) => req.path === '/health'
    });
};

const createSearchLimiter = () => {
    return rateLimit({
        windowMs: 60000,
        max: 30,
        message: {
            success: false,
            message: 'Too many search requests. Please wait before searching again.',
            retryAfter: 60
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            return `search:${userId}`;
        }
    });
};

const createBulkOperationLimiter = () => {
    return rateLimit({
        windowMs: 3600000,
        max: 10,
        message: {
            success: false,
            message: 'Too many bulk operations. Please wait before starting another bulk operation.',
            retryAfter: 3600
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            const userId = req.user?.id || 'anonymous';
            return `bulk:${userId}`;
        }
    });
};

const getRateLimitStats = async () => {
    if (!redisClient || !redisClient.isOpen) {
        return { status: 'redis_unavailable' };
    }

    try {
        const keys = await redisClient.keys('rl:*');
        return {
            status: 'active',
            trackedKeys: keys.length
        };
    } catch (error) {
        logger.error('Error getting rate limit stats', { error: error.message });
        return { status: 'error', error: error.message };
    }
};

module.exports = {
    initRedisStore,
    authLimiter,
    generalLimiter,
    otpLimiter,
    passwordResetLimiter,
    apiLimiter,
    createUserLimiter,
    createAuthenticatedUserLimiter,
    createEndpointLimiter,
    createSearchLimiter,
    createBulkOperationLimiter,
    getRateLimitStats
};
