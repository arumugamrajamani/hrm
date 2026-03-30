const EventEmitter = require('events');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

class AppEvents extends EventEmitter {
    constructor() {
        super();
        this.setMaxListeners(100);
        this.setupListeners();
    }

    setupListeners() {
        this.on('user.created', async (data) => {
            logger.info('Event: User created', { 
                userId: data.userId, 
                email: data.email,
                requestId: data.requestId 
            });
        });

        this.on('user.updated', async (data) => {
            logger.info('Event: User updated', { 
                userId: data.userId, 
                changes: data.changes,
                requestId: data.requestId 
            });
            
            if (data.userId) {
                await cacheService.delete(`user:${data.userId}`);
                await cacheService.deletePattern('users:*');
            }
        });

        this.on('user.deleted', async (data) => {
            logger.info('Event: User deleted', { 
                userId: data.userId,
                requestId: data.requestId 
            });
            
            if (data.userId) {
                await cacheService.delete(`user:${data.userId}`);
                await cacheService.deletePattern('users:*');
            }
        });

        this.on('auth.login', async (data) => {
            logger.info('Event: User login', { 
                userId: data.userId, 
                email: data.email,
                ip: data.ip,
                requestId: data.requestId 
            });
        });

        this.on('auth.logout', async (data) => {
            logger.info('Event: User logout', { 
                userId: data.userId,
                requestId: data.requestId 
            });
        });

        this.on('auth.password_changed', async (data) => {
            logger.info('Event: Password changed', { 
                userId: data.userId,
                requestId: data.requestId 
            });
        });

        this.on('cache.invalidate', async (data) => {
            logger.info('Event: Cache invalidated', { 
                pattern: data.pattern,
                requestId: data.requestId 
            });
            
            if (data.pattern) {
                await cacheService.deletePattern(data.pattern);
            }
        });

        this.on('error', async (data) => {
            logger.error('Event Error', { 
                error: data.error,
                event: data.event,
                requestId: data.requestId 
            });
        });
    }

    emitAsync(event, data) {
        return new Promise((resolve) => {
            try {
                this.emit(event, data);
                resolve(true);
            } catch (error) {
                logger.error('Failed to emit event', { event, error: error.message });
                resolve(false);
            }
        });
    }
}

const appEvents = new AppEvents();

module.exports = appEvents;
