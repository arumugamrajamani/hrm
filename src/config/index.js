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
        PORT: parseInt(process.env.DB_PORT) || 3306,
        POOL_SIZE: parseInt(process.env.DB_POOL_SIZE) || 20,
        QUEUE_LIMIT: parseInt(process.env.DB_QUEUE_LIMIT) || 100,
        REPLICA_HOST: process.env.DB_REPLICA_HOST || null,
        REPLICA_PORT: parseInt(process.env.DB_REPLICA_PORT) || 3306
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
        REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
        ALGORITHM: process.env.JWT_ALGORITHM || 'HS256',
        KEY_ROTATION_ENABLED: process.env.JWT_KEY_ROTATION === 'true',
        KEY_ID: process.env.JWT_KEY_ID || 'default'
    },

    BULL_QUEUE: {
        REDIS_HOST: process.env.REDIS_HOST || 'localhost',
        REDIS_PORT: parseInt(process.env.REDIS_PORT) || 6379,
        REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
        REDIS_DB: parseInt(process.env.BULL_REDIS_DB) || 1
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

    ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:4200',
        'http://localhost:4201',
        'http://localhost:3000',
        'http://localhost:3001'
    ]).map(origin => origin.trim()),

    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:4200',
    API_URL: process.env.API_URL || 'http://localhost:3000',
    API_VERSION: process.env.API_VERSION || 'v1',

    SECURITY: {
        PASSWORD_MIN_LENGTH: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
        PASSWORD_EXPIRY_DAYS: parseInt(process.env.PASSWORD_EXPIRY_DAYS) || 90,
        MAX_LOGIN_ATTEMPTS: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
        BLOCK_DURATION_MINUTES: parseInt(process.env.BLOCK_DURATION_MINUTES) || 30,
        OTP_EXPIRY_MINUTES: parseInt(process.env.OTP_EXPIRY_MINUTES) || 5,
        OTP_EXPIRY_PASSWORD_MINUTES: parseInt(process.env.OTP_EXPIRY_PASSWORD_MINUTES) || 15,
        PASSWORD_HISTORY_COUNT: parseInt(process.env.PASSWORD_HISTORY_COUNT) || 3,
        TOTP_ISSUER: process.env.TOTP_ISSUER || 'HRM System',
        TOTP_WINDOW: parseInt(process.env.TOTP_WINDOW) || 1,
        BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        TOTP_DIGITS: 6,
        TOTP_ALGORITHM: 'SHA1'
    },

    RATE_LIMIT: {
        WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
        MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 5000,
        AUTH_WINDOW_MS: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 900000,
        AUTH_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS) || 5,
        OTP_WINDOW_MS: parseInt(process.env.RATE_LIMIT_OTP_WINDOW_MS) || 60000,
        OTP_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_OTP_MAX_REQUESTS) || 3,
        USER_WINDOW_MS: parseInt(process.env.RATE_LIMIT_USER_WINDOW_MS) || 60000,
        USER_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_USER_MAX_REQUESTS) || 100
    },

    CACHE: {
        DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300,
        USER_TTL: parseInt(process.env.CACHE_USER_TTL) || 300,
        LIST_TTL: parseInt(process.env.CACHE_LIST_TTL) || 60
    },

    LOGGING: {
        LEVEL: process.env.LOG_LEVEL || 'info',
        MAX_FILES: parseInt(process.env.LOG_MAX_FILES) || 14,
        MAX_SIZE: process.env.LOG_MAX_SIZE || '20m',
        SANITIZE_FIELDS: (process.env.LOG_SANITIZE_FIELDS || 'password,token,secret,authorization,cookie').split(','),
        MASK_CHAR: process.env.LOG_MASK_CHAR || '*'
    },

    CIRCUIT_BREAKER: {
        TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT) || 5000,
        RESET_TIMEOUT: parseInt(process.env.CIRCUIT_BREAKER_RESET_TIMEOUT) || 30000,
        ERROR_THRESHOLD: parseInt(process.env.CIRCUIT_BREAKER_ERROR_THRESHOLD) || 50,
        ENABLED: process.env.CIRCUIT_BREAKER_ENABLED !== 'false'
    },

    MULTI_TENANCY: {
        ENABLED: process.env.MULTI_TENANCY_ENABLED === 'true',
        SCHEMA_STRATEGY: process.env.TENANT_SCHEMA_STRATEGY || 'database'
    },

    WEBHOOK: {
        ENABLED: process.env.WEBHOOK_ENABLED === 'true',
        RETRY_ATTEMPTS: parseInt(process.env.WEBHOOK_RETRY_ATTEMPTS) || 3,
        RETRY_DELAY: parseInt(process.env.WEBHOOK_RETRY_DELAY) || 5000
    },

    FILE_UPLOAD: {
        MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880,
        ALLOWED_EXTENSIONS: (process.env.ALLOWED_FILE_EXTENSIONS || 'jpeg,jpg,png,gif,webp,pdf,doc,docx,xls,xlsx').split(','),
        STORAGE_TYPE: process.env.FILE_STORAGE_TYPE || 'local'
    },

    METRICS: {
        ENABLED: process.env.METRICS_ENABLED === 'true',
        PORT: parseInt(process.env.METRICS_PORT) || 9090
    }
};

module.exports = config;
