const { pool } = require('../config/database');
const config = require('../config');
const logger = require('../utils/logger');
const queueService = require('./queueService');
const { getCircuitBreaker } = require('./circuitBreaker');

const EventType = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_LOGIN: 'user.login',
    USER_LOGOUT: 'user.logout',
    USER_PASSWORD_CHANGED: 'user.password_changed',
    USER_ROLE_CHANGED: 'user.role_changed',
    USER_STATUS_CHANGED: 'user.status_changed',
    
    DEPARTMENT_CREATED: 'department.created',
    DEPARTMENT_UPDATED: 'department.updated',
    DEPARTMENT_DELETED: 'department.deleted',
    
    LOCATION_CREATED: 'location.created',
    LOCATION_UPDATED: 'location.updated',
    LOCATION_DELETED: 'location.deleted',
    
    DESIGNATION_CREATED: 'designation.created',
    DESIGNATION_UPDATED: 'designation.updated',
    DESIGNATION_DELETED: 'designation.deleted',
    
    EDUCATION_CREATED: 'education.created',
    EDUCATION_UPDATED: 'education.updated',
    EDUCATION_DELETED: 'education.deleted',
    
    COURSE_CREATED: 'course.created',
    COURSE_UPDATED: 'course.updated',
    COURSE_DELETED: 'course.deleted',
    
    MAPPING_CREATED: 'mapping.created',
    MAPPING_DELETED: 'mapping.deleted',
    
    AUDIT_EXPORT: 'audit.export'
};

class WebhookService {
    constructor() {
        this.webhookCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
        this.circuitBreaker = getCircuitBreaker('webhook', {
            timeout: 10000,
            errorThreshold: 10,
            resetTimeout: 60000
        });
    }

    async getActiveWebhooks(eventType) {
        const cacheKey = `webhooks:${eventType}`;
        const cached = this.webhookCache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.webhooks;
        }

        try {
            const [rows] = await pool.execute(
                `SELECT w.*, wh.url, wh.secret, wh.events, wh.is_active, wh.retry_count
                 FROM webhooks w
                 JOIN webhook_endpoints wh ON w.endpoint_id = wh.id
                 WHERE wh.is_active = TRUE 
                 AND JSON_CONTAINS(wh.events, ?)`,
                [JSON.stringify(eventType)]
            );

            this.webhookCache.set(cacheKey, { webhooks: rows, timestamp: Date.now() });
            return rows;
        } catch (error) {
            logger.error('Error fetching webhooks', { eventType, error: error.message });
            return [];
        }
    }

    async trigger(eventType, payload, options = {}) {
        if (!config.WEBHOOK.ENABLED) {
            logger.debug('Webhooks disabled, skipping trigger', { eventType });
            return { triggered: false, reason: 'webhooks_disabled' };
        }

        const webhooks = await this.getActiveWebhooks(eventType);
        
        if (webhooks.length === 0) {
            return { triggered: false, reason: 'no_webhooks' };
        }

        const eventId = this.generateEventId();
        const eventData = {
            id: eventId,
            type: eventType,
            payload,
            timestamp: new Date().toISOString(),
            tenantId: options.tenantId || null,
            userId: options.userId || null,
            requestId: options.requestId || null
        };

        const results = {
            eventId,
            triggered: true,
            webhookCount: webhooks.length,
            deliveries: []
        };

        for (const webhook of webhooks) {
            const deliveryJob = await queueService.add('webhook', {
                webhookId: webhook.id,
                endpointId: webhook.endpoint_id,
                url: webhook.url,
                secret: webhook.secret,
                eventData,
                retryCount: webhook.retry_count
            });

            results.deliveries.push({
                webhookId: webhook.id,
                jobId: deliveryJob.id,
                status: 'queued'
            });
        }

        return results;
    }

    async deliverWebhook(webhookData) {
        const { webhookId, url, secret, eventData } = webhookData;
        const payload = JSON.stringify(eventData);
        const timestamp = new Date().toISOString();
        const signature = this.generateSignature(payload, timestamp, secret);

        try {
            const response = await this.circuitBreaker.execute(async () => {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);

                try {
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Webhook-Signature': signature,
                            'X-Webhook-Timestamp': timestamp,
                            'X-Webhook-Event': eventData.type,
                            'X-Webhook-Event-ID': eventData.id
                        },
                        body: payload,
                        signal: controller.signal
                    });

                    clearTimeout(timeout);
                    return res;
                } catch (err) {
                    clearTimeout(timeout);
                    throw err;
                }
            });

            const status = response.status;
            const success = status >= 200 && status < 300;

            await this.logDelivery({
                webhookId,
                eventId: eventData.id,
                statusCode: status,
                success,
                responseBody: success ? null : await response.text().catch(() => null)
            });

            return { success, statusCode: status };
        } catch (error) {
            logger.error('Webhook delivery failed', {
                webhookId,
                eventId: eventData.id,
                error: error.message
            });

            await this.logDelivery({
                webhookId,
                eventId: eventData.id,
                statusCode: 0,
                success: false,
                error: error.message
            });

            return { success: false, error: error.message };
        }
    }

    generateSignature(payload, timestamp, secret) {
        const crypto = require('crypto');
        const signaturePayload = `${timestamp}.${payload}`;
        return crypto
            .createHmac('sha256', secret)
            .update(signaturePayload)
            .digest('hex');
    }

    generateEventId() {
        const crypto = require('crypto');
        return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
    }

    async logDelivery(deliveryData) {
        try {
            await pool.execute(
                `INSERT INTO webhook_deliveries 
                 (webhook_id, event_id, status_code, success, response_body, error_message, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    deliveryData.webhookId,
                    deliveryData.eventId,
                    deliveryData.statusCode,
                    deliveryData.success,
                    deliveryData.responseBody,
                    deliveryData.error || null
                ]
            );
        } catch (error) {
            logger.error('Failed to log webhook delivery', { error: error.message });
        }
    }

    clearCache() {
        this.webhookCache.clear();
    }
}

const webhookService = new WebhookService();

queueService.process('webhook', async (job) => {
    await webhookService.deliverWebhook(job.data);
}, 5);

module.exports = { WebhookService, EventType, webhookService };
