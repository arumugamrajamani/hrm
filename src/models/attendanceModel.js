const { pool } = require('../config/database');

const formatDateOnly = (value) => {
    if (!value) return value;
    if (typeof value === 'string') return value.slice(0, 10);
    if (!(value instanceof Date) || Number.isNaN(value.getTime())) return value;

    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const normalizeDateOnlyFields = (row, fields) => {
    if (!row) return row;
    for (const field of fields) {
        if (row[field] !== undefined && row[field] !== null) {
            row[field] = formatDateOnly(row[field]);
        }
    }
    return row;
};

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

    static async generateShiftCode() {
        const [rows] = await pool.query("SELECT shift_code FROM shifts WHERE shift_code IS NOT NULL AND shift_code <> ''");
        const usedCodes = new Set(rows.map((row) => row.shift_code));

        let sequence = 1;
        let code;
        do {
            code = `SHF${String(sequence).padStart(3, '0')}`;
            sequence += 1;
        } while (usedCodes.has(code));

        return code;
    }

    static async findShiftByName(shiftName, excludeId = null) {
        let query = 'SELECT id FROM shifts WHERE shift_name = ?';
        const params = [shiftName];
        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findShiftByCode(shiftCode, excludeId = null) {
        let query = 'SELECT id FROM shifts WHERE shift_code = ?';
        const params = [shiftCode];
        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async createShift(shiftData) {
        const {
            shift_name, shift_code, start_time, end_time, break_duration,
            weekoff_days, is_flexible, grace_period_minutes, status, created_by
        } = shiftData;

        const code = shift_code || await this.generateShiftCode();

        const query = `
            INSERT INTO shifts 
            (shift_name, shift_code, start_time, end_time, break_duration, weekoff_days, is_flexible, grace_period_minutes, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            shift_name, code, start_time, end_time, break_duration,
            weekoff_days, is_flexible, grace_period_minutes, status || 'active', created_by
        ]);
        
        return result.insertId;
    }

    static async updateShift(id, shiftData) {
        const allowedFields = ['shift_code', 'shift_name', 'start_time', 'end_time', 'break_duration', 'weekoff_days', 'is_flexible', 'grace_period_minutes', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (shiftData[field] !== undefined) {
                // shift_code is NOT NULL. Treat null/empty as "keep the existing code".
                if (field === 'shift_code' && !shiftData[field]) continue;
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
            holidays: rows.map((row) => normalizeDateOnlyFields(row, ['holiday_date'])),
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
        return rows[0] ? normalizeDateOnlyFields(rows[0], ['holiday_date']) : null;
    }

    static async createHoliday(holidayData) {
        const { holiday_name, holiday_date, description, is_national, location_id, status, created_by } = holidayData;
        
        const query = `
            INSERT INTO holiday_calendar 
            (holiday_name, holiday_date, description, is_national, location_id, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            holiday_name, holiday_date, description, is_national, location_id, status || 'active', created_by
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
            whereClause += ' AND DATE(ar.attendance_date) >= DATE(?)';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(ar.attendance_date) <= DATE(?)';
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
            attendance: rows.map((row) => normalizeDateOnlyFields(row, ['attendance_date'])),
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
        return rows[0] ? normalizeDateOnlyFields(rows[0], ['attendance_date']) : null;
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
        const query = `SELECT * FROM attendance_records WHERE employee_id = ? AND attendance_date = DATE(?)`;
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

    static async findLeaveTypeByName(leaveName, excludeId = null) {
        let query = 'SELECT id FROM leave_types WHERE leave_name = ?';
        const params = [leaveName];
        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findLeaveTypeByCode(leaveCode, excludeId = null) {
        let query = 'SELECT id FROM leave_types WHERE leave_code = ?';
        const params = [leaveCode];
        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }
        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async createLeaveType(leaveTypeData) {
        const { leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, status, created_by } = leaveTypeData;
        
        const query = `
            INSERT INTO leave_types 
            (leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            leave_code, leave_name, description, max_days_per_year, carry_forward, encashable, requires_approval, min_days_notice, status || 'active', created_by
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

    static async findLeaveBalance(employee_id, leave_type_id, start_date) {
        const query = `
            SELECT * FROM leave_balances
            WHERE employee_id = ? AND leave_type_id = ? AND year = YEAR(?)
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [employee_id, leave_type_id, start_date]);
        return rows[0] || null;
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
            whereClause += ' AND DATE(lr.start_date) >= DATE(?)';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(lr.end_date) <= DATE(?)';
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
            leave_requests: rows.map((row) => normalizeDateOnlyFields(row, ['start_date', 'end_date'])),
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
        return rows[0] ? normalizeDateOnlyFields(rows[0], ['start_date', 'end_date']) : null;
    }

    static async findOverlappingLeaveRequest(employee_id, start_date, end_date, statuses = ['pending', 'approved'], excludeId = null) {
        const placeholders = statuses.map(() => '?').join(', ');
        let query = `
            SELECT id FROM leave_requests
            WHERE employee_id = ?
              AND status IN (${placeholders})
              AND DATE(start_date) <= DATE(?)
              AND DATE(end_date) >= DATE(?)
        `;
        const params = [employee_id, ...statuses, end_date, start_date];

        if (excludeId) {
            query += ' AND id <> ?';
            params.push(excludeId);
        }

        query += ' LIMIT 1';
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async createLeaveRequest(requestData) {
        const { employee_id, leave_type_id, start_date, end_date, total_days, reason } = requestData;
        
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [result] = await conn.query(`
                INSERT INTO leave_requests 
                (employee_id, leave_type_id, start_date, end_date, total_days, reason, applied_at)
                VALUES (?, ?, ?, ?, ?, ?, NOW())
            `, [employee_id, leave_type_id, start_date, end_date, total_days, reason]);
            
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
        const conn = await pool.getConnection();

        try {
            await conn.beginTransaction();

            const [requestRows] = await conn.query(
                'SELECT * FROM leave_requests WHERE id = ? FOR UPDATE',
                [id]
            );
            const request = requestRows[0];

            if (!request) {
                const error = new Error('Leave request not found');
                error.statusCode = 404;
                throw error;
            }

            if (request.status !== 'pending') {
                const error = new Error('Leave request has already been processed');
                error.statusCode = 400;
                throw error;
            }

            if (status === 'approved') {
                const [overlapRows] = await conn.query(`
                    SELECT id FROM leave_requests
                    WHERE employee_id = ? AND id <> ? AND status = 'approved'
                      AND DATE(start_date) <= DATE(?) AND DATE(end_date) >= DATE(?)
                    LIMIT 1
                    FOR UPDATE
                `, [request.employee_id, id, request.end_date, request.start_date]);

                if (overlapRows.length > 0) {
                    const error = new Error('Leave request overlaps an approved leave request');
                    error.statusCode = 400;
                    throw error;
                }

                const [leaveTypeRows] = await conn.query(
                    'SELECT max_days_per_year FROM leave_types WHERE id = ?',
                    [request.leave_type_id]
                );
                if (leaveTypeRows.length === 0) {
                    const error = new Error('Leave type not found');
                    error.statusCode = 404;
                    throw error;
                }

                const maxDays = Number(leaveTypeRows[0].max_days_per_year || 0);
                const [balanceRows] = await conn.query(`
                    SELECT * FROM leave_balances
                    WHERE employee_id = ? AND leave_type_id = ? AND year = YEAR(?)
                    FOR UPDATE
                `, [request.employee_id, request.leave_type_id, request.start_date]);

                if (balanceRows.length === 0) {
                    if (maxDays > 0) {
                        const error = new Error('Leave balance not initialized for this leave type and year');
                        error.statusCode = 400;
                        throw error;
                    }

                    // Unlimited leave types (max_days_per_year = 0) still keep a usage ledger.
                    await conn.query(`
                        INSERT INTO leave_balances
                        (employee_id, leave_type_id, year, opening_balance, accrued, used)
                        VALUES (?, ?, YEAR(?), 0, 0, ?)
                        ON DUPLICATE KEY UPDATE used = used + VALUES(used)
                    `, [request.employee_id, request.leave_type_id, request.start_date, request.total_days]);
                } else {
                    const balance = balanceRows[0];
                    if (maxDays > 0) {
                        const available = Number(balance.opening_balance || 0)
                            + Number(balance.accrued || 0)
                            - Number(balance.used || 0);

                        if (Number(request.total_days) > available) {
                            const error = new Error('Insufficient leave balance');
                            error.statusCode = 400;
                            throw error;
                        }
                    }

                    await conn.query(
                        'UPDATE leave_balances SET used = used + ? WHERE id = ?',
                        [request.total_days, balance.id]
                    );
                }
            }

            const approvedAt = status === 'approved' ? new Date() : null;
            const approvedBy = status === 'approved' ? approved_by : null;
            const rejectionReason = status === 'rejected' ? rejection_reason : null;

            const [result] = await conn.query(`
                UPDATE leave_requests
                SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?, updated_at = NOW()
                WHERE id = ?
            `, [status, approvedBy, approvedAt, rejectionReason, id]);

            await conn.commit();
            return result.affectedRows > 0;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
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
            whereClause += ' AND DATE(t.timesheet_date) >= DATE(?)';
            params.push(start_date);
        }

        if (end_date) {
            whereClause += ' AND DATE(t.timesheet_date) <= DATE(?)';
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
            timesheets: rows.map((row) => normalizeDateOnlyFields(row, ['timesheet_date'])),
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async createTimesheet(timesheetData) {
        const { employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable } = timesheetData;
        
        const query = `
            INSERT INTO timesheets 
            (employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            employee_id, timesheet_date, project_code, task_description, hours_worked, is_billable
        ]);
        
        return result.insertId;
    }

    static async findTimesheetById(id) {
        const query = 'SELECT * FROM timesheets WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0] ? normalizeDateOnlyFields(rows[0], ['timesheet_date']) : null;
    }

    static async updateTimesheetStatus(id, { status, approved_by, rejection_reason }) {
        const approvedAt = status === 'approved' ? new Date() : null;
        const approvedBy = status === 'approved' ? approved_by : null;
        const rejectionReason = status === 'rejected' ? rejection_reason : null;

        const query = `
            UPDATE timesheets 
            SET status = ?, approved_by = ?, approved_at = ?, rejection_reason = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await pool.query(query, [status, approvedBy, approvedAt, rejectionReason, id]);
        return result.affectedRows > 0;
    }
}

module.exports = AttendanceModel;
