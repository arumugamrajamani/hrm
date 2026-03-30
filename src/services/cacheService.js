const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
    constructor() {
        this.client = null;
        this.isConnected = false;
        this.connectionAttempted = false;
    }

    async connect() {
        if (this.connectionAttempted) {
            return this.isConnected;
        }
        
        this.connectionAttempted = true;

        try {
            const redisUrl = config.REDIS_URL || `redis://${config.REDIS.HOST}:${config.REDIS.PORT}`;
            
            this.client = redis.createClient({
                url: redisUrl,
                legacyMode: false,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 3) {
                            logger.warn('Redis reconnection limit reached - disabling cache');
                            this.isConnected = false;
                            return new Error('Max reconnection attempts reached');
                        }
                        return 1000;
                    }
                }
            });

            this.client.on('error', (err) => {
                if (!this.connectionLogged) {
                    logger.warn('Redis unavailable - running without cache', { error: err.message });
                    this.connectionLogged = true;
                }
                this.isConnected = false;
            });

            this.client.on('connect', () => {
                logger.info('Redis connected successfully');
                this.isConnected = true;
            });

            await this.client.connect();
            return true;
        } catch (error) {
            logger.warn('Redis not available - running without cache');
            this.isConnected = false;
            return false;
        }
    }

    async get(key) {
        try {
            if (!this.isConnected) return null;
            const data = await this.client.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error', { key, error: error.message });
            return null;
        }
    }

    async set(key, value, ttl = 300) {
        try {
            if (!this.isConnected) return false;
            await this.client.set(key, JSON.stringify(value), {
                EX: ttl
            });
            return true;
        } catch (error) {
            logger.error('Cache set error', { key, error: error.message });
            return false;
        }
    }

    async delete(key) {
        try {
            if (!this.isConnected) return false;
            await this.client.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error', { key, error: error.message });
            return false;
        }
    }

    async deletePattern(pattern) {
        try {
            if (!this.isConnected) return false;
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(keys);
            }
            return true;
        } catch (error) {
            logger.error('Cache delete pattern error', { pattern, error: error.message });
            return false;
        }
    }

    async exists(key) {
        try {
            if (!this.isConnected) return false;
            return await this.client.exists(key);
        } catch (error) {
            logger.error('Cache exists error', { key, error: error.message });
            return false;
        }
    }

    async disconnect() {
        if (this.client) {
            await this.client.quit();
            this.isConnected = false;
            logger.info('Redis disconnected');
        }
    }
}

module.exports = new CacheService();
