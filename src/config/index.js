require('dotenv').config();

const requiredEnvVars = [
    'DB_HOST',
    'DB_USER',
    'DB_NAME',
    'JWT_SECRET',
    'JWT_REFRESH_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0 && process.env.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

const config = {
    ENV: process.env.NODE_ENV || 'development',
    APP_VERSION: process.env.APP_VERSION || '1.0.0',
    PORT: parseInt(process.env.PORT) || 3000,

    DB: {
        HOST: process.env.DB_HOST || 'localhost',
        USER: process.env.DB_USER || 'root',
        PASSWORD: process.env.DB_PASSWORD || '',
        NAME: process.env.DB_NAME || 'hrm',
        PORT: parseInt(process.env.DB_PORT) || 3306
    },

    REDIS: {
        HOST: process.env.REDIS_HOST || 'localhost',
        PORT: parseInt(process.env.REDIS_PORT) || 6379,
        PASSWORD: process.env.REDIS_PASSWORD || undefined,
        DB: parseInt(process.env.REDIS_DB) || 0
    },
    REDIS_URL: process.env.REDIS_URL || undefined,

    JWT: {
        SECRET: process.env.JWT_SECRET,
        REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
        REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d'
    },

    SMTP: {
        HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
        PORT: parseInt(process.env.SMTP_PORT) || 587,
        SECURE: process.env.SMTP_SECURE === 'true',
        USER: process.env.SMTP_USER || '',
        PASS: process.env.SMTP_PASS || '',
        FROM_NAME: process.env.SMTP_FROM_NAME || 'HRM System',
        FROM_EMAIL: process.env.SMTP_FROM_EMAIL || 'noreply@hrmsystem.com'
    },

    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:4200',
        'http://localhost:4201',
        'http://localhost:3000',
        'http://localhost:3001'
    ],
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
    API_URL: process.env.API_URL || 'http://localhost:3000',

    SECURITY: {
        PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        PASSWORD_EXPIRY_DAYS: parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 90,
        MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        BLOCK_DURATION_MINUTES: parseInt(process.env.BLOCK_DURATION_MINUTES) || 30,
        OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
        OTP_EXPIRY_PASSWORD_MINUTES: parseInt(process.env.OTP_EXPIRY_PASSWORD_MINUTES) || 15,
        PASSWORD_HISTORY_COUNT: parseInt(process.env.PASSWORD_HISTORY_COUNT) || 3
    },

    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000
    },

    CACHE: {
        DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
        USER_TTL: parseInt(process.env.CACHE_USER_TTL) || 300,
        LIST_TTL: parseInt(process.env.CACHE_LIST_TTL) || 60
    },

    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        MAX_FILES: parseInt(process.env.LOG_MAX_FILES) || 14,
        MAX_SIZE: process.env.LOG_MAX_SIZE || '20m'
    }
};

module.exports = config;
