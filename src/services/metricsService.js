const express = require('express');
const config = require('../config');
const logger = require('../utils/logger');
const { getPoolMetrics } = require('../config/database');
const { getAllCircuitBreakers } = require('./circuitBreaker');
const queueService = require('./queueService');
const cacheService = require('./cacheService');

class MetricsService {
    constructor() {
        this.app = express();
        this.port = config.METRICS.PORT;
        this.metrics = {
            httpRequests: new Map(),
            httpRequestDuration: [],
            databaseQueries: 0,
            databaseQueryDuration: [],
            cacheHits: 0,
            cacheMisses: 0,
            activeUsers: new Set()
        };

        this.setupEndpoints();
    }

    setupEndpoints() {
        this.app.get('/metrics', (req, res) => {
            res.set('Content-Type', 'text/plain');
            res.send(this.getPrometheusMetrics());
        });

        this.app.get('/metrics/json', (req, res) => {
            res.json(this.getJsonMetrics());
        });
    }

    incrementHttpRequest(method, path, statusCode, duration) {
        const key = `${method}:${path}:${statusCode}`;
        
        const existing = this.metrics.httpRequests.get(key) || { count: 0, totalDuration: 0 };
        existing.count++;
        existing.totalDuration += duration;
        this.metrics.httpRequests.set(key, existing);

        this.metrics.httpRequestDuration.push(duration);
        if (this.metrics.httpRequestDuration.length > 1000) {
            this.metrics.httpRequestDuration.shift();
        }
    }

    incrementDatabaseQuery(duration, success = true) {
        this.metrics.databaseQueries++;
        this.metrics.databaseQueryDuration.push(duration);
        if (this.metrics.databaseQueryDuration.length > 1000) {
            this.metrics.databaseQueryDuration.shift();
        }
    }

    incrementCacheHit() {
        this.metrics.cacheHits++;
    }

    incrementCacheMiss() {
        this.metrics.cacheMisses++;
    }

    addActiveUser(userId) {
        this.metrics.activeUsers.add(userId);
    }

    removeActiveUser(userId) {
        this.metrics.activeUsers.delete(userId);
    }

    getAverageHttpDuration() {
        if (this.metrics.httpRequestDuration.length === 0) return 0;
        const sum = this.metrics.httpRequestDuration.reduce((a, b) => a + b, 0);
        return sum / this.metrics.httpRequestDuration.length;
    }

    getAverageDatabaseDuration() {
        if (this.metrics.databaseQueryDuration.length === 0) return 0;
        const sum = this.metrics.databaseQueryDuration.reduce((a, b) => a + b, 0);
        return sum / this.metrics.databaseQueryDuration.length;
    }

    getCacheHitRate() {
        const total = this.metrics.cacheHits + this.metrics.cacheMisses;
        if (total === 0) return 0;
        return (this.metrics.cacheHits / total) * 100;
    }

