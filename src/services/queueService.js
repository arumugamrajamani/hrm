const Queue = require('bull');
const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Queue definitions are created lazily in `initialize()` so that a missing
 * Redis instance does not cause a storm of connection errors and unhandled
 * rejections during startup. When Redis is unavailable the service reports
 * itself as unavailable and jobs are simulated synchronously by callers.
 */
const QUEUE_DEFINITIONS = {
    email: {
        attempts: 3,
        backoffType: 'exponential',
        backoffDelay: 2000,
        removeOnComplete: 100,
        removeOnFail: 500
    },
    notifications: {
        attempts: 3,
        backoffType: 'exponential',
        backoffDelay: 1000,
        removeOnComplete: 200,
        removeOnFail: 1000
    },
    audit: {
        attempts: 5,
        backoffType: 'fixed',
        backoffDelay: 5000,
        removeOnComplete: 500,
        removeOnFail: 5000
    },
    webhook: {
        attempts: 3,
        backoffType: 'exponential',
        backoffDelay: 3000,
        removeOnComplete: 200,
        removeOnFail: 1000
    },
    export: {
        attempts: 2,
        backoffType: 'exponential',
        backoffDelay: 5000,
        removeOnComplete: 50,
        removeOnFail: 100
    }
};

class QueueService {
    constructor() {
        this.queues = new Map();
        this.pendingProcessors = new Map();
        this.isConnected = false;
        this.isRedisAvailable = false;
        this.isInitialized = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.queueErrorLogged = new Set();
    }

    /**
     * Probe the Bull Redis instance before creating any queues. A failed probe
     * is expected when Redis is optional, so it is logged once and queues are
     * left disabled instead of retrying five times per queue.
     */
    async checkRedisConnection() {
        const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_DB } = config.BULL_QUEUE;

        const client = redis.createClient({
            socket: {
                host: REDIS_HOST,
                port: REDIS_PORT,
                connectTimeout: 1500,
                reconnectStrategy: false
            },
            password: REDIS_PASSWORD || undefined,
            database: REDIS_DB
        });

        // Prevent an unhandled 'error' event while the probe is running.
        client.on('error', () => {});

        try {
            await client.connect();
            await client.ping();
            return true;
        } catch (error) {
            return false;
        } finally {
            if (client.isOpen) {
                try {
                    await client.quit();
                } catch (error) {
                    // The client may already be closing; nothing to clean up.
                }
            }
        }
    }

    async initialize() {
        if (this.isInitialized) {
            return this.isRedisAvailable;
        }

        this.isInitialized = true;
        this.isRedisAvailable = await this.checkRedisConnection();

        if (!this.isRedisAvailable) {
            logger.warn('Redis unavailable - job queues disabled; jobs will run synchronously');
            return false;
        }

        for (const [name, options] of Object.entries(QUEUE_DEFINITIONS)) {
            this.createQueue(name, options);
        }

        this.registerPendingProcessors();
        logger.info('Job queues initialized');
        return true;
    }

    createQueue(name, options = {}) {
        if (this.queues.has(name)) {
            return this.queues.get(name);
        }

        if (!this.isRedisAvailable) {
            return null;
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
                        this.isRedisAvailable = false;
                        logger.warn(`Queue [${name}] connection retries exhausted, queue disabled`);
                        return null;
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
            }
        };

        try {
            const queue = new Queue(name, queueOptions);

            queue.on('error', (error) => {
                if (!this.isRedisAvailable) {
                    return;
                }
                if (!this.queueErrorLogged.has(name)) {
                    this.queueErrorLogged.add(name);
                    logger.error(`Queue [${name}] error`, {
                        error: error?.message || error?.code || String(error)
                    });
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
                this.queueErrorLogged.delete(name);
                logger.info(`Queue [${name}] is ready`);
            });

            this.queues.set(name, queue);
            logger.info(`Queue [${name}] created`);

            return queue;
        } catch (error) {
            logger.warn(`Failed to create queue [${name}]: ${error.message}`);
            return null;
        }
    }

    getQueue(name) {
        return this.queues.get(name);
    }

    registerPendingProcessors() {
        for (const name of this.pendingProcessors.keys()) {
            this.attachProcessor(name);
        }
    }

    attachProcessor(name) {
        const queue = this.getQueue(name);
        const entry = this.pendingProcessors.get(name);

        if (!queue || !entry || entry.registered) {
            return false;
        }

        queue.process(entry.concurrency, async (job) => {
            try {
                logger.debug(`Processing job ${job.id} from queue [${name}]`);
                return await entry.processor(job);
            } catch (error) {
                logger.error(`Error processing job ${job.id} from queue [${name}]`, {
                    error: error.message
                });
                throw error;
            }
        });

        entry.registered = true;
        logger.info(`Queue [${name}] processor registered with concurrency: ${entry.concurrency}`);
        return true;
    }

    /**
     * Register a processor. If the queues have not been initialized yet (or
     * Redis is unavailable) the processor is stored and attached once queues
     * become available, so module-level registrations are not lost.
     */
    process(name, processor, concurrency = 1) {
        this.pendingProcessors.set(name, {
            processor,
            concurrency,
            registered: false
        });

        const registered = this.attachProcessor(name);
        if (!registered && this.isInitialized) {
            logger.warn(`Queue [${name}] unavailable, processor deferred`);
        }
        return registered;
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
        const queues = [...this.queues.entries()];
        this.queues.clear();
        this.isConnected = false;

        await Promise.allSettled(queues.map(async ([name, queue]) => {
            logger.info(`Closing queue [${name}]`);
            try {
                await queue.close();
            } catch (error) {
                logger.warn(`Error closing queue [${name}]: ${error.message}`);
            }
        }));

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

module.exports = queueService;
