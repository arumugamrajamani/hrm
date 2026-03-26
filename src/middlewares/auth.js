const { verifyAccessToken } = require('../config/jwt');
const { errorResponse } = require('../utils/helpers');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'Access token is required', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyAccessToken(token);

            if (decoded.type !== 'access') {
                return errorResponse(res, 'Invalid token type', 401);
            }

            req.user = {
                id: decoded.id,
                email: decoded.email,
                role_id: decoded.role_id
            };

            next();
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                return errorResponse(res, 'Access token expired', 401);
            }
            if (error.name === 'JsonWebTokenError') {
                return errorResponse(res, 'Invalid access token', 401);
            }
            throw error;
        }
    } catch (error) {
        next(error);
    }
};

const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyAccessToken(token);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role_id: decoded.role_id
            };
        } catch (error) {
            // Token invalid, but continue without auth
        }

        next();
    } catch (error) {
        next();
    }
};

module.exports = { authMiddleware, optionalAuth };
