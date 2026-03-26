const mysql = require('mysql2/promise');
const config = require('./index');

const pool = mysql.createPool({
    host: config.DB.HOST,
    user: config.DB.USER,
    password: config.DB.PASSWORD,
    database: config.DB.NAME,
    port: config.DB.PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log(`[${new Date().toISOString()}] Database connected successfully`);
        connection.release();
        return true;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Database connection failed:`, error.message);
        return false;
    }
};

module.exports = { pool, testConnection };
