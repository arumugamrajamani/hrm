const app = require('./app');
const config = require('./config');
const { testConnection } = require('./config/database');
const { RefreshTokenModel } = require('./models');
const cacheService = require('./services/cacheService');
const { initRedisStore } = require('./middlewares/rateLimiter');
const logger = require('./utils/logger');

const startServer = async () => {
    try {
        logger.info('Starting HRM Server...');

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
            logger.info(`Environment: ${config.ENV}`);
            logger.info(`API Version: ${config.APP_VERSION}`);
            logger.info(`Frontend URL: ${config.FRONTEND_URL}`);
        });

        const gracefulShutdown = async (signal) => {
            logger.info(`${signal} received. Shutting down gracefully...`);
            
            server.close(async () => {
                logger.info('HTTP server closed');
                
                try {
                    const { pool } = require('./config/database');
                    await pool.end();
                    logger.info('Database connections closed');
                } catch (error) {
                    logger.error('Error closing database connections', { error: error.message });
                }

                try {
                    await cacheService.disconnect();
                    logger.info('Redis connections closed');
                } catch (error) {
                    logger.error('Error closing Redis connections', { error: error.message });
                }
                
                process.exit(0);
            });

            setTimeout(() => {
                logger.error('Forced shutdown after timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection', { reason: String(reason), promise: String(promise) });
        });

        process.on('uncaughtException', (error) => {
            logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to start server', { error: error.message, stack: error.stack });
        process.exit(1);
    }
};

startServer();
