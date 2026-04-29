const { pool } = require('../config/database');

class EmployeeBankModel {
    static async findById(id) {
        const query = `
            SELECT 
                eb.*,
                e.employee_code, e.first_name, e.last_name,
                u1.username as verified_by_username
            FROM employee_bank_details eb
            JOIN employees e ON eb.employee_id = e.id
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            WHERE eb.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                eb.*,
                u1.username as verified_by_username,
                u2.username as created_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            LEFT JOIN users u2 ON eb.created_by = u2.id
            WHERE eb.employee_id = ?
            ORDER BY eb.is_current DESC, eb.effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async findCurrentByEmployeeId(employeeId) {
        const query = `
            SELECT 
                eb.*,
                u1.username as verified_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            WHERE eb.employee_id = ? AND eb.is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async findPrimaryByEmployeeId(employeeId) {
        const query = `
            SELECT 
                eb.*,
                u1.username as verified_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            WHERE eb.employee_id = ? AND eb.is_primary = TRUE AND eb.is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async create(bankData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            if (bankData.is_primary === true) {
                const resetPrimaryQuery = `
                    UPDATE employee_bank_details
                    SET is_primary = FALSE, is_current = FALSE, effective_end_date = COALESCE(?, NOW())
                    WHERE employee_id = ? AND is_primary = TRUE
                `;
                await conn.query(resetPrimaryQuery, [bankData.effective_start_date || new Date(), bankData.employee_id]);
            }

            const existingQuery = `
                SELECT id FROM employee_bank_details 
                WHERE employee_id = ? AND is_current = TRUE
                FOR UPDATE
            `;
            const [existing] = await conn.query(existingQuery, [bankData.employee_id]);

            if (existing.length > 0) {
                const closeQuery = `
                    UPDATE employee_bank_details
                    SET is_current = FALSE,
                        effective_end_date = COALESCE(?, NOW())
                    WHERE id = ?
                `;
                await conn.query(closeQuery, [bankData.effective_start_date || new Date(), existing[0].id]);
            }

            const insertQuery = `
                INSERT INTO employee_bank_details (
                    employee_id, account_holder_name, account_number, ifsc_code,
                    bank_name, branch, account_type, is_primary, is_verified,
                    is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                bankData.employee_id,
                bankData.account_holder_name || null,
                bankData.account_number || null,
                bankData.ifsc_code || null,
                bankData.bank_name || null,
                bankData.branch || null,
                bankData.account_type || 'savings',
                bankData.is_primary || false,
                bankData.is_verified || false,
                true,
                bankData.effective_start_date || new Date(),
                bankData.created_by || null
            ]);

            await conn.commit();
            return result.insertId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async update(id, bankData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [current] = await conn.query(
                'SELECT employee_id FROM employee_bank_details WHERE id = ?',
                [id]
            );

            if (current.length === 0) {
                await conn.rollback();
                return false;
            }

            if (bankData.is_primary === true) {
                const resetPrimaryQuery = `
                    UPDATE employee_bank_details
                    SET is_primary = FALSE, is_current = FALSE, effective_end_date = COALESCE(?, NOW())
                    WHERE employee_id = ? AND is_primary = TRUE
                `;
                await conn.query(resetPrimaryQuery, [bankData.effective_start_date || new Date(), current[0].employee_id]);
            }

            const closeQuery = `
                UPDATE employee_bank_details
                SET is_current = FALSE,
                    effective_end_date = COALESCE(?, NOW())
                WHERE employee_id = ? AND is_current = TRUE
            `;
            await conn.query(closeQuery, [bankData.effective_start_date || new Date(), current[0].employee_id]);

            const insertQuery = `
                INSERT INTO employee_bank_details (
                    employee_id, account_holder_name, account_number, ifsc_code,
                    bank_name, branch, account_type, is_primary, is_verified,
                    is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                current[0].employee_id,
                bankData.account_holder_name || null,
                bankData.account_number || null,
                bankData.ifsc_code || null,
                bankData.bank_name || null,
                bankData.branch || null,
                bankData.account_type || 'savings',
                bankData.is_primary || false,
                bankData.is_verified || false,
                true,
                bankData.effective_start_date || new Date(),
                bankData.created_by || null
            ]);

            await conn.commit();
            return result.insertId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async verify(id, verifiedBy) {
        const query = `
            UPDATE employee_bank_details
            SET is_verified = TRUE, verified_by = ?, verified_at = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [verifiedBy, id]);
        return result.affectedRows > 0;
    }

    static async setAsPrimary(id, employeeId) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const resetQuery = `
                UPDATE employee_bank_details
                SET is_primary = FALSE
                WHERE employee_id = ? AND is_primary = TRUE
            `;
            await conn.query(resetQuery, [employeeId]);

            const setQuery = `
                UPDATE employee_bank_details
                SET is_primary = TRUE
                WHERE id = ?
            `;
            const [result] = await conn.query(setQuery, [id]);

            await conn.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getHistory(employeeId) {
        const query = `
            SELECT 
                eb.*,
                u1.username as verified_by_username,
                u2.username as created_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            LEFT JOIN users u2 ON eb.created_by = u2.id
            WHERE eb.employee_id = ?
            ORDER BY eb.effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getAllPrimaryAccounts() {
        const query = `
            SELECT 
                eb.*,
                e.employee_code, e.first_name, e.last_name,
                u1.username as verified_by_username
            FROM employee_bank_details eb
            JOIN employees e ON eb.employee_id = e.id
            LEFT JOIN users u1 ON eb.verified_by = u1.id
            WHERE eb.is_primary = TRUE AND eb.is_current = TRUE AND e.deleted_at IS NULL
            ORDER BY e.employee_code
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getPendingVerifications() {
        const query = `
            SELECT 
                eb.*,
                e.employee_code, e.first_name, e.last_name,
                u1.username as created_by_username
            FROM employee_bank_details eb
            JOIN employees e ON eb.employee_id = e.id
            LEFT JOIN users u1 ON eb.created_by = u1.id
            WHERE eb.is_verified = FALSE AND eb.is_current = TRUE AND e.deleted_at IS NULL
            ORDER BY eb.created_at DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = EmployeeBankModel;
