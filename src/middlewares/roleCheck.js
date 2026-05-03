const { errorResponse } = require('../utils/helpers');

const checkPermission = (requiredPermissions) => {
    return async (req, res, next) => {
        try {
            if (!req.user) {
                return errorResponse(res, 'Authentication required', 401);
            }

            const userRoleId = req.user.role_id;

            // Role ID 1 (Super Admin) and Role ID 2 (Admin) bypass all permission checks
            if (userRoleId === 1 || userRoleId === 2) {
                return next();
            }

            const rolePermissions = req.user.permissions || [];

            // Check if user has all required permissions
            if (Array.isArray(requiredPermissions)) {
                const hasAllPermissions = requiredPermissions.every(permission =>
                    rolePermissions.includes(permission) || rolePermissions.includes('all')
                );

                if (!hasAllPermissions) {
                    return errorResponse(res, 'Insufficient permissions', 403);
                }
            } else {
                const hasPermission = rolePermissions.includes(requiredPermissions) ||
                    rolePermissions.includes('all');

                if (!hasPermission) {
                    return errorResponse(res, 'Insufficient permissions', 403);
                }
            }

            next();
        } catch (error) {
            next(error);
        }
    };
};

const isAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        if (req.user.role_id !== 1 && req.user.role_id !== 2) {
            return errorResponse(res, 'Admin access required', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

const isSuperAdmin = async (req, res, next) => {
    try {
        if (!req.user) {
            return errorResponse(res, 'Authentication required', 401);
        }

        if (req.user.role_id !== 1) {
            return errorResponse(res, 'Super admin access required', 403);
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { checkPermission, isAdmin, isSuperAdmin };
