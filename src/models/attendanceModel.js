const { pool } = require('../config/database');

class AttendanceModel {
    // ==================== SHIFTS ===================
    static async findAllShifts({ page = 1, limit = 10, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM shifts ${whereClause}`;
        const dataQuery = `
            SELECT *, 
                (SELECT COUNT(*) FROM attendance_records ar 
                 JOIN employees e ON ar.employee_id = e.id 
                 WHERE ar.shift_id = shifts.id AND e.deleted_at IS NULL) as usage_count
            FROM shifts 
            ${whereClause}
            ORDER BY shift_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            shifts: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findShiftById(id) {
        const query = `SELECT * FROM shifts WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createShift(shiftData) {
        const { shift_name, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by } = shiftData;
        
        const query = `
            INSERT INTO shifts 
            (shift_name, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            shift_name, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, created_by
        ]);
        
        return result.insertId;
    }

    static async updateShift(id, shiftData) {
        const allowedFields = ['shift_name', 'start_time', 'end_time', 'break_duration', 'weekoff_days', 'is_flexible', 'grace_period_minutes', 'status', 'updated_by'];
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

    // ==================== HOLIDAY CALENDAR ===================
    static async findAllHolidays({ page = 1, limit = 10, year = null, location_id = null }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (year) {
            whereClause += ' AND YEAR(holiday_date) = ?';
            params.push(year);
        }

        if (location_id) {
            whereClause += ' AND (location_id = ? OR location_id IS NULL)';
            params.push(location_id);
        }

        const countQuery = `SELECT COUNT(*) as total FROM holiday_calendar ${whereClause}`;
        const dataQuery = `
            SELECT hc.*, lm.location_name
            FROM holiday_calendar hc
            LEFT JOIN locations_master lm ON hc.location_id = lm.id
            ${whereClause}
            ORDER BY hc.holiday_date
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            holidays: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findHolidayById(id) {
        const query = `
            SELECT hc.*, lm.location_name
            FROM holiday_calendar hc
            LEFT JOIN locations_master lm ON hc.location_id = lm.id
            WHERE hc.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createHoliday(holidayData) {
        const { holiday_name, holiday_date, description, is_national, location_id, created_by } = holidayData;
        
        const query = `
            INSERT INTO holiday_calendar 
            (holiday_name, holiday_date, description, is_national, location_id, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            holiday_name, holiday_date, description, is_national, location_id, created_by
        ]);
        
        return result.insertId;
    }

    static async updateHoliday(id, holidayData) {
        const allowedFields = ['holiday_name', 'holiday_date', 'description', 'is_national', 'location_id', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (holidayData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(holidayData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE holiday_calendar SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    // ==================== ATTENDANCE RECORDS ===================
    static async findAllAttendance({ page = 1, limit = 10, employee_id = null, start_date = null, end_date = null, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE ar.attendance_date IS NOT NULL';
        const params = [];

        if (employee_id) {
            whereClause += ' AND ar.employee_id = ?';
            params.push(employee_id);
        }

        if (start_date) {
            whereClause += ' AND ar.attendance_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND ar.attendance_date <= ?';
            params.push(end_date);
        }

        if (status) {
            whereClause += ' AND ar.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM attendance_records ar
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                ar.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                s.shift_name,
                u.username as regularized_by_username
            FROM attendance_records ar
            LEFT JOIN employees e ON ar.employee_id = e.id
            LEFT JOIN shifts s ON ar.shift_id = s.id
            LEFT JOIN users u ON ar.regularized_by = u.id
            ${whereClause}
            ORDER BY ar.attendance_date DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            attendance: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findAttendanceById(id) {
        const query = `
            SELECT 
                ar.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                s.shift_name,
                u.username as regularized_by_username
            FROM attendance_records ar
            LEFT JOIN employees e ON ar.employee_id = e.id
            LEFT JOIN shifts s ON ar.shift_id = s.id
            LEFT JOIN users u ON ar.regularized_by = u.id
            WHERE ar.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async markAttendance(attendanceData) {
        const { employee_id, attendance_date, shift_id, check_in, check_out, status, is_late, late_minutes, is_early_departure, early_departure_minutes } = attendanceData;
        
        const query = `
            INSERT INTO attendance_records 
            (employee_id, attendance_date, shift_id, check_in, check_out, status, is_late, late_minutes, is_early_departure, early_departure_minutes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
                check_in = VALUES(check_in),
                check_out = VALUES(check_out),
                status = VALUES(status),
                is_late = VALUES(is_late),
                late_minutes = VALUES(late_minutes),
                is_early_departure = VALUES(is_early_departure),
                early_departure_minutes = VALUES(early_departure_minutes),
                updated_at = NOW()
        `;
        
        const [result] = await pool.query(query, [
            employee_id, attendance_date, shift_id, check_in, check_out, status, is_late, late_minutes, is_early_departure, early_departure_minutes
        ]);
        
        return result.insertId || result.affectedRows > 0;
    }

    static async regularizeAttendance(id, { regularization_reason, regularized_by }) {
        const query = `
            UPDATE attendance_records 
            SET regularization_reason = ?, regularized_by = ?, regularized_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [regularization_reason, regularized_by, id]);
        return result.affectedRows > 0;
    }

    static async findAttendanceByEmployeeAndDate(employee_id, attendance_date) {
        const query = `SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = ?`;
        const [rows] = await pool.query(query, [employee_id, attendance_date]);
        return rows[0] || null;
    }

    static async findEmployeeById(id) {
        const query = `SELECT id, employee_code, first_name, last_name FROM employees WHERE id = ? AND deleted_at IS NULL`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    // ==================== LEAVE TYPES ===================
    static async findAllLeaveTypes({ page = 1, limit = 10, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM leave_types ${whereClause}`;
        const dataQuery = `
            SELECT * FROM leave_types 
            ${whereClause}
            ORDER BY leave_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            leave_types: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findLeaveTypeById(id) {
        const query = `SELECT * FROM leave_types WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createLeaveType(leaveTypeData) {
        const { leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, created_by } = leaveTypeData;
        
        const query = `
            INSERT INTO leave_types 
            (leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, created_by
        ]);
        
        return result.insertId;
    }

    // ==================== LEAVE BALANCES ===================
    static async getLeaveBalances(employee_id, year = null) {
        let whereClause = 'WHERE lb.employee_id = ?';
        const params = [employee_id];

        if (year) {
            whereClause += ' AND lb.year = ?';
            params.push(year);
        }

        const query = `
            SELECT 
                lb.*,
                lt.leave_name,
                lt.leave_code
            FROM leave_balances lb
            LEFT JOIN leave_types lt ON lb.leave_type_id = lt.id
            ${whereClause}
            ORDER BY lb.year DESC, lt.leave_name
        `;
        
        const [rows] = await pool.query(query, params);
        return rows;
    }

    static async initializeLeaveBalances(employee_id, year) {
        const [leaveTypes] = await pool.query("SELECT id, max_days_per_year FROM leave_types WHERE status = 'active'");
        
        for (const lt of leaveTypes) {
            await pool.query(`
                INSERT IGNORE INTO leave_balances 
                (employee_id, leave_type_id, year, opening_balance, accrued)
                VALUES (?, ?, ?, ?, 0)
            `, [employee_id, lt.id, year, lt.max_days_per_year]);
        }
        
        return true;
    }

    // ==================== LEAVE REQUESTS ===================
    static async findAllLeaveRequests({ page = 1, limit = 10, employee_id = null, status = '', start_date = null, end_date = null }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (employee_id) {
            whereClause += ' AND lr.employee_id = ?';
            params.push(employee_id);
        }

        if (status) {
            whereClause += ' AND lr.status = ?';
            params.push(status);
        }

        if (start_date) {
            whereClause += ' AND lr.start_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND lr.end_date <= ?';
            params.push(end_date);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM leave_requests lr
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                lr.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                lt.leave_name,
                lt.leave_code,
                u.username as approved_by_username
            FROM leave_requests lr
            LEFT JOIN employees e ON lr.employee_id = e.id
            LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
            LEFT JOIN users u ON lr.approved_by = u.id
            ${whereClause}
            ORDER BY lr.applied_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            leave_requests: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findLeaveRequestById(id) {
        const query = `
            SELECT 
                lr.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                lt.leave_name,
                lt.leave_code,
                u.username as approved_by_username
            FROM leave_requests lr
            LEFT JOIN employees e ON lr.employee_id = e.id
            LEFT JOIN leave_types lt ON lr.leave_type_id = lt.id
            LEFT JOIN users u ON lr.approved_by = u.id
            WHERE lr.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createLeaveRequest(requestData) {
        const { employee_id, leave_type_id, start_date, end_date, total_days, reason, applied_by } = requestData;
        
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(`
                INSERT INTO leave_requests 
                (employee_id, leave_type_id, start_date, end_date, total_days, reason, applied_by, applied_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [employee_id, leave_type_id, start_date, end_date, total_days, reason, applied_by]);
            
            await conn.commit();
            return result.insertId;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async updateLeaveRequestStatus(id, { status, approved_by, rejection_reason }) {
        const query = `
            UPDATE leave_requests 
            SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [status, approved_by, rejection_reason, id]);
        
        if (result.affectedRows > 0 && status === 'approved') {
            const [request] = await pool.query('SELECT * FROM leave_requests WHERE id = ?', [id]);
            if (request.length > 0) {
                await pool.query(`
                    UPDATE leave_balances 
                    SET used = used + ? 
                    WHERE employee_id = ? AND leave_type_id = ? AND year = YEAR(?)
                `, [request[0].total_days, request[0].employee_id, request[0].leave_type_id, request[0].start_date]);
            }
        }
        
        return result.affectedRows > 0;
    }

    // ==================== TIMESHEETS ===================
    static async findAllTimesheets({ page = 1, limit = 10, employee_id = null, start_date = null, end_date = null, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (employee_id) {
            whereClause += ' AND t.employee_id = ?';
            params.push(employee_id);
        }

        if (start_date) {
            whereClause += ' AND t.timesheet_date >= ?';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND t.timesheet_date <= ?';
            params.push(end_date);
        }

        if (status) {
            whereClause += ' AND t.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM timesheets t
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                t.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                u.username as approved_by_username
            FROM timesheets t
            LEFT JOIN employees e ON t.employee_id = e.id
            LEFT JOIN users u ON t.approved_by = u.id
            ${whereClause}
            ORDER BY t.timesheet_date DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            timesheets: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async createTimesheet(timesheetData) {
        const { employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable, created_by } = timesheetData;
        
        const query = `
            INSERT INTO timesheets 
            (employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable, created_by
        ]);
        
        return result.insertId;
    }

    static async updateTimesheetStatus(id, { status, approved_by, rejection_reason }) {
        const query = `
            UPDATE timesheets 
            SET status = ?, approved_by = ?, approved_at = NOW(), rejection_reason = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [status, approved_by, rejection_reason, id]);
        return result.affectedRows > 0;
    }
}

module.exports = AttendanceModel;