    getPrometheusMetrics() {
        const lines = [];
        
        lines.push('# HELP hrm_http_requests_total Total HTTP requests');
        lines.push('# TYPE hrm_http_requests_total counter');
        this.metrics.httpRequests.forEach((data, key) => {
            const [method, path, status] = key.split(':');
            lines.push(`hrm_http_requests_total{method="${method}",path="${path}",status="${status}"} ${data.count}`);
        });

        lines.push('');
        lines.push('# HELP hrm_http_request_duration_seconds Average HTTP request duration');
        lines.push('# TYPE hrm_http_request_duration_seconds gauge');
        lines.push(`hrm_http_request_duration_seconds ${(this.getAverageHttpDuration() / 1000).toFixed(6)}`);

        lines.push('');
        lines.push('# HELP hrm_database_queries_total Total database queries');
        lines.push('# TYPE hrm_database_queries_total counter');
        lines.push(`hrm_database_queries_total ${this.metrics.databaseQueries}`);

        lines.push('');
        lines.push('# HELP hrm_database_query_duration_seconds Average database query duration');
        lines.push('# TYPE hrm_database_query_duration_seconds gauge');
        lines.push(`hrm_database_query_duration_seconds ${(this.getAverageDatabaseDuration() / 1000).toFixed(6)}`);

        lines.push('');
        lines.push('# HELP hrm_cache_hits_total Total cache hits');
        lines.push('# TYPE hrm_cache_hits_total counter');
        lines.push(`hrm_cache_hits_total ${this.metrics.cacheHits}`);

        lines.push('');
        lines.push('# HELP hrm_cache_misses_total Total cache misses');
        lines.push('# TYPE hrm_cache_misses_total counter');
        lines.push(`hrm_cache_misses_total ${this.metrics.cacheMisses}`);

        lines.push('');
        lines.push('# HELP hrm_cache_hit_rate_percent Cache hit rate percentage');
        lines.push('# TYPE hrm_cache_hit_rate_percent gauge');
        lines.push(`hrm_cache_hit_rate_percent ${this.getCacheHitRate().toFixed(2)}`);

        lines.push('');
        lines.push('# HELP hrm_active_users Current active users');
        lines.push('# TYPE hrm_active_users gauge');
        lines.push(`hrm_active_users ${this.metrics.activeUsers.size}`);

        lines.push('');
        lines.push('# HELP hrm_process_uptime_seconds Process uptime in seconds');
        lines.push('# TYPE hrm_process_uptime_seconds gauge');
        lines.push(`hrm_process_uptime_seconds ${process.uptime()}`);

        lines.push('');
        lines.push('# HELP hrm_process_memory_bytes Process memory usage in bytes');
        lines.push('# TYPE hrm_process_memory_bytes gauge');
        const memUsage = process.memoryUsage();
        lines.push(`hrm_process_memory_bytes{type="rss"} ${memUsage.rss}`);
        lines.push(`hrm_process_memory_bytes{type="heapUsed"} ${memUsage.heapUsed}`);
        lines.push(`hrm_process_memory_bytes{type="heapTotal"} ${memUsage.heapTotal}`);
        lines.push(`hrm_process_memory_bytes{type="external"} ${memUsage.external}`);

        const dbMetrics = getPoolMetrics();
        lines.push('');
        lines.push('# HELP hrm_database_connections_active Active database connections');
        lines.push('# TYPE hrm_database_connections_active gauge');
        lines.push(`hrm_database_connections_active ${dbMetrics.activeConnections || 0}`);
        lines.push(`hrm_database_connections_idle ${dbMetrics.idleConnections || 0}`);
        lines.push(`hrm_database_connections_pending ${dbMetrics.pendingRequests || 0}`);

        lines.push('');
        lines.push('# HELP hrm_database_queries_total Total database queries');
        lines.push('# TYPE hrm_database_queries_total counter');
        lines.push(`hrm_database_queries_executed ${dbMetrics.queriesExecuted || 0}`);
        lines.push(`hrm_database_queries_failed ${dbMetrics.queriesFailed || 0}`);

        lines.push('');
        lines.push('# HELP hrm_redis_connected Redis connection status');
        lines.push('# TYPE hrm_redis_connected gauge');
        lines.push(`hrm_redis_connected ${cacheService.isConnected ? 1 : 0}`);

        return lines.join('\n');
    }

    getJsonMetrics() {
        const dbMetrics = getPoolMetrics();
        const circuitBreakers = getAllCircuitBreakers();
        const queueStats = queueService.getQueueStats();

        return {
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeUsers: this.metrics.activeUsers.size,
            http: {
                totalRequests: Array.from(this.metrics.httpRequests.values()).reduce((a, b) => a + b.count, 0),
                averageDuration: this.getAverageHttpDuration()
            },
            database: {
                ...dbMetrics,
                averageQueryDuration: this.getAverageDatabaseDuration()
            },
            cache: {
                hits: this.metrics.cacheHits,
                misses: this.metrics.cacheMisses,
                hitRate: this.getCacheHitRate()
            },
            circuitBreakers,
            queues: queueStats,
            redis: {
                connected: cacheService.isConnected
            }
        };
    }

    start() {
        if (!config.METRICS.ENABLED) {
            logger.info('Metrics service is disabled');
            return;
        }

        this.app.listen(this.port, () => {
            logger.info(`Metrics server running on port ${this.port}`);
        });
    }

    reset() {
        this.metrics.httpRequests.clear();
        this.metrics.httpRequestDuration = [];
        this.metrics.databaseQueries = 0;
        this.metrics.databaseQueryDuration = [];
        this.metrics.cacheHits = 0;
        this.metrics.cacheMisses = 0;
    }
}

const metricsService = new MetricsService();

module.exports = metricsService;
