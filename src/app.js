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
const { generalLimiter } = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');

const app = express();

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "blob:"]
        }
    },
    crossOriginEmbedderPolicy: false
}));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) {
            return callback(null, true);
        }
        
        if (config.ALLOWED_ORIGINS.indexOf(origin) !== -1) {
            callback(null, true);
        } else if (config.ENV !== 'production') {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Forwarded-For'],
    maxAge: 86400
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

app.use(express.json({ limit: '10kb' }));

app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(requestId);

app.use(morgan('combined', {
    stream: {
        write: (message) => {
            logger.http(message.trim());
        }
    }
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

app.use('/api/v1', generalLimiter, require('./routes/v1'));

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
