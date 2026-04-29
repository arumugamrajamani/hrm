const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const swaggerSpec = require('./config/swagger');
const requestId = require('./middlewares/requestId');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { generalLimiter, authLimiter } = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');
const { requestSanitizer } = require('./utils/sanitizer');
const { getPoolMetrics } = require('./config/database');
const cacheService = require('./services/cacheService');
const { getAllCircuitBreakers } = require('./services/circuitBreaker');
const queueService = require('./services/queueService');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"]
        }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "same-origin" },
    dnsPrefetchControl: { allow: false },
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: "none" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
}));

const corsOptions = {
    origin: (origin, callback) => {
        if (config.ENV === 'development') {
            return callback(null, true);
        }

        if (!origin) {
            return callback(null, true);
        }

        if (config.ALLOWED_ORIGINS.includes(origin)) {
            return callback(null, true);
        }

        logger.logSecurity('CORS rejection for unknown origin', { origin });
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'X-Request-ID', 
        'X-Forwarded-For',
        'X-API-Key',
        'X-Tenant-ID',
        'Accept-Language',
        'X-Timezone'
    ],
    exposedHeaders: [
        'X-Request-ID',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
        'Retry-After'
    ],
    maxAge: 86400,
    optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

app.use(compression({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

app.use(express.json({ 
    limit: '10kb',
    strict: true
}));

app.use(express.urlencoded({ 
    extended: true, 
    limit: '10kb',
    parameterLimit: 100
}));

app.use(requestId);
app.use(requestSanitizer);

app.use(morgan('combined', {
    stream: {
        write: (message) => {
            logger.http(message.trim());
        }
    },
    skip: (req) => req.path === '/health' || req.path === '/health/detailed'
}));

app.use('/uploads', express.static('uploads', {
    maxAge: '1d',
    setHeaders: (res, path) => {
        if (path.endsWith('.jpg') || path.endsWith('.jpeg') || path.endsWith('.png')) {
            res.setHeader('Cache-Control', 'public, max-age=1');
        }
    }
}));

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HRM API is running',
        timestamp: new Date().toISOString(),
        version: config.APP_VERSION,
        environment: config.ENV
    });
});

app.get('/health/detailed', async (req, res) => {
    try {
        const dbMetrics = getPoolMetrics();
        const redisStatus = cacheService.isConnected ? 'connected' : 'disconnected';
        const circuitBreakers = getAllCircuitBreakers();
        const queueStats = queueService.getQueueStats();

        const checks = {
            database: {
                status: dbMetrics.isHealthy ? 'healthy' : 'unhealthy',
                ...dbMetrics
            },
            redis: {
                status: redisStatus === 'connected' ? 'healthy' : 'degraded',
                connected: cacheService.isConnected
            },
            circuitBreakers: circuitBreakers,
            queues: queueStats
        };

        const allHealthy = 
            checks.database.status === 'healthy' &&
            checks.redis.status !== 'unhealthy';

        res.status(allHealthy ? 200 : 503).json({
            success: allHealthy,
            status: allHealthy ? 'healthy' : 'degraded',
            timestamp: new Date().toISOString(),
            version: config.APP_VERSION,
            environment: config.ENV,
            uptime: process.uptime(),
            checks
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error.message
        });
    }
});

app.get('/health/live', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

app.get('/health/ready', async (req, res) => {
    try {
        const dbMetrics = getPoolMetrics();
        
        if (!dbMetrics.isHealthy) {
            return res.status(503).json({
                success: false,
                status: 'not ready',
                reason: 'Database connection unavailable'
            });
        }

        res.status(200).json({
            success: true,
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            success: false,
            status: 'not ready',
            error: error.message
        });
    }
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
        persistAuthorization: true,
        docExpansion: 'list',
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        tryItOutEnabled: true
    },
    customCss: `
        .swagger-ui .topbar { display: none }
    `,
    customSiteTitle: 'HRM API Documentation'
}));

app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.use('/api/v1', generalLimiter, require('./routes/v1'));

app.use(notFoundHandler);

app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({
            success: false,
            message: 'CORS policy rejected this request'
        });
    }
    errorHandler(err, req, res, next);
});

module.exports = app;
