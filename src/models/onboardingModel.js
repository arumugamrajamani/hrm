const { pool } = require('../config/database');

class OnboardingModel {
    static async findAll({ page = 1, limit = 10, status = '', employee_id = null }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND eo.status = ?';
            params.push(status);
        }

        if (employee_id) {
            whereClause += ' AND eo.employee_id = ?';
            params.push(employee_id);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM employee_onboarding eo
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                eo.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                oct.template_name,
                u.username as created_by_username
            FROM employee_onboarding eo
            LEFT JOIN employees e ON eo.employee_id = e.id
            LEFT JOIN onboarding_checklist_templates oct ON eo.template_id = oct.id
            LEFT JOIN users u ON eo.created_by = u.id
            ${whereClause}
            ORDER BY eo.joining_date DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            onboarding: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                eo.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                oct.template_name,
                oct.description as template_description,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM employee_onboarding eo
            LEFT JOIN employees e ON eo.employee_id = e.id
            LEFT JOIN onboarding_checklist_templates oct ON eo.template_id = oct.id
            LEFT JOIN users u1 ON eo.created_by = u1.id
            LEFT JOIN users u2 ON eo.updated_by = u2.id
            WHERE eo.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_onboarding 
            WHERE employee_id = ? 
            ORDER BY created_at DESC
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async create(onboardingData) {
        const {
            employee_id,
            template_id,
            joining_date,
            created_by
        } = onboardingData;

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            // Get checklist items for the template
            const [items] = await conn.query(
                'SELECT id FROM checklist_items WHERE template_id = ? ORDER BY sort_order',
                [template_id]
            );

            // Create onboarding record
            const [result] = await conn.query(`
                INSERT INTO employee_onboarding 
                (employee_id, template_id, joining_date, status, created_by, created_at)
                VALUES (?, ?, ?, 'pending', ?, NOW())
            `, [employee_id, template_id, joining_date, created_by]);

            const onboardingId = result.insertId;

            // Create checklist progress entries
            for (const item of items) {
                await conn.query(`
                    INSERT INTO employee_checklist_progress 
                    (onboarding_id, checklist_item_id, status, created_at)
                    VALUES (?, ?, 'pending', NOW())
                `, [onboardingId, item.id]);
            }

            await conn.commit();
            return onboardingId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async update(id, data) {
        const allowedFields = [
            'template_id', 'status', 'joining_date', 'actual_joining_date',
            'probation_end_date', 'confirmation_date', 'onboarding_completion_date', 'remarks'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(data[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employee_onboarding SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async getChecklistProgress(onboardingId) {
        const query = `
            SELECT 
                ecp.*,
                ci.item_name,
                ci.description as item_description,
                ci.category,
                ci.is_mandatory,
                ci.estimated_days,
                u.username as completed_by_username
            FROM employee_checklist_progress ecp
            LEFT JOIN checklist_items ci ON ecp.checklist_item_id = ci.id
            LEFT JOIN users u ON ecp.completed_by = u.id
            WHERE ecp.onboarding_id = ?
            ORDER BY ci.sort_order
        `;
        const [rows] = await pool.query(query, [onboardingId]);
        return rows;
    }

    static async updateChecklistItem(onboardingId, itemId, { status, remarks, attachment_path, completed_by }) {
        const query = `
            UPDATE employee_checklist_progress 
            SET status = ?, remarks = ?, attachment_path = ?, 
                completed_by = ?, completed_at = NOW(), updated_at = NOW()
            WHERE onboarding_id = ? AND checklist_item_id = ?
        `;
        const [result] = await pool.query(query, [status, remarks, attachment_path, completed_by, onboardingId, itemId]);
        
        if (status === 'completed') {
            await this.checkAndUpdateOnboardingStatus(onboardingId);
        }
        
        return result.affectedRows > 0;
    }

    static async checkAndUpdateOnboardingStatus(onboardingId) {
        const [pendingItems] = await pool.query(`
            SELECT COUNT(*) as count FROM employee_checklist_progress 
            WHERE onboarding_id = ? AND status != 'completed'
        `);

        if (pendingItems[0].count === 0) {
            await pool.query(`
                UPDATE employee_onboarding 
                SET status = 'completed', onboarding_completion_date = CURDATE(), updated_at = NOW()
                WHERE id = ?
            `, [onboardingId]);
        }
    }

    static async getTemplateChecklist(templateId) {
        const query = `
            SELECT * FROM checklist_items 
            WHERE template_id = ? 
            ORDER BY sort_order
        `;
        const [rows] = await pool.query(query, [templateId]);
        return rows;
    }

    static async getProbationTracking(employeeId) {
        const query = `
            SELECT * FROM probation_tracking 
            WHERE employee_id = ? 
            ORDER BY probation_start_date DESC
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async createProbationTracking({ employee_id, probation_start_date, probation_end_date, created_by }) {
        const query = `
            INSERT INTO probation_tracking 
            (employee_id, probation_start_date, probation_end_date, status, created_by, created_at)
            VALUES (?, ?, ?, 'in_progress', ?, NOW())
        `;
        const [result] = await pool.query(query, [employee_id, probation_start_date, probation_end_date, created_by]);
        return result.insertId;
    }

    static async updateProbationStatus(employeeId, { status, performance_rating, manager_feedback, hr_feedback, self_assessment, confirmation_date, confirmed_by }) {
        const updates = [];
        const params = [];

        const fields = {
            status, performance_rating, manager_feedback, hr_feedback, 
            self_assessment, confirmation_date, confirmed_by
        };

        for (const [field, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates.push(`${field} = ?`);
                params.push(value);
            }
        }

        if (updates.length === 0) return false;

        params.push(employeeId);
        const query = `UPDATE probation_tracking SET ${updates.join(', ')}, updated_at = NOW() WHERE employee_id = ? ORDER BY id DESC LIMIT 1`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }
}

module.exports = OnboardingModel;
