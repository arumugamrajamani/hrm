const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const config = require('./config');
const swaggerSpec = require('./config/swagger');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const { errorHandler, notFoundHandler } = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');

const app = express();

app.use(helmet());

const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'http://localhost:4200',
            'http://localhost:4201',
            'http://localhost:3000',
            'http://localhost:3001'
        ];
        const isLocalhost = origin && origin.match(/^http:\/\/localhost:\d+$/);
        if (!origin || allowedOrigins.includes(origin) || isLocalhost) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '20mb' }));

app.use(express.urlencoded({ extended: true, limit: '20mb' }));

app.use(morgan('combined'));

app.use('/uploads', express.static('uploads'));

app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HRM API is running',
        timestamp: new Date().toISOString()
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

app.use('/api/auth', generalLimiter, authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/departments', departmentRoutes);

app.use(notFoundHandler);

app.use(errorHandler);

module.exports = app;
