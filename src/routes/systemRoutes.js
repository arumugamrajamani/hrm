const express = require('express');
const router = express.Router();
const { getPoolMetrics } = require('../config/database');
const { getAllCircuitBreakers } = require('../services/circuitBreaker');
const queueService = require('../services/queueService');
const cacheService = require('../services/cacheService');
const metricsService = require('../services/metricsService');
const { webhookService, EventType } = require('../services/webhookService');
const { featureFlagService } = require('../services/featureFlags');
const { ipBlocklistService } = require('../middlewares/ipBlock');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, isSuperAdmin } = require('../middlewares/roleCheck');
const { asyncHandler } = require('../middlewares/errorHandler');
const config = require('../config');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Basic health check
 *     tags: [Health]
 *     description: Returns basic server health status
 *     responses:
 *       200:
 *         description: Server is running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: HRM API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 version:
 *                   type: string
 *                   example: 2.0.0
 *                 environment:
 *                   type: string
 *                   example: development
 */
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'HRM API is running',
        timestamp: new Date().toISOString(),
        version: config.APP_VERSION,
        environment: config.ENV
    });
});

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     summary: Detailed health check
 *     tags: [Health]
 *     description: Returns detailed health status including all dependencies (database, Redis, queues, circuit breakers)
 *     responses:
 *       200:
 *         description: Detailed health status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service degraded or unhealthy
 */
router.get('/health/detailed', asyncHandler(async (req, res) => {
    const dbMetrics = getPoolMetrics();
    const redisStatus = cacheService.isConnected ? 'connected' : 'disconnected';
    const circuitBreakers = getAllCircuitBreakers();
    const queueStats = queueService.getQueueStats();

    const checks = {
        database: {
            status: dbMetrics.isHealthy ? 'healthy' : 'unhealthy',
            ...dbMetrics
        },
        redis: {
            status: redisStatus === 'connected' ? 'healthy' : 'degraded',
            connected: cacheService.isConnected
        },
        circuitBreakers,
        queues: queueStats
    };

    const allHealthy = 
        checks.database.status === 'healthy' &&
        checks.redis.status !== 'unhealthy';

    res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        status: allHealthy ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        version: config.APP_VERSION,
        environment: config.ENV,
        uptime: process.uptime(),
        checks
    });
}));

/**
 * @swagger
 * /health/live:
 *   get:
 *     summary: Liveness probe
 *     tags: [Health]
 *     description: Kubernetes liveness probe - returns 200 if server is alive
 *     responses:
 *       200:
 *         description: Server is alive
 */
router.get('/health/live', (req, res) => {
    res.status(200).json({
        success: true,
        status: 'alive',
        timestamp: new Date().toISOString()
    });
});

/**
 * @swagger
 * /health/ready:
 *   get:
 *     summary: Readiness probe
 *     tags: [Health]
 *     description: Kubernetes readiness probe - returns 200 if server is ready to accept traffic
 *     responses:
 *       200:
 *         description: Server is ready
 *       503:
 *         description: Server not ready (database unavailable)
 */
router.get('/health/ready', asyncHandler(async (req, res) => {
    const dbMetrics = getPoolMetrics();
    
    if (!dbMetrics.isHealthy) {
        return res.status(503).json({
            success: false,
            status: 'not ready',
            reason: 'Database connection unavailable'
        });
    }

    res.status(200).json({
        success: true,
        status: 'ready',
        timestamp: new Date().toISOString()
    });
}));

/**
 * @swagger
 * /metrics:
 *   get:
 *     summary: Prometheus metrics
 *     tags: [Metrics]
 *     description: Returns application metrics in Prometheus format
 *     responses:
 *       200:
 *         description: Prometheus metrics
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: |
 *                 # HELP hrm_http_requests_total Total HTTP requests
 *                 # TYPE hrm_http_requests_total counter
 *                 hrm_http_requests_total{method="GET",path="/health",status="200"} 100
 */
router.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(metricsService.getPrometheusMetrics());
});

/**
 * @swagger
 * /metrics/json:
 *   get:
 *     summary: JSON metrics
 *     tags: [Metrics]
 *     description: Returns application metrics in JSON format
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JSON metrics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MetricsResponse'
 */
router.get('/metrics/json', authMiddleware, isAdmin, (req, res) => {
    res.json(metricsService.getJsonMetrics());
});

/**
 * @swagger
 * /circuit-breakers:
 *   get:
 *     summary: Get circuit breaker status
 *     tags: [Admin]
 *     description: Returns status of all circuit breakers
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Circuit breaker statuses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 $ref: '#/components/schemas/CircuitBreakerStatus'
 */
router.get('/circuit-breakers', authMiddleware, isAdmin, (req, res) => {
    res.json({
        success: true,
        data: getAllCircuitBreakers()
    });
});

/**
 * @swagger
 * /feature-flags:
 *   get:
 *     summary: Get all feature flags
 *     tags: [FeatureFlags]
 *     description: Returns all feature flags with their status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feature flags
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeatureFlag'
 */
router.get('/feature-flags', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const flags = await featureFlagService.getAllFlags();
    res.json({
        success: true,
        data: flags
    });
}));

