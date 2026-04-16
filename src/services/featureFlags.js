const { pool } = require('../config/database');
const logger = require('../utils/logger');

class FeatureFlagService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000;
    }

    async isEnabled(flagName, context = {}) {
        const cached = this.cache.get(flagName);
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return this.evaluateFlag(cached.value, context);
        }

        try {
            const [rows] = await pool.execute(
                'SELECT * FROM feature_flags WHERE name = ?',
                [flagName]
            );

            if (rows.length === 0) {
                logger.warn(`Feature flag not found: ${flagName}`);
                return false;
            }

            const flag = rows[0];
            this.cache.set(flagName, { value: flag, timestamp: Date.now() });

            return this.evaluateFlag(flag, context);
        } catch (error) {
            logger.error('Error checking feature flag', { flagName, error: error.message });
            return false;
        }
    }

    evaluateFlag(flag, context = {}) {
        if (!flag.is_enabled) {
            return false;
        }

        if (flag.rollout_percentage >= 100) {
            return true;
        }

        if (flag.rollout_percentage <= 0) {
            return false;
        }

        const userId = context.userId;
        if (userId) {
            const hash = this.hashUser(userId, flag.name);
            const bucket = hash % 100;
            return bucket < flag.rollout_percentage;
        }

        return false;
    }

    hashUser(userId, flagName) {
        const str = `${userId}:${flagName}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }

    async getAllFlags() {
        try {
            const [rows] = await pool.execute('SELECT * FROM feature_flags');
            return rows;
        } catch (error) {
            logger.error('Error fetching feature flags', { error: error.message });
            return [];
        }
    }

    async enableFlag(flagName) {
        try {
            await pool.execute(
                'UPDATE feature_flags SET is_enabled = TRUE WHERE name = ?',
                [flagName]
            );
            this.cache.delete(flagName);
            logger.info(`Feature flag enabled: ${flagName}`);
            return { success: true };
        } catch (error) {
            logger.error('Error enabling feature flag', { flagName, error: error.message });
            throw error;
        }
    }

    async disableFlag(flagName) {
        try {
            await pool.execute(
                'UPDATE feature_flags SET is_enabled = FALSE WHERE name = ?',
                [flagName]
            );
            this.cache.delete(flagName);
            logger.info(`Feature flag disabled: ${flagName}`);
            return { success: true };
        } catch (error) {
            logger.error('Error disabling feature flag', { flagName, error: error.message });
            throw error;
        }
    }

    async setRollout(flagName, percentage) {
        try {
            percentage = Math.max(0, Math.min(100, percentage));
            await pool.execute(
                'UPDATE feature_flags SET rollout_percentage = ? WHERE name = ?',
                [percentage, flagName]
            );
            this.cache.delete(flagName);
            logger.info(`Feature flag rollout set: ${flagName} = ${percentage}%`);
            return { success: true };
        } catch (error) {
            logger.error('Error setting feature flag rollout', { flagName, error: error.message });
            throw error;
        }
    }

    clearCache() {
        this.cache.clear();
    }
}

const featureFlagService = new FeatureFlagService();

const requireFeature = (flagName) => {
    return async (req, res, next) => {
        const isEnabled = await featureFlagService.isEnabled(flagName, {
            userId: req.user?.id,
            tenantId: req.tenantId
        });

        if (!isEnabled) {
            return res.status(403).json({
                success: false,
                message: `This feature is currently disabled: ${flagName}`,
                code: 'FEATURE_DISABLED'
            });
        }

        next();
    };
};

module.exports = {
    featureFlagService,
    requireFeature
};
