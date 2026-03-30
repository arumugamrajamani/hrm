const rateLimit = require('express-rate-limit');
const config = require('../config');
const logger = require('../utils/logger');

let RedisStore;
let redisClient;

const initRedisStore = async () => {
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

        RedisStore = require('rate-limit-redis').default;
        
        logger.info('Rate limiter Redis store initialized');
        return true;
    } catch (error) {
        logger.warn('Failed to initialize Redis for rate limiter, using memory store', { error: error.message });
        return false;
    }
};

const createLimiter = async (options) => {
    const limiterOptions = {
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            message: options.message || 'Too many requests. Please try again later.'
        },
        standardHeaders: true,
        legacyHeaders: false,
        keyGenerator: (req) => {
            return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
        },
        skip: (req) => {
            return req.path === '/health' || req.path === '/api-docs';
        }
    };

    if (redisClient && RedisStore && redisClient.isOpen) {
        limiterOptions.store = new RedisStore({
            sendCommand: (...args) => redisClient.call(...args),
            prefix: options.prefix || 'rl:'
        });
    }

    return rateLimit(limiterOptions);
};

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many login attempts. Please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    }
});

const otpLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    }
});

const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Too many password reset attempts. Please try again after 1 hour'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    }
});

const generalLimiter = rateLimit({
    windowMs: config.RATE_LIMIT.WINDOW_MS,
    max: config.RATE_LIMIT.MAX_REQUESTS,
    message: {
        success: false,
        message: 'Too many requests. Please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    },
    skip: (req) => {
        return req.path === '/health' || req.path === '/api-docs';
    }
});

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: {
        success: false,
        message: 'API rate limit exceeded. Please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
        return req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    }
});

module.exports = {
    initRedisStore,
    authLimiter,
    generalLimiter,
    otpLimiter,
    passwordResetLimiter,
    apiLimiter
};
