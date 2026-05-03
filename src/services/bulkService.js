const { pool, withTransaction } = require('../config/database');
const logger = require('../utils/logger');
const queueService = require('./queueService');
const { webhookService, EventType } = require('./webhookService');
const config = require('../config');

class BulkOperationService {
    constructor() {
        this.supportedTypes = ['users', 'departments', 'locations', 'designations', 'courses', 'education'];
    }

    async initiateBulkImport(type, data, userId, options = {}) {
        if (!this.supportedTypes.includes(type)) {
            throw new Error(`Unsupported import type: ${type}`);
        }

        const job = await queueService.add('export', {
            type: 'import',
            entityType: type,
            data,
            userId,
            options
        }, {
            attempts: 3,
            backoffType: 'exponential',
            backoffDelay: 5000
        });

        logger.logAudit(`Bulk import initiated`, {
            type,
            userId,
            jobId: job.id,
            recordCount: Array.isArray(data) ? data.length : 0
        });

        return {
            jobId: job.id,
            status: 'queued',
            message: `Bulk import of ${type} has been queued for processing`
        };
    }

    async initiateBulkExport(type, filters, userId, options = {}) {
        if (!this.supportedTypes.includes(type)) {
            throw new Error(`Unsupported export type: ${type}`);
        }

        const job = await queueService.add('export', {
            type: 'export',
            entityType: type,
            filters,
            userId,
            options
        }, {
            attempts: 2,
            backoffType: 'fixed',
            backoffDelay: 10000
        });

        logger.logAudit(`Bulk export initiated`, {
            type,
            userId,
            jobId: job.id
        });

        return {
            jobId: job.id,
            status: 'queued',
            message: `Bulk export of ${type} has been queued for processing`
        };
    }

    async processImport(job) {
        const { entityType, data, userId, options } = job.data;
        
        logger.info(`Processing bulk import`, { entityType, userId, jobId: job.id });
        
        const results = {
            total: 0,
            successful: 0,
            failed: 0,
            errors: []
        };

        try {
            await withTransaction(async (connection) => {
                if (entityType === 'users') {
                    await job.progress(10);
                    const result = await this.importUsers(data, userId, connection, job);
                    Object.assign(results, result);
                } else if (entityType === 'departments') {
                    await job.progress(10);
                    const result = await this.importDepartments(data, userId, connection, job);
                    Object.assign(results, result);
                } else if (entityType === 'locations') {
                    await job.progress(10);
                    const result = await this.importLocations(data, userId, connection, job);
                    Object.assign(results, result);
                }
            });

            webhookService.trigger(EventType.AUDIT_EXPORT, {
                type: 'import',
                entityType,
                results,
                userId
            });

            return results;
        } catch (error) {
            logger.error('Bulk import failed', { entityType, error: error.message });
            throw error;
        }
    }

    async importUsers(data, userId, connection, job) {
        const results = { total: data.length, successful: 0, failed: 0, errors: [] };
        const bcrypt = require('bcrypt');
        const saltRounds = config.SECURITY.BCRYPT_ROUNDS || 12;

        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];
                
                const [existing] = await connection.execute(
                    'SELECT id FROM users WHERE email = ? OR username = ?',
                    [row.email, row.username]
                );

