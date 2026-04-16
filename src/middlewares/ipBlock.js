const { pool } = require('../config/database');
const logger = require('../utils/logger');
const config = require('../config');

class IPBlocklistService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    getClientIP(req) {
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
            return forwarded.split(',')[0].trim();
        }
        return req.ip || req.connection?.remoteAddress || 'unknown';
    }

    async isBlocked(ip) {
        if (!ip || ip === 'unknown') return false;

        const cached = this.cache.get(ip);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.blocked;
        }

        try {
            const [rows] = await pool.execute(
                `SELECT * FROM ip_blocklist 
                 WHERE ip_address = ? 
                 AND (is_permanent = TRUE OR expires_at > NOW())`,
                [ip]
            );

            const blocked = rows.length > 0;
            this.cache.set(ip, { blocked, timestamp: Date.now() });

            return blocked;
        } catch (error) {
            logger.error('Error checking IP blocklist', { ip, error: error.message });
            return false;
        }
    }

    async blockIP(ip, options = {}) {
        const { reason, blockedBy, expiresAt = null, isPermanent = false } = options;

        try {
            await pool.execute(
                `INSERT INTO ip_blocklist (ip_address, reason, blocked_by, expires_at, is_permanent)
                 VALUES (?, ?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE
                 reason = VALUES(reason),
                 blocked_by = VALUES(blocked_by),
                 expires_at = VALUES(expires_at),
                 is_permanent = VALUES(is_permanent)`,
                [ip, reason, blockedBy, expiresAt, isPermanent]
            );

            this.cache.set(ip, { blocked: true, timestamp: Date.now() });
            
            logger.logSecurity('IP blocked', { ip, reason, blockedBy, isPermanent });

            return { success: true };
        } catch (error) {
            logger.error('Error blocking IP', { ip, error: error.message });
            throw error;
        }
    }

    async unblockIP(ip) {
        try {
            const [result] = await pool.execute(
                'DELETE FROM ip_blocklist WHERE ip_address = ?',
                [ip]
            );

            this.cache.delete(ip);
            
            logger.logSecurity('IP unblocked', { ip });

            return { success: result.affectedRows > 0 };
        } catch (error) {
            logger.error('Error unblocking IP', { ip, error: error.message });
            throw error;
        }
    }

    async getBlockedIPs(limit = 100, offset = 0) {
        try {
            const [rows] = await pool.execute(
                `SELECT ib.*, u.username as blocked_by_username
                 FROM ip_blocklist ib
                 LEFT JOIN users u ON ib.blocked_by = u.id
                 WHERE ib.is_permanent = TRUE OR ib.expires_at > NOW()
                 ORDER BY ib.created_at DESC
                 LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            return rows;
        } catch (error) {
            logger.error('Error fetching blocked IPs', { error: error.message });
            throw error;
        }
    }

    async cleanupExpired() {
        try {
            const [result] = await pool.execute(
                'DELETE FROM ip_blocklist WHERE is_permanent = FALSE AND expires_at < NOW()'
            );

            this.cache.clear();
            
            logger.info(`Cleaned up ${result.affectedRows} expired IP blocks`);
            return { deleted: result.affectedRows };
        } catch (error) {
            logger.error('Error cleaning up expired blocks', { error: error.message });
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const ipBlocklistService = new IPBlocklistService();

setInterval(() => {
    ipBlocklistService.cleanupExpired();
}, 60 * 60 * 1000);

const ipBlockMiddleware = async (req, res, next) => {
    const ip = ipBlocklistService.getClientIP(req);

    const blocked = await ipBlocklistService.isBlocked(ip);

    if (blocked) {
        logger.logSecurity('Blocked IP attempted access', { 
            ip, 
            path: req.path,
            method: req.method
        });

        return res.status(403).json({
            success: false,
            message: 'Access denied. Your IP has been blocked.',
            code: 'IP_BLOCKED'
        });
    }

    next();
};

module.exports = {
    ipBlocklistService,
    ipBlockMiddleware
};
