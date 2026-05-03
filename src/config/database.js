const mysql = require('mysql2/promise');
const config = require('./index');
const logger = require('../utils/logger');

const pool = mysql.createPool({
    host: config.DB.HOST,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    port: config.DB.PORT,
    waitForConnections: true,
    connectionLimit: config.DB.POOL_SIZE || 20,
    queueLimit: config.DB.QUEUE_LIMIT || 100,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    idleTimeout: 60000,
    maxIdle: 10
});

let poolMetrics = {
    totalConnections: 0,
    activeConnections: 0,
    idleConnections: 0,
    pendingRequests: 0,
    lastCheck: new Date(),
    queriesExecuted: 0,
    queriesFailed: 0,
    averageQueryTime: 0
};

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        connection.release();
        logger.info('Database connected successfully');
        return true;
    } catch (error) {
        logger.error('Database connection failed', { error: error.message });
        return false;
    }
};

const getPoolMetrics = () => {
    try {
        const poolState = pool.pool?._allConnections?.length || 0;
        const freeConnections = pool.pool?._freeConnections?.length || 0;
        
        return {
            ...poolMetrics,
            poolSize: config.DB.POOL_SIZE || 20,
            queueLimit: config.DB.QUEUE_LIMIT || 100,
            environment: config.ENV,
            isHealthy: poolState > 0 || freeConnections > 0
        };
    } catch (error) {
        return {
            ...poolMetrics,
            error: 'Unable to collect pool metrics',
            isHealthy: false
        };
    }
};

const withTransaction = async (callback, retryCount = 3) => {
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
        const result = await callback(connection);
        await connection.commit();
        return result;
    } catch (error) {
        await connection.rollback();
        
        if (error.code === 'ER_LOCK_DEADLOCK' && retryCount > 0) {
            logger.warn('Deadlock detected, retrying transaction', { retryCount });
            await new Promise(resolve => setTimeout(resolve, 100 * (4 - retryCount)));
            return withTransaction(callback, retryCount - 1);
        }
        
        if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && retryCount > 0) {
            logger.warn('Lock timeout, retrying transaction', { retryCount });
            await new Promise(resolve => setTimeout(resolve, 100 * (4 - retryCount)));
            return withTransaction(callback, retryCount - 1);
        }
        
        throw error;
    } finally {
        connection.release();
    }
};

const query = async (sql, params = []) => {
    const startTime = Date.now();
    try {
        const [rows] = await pool.execute(sql, params);
        const queryTime = Date.now() - startTime;
        
        poolMetrics.queriesExecuted++;
        poolMetrics.averageQueryTime = 
            (poolMetrics.averageQueryTime * (poolMetrics.queriesExecuted - 1) + queryTime) / 
            poolMetrics.queriesExecuted;
        
        return rows;
    } catch (error) {
        poolMetrics.queriesFailed++;
        throw error;
    }
};

const execute = async (sql, params = []) => {
    const startTime = Date.now();
    try {
        const [result] = await pool.execute(sql, params);
        const queryTime = Date.now() - startTime;
        
        poolMetrics.queriesExecuted++;
        poolMetrics.averageQueryTime = 
            (poolMetrics.averageQueryTime * (poolMetrics.queriesExecuted - 1) + queryTime) / 
            poolMetrics.queriesExecuted;
        
        return result;
    } catch (error) {
        poolMetrics.queriesFailed++;
        throw error;
    }
};

const queryWithConnection = async (connection, sql, params = []) => {
    const [rows] = await connection.execute(sql, params);
    return rows;
};

const executeWithConnection = async (connection, sql, params = []) => {
    const [result] = await connection.execute(sql, params);
    return result;
};

const closePool = async () => {
    try {
        await pool.end();
        logger.info('Database pool closed');
    } catch (error) {
        logger.error('Error closing database pool', { error: error.message });
    }
};

setInterval(() => {
    try {
        const poolState = pool.pool;
        poolMetrics.totalConnections = poolState?._allConnections?.length || 0;
        poolMetrics.idleConnections = poolState?._freeConnections?.length || 0;
        poolMetrics.activeConnections = poolMetrics.totalConnections - poolMetrics.idleConnections;
        poolMetrics.pendingRequests = poolState?._connectionQueue?.length || 0;
        poolMetrics.lastCheck = new Date();
    } catch (error) {
        logger.debug('Error collecting pool metrics', { error: error.message });
    }
}, 30000);

module.exports = { 
    pool, 
    testConnection,
    getPoolMetrics,
    withTransaction,
    query,
    execute,
    queryWithConnection,
    executeWithConnection,
    closePool
};
