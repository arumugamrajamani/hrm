const { pool } = require('../config/database');

class EmployeeAddressModel {
    static async findById(id) {
        const query = `
            SELECT 
                ea.*,
                e.employee_code, e.first_name, e.last_name
            FROM employee_addresses ea
            JOIN employees e ON ea.employee_id = e.id
            WHERE ea.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_addresses
            WHERE employee_id = ?
            ORDER BY is_current DESC, effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async findCurrentByEmployeeId(employeeId) {
        const query = `
            SELECT * FROM employee_addresses
            WHERE employee_id = ? AND is_current = TRUE
            ORDER BY type ASC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async findCurrentByType(employeeId, type) {
        const query = `
            SELECT * FROM employee_addresses
            WHERE employee_id = ? AND type = ? AND is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId, type]);
        return rows[0] || null;
    }

    static async create(addressData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            if (addressData.is_current !== false) {
                const existingQuery = `
                    SELECT id FROM employee_addresses 
                    WHERE employee_id = ? AND type = ? AND is_current = TRUE
                    FOR UPDATE
                `;
                const [existing] = await conn.query(existingQuery, [addressData.employee_id, addressData.type]);

                if (existing.length > 0) {
                    const closeQuery = `
                        UPDATE employee_addresses
                        SET is_current = FALSE,
                            effective_end_date = COALESCE(?, NOW())
                        WHERE id = ?
                    `;
                    await conn.query(closeQuery, [addressData.effective_start_date || new Date(), existing[0].id]);
                }
            }

            const insertQuery = `
                INSERT INTO employee_addresses (
                    employee_id, type, address_line1, address_line2, city, state,
                    country, pincode, is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                addressData.employee_id,
                addressData.type,
                addressData.address_line1 || null,
                addressData.address_line2 || null,
                addressData.city || null,
                addressData.state || null,
                addressData.country || 'India',
                addressData.pincode || null,
                addressData.is_current !== false,
                addressData.effective_start_date || new Date(),
                addressData.created_by || null
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

    static async update(id, addressData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [current] = await conn.query(
                'SELECT employee_id, type FROM employee_addresses WHERE id = ?',
                [id]
            );

            if (current.length === 0) {
                await conn.rollback();
                return false;
            }

            const closeQuery = `
                UPDATE employee_addresses
                SET is_current = FALSE,
                    effective_end_date = COALESCE(?, NOW())
                WHERE employee_id = ? AND type = ? AND is_current = TRUE
            `;
            await conn.query(closeQuery, [
                addressData.effective_start_date || new Date(),
                current[0].employee_id,
                current[0].type
            ]);

            const insertQuery = `
                INSERT INTO employee_addresses (
                    employee_id, type, address_line1, address_line2, city, state,
                    country, pincode, is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                current[0].employee_id,
                current[0].type,
                addressData.address_line1 || null,
                addressData.address_line2 || null,
                addressData.city || null,
                addressData.state || null,
                addressData.country || 'India',
                addressData.pincode || null,
                addressData.effective_start_date || new Date(),
                addressData.created_by || null
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

    static async getHistory(employeeId, type = null) {
        let query;
        let params;

        if (type) {
            query = `
                SELECT * FROM employee_addresses
                WHERE employee_id = ? AND type = ?
                ORDER BY effective_start_date DESC
            `;
            params = [employeeId, type];
        } else {
            query = `
                SELECT * FROM employee_addresses
                WHERE employee_id = ?
                ORDER BY type, effective_start_date DESC
            `;
            params = [employeeId];
        }

        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async getAddressSummary(employeeId) {
        const query = `
            SELECT 
                type,
                MAX(effective_start_date) as latest_date,
                COUNT(*) as total_versions,
                SUM(CASE WHEN is_current = TRUE THEN 1 ELSE 0 END) as current_count
            FROM employee_addresses
            WHERE employee_id = ?
            GROUP BY type
            ORDER BY type
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async deleteSoft(employeeId) {
        const query = `
            UPDATE employee_addresses
            SET is_current = FALSE, effective_end_date = NOW()
            WHERE employee_id = ? AND is_current = TRUE
        `;
        const [result] = await pool.query(query, [employeeId]);
        return result.affectedRows > 0;
    }
}

module.exports = EmployeeAddressModel;
