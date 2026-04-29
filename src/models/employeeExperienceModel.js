const { pool } = require('../config/database');

class EmployeeExperienceModel {
    static async findById(id) {
        const query = `
            SELECT 
                ee.*,
                e.employee_code, e.first_name, e.last_name,
                u1.username as verified_by_username,
                u2.username as created_by_username
            FROM employee_experience ee
            JOIN employees e ON ee.employee_id = e.id
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            WHERE ee.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                ee.*,
                u1.username as verified_by_username,
                u2.username as created_by_username
            FROM employee_experience ee
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            WHERE ee.employee_id = ?
            ORDER BY ee.is_current DESC, ee.start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async create(experienceData) {
        const query = `
            INSERT INTO employee_experience (
                employee_id, company_name, designation, department,
                start_date, end_date, is_current,
                reason_for_leaving, is_verified, verified_by, verified_at,
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            experienceData.employee_id,
            experienceData.company_name,
            experienceData.designation,
            experienceData.department || null,
            experienceData.start_date,
            experienceData.end_date || null,
            experienceData.is_current || false,
            experienceData.reason_for_leaving || null,
            experienceData.is_verified || false,
            experienceData.verified_by || null,
            experienceData.verified_at || null,
            experienceData.created_by || null
        ]);

        return result.insertId;
    }

    static async update(id, experienceData) {
        const allowedFields = [
            'company_name', 'designation', 'department',
            'start_date', 'end_date', 'is_current', 'reason_for_leaving', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (experienceData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(experienceData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employee_experience SET ${updates.join(', ')} WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async markAsCurrent(id) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [current] = await conn.query(
                'SELECT employee_id FROM employee_experience WHERE id = ?',
                [id]
            );

            if (current.length > 0) {
                await conn.query(
                    'UPDATE employee_experience SET is_current = FALSE WHERE employee_id = ? AND is_current = TRUE',
                    [current[0].employee_id]
                );
            }

            const [result] = await conn.query(
                'UPDATE employee_experience SET is_current = TRUE WHERE id = ?',
                [id]
            );

            await conn.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async verify(id, verifiedBy) {
        const query = `
            UPDATE employee_experience
            SET is_verified = TRUE, verified_by = ?, verified_at = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [verifiedBy, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_experience WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_experience WHERE employee_id = ?';
        const [result] = await pool.query(query, [employeeId]);
        return result.affectedRows;
    }

    static async getTotalExperience(employeeId) {
        const query = `
            SELECT 
                SUM(TIMESTAMPDIFF(MONTH, start_date, COALESCE(end_date, CURDATE()))) as total_months,
                SUM(TIMESTAMPDIFF(YEAR, start_date, COALESCE(end_date, CURDATE()))) as total_years
            FROM employee_experience
            WHERE employee_id = ?
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0];
    }

    static async getPreviousCompanies(employeeId) {
        const query = `
            SELECT DISTINCT company_name, designation
            FROM employee_experience
            WHERE employee_id = ? AND is_current = FALSE
            ORDER BY end_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getCurrentEmployer(employeeId) {
        const query = `
            SELECT * FROM employee_experience
            WHERE employee_id = ? AND is_current = TRUE
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async getVerificationStatus(employeeId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN is_verified = FALSE THEN 1 ELSE 0 END) as pending
            FROM employee_experience
            WHERE employee_id = ?
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0];
    }

    static async getAllPendingVerifications() {
        const query = `
            SELECT 
                ee.*,
                e.employee_code, e.first_name, e.last_name,
                u1.username as created_by_username
            FROM employee_experience ee
            JOIN employees e ON ee.employee_id = e.id
            LEFT JOIN users u1 ON ee.created_by = u1.id
            WHERE ee.is_verified = FALSE AND e.deleted_at IS NULL
            ORDER BY ee.created_at DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getExperienceTimeline(employeeId) {
        const query = `
            SELECT 
                company_name,
                designation,
                start_date,
                end_date,
                is_current,
                TIMESTAMPDIFF(MONTH, start_date, COALESCE(end_date, CURDATE())) as months
            FROM employee_experience
            WHERE employee_id = ?
            ORDER BY start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }
}

module.exports = EmployeeExperienceModel;
