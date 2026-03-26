const app = require('./app');
const config = require('./config');
const { testConnection } = require('./config/database');
const { RefreshTokenModel } = require('./models');

const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error(`[${new Date().toISOString()}] Failed to connect to database. Exiting...`);
            process.exit(1);
        }

        await RefreshTokenModel.deleteExpired();
        console.log(`[${new Date().toISOString()}] Cleaned up expired refresh tokens`);

        const server = app.listen(config.PORT, () => {
            console.log(`[${new Date().toISOString()}] HRM Server started successfully`);
            console.log(`[${new Date().toISOString()}] Environment: ${config.ENV}`);
            console.log(`[${new Date().toISOString()}] Server running on port: ${config.PORT}`);
            console.log(`[${new Date().toISOString()}] Frontend URL: ${config.FRONTEND_URL}`);
        });

        const gracefulShutdown = async (signal) => {
            console.log(`[${new Date().toISOString()}] ${signal} received. Shutting down gracefully...`);
            
            server.close(async () => {
                console.log(`[${new Date().toISOString()}] HTTP server closed`);
                
                try {
                    const { pool } = require('./config/database');
                    await pool.end();
                    console.log(`[${new Date().toISOString()}] Database connections closed`);
                } catch (error) {
                    console.error(`[${new Date().toISOString()}] Error closing database connections:`, error);
                }
                
                process.exit(0);
            });

            setTimeout(() => {
                console.error(`[${new Date().toISOString()}] Forced shutdown after timeout`);
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));

        process.on('unhandledRejection', (reason, promise) => {
            console.error(`[${new Date().toISOString()}] Unhandled Rejection at:`, promise, 'reason:', reason);
        });

        process.on('uncaughtException', (error) => {
            console.error(`[${new Date().toISOString()}] Uncaught Exception:`, error);
            process.exit(1);
        });

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Failed to start server:`, error);
        process.exit(1);
    }
};

startServer();
