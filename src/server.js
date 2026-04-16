const app = require('./app');
const config = require('./config');
const { testConnection, closePool } = require('./config/database');
const { RefreshTokenModel } = require('./models');
const cacheService = require('./services/cacheService');
const { initRedisStore } = require('./middlewares/rateLimiter');
const queueService = require('./services/queueService');
const logger = require('./utils/logger');

const startServer = async () => {
    try {
        logger.info('Starting HRM Server...');
        logger.info(`Environment: ${config.ENV}`);
        logger.info(`Version: ${config.APP_VERSION}`);

        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            logger.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }
        logger.info('Database connected successfully');

        await RefreshTokenModel.deleteExpired();
        logger.info('Cleaned up expired refresh tokens');

        const redisConnected = await cacheService.connect();
        if (redisConnected) {
            logger.info('Redis cache connected successfully');
            await initRedisStore();
        } else {
            logger.warn('Running without Redis cache - performance may be affected');
        }

        const server = app.listen(config.PORT, () => {
            logger.info(`HRM Server started successfully on port ${config.PORT}`);
            logger.info(`Frontend URL: ${config.FRONTEND_URL}`);
            logger.info(`API URL: ${config.API_URL}`);
            logger.info(`Health check: ${config.API_URL}/health`);
            logger.info(`Detailed health: ${config.API_URL}/health/detailed`);
        });

        server.headersTimeout = 65000;
        server.keepAliveTimeout = 70000;
        server.requestTimeout = 60000;

        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Starting graceful shutdown...`);
            
            const shutdownTimeout = setTimeout(() => {
                logger.error('Graceful shutdown timeout exceeded, forcing exit');
                process.exit(1);
            }, 30000);

            try {
                server.close(() => {
                    logger.info('HTTP server closed');
                });

                logger.info('Closing queue connections...');
                await queueService.closeAll();

                logger.info('Closing cache connections...');
                await cacheService.disconnect();

                logger.info('Closing database connections...');
                await closePool();

                clearTimeout(shutdownTimeout);
                logger.info('Graceful shutdown completed');
                process.exit(0);
            } catch (error) {
                logger.error('Error during graceful shutdown', { error: error.message });
                clearTimeout(shutdownTimeout);
                process.exit(1);
            }
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        process.on('SIGUSR2', () => {
            logger.info('SIGUSR2 received - restarting workers...');
        });

        process.on('beforeExit', (code) => {
            logger.info('Node.js event loop empty. Exit code:', code);
        });

        process.on('exit', (code) => {
            logger.info('Process exiting with code:', code);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection', { 
                reason: String(reason),
                stack: reason?.stack || undefined,
                promise: String(promise)
            });
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', { 
                error: error.message, 
                stack: error.stack,
                name: error.name
            });
            gracefulShutdown('uncaughtException');
        });

        process.on('warning', (warning) => {
            logger.warn('Process Warning', {
                name: warning.name,
                message: warning.message,
                stack: warning.stack
            });
        });

    } catch (error) {
        logger.error('Failed to start server', { 
            error: error.message, 
            stack: error.stack 
        });
        process.exit(1);
    }
};

startServer();
