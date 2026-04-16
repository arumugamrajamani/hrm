const config = require('../config');
const logger = require('../utils/logger');
const { pool } = require('../config/database');

const TENANT_HEADER = 'x-tenant-id';
const DEFAULT_TENANT = 'default';

class TenantContext {
    constructor() {
        this.current = null;
    }

    set(tenant) {
        this.current = tenant;
    }

    get() {
        return this.current || DEFAULT_TENANT;
    }

    clear() {
        this.current = null;
    }
}

const tenantContext = new TenantContext();

const tenantMiddleware = async (req, res, next) => {
    if (!config.MULTI_TENANCY.ENABLED) {
        req.tenant = DEFAULT_TENANT;
        tenantContext.set(DEFAULT_TENANT);
        return next();
    }

    const tenantId = req.headers[TENANT_HEADER] || req.query.tenant || DEFAULT_TENANT;

    try {
        if (tenantId !== DEFAULT_TENANT) {
            const [tenants] = await pool.execute(
                'SELECT id, name, database_schema, is_active FROM tenants WHERE id = ? AND is_active = TRUE',
                [tenantId]
            );

            if (tenants.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Tenant not found or inactive',
                    code: 'TENANT_NOT_FOUND'
                });
            }

            req.tenant = tenants[0];
            req.tenantId = tenants[0].id;
            tenantContext.set(tenants[0].id);
        } else {
            req.tenant = DEFAULT_TENANT;
            req.tenantId = DEFAULT_TENANT;
            tenantContext.set(DEFAULT_TENANT);
        }

        next();
    } catch (error) {
        logger.error('Error in tenant middleware', { error: error.message, tenantId });
        next(error);
    }
};

const getTenantConnection = async (tenantId) => {
    if (!config.MULTI_TENANCY.ENABLED || tenantId === DEFAULT_TENANT) {
        return { pool, schema: null };
    }

    try {
        const [tenants] = await pool.execute(
            'SELECT database_schema FROM tenants WHERE id = ? AND is_active = TRUE',
            [tenantId]
        );

        if (tenants.length === 0) {
            throw new Error('Tenant not found');
        }

        return {
            pool,
            schema: tenants[0].database_schema
        };
    } catch (error) {
        logger.error('Error getting tenant connection', { error: error.message, tenantId });
        throw error;
    }
};

const withTenant = async (tenantId, callback) => {
    const previousTenant = tenantContext.get();
    
    try {
        tenantContext.set(tenantId);
        return await callback();
    } finally {
        tenantContext.set(previousTenant);
    }
};

const getCurrentTenant = () => {
    return tenantContext.get();
};

const requireTenant = (req, res, next) => {
    if (!config.MULTI_TENANCY.ENABLED) {
        return next();
    }

    if (!req.tenantId || req.tenantId === DEFAULT_TENANT) {
        return res.status(403).json({
            success: false,
            message: 'Tenant context required for this operation',
            code: 'TENANT_REQUIRED'
        });
    }

    next();
};

const addTenantFilter = (query, params = []) => {
    if (!config.MULTI_TENANCY.ENABLED) {
        return { query, params };
    }

    const tenantId = tenantContext.get();
    
    if (tenantId === DEFAULT_TENANT) {
        return { query, params };
    }

    const tenantQuery = query.replace(
        'WHERE',
        `WHERE tenant_id = ? AND`
    ).replace(
        'FROM',
        `, tenants t WHERE t.id = tenant_id AND`
    );

    return {
        query: query,
        params: [tenantId, ...params]
    };
};

module.exports = {
    tenantMiddleware,
    getTenantConnection,
    withTenant,
    getCurrentTenant,
    requireTenant,
    addTenantFilter,
    tenantContext,
    TENANT_HEADER,
    DEFAULT_TENANT
};
