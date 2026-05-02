const jwtService = require('../config/jwt');
const { errorResponse } = require('../utils/helpers');
const { pool } = require('../config/database');
const { parseJSON } = require('../utils/helpers');

const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return errorResponse(res, 'Access token is required', 401);
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = jwtService.verifyAccessToken(token);

            if (decoded.type !== 'access') {
                return errorResponse(res, 'Invalid token type', 401);
            }

            // Fetch user with role permissions
            const [users] = await pool.query(
                `SELECT u.id, u.email, u.role_id, r.permissions 
                 FROM users u 
                 LEFT JOIN roles r ON u.role_id = r.id 
                 WHERE u.id = ?`,
                [decoded.id]
            );

            if (!users.length) {
                return errorResponse(res, 'User not found', 401);
            }

            const user = users[0];
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role_id: decoded.role_id,
                permissions: parseJSON(user.permissions) || []
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
            const decoded = jwtService.verifyAccessToken(token);
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
