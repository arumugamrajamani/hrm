const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const config = require('./index');
const logger = require('../utils/logger');

class JWTKeyRotationService {
    constructor() {
        this.currentKeyId = config.JWT.KEY_ID || 'v1';
        this.previousKeyId = null;
        this.keys = new Map();
        this.keyExpiry = 7 * 24 * 60 * 60 * 1000;
        this.initKeys();
    }

    initKeys() {
        this.keys.set(this.currentKeyId, {
            secret: config.JWT.SECRET,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.keyExpiry)
        });

        if (config.JWT.KEY_ROTATION_ENABLED && config.JWT.SECRET) {
            this.keys.set(`${this.currentKeyId}-refresh`, {
                secret: config.JWT.REFRESH_SECRET,
                createdAt: new Date(),
                expiresAt: new Date(Date.now() + this.keyExpiry),
                type: 'refresh'
            });
        }

        logger.info('JWT Key Rotation Service initialized', {
            currentKeyId: this.currentKeyId,
            keyRotationEnabled: config.JWT.KEY_ROTATION_ENABLED
        });
    }

    generateKeyId() {
        return `v${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    }

    rotateKeys() {
        if (!config.JWT.KEY_ROTATION_ENABLED) {
            return { rotated: false, reason: 'key_rotation_disabled' };
        }

        this.previousKeyId = this.currentKeyId;
        this.currentKeyId = this.generateKeyId();

        const newAccessSecret = crypto.randomBytes(64).toString('hex');
        const newRefreshSecret = crypto.randomBytes(64).toString('hex');

        this.keys.set(this.currentKeyId, {
            secret: newAccessSecret,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.keyExpiry),
            type: 'access'
        });

        this.keys.set(`${this.currentKeyId}-refresh`, {
            secret: newRefreshSecret,
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + this.keyExpiry),
            type: 'refresh'
        });

        if (this.previousKeyId) {
            this.keys.set(`previous-${this.previousKeyId}`, this.keys.get(this.currentKeyId));
            this.keys.set(`previous-${this.currentKeyId}-refresh`, this.keys.get(`${this.currentKeyId}-refresh`));
        }

        logger.logSecurity('JWT keys rotated', {
            previousKeyId: this.previousKeyId,
            newKeyId: this.currentKeyId
        });

        return {
            rotated: true,
            newKeyId: this.currentKeyId,
            previousKeyId: this.previousKeyId
        };
    }

    getSecret(keyId, type = 'access') {
        if (type === 'refresh') {
            keyId = `${keyId}-refresh`;
        }

        const key = this.keys.get(keyId);
        if (key) {
            return key.secret;
        }

        if (this.previousKeyId) {
            const prevKeyId = keyId.startsWith('previous-') ? keyId : `previous-${keyId}`;
            const prevKey = this.keys.get(prevKeyId);
            if (prevKey) {
                return prevKey.secret;
            }
        }

        return config.JWT.SECRET;
    }

    generateAccessToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            role_id: user.role_id,
            type: 'access',
            keyId: this.currentKeyId
        };

        const secret = this.getSecret(this.currentKeyId, 'access');
        
        return jwt.sign(payload, secret, { 
            expiresIn: config.JWT.ACCESS_EXPIRY,
            algorithm: config.JWT.ALGORITHM
        });
    }

    generateRefreshToken(user) {
        const payload = {
            id: user.id,
            email: user.email,
            type: 'refresh',
            keyId: this.currentKeyId
        };

        const secret = this.getSecret(this.currentKeyId, 'refresh');
        
        return jwt.sign(payload, secret, { 
            expiresIn: config.JWT.REFRESH_EXPIRY,
            algorithm: config.JWT.ALGORITHM
        });
    }

    verifyAccessToken(token) {
        const decoded = jwt.decode(token, { complete: true });
        
        if (!decoded) {
            throw new Error('Invalid token format');
        }

        const keyId = decoded.payload.keyId || this.currentKeyId;
        const secret = this.getSecret(keyId, 'access');
        
        try {
            return jwt.verify(token, secret, { 
                algorithms: [config.JWT.ALGORITHM]
            });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' && this.previousKeyId) {
                try {
                    const prevSecret = this.getSecret(keyId, 'access');
                    return jwt.verify(token, prevSecret, { 
                        algorithms: [config.JWT.ALGORITHM]
                    });
                } catch (prevError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    verifyRefreshToken(token) {
        const decoded = jwt.decode(token, { complete: true });
        
        if (!decoded) {
            throw new Error('Invalid token format');
        }

        const keyId = decoded.payload.keyId || this.currentKeyId;
        const secret = this.getSecret(keyId, 'refresh');
        
        try {
            return jwt.verify(token, secret, { 
                algorithms: [config.JWT.ALGORITHM]
            });
        } catch (error) {
            if (error.name === 'JsonWebTokenError' && this.previousKeyId) {
                try {
                    const prevSecret = this.getSecret(keyId, 'refresh');
                    return jwt.verify(token, prevSecret, { 
                        algorithms: [config.JWT.ALGORITHM]
                    });
                } catch (prevError) {
                    throw error;
                }
            }
            throw error;
        }
    }

    decodeToken(token) {
        return jwt.decode(token);
    }

    getKeyInfo() {
        const keys = {};
        this.keys.forEach((value, key) => {
            keys[key] = {
                type: value.type || 'access',
                createdAt: value.createdAt,
                expiresAt: value.expiresAt,
                isExpired: new Date() > value.expiresAt
            };
        });

        return {
            currentKeyId: this.currentKeyId,
            previousKeyId: this.previousKeyId,
            keyRotationEnabled: config.JWT.KEY_ROTATION_ENABLED,
            keys
        };
    }

    cleanupOldKeys() {
        const now = new Date();
        let cleaned = 0;

        for (const [keyId, key] of this.keys.entries()) {
            if (key.expiresAt < now && !keyId.startsWith('current')) {
                this.keys.delete(keyId);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.info(`Cleaned up ${cleaned} expired JWT keys`);
        }

        return { cleaned };
    }
}

const jwtKeyRotationService = new JWTKeyRotationService();

setInterval(() => {
    if (config.JWT.KEY_ROTATION_ENABLED) {
        jwtKeyRotationService.cleanupOldKeys();
    }
}, 60 * 60 * 1000);

module.exports = jwtKeyRotationService;