/**
 * @swagger
 * /feature-flags/{name}/toggle:
 *   patch:
 *     summary: Toggle a feature flag
 *     tags: [FeatureFlags]
 *     description: Enable or disable a feature flag
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Feature flag name
 *       - in: query
 *         name: enabled
 *         required: true
 *         schema:
 *           type: boolean
 *         description: Enable or disable the flag
 *     responses:
 *       200:
 *         description: Feature flag toggled
 *       404:
 *         description: Feature flag not found
 */
router.patch('/feature-flags/:name/toggle', authMiddleware, isSuperAdmin, asyncHandler(async (req, res) => {
    const { name } = req.params;
    const { enabled } = req.query;

    if (enabled === 'true') {
        await featureFlagService.enableFlag(name);
    } else {
        await featureFlagService.disableFlag(name);
    }

    res.json({
        success: true,
        message: `Feature flag '${name}' ${enabled === 'true' ? 'enabled' : 'disabled'}`
    });
}));

/**
 * @swagger
 * /webhooks:
 *   get:
 *     summary: Get all webhooks
 *     tags: [Webhooks]
 *     description: Returns all configured webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Webhooks list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Webhook'
 */
router.get('/webhooks', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { pool } = require('../config/database');
    const [webhooks] = await pool.execute(
        'SELECT * FROM webhook_endpoints WHERE is_active = TRUE ORDER BY created_at DESC'
    );
    res.json({
        success: true,
        data: webhooks
    });
}));

/**
 * @swagger
 * /webhooks:
 *   post:
 *     summary: Create a webhook
 *     tags: [Webhooks]
 *     description: Create a new webhook endpoint
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - url
 *               - events
 *             properties:
 *               name:
 *                 type: string
 *                 example: User Activity Webhook
 *               url:
 *                 type: string
 *                 format: uri
 *                 example: https://api.example.com/webhooks/hrm
 *               description:
 *                 type: string
 *               events:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["user.created", "user.login"]
 *               headers:
 *                 type: object
 *                 description: Custom headers to send with webhook
 *               retry_count:
 *                 type: integer
 *                 default: 3
 *     responses:
 *       201:
 *         description: Webhook created
 *       400:
 *         description: Validation error
 */
