const config = require('../config');
const logger = require('../utils/logger');

const CircuitState = {
    CLOSED: 'CLOSED',
    OPEN: 'OPEN',
    HALF_OPEN: 'HALF_OPEN'
};

class CircuitBreaker {
    constructor(options = {}) {
        this.name = options.name || 'default';
        this.timeout = options.timeout || config.CIRCUIT_BREAKER.TIMEOUT;
        this.resetTimeout = options.resetTimeout || config.CIRCUIT_BREAKER.RESET_TIMEOUT;
        this.errorThreshold = options.errorThreshold || config.CIRCUIT_BREAKER.ERROR_THRESHOLD;
        this.enabled = options.enabled !== undefined ? options.enabled : config.CIRCUIT_BREAKER.ENABLED;
        
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            rejectedCalls: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
    }

    async execute(fn, fallback = null) {
        if (!this.enabled) {
            return this.executeFunction(fn);
        }

        this.stats.totalCalls++;
        const startTime = Date.now();

        if (this.state === CircuitState.OPEN) {
            if (Date.now() >= this.nextAttemptTime) {
                this.state = CircuitState.HALF_OPEN;
                logger.info(`Circuit breaker [${this.name}] entering HALF_OPEN state`);
            } else {
                this.stats.rejectedCalls++;
                if (fallback) {
                    logger.debug(`Circuit breaker [${this.name}] returning fallback (circuit OPEN)`);
                    return fallback;
                }
                throw new Error(`Circuit breaker [${this.name}] is OPEN. Next attempt at: ${this.nextAttemptTime}`);
            }
        }

        try {
            const result = await this.executeFunctionWithTimeout(fn);
            this.onSuccess(startTime);
            return result;
        } catch (error) {
            this.onFailure(error, startTime);
            
            if (fallback && this.state === CircuitState.OPEN) {
                logger.debug(`Circuit breaker [${this.name}] returning fallback after failure`);
                return fallback;
            }
            
            throw error;
        }
    }

    async executeFunction(fn) {
        if (typeof fn === 'function') {
            return await fn();
        }
        return fn;
    }

    async executeFunctionWithTimeout(fn) {
        return Promise.race([
            Promise.resolve().then(() => fn()),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error(`Circuit breaker [${this.name}] timeout after ${this.timeout}ms`)), this.timeout)
            )
        ]);
    }

    onSuccess(startTime) {
        const responseTime = Date.now() - startTime;
        this.stats.successfulCalls++;
        this.stats.totalResponseTime += responseTime;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.successfulCalls;
        
        this.failures = 0;
        this.successes++;
        
        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.CLOSED;
            logger.info(`Circuit breaker [${this.name}] CLOSED after successful HALF_OPEN call`);
        }
    }

    onFailure(error, startTime) {
        const responseTime = Date.now() - startTime;
        this.stats.failedCalls++;
        this.stats.totalResponseTime += responseTime;
        this.stats.averageResponseTime = this.stats.totalResponseTime / this.stats.successfulCalls;
        
        this.failures++;
        this.lastFailureTime = new Date();
        this.successes = 0;

        const errorRate = this.failures / this.stats.totalCalls * 100;

        if (this.state === CircuitState.HALF_OPEN) {
            this.state = CircuitState.OPEN;
            this.nextAttemptTime = Date.now() + this.resetTimeout;
            logger.error(`Circuit breaker [${this.name}] OPEN after HALF_OPEN failure`, { 
                error: error.message,
                nextAttemptTime: this.nextAttemptTime 
            });
        } else if (this.failures >= this.errorThreshold || errorRate >= 50) {
            this.state = CircuitState.OPEN;
            this.nextAttemptTime = Date.now() + this.resetTimeout;
            logger.error(`Circuit breaker [${this.name}] OPEN after ${this.failures} failures`, { 
                error: error.message,
                errorRate: `${errorRate.toFixed(2)}%`,
                nextAttemptTime: this.nextAttemptTime 
            });
        }
    }

    getState() {
        return {
            name: this.name,
            state: this.state,
            failures: this.failures,
            successes: this.successes,
            lastFailureTime: this.lastFailureTime,
            nextAttemptTime: this.nextAttemptTime,
            stats: { ...this.stats }
        };
    }

    reset() {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        this.lastFailureTime = null;
        this.nextAttemptTime = null;
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            rejectedCalls: 0,
            averageResponseTime: 0,
            totalResponseTime: 0
        };
        logger.info(`Circuit breaker [${this.name}] has been reset`);
    }
}

const circuitBreakers = new Map();

const getCircuitBreaker = (name, options = {}) => {
    if (!circuitBreakers.has(name)) {
        circuitBreakers.set(name, new CircuitBreaker({ ...options, name }));
    }
    return circuitBreakers.get(name);
};

const getAllCircuitBreakers = () => {
    const breakers = {};
    circuitBreakers.forEach((breaker, name) => {
        breakers[name] = breaker.getState();
    });
    return breakers;
};

module.exports = {
    CircuitBreaker,
    getCircuitBreaker,
    getAllCircuitBreakers,
    CircuitState
};
