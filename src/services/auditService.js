const { pool } = require('../config/database');
const logger = require('../utils/logger');

const AUDIT_ACTIONS = {
    USER_CREATED: 'user.created',
    USER_UPDATED: 'user.updated',
    USER_DELETED: 'user.deleted',
    USER_LOGIN: 'auth.login',
    USER_LOGOUT: 'auth.logout',
    PASSWORD_CHANGED: 'auth.password_changed',
    PASSWORD_RESET: 'auth.password_reset',
    ROLE_CHANGED: 'user.role_changed',
    STATUS_CHANGED: 'user.status_changed',
    DEPARTMENT_CREATED: 'department.created',
    DEPARTMENT_UPDATED: 'department.updated',
    DEPARTMENT_DELETED: 'department.deleted',
    EDUCATION_CREATED: 'education.created',
    EDUCATION_UPDATED: 'education.updated',
    EDUCATION_DELETED: 'education.deleted',
    COURSE_CREATED: 'course.created',
    COURSE_UPDATED: 'course.updated',
    COURSE_DELETED: 'course.deleted',
    MAPPING_CREATED: 'mapping.created',
    MAPPING_DELETED: 'mapping.deleted'
};

const ENTITY_TYPES = {
    USER: 'user',
    DEPARTMENT: 'department',
    EDUCATION: 'education',
    COURSE: 'course',
    MAPPING: 'mapping',
    ROLE: 'role',
    AUTH: 'auth'
};

class AuditService {
    static async log(params) {
        const { 
            userId, 
            action, 
            entityType, 
            entityId, 
            oldValue, 
            newValue, 
            req,
            description 
        } = params;

        try {
            const query = `
                INSERT INTO audit_logs 
                (user_id, action, entity_type, entity_id, old_value, new_value, ip_address, user_agent, request_id, description, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const values = [
                userId || null,
                action,
                entityType,
                entityId || null,
                oldValue ? JSON.stringify(oldValue) : null,
                newValue ? JSON.stringify(newValue) : null,
                req?.ip || req?.connection?.remoteAddress || null,
                req?.headers?.['user-agent'] || null,
                req?.requestId || req?.headers?.['x-request-id'] || null,
                description || null
            ];

            await pool.execute(query, values);
            
            logger.info('Audit log created', {
                userId,
                action,
                entityType,
                entityId,
                requestId: req?.requestId
            });
        } catch (error) {
            logger.error('Failed to create audit log', {
                error: error.message,
                action,
                entityType,
                entityId
            });
        }
    }

    static async logUserAction(action, userId, targetUserId, changes, req, description) {
        return this.log({
            userId,
            action,
            entityType: ENTITY_TYPES.USER,
            entityId: targetUserId,
            oldValue: changes.oldValue,
            newValue: changes.newValue,
            req,
            description
        });
    }

    static async logAuthAction(action, userId, req, description) {
        return this.log({
            userId,
            action,
            entityType: ENTITY_TYPES.AUTH,
            entityId: userId,
            req,
            description
        });
    }

    static async logEntityAction(action, entityType, entityId, oldValue, newValue, userId, req, description) {
        return this.log({
            userId,
            action,
            entityType,
            entityId,
            oldValue,
            newValue,
            req,
            description
        });
    }

    static async getAuditLogs(filters = {}) {
        const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = filters;
        const offset = (page - 1) * limit;
        
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (userId) {
            whereClause += ' AND user_id = ?';
            params.push(userId);
        }

        if (action) {
            whereClause += ' AND action = ?';
            params.push(action);
        }

        if (entityType) {
            whereClause += ' AND entity_type = ?';
            params.push(entityType);
        }

        if (startDate) {
            whereClause += ' AND created_at >= ?';
            params.push(startDate);
        }

        if (endDate) {
            whereClause += ' AND created_at <= ?';
            params.push(endDate);
        }

        const countQuery = `SELECT COUNT(*) as total FROM audit_logs ${whereClause}`;
        const dataQuery = `
            SELECT * FROM audit_logs 
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.execute(countQuery, params);
        const [rows] = await pool.execute(dataQuery, [...params, limit, offset]);

        return {
            logs: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }
}

module.exports = { AuditService, AUDIT_ACTIONS, ENTITY_TYPES };
