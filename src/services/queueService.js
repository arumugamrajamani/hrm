const Queue = require('bull');
const config = require('../config');
const logger = require('../utils/logger');

class QueueService {
    constructor() {
        this.queues = new Map();
        this.isConnected = false;
        this.isRedisAvailable = true;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
    }

    createQueue(name, options = {}) {
        if (this.queues.has(name)) {
            return this.queues.get(name);
        }

        const queueOptions = {
            redis: {
                host: config.BULL_QUEUE.REDIS_HOST,
                port: config.BULL_QUEUE.REDIS_PORT,
                password: config.BULL_QUEUE.REDIS_PASSWORD,
                db: config.BULL_QUEUE.REDIS_DB,
                maxRetriesPerRequest: 3,
                enableReadyCheck: false,
                retryStrategy: (times) => {
                    this.connectionAttempts++;
                    if (times > this.maxConnectionAttempts) {
                        logger.warn(`Queue [${name}] max connection attempts reached, queue disabled`);
                        this.isRedisAvailable = false;
                        return false;
                    }
                    return Math.min(times * 1000, 5000);
                }
            },
            defaultJobOptions: {
                removeOnComplete: options.removeOnComplete || 100,
                removeOnFail: options.removeOnFail || 500,
                attempts: options.attempts || 3,
                backoff: {
                    type: options.backoffType || 'exponential',
                    delay: options.backoffDelay || 2000
                }
            },
            ...options
        };

        try {
            const queue = new Queue(name, queueOptions);

            queue.on('error', (error) => {
                if (this.isRedisAvailable) {
                    logger.error(`Queue [${name}] error`, { error: error.message });
                }
            });

            queue.on('failed', (job, error) => {
                if (this.isRedisAvailable) {
                    logger.error(`Queue [${name}] job ${job.id} failed`, { 
                        error: error.message,
                        attemptsMade: job.attemptsMade
                    });
                }
            });

            queue.on('completed', (job) => {
                if (this.isRedisAvailable) {
                    logger.debug(`Queue [${name}] job ${job.id} completed`, { 
                        progress: job.progress() 
                    });
                }
            });

            queue.on('stalled', (job) => {
                if (this.isRedisAvailable) {
                    logger.warn(`Queue [${name}] job ${job.id} stalled`, { 
                        attemptsMade: job.attemptsMade 
                    });
                }
            });

            queue.on('ready', () => {
                this.isConnected = true;
                this.isRedisAvailable = true;
                logger.info(`Queue [${name}] is ready`);
            });

            this.queues.set(name, queue);
            
            if (this.isRedisAvailable) {
                logger.info(`Queue [${name}] created`);
            }

            return queue;
        } catch (error) {
            logger.warn(`Failed to create queue [${name}]: ${error.message}`);
            return null;
        }
    }

    getQueue(name) {
        return this.queues.get(name);
    }

    async add(name, data, options = {}) {
        const queue = this.getQueue(name);
        
        if (!queue || !this.isRedisAvailable) {
            logger.warn(`Queue [${name}] unavailable, simulating job execution`);
            return { 
                id: `sync-${Date.now()}`,
                data,
                simulate: true 
            };
        }

        const jobOptions = {
            priority: options.priority,
            delay: options.delay,
            timeout: options.timeout,
            jobId: options.jobId,
            removeOnComplete: options.removeOnComplete,
            removeOnFail: options.removeOnFail
        };

        Object.keys(jobOptions).forEach(key => {
            if (jobOptions[key] === undefined) {
                delete jobOptions[key];
            }
        });

        try {
            const job = await queue.add(data, jobOptions);
            logger.info(`Job added to queue [${name}]`, { jobId: job.id, data });
            return job;
        } catch (error) {
            logger.error(`Failed to add job to queue [${name}]`, { error: error.message });
            throw error;
        }
    }

    async process(name, processor, concurrency = 1) {
        const queue = this.getQueue(name);
        
        if (!queue || !this.isRedisAvailable) {
            logger.warn(`Queue [${name}] unavailable, processor not registered`);
            return false;
        }

        queue.process(concurrency, async (job) => {
            try {
                logger.debug(`Processing job ${job.id} from queue [${name}]`);
                const result = await processor(job);
                return result;
            } catch (error) {
                logger.error(`Error processing job ${job.id} from queue [${name}]`, { 
                    error: error.message 
                });
                throw error;
            }
        });

        logger.info(`Queue [${name}] processor registered with concurrency: ${concurrency}`);
        return true;
    }

    async getJobCounts(name) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return null;
        try {
            return await queue.getJobCounts();
        } catch (error) {
            return null;
        }
    }

    async getFailedJobs(name, start = 0, end = 20) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return [];
        try {
            return await queue.getFailed(start, end);
        } catch (error) {
            return [];
        }
    }

    async retryFailed(name) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return 0;

        try {
            const failedJobs = await queue.getFailed();
            let retriedCount = 0;

            for (const job of failedJobs) {
                await job.retry();
                retriedCount++;
            }

            logger.info(`Retried ${retriedCount} failed jobs in queue [${name}]`);
            return retriedCount;
        } catch (error) {
            return 0;
        }
    }

    async clearQueue(name) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return false;

        try {
            await queue.empty();
            logger.info(`Queue [${name}] cleared`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async pauseQueue(name) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return false;

        try {
            await queue.pause();
            logger.info(`Queue [${name}] paused`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async resumeQueue(name) {
        const queue = this.getQueue(name);
        if (!queue || !this.isRedisAvailable) return false;

        try {
            await queue.resume();
            logger.info(`Queue [${name}] resumed`);
            return true;
        } catch (error) {
            return false;
        }
    }

    async closeAll() {
        const closePromises = [];
        this.queues.forEach((queue, name) => {
            try {
                closePromises.push(queue.close());
                logger.info(`Closing queue [${name}]`);
            } catch (error) {
                logger.warn(`Error closing queue [${name}]: ${error.message}`);
            }
        });

        await Promise.all(closePromises);
        this.queues.clear();
        logger.info('All queues closed');
    }

    getQueueStats() {
        const stats = {};
        this.queues.forEach((queue, name) => {
            try {
                stats[name] = {
                    name,
                    isPaused: queue.isPaused ? queue.isPaused() : false,
                    isRunning: queue.isRunning ? queue.isRunning() : false
                };
            } catch (error) {
                stats[name] = {
                    name,
                    error: error.message
                };
            }
        });
        return stats;
    }

    isQueueAvailable() {
        return this.isRedisAvailable;
    }
}

const queueService = new QueueService();

queueService.createQueue('email', {
    attempts: 3,
    backoffType: 'exponential',
    backoffDelay: 2000,
    removeOnComplete: 100,
    removeOnFail: 500
});

queueService.createQueue('notifications', {
    attempts: 3,
    backoffType: 'exponential',
    backoffDelay: 1000,
    removeOnComplete: 200,
    removeOnFail: 1000
});

queueService.createQueue('audit', {
    attempts: 5,
    backoffType: 'fixed',
    backoffDelay: 5000,
    removeOnComplete: 500,
    removeOnFail: 5000
});

queueService.createQueue('webhook', {
    attempts: 3,
    backoffType: 'exponential',
    backoffDelay: 3000,
    removeOnComplete: 200,
    removeOnFail: 1000
});

queueService.createQueue('export', {
    attempts: 2,
    backoffType: 'exponential',
    backoffDelay: 5000,
    removeOnComplete: 50,
    removeOnFail: 100
});

module.exports = queueService;
