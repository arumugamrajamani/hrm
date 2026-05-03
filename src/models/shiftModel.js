const { pool } = require('../config/database');

class ShiftModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (shift_name LIKE ? OR shift_code LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM shifts ${whereClause}`;

        const dataQuery = `
            SELECT s.*, 
                (SELECT COUNT(*) FROM attendance_records ar 
                 JOIN employees e ON ar.employee_id = e.id 
                 WHERE ar.shift_id = s.id AND e.deleted_at IS NULL) as usage_count
            FROM shifts s
            ${whereClause}
            ORDER BY s.shift_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            shifts: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `SELECT * FROM shifts WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByCode(shiftCode, excludeId = null) {
        let query = `SELECT * FROM shifts WHERE shift_code = ?`;
        const params = [shiftCode];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByName(shiftName, excludeId = null) {
        let query = `SELECT * FROM shifts WHERE shift_name = ?`;
        const params = [shiftName];

        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }

        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async create(shiftData) {
        const { shift_name, shift_code, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by } = shiftData;

        const query = `
            INSERT INTO shifts 
            (shift_name, shift_code, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            shift_name, shift_code, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by
        ]);

        return result.insertId;
    }

    static async update(id, shiftData) {
        const allowedFields = ['shift_name', 'shift_code', 'start_time', 'end_time', 'break_duration', 'weekoff_days', 'is_flexible', 'grace_period_minutes', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (shiftData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(shiftData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);

        const query = `UPDATE shifts SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE shifts SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE shifts SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE shifts SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async shiftCodeExists(shiftCode, excludeId = null) {
        const result = await this.findByCode(shiftCode, excludeId);
        return result !== null;
    }

    static async shiftNameExists(shiftName, excludeId = null) {
        const result = await this.findByName(shiftName, excludeId);
        return result !== null;
    }
}

module.exports = ShiftModel;