                if (existing.length > 0) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: 'Email or username already exists' });
                    continue;
                }

                const passwordHash = await bcrypt.hash(row.password || 'ChangeMe123!', saltRounds);

                const [roleResult] = await connection.execute(
                    'SELECT id FROM roles WHERE name = ?',
                    [row.role || 'Employee']
                );

                const roleId = roleResult.length > 0 ? roleResult[0].id : 2;

                await connection.execute(
                    `INSERT INTO users (username, email, mobile, password, role_id, status, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [row.username, row.email, row.mobile, passwordHash, roleId, row.status || 'active', userId]
                );

                results.successful++;
                
                if (i % 10 === 0) {
                    await job.progress(Math.floor((i / data.length) * 90) + 10);
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ row: i + 1, error: error.message });
            }
        }

        return results;
    }

    async importDepartments(data, userId, connection, job) {
        const results = { total: data.length, successful: 0, failed: 0, errors: [] };

        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];

                const [existing] = await connection.execute(
                    'SELECT id FROM departments WHERE department_name = ? OR department_code = ?',
                    [row.department_name, row.department_code]
                );

                if (existing.length > 0) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: 'Department name or code already exists' });
                    continue;
                }

                let parentId = null;
                if (row.parent_department_name) {
                    const [parent] = await connection.execute(
                        'SELECT id FROM departments WHERE department_name = ?',
                        [row.parent_department_name]
                    );
                    if (parent.length > 0) {
                        parentId = parent[0].id;
                    }
                }

                await connection.execute(
                    `INSERT INTO departments (department_name, department_code, parent_department_id, description, status, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                    [row.department_name, row.department_code, parentId, row.description, row.status || 'active', userId]
                );

                results.successful++;
                
                if (i % 10 === 0) {
                    await job.progress(Math.floor((i / data.length) * 90) + 10);
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ row: i + 1, error: error.message });
            }
        }

        return results;
    }

    async importLocations(data, userId, connection, job) {
        const results = { total: data.length, successful: 0, failed: 0, errors: [] };

        for (let i = 0; i < data.length; i++) {
            try {
                const row = data[i];

                const [existing] = await connection.execute(
                    'SELECT id FROM locations_master WHERE location_name = ? OR location_code = ?',
                    [row.location_name, row.location_code]
                );

                if (existing.length > 0) {
                    results.failed++;
                    results.errors.push({ row: i + 1, error: 'Location name or code already exists' });
                    continue;
                }

                await connection.execute(
                    `INSERT INTO locations_master (location_name, location_code, address, city, state, country, pincode, phone, email, description, status, created_by, created_at)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        row.location_name, row.location_code, row.address, row.city,
                        row.state, row.country || 'India', row.pincode, row.phone,
                        row.email, row.description, row.status || 'active', userId
                    ]
                );

                results.successful++;
                
                if (i % 10 === 0) {
                    await job.progress(Math.floor((i / data.length) * 90) + 10);
                }
            } catch (error) {
                results.failed++;
                results.errors.push({ row: i + 1, error: error.message });
            }
        }

        return results;
    }

    async exportToCSV(type, filters) {
        let query;
        let params = [];

        switch (type) {
            case 'users':
                query = `
                    SELECT u.username, u.email, u.mobile, u.status, r.name as role,
                           u.created_at, u.updated_at
                    FROM users u
                    LEFT JOIN roles r ON u.role_id = r.id
                    WHERE u.status != 'deleted'
                    ORDER BY u.created_at DESC
                `;
                break;
            case 'departments':
                query = `
                    SELECT d.department_name, d.department_code, d.status, d.description,
                           d.created_at, d.updated_at
                    FROM departments d
                    ORDER BY d.department_name ASC
                `;
                break;
            case 'locations':
                query = `
                    SELECT l.location_name, l.location_code, l.city, l.state, l.country,
                           l.status, l.created_at, l.updated_at
                    FROM locations_master l
                    ORDER BY l.location_name ASC
                `;
                break;
            default:
                throw new Error(`Unsupported export type: ${type}`);
        }

        const [rows] = await pool.execute(query, params);
        return this.convertToCSV(rows);
    }

    convertToCSV(data) {
        if (!data || data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvRows = [];

        csvRows.push(headers.join(','));

        for (const row of data) {
            const values = headers.map(header => {
                const value = row[header];
                if (value === null || value === undefined) return '';
                const stringValue = String(value);
                if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            });
            csvRows.push(values.join(','));
        }

        return csvRows.join('\n');
    }

    async getJobStatus(jobId) {
        const queue = queueService.getQueue('export');
        if (!queue) return null;

        const job = await queue.getJob(jobId);
        if (!job) return null;

        return {
            id: job.id,
            status: await job.getState(),
            progress: job.progress(),
            data: job.data,
            result: job.returnvalue,
            failedReason: job.failedReason,
            attemptsMade: job.attemptsMade,
            createdAt: job.timestamp,
            processedOn: job.processedOn,
            finishedOn: job.finishedOn
        };
    }
}

const bulkOperationService = new BulkOperationService();

queueService.process('export', async (job) => {
    if (job.data.type === 'import') {
        return await bulkOperationService.processImport(job);
    } else if (job.data.type === 'export') {
        return await bulkOperationService.exportToCSV(job.data.entityType, job.data.filters);
    }
}, 2);

module.exports = bulkOperationService;