router.post('/webhooks', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { name, url, description, events, headers, retry_count = 3 } = req.body;
    const { pool } = require('../config/database');
    const crypto = require('crypto');

    const secret = crypto.randomBytes(32).toString('hex');

    const [result] = await pool.execute(
        `INSERT INTO webhook_endpoints (name, url, description, secret, events, headers, retry_count, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, url, description, secret, JSON.stringify(events), JSON.stringify(headers), retry_count, req.user.id]
    );

    res.status(201).json({
        success: true,
        message: 'Webhook created',
        data: {
            id: result.insertId,
            secret
        }
    });
}));

/**
 * @swagger
 * /webhooks/{id}:
 *   delete:
 *     summary: Delete a webhook
 *     tags: [Webhooks]
 *     description: Delete a webhook endpoint
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Webhook ID
 *     responses:
 *       200:
 *         description: Webhook deleted
 *       404:
 *         description: Webhook not found
 */
router.delete('/webhooks/:id', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { pool } = require('../config/database');

    const [result] = await pool.execute(
        'DELETE FROM webhook_endpoints WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        return res.status(404).json({
            success: false,
            message: 'Webhook not found'
        });
    }

    res.json({
        success: true,
        message: 'Webhook deleted'
    });
}));

/**
 * @swagger
 * /webhooks/events:
 *   get:
 *     summary: Get available webhook events
 *     tags: [Webhooks]
 *     description: Returns list of all available webhook event types
 *     responses:
 *       200:
 *         description: Available events
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["user.created", "user.updated", "user.login"]
 *                     department:
 *                       type: array
 *                       items:
 *                         type: string
 *                     location:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.get('/webhooks/events', (req, res) => {
    res.json({
        success: true,
        data: {
            user: [
                'user.created',
                'user.updated',
                'user.deleted',
                'user.login',
                'user.logout',
                'user.password_changed',
                'user.role_changed',
                'user.status_changed'
            ],
            department: [
                'department.created',
                'department.updated',
                'department.deleted'
            ],
            location: [
                'location.created',
                'location.updated',
                'location.deleted'
            ],
            designation: [
                'designation.created',
                'designation.updated',
                'designation.deleted'
            ],
            education: [
                'education.created',
                'education.updated',
                'education.deleted'
            ],
            course: [
                'course.created',
                'course.updated',
                'course.deleted'
            ],
            audit: [
                'audit.export'
            ]
        }
    });
});

/**
 * @swagger
 * /ip-blocklist:
 *   get:
 *     summary: Get blocked IPs
 *     tags: [Admin]
 *     description: Returns list of blocked IP addresses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Blocked IPs list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/IPBlock'
 */
router.get('/ip-blocklist', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const blocked = await ipBlocklistService.getBlockedIPs(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
    res.json({
        success: true,
        data: blocked
    });
}));

/**
 * @swagger
 * /ip-blocklist:
 *   post:
 *     summary: Block an IP address
 *     tags: [Admin]
 *     description: Add an IP address to the blocklist
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ip_address
 *             properties:
 *               ip_address:
 *                 type: string
 *                 example: "192.168.1.100"
 *               reason:
 *                 type: string
 *                 example: "Suspicious activity detected"
 *               is_permanent:
 *                 type: boolean
 *                 default: false
 *               expires_at:
 *                 type: string
 *                 format: date-time
 *                 description: Required if is_permanent is false
 *     responses:
 *       200:
 *         description: IP blocked
 *       400:
 *         description: Invalid request
 */
router.post('/ip-blocklist', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { ip_address, reason, is_permanent = false, expires_at } = req.body;

    if (!ip_address) {
        return res.status(400).json({
            success: false,
            message: 'IP address is required'
        });
    }

    await ipBlocklistService.blockIP(ip_address, {
        reason,
        blockedBy: req.user.id,
        expiresAt: expires_at,
        isPermanent: is_permanent
    });

    res.json({
        success: true,
        message: `IP ${ip_address} has been blocked`
    });
}));

/**
 * @swagger
 * /ip-blocklist/{ip}:
 *   delete:
 *     summary: Unblock an IP address
 *     tags: [Admin]
 *     description: Remove an IP address from the blocklist
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ip
 *         required: true
 *         schema:
 *           type: string
 *         description: IP address to unblock
 *     responses:
 *       200:
 *         description: IP unblocked
 *       404:
 *         description: IP not found in blocklist
 */
router.delete('/ip-blocklist/:ip', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const { ip } = req.params;
    const result = await ipBlocklistService.unblockIP(ip);

    if (!result.success) {
        return res.status(404).json({
            success: false,
            message: 'IP not found in blocklist'
        });
    }

    res.json({
        success: true,
        message: `IP ${ip} has been unblocked`
    });
}));

/**
 * @swagger
 * /bulk/export:
 *   post:
 *     summary: Initiate bulk export
 *     tags: [Bulk]
 *     description: Start a bulk export job (users, departments, locations, etc.)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [users, departments, locations, designations, courses, education]
 *                 example: users
 *               format:
 *                 type: string
 *                 enum: [csv, json]
 *                 default: csv
 *     responses:
 *       202:
 *         description: Export job queued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkJob'
 */
router.post('/bulk/export', authMiddleware, isAdmin, asyncHandler(async (req, res) => {
    const bulkService = require('../services/bulkService');
    const { type, format = 'csv' } = req.body;

    const result = await bulkService.initiateBulkExport(type, {}, req.user.id, { format });

    res.status(202).json({
        success: true,
        ...result
    });
}));

/**
 * @swagger
 * /bulk/job/{jobId}:
 *   get:
 *     summary: Get bulk job status
 *     tags: [Bulk]
 *     description: Check the status of a bulk import/export job
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: jobId
 *         required: true
 *         schema:
 *           type: string
 *         description: Job ID returned from bulk operation
 *     responses:
 *       200:
 *         description: Job status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BulkJob'
 */
router.get('/bulk/job/:jobId', authMiddleware, asyncHandler(async (req, res) => {
    const bulkService = require('../services/bulkService');
    const { jobId } = req.params;

    const status = await bulkService.getJobStatus(jobId);

    if (!status) {
        return res.status(404).json({
            success: false,
            message: 'Job not found'
        });
    }

    res.json({
        success: true,
        data: status
    });
}));

/**
 * @swagger
 * /tenants:
 *   get:
 *     summary: Get all tenants
 *     tags: [Admin]
 *     description: Returns all tenants (requires multi-tenancy enabled)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tenants list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tenant'
 */
router.get('/tenants', authMiddleware, isSuperAdmin, asyncHandler(async (req, res) => {
    if (!config.MULTI_TENANCY.ENABLED) {
        return res.status(400).json({
            success: false,
            message: 'Multi-tenancy is not enabled'
        });
    }

    const { pool } = require('../config/database');
    const [tenants] = await pool.execute('SELECT * FROM tenants ORDER BY name ASC');
    res.json({
        success: true,
        data: tenants
    });
}));

/**
 * @swagger
 * /system/info:
 *   get:
 *     summary: Get system information
 *     tags: [Admin]
 *     description: Returns system configuration and status
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System info
 */
router.get('/system/info', authMiddleware, isAdmin, (req, res) => {
    const dbMetrics = getPoolMetrics();
    
    res.json({
        success: true,
        data: {
            version: config.APP_VERSION,
            environment: config.ENV,
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
            database: {
                host: config.DB.HOST,
                name: config.DB.NAME,
                poolSize: config.DB.POOL_SIZE,
                metrics: dbMetrics
            },
            redis: {
                connected: cacheService.isConnected
            },
            features: {
                multiTenancy: config.MULTI_TENANCY.ENABLED,
                webhooks: config.WEBHOOK.ENABLED,
                metrics: config.METRICS.ENABLED,
                keyRotation: config.JWT.KEY_ROTATION_ENABLED
            }
        }
    });
});

module.exports = router;
