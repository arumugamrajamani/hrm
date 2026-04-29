const { pool } = require('../config/database');

class EmployeeJobModel {
    static async findById(id) {
        const query = `
            SELECT 
                jd.*,
                e.employee_code, e.first_name, e.last_name,
                d.department_name,
                dm.designation_name,
                lm.location_name,
                r.name as role_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                m.employee_code as manager_employee_code
            FROM employee_job_details jd
            JOIN employees e ON jd.employee_id = e.id
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            LEFT JOIN employees m ON jd.reporting_manager_id = m.id
            WHERE jd.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                jd.*,
                d.department_name,
                dm.designation_name,
                lm.location_name,
                r.name as role_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                m.employee_code as manager_employee_code
            FROM employee_job_details jd
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            LEFT JOIN employees m ON jd.reporting_manager_id = m.id
            WHERE jd.employee_id = ?
            ORDER BY jd.is_current DESC, jd.effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getCurrentByEmployeeId(employeeId) {
        const query = `
            SELECT 
                jd.*,
                d.department_name,
                dm.designation_name,
                dm.grade_level,
                lm.location_name,
                r.name as role_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                m.employee_code as manager_employee_code
            FROM employee_job_details jd
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            LEFT JOIN employees m ON jd.reporting_manager_id = m.id
            WHERE jd.employee_id = ? AND jd.is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async create(jobData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const existingQuery = `
                SELECT id FROM employee_job_details 
                WHERE employee_id = ? AND is_current = TRUE
                FOR UPDATE
            `;
            const [existing] = await conn.query(existingQuery, [jobData.employee_id]);

            if (existing.length > 0) {
                const closeQuery = `
                    UPDATE employee_job_details
                    SET is_current = FALSE,
                        effective_end_date = COALESCE(?, NOW())
                    WHERE id = ?
                `;
                await conn.query(closeQuery, [jobData.effective_start_date || new Date(), existing[0].id]);
            }

            const insertQuery = `
                INSERT INTO employee_job_details (
                    employee_id, department_id, designation_id, location_id,
                    role_id, reporting_manager_id, employment_type, employment_status,
                    date_of_joining, confirmation_date, termination_date,
                    is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                jobData.employee_id,
                jobData.department_id || null,
                jobData.designation_id || null,
                jobData.location_id || null,
                jobData.role_id || null,
                jobData.reporting_manager_id || null,
                jobData.employment_type || 'full_time',
                jobData.employment_status || 'active',
                jobData.date_of_joining || null,
                jobData.confirmation_date || null,
                jobData.termination_date || null,
                jobData.effective_start_date || new Date(),
                jobData.created_by || null
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

    static async promote(employeeId, jobData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const currentQuery = `
                SELECT id FROM employee_job_details 
                WHERE employee_id = ? AND is_current = TRUE
                FOR UPDATE
            `;
            const [current] = await conn.query(currentQuery, [employeeId]);

            if (current.length > 0) {
                const closeQuery = `
                    UPDATE employee_job_details
                    SET is_current = FALSE,
                        effective_end_date = COALESCE(?, NOW())
                    WHERE id = ?
                `;
                await conn.query(closeQuery, [jobData.effective_start_date || new Date(), current[0].id]);
            }

            const insertQuery = `
                INSERT INTO employee_job_details (
                    employee_id, department_id, designation_id, location_id,
                    role_id, reporting_manager_id, employment_type, employment_status,
                    date_of_joining, is_current, effective_start_date, created_by, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, TRUE, ?, ?, NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                employeeId,
                jobData.department_id || null,
                jobData.designation_id || null,
                jobData.location_id || null,
                jobData.role_id || null,
                jobData.reporting_manager_id || null,
                jobData.employment_type || 'full_time',
                jobData.date_of_joining || null,
                jobData.effective_start_date || new Date(),
                jobData.created_by || null
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

    static async transfer(employeeId, jobData) {
        return EmployeeJobModel.promote(employeeId, {
            ...jobData,
            employment_status: 'transferred'
        });
    }

    static async updateStatus(employeeId, status, terminationDate = null) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const currentQuery = `
                SELECT id FROM employee_job_details 
                WHERE employee_id = ? AND is_current = TRUE
                FOR UPDATE
            `;
            const [current] = await conn.query(currentQuery, [employeeId]);

            if (current.length > 0) {
                const updateQuery = `
                    UPDATE employee_job_details
                    SET employment_status = ?,
                        termination_date = ?,
                        is_current = FALSE,
                        effective_end_date = COALESCE(?, NOW())
                    WHERE id = ?
                `;
                await conn.query(updateQuery, [
                    status,
                    terminationDate || null,
                    terminationDate || new Date(),
                    current[0].id
                ]);
            }

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getJobHistory(employeeId) {
        const query = `
            SELECT 
                jd.*,
                d.department_name,
                dm.designation_name,
                dm.grade_level,
                lm.location_name,
                r.name as role_name,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM employee_job_details jd
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            LEFT JOIN users u1 ON jd.created_by = u1.id
            LEFT JOIN users u2 ON jd.updated_by = u2.id
            WHERE jd.employee_id = ?
            ORDER BY jd.effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getByDepartment(departmentId, includeHistory = false) {
        let query;
        if (includeHistory) {
            query = `
                SELECT 
                    jd.*,
                    e.employee_code, e.first_name, e.last_name,
                    dm.designation_name,
                    lm.location_name,
                    r.name as role_name
                FROM employee_job_details jd
                JOIN employees e ON jd.employee_id = e.id
                LEFT JOIN designations_master dm ON jd.designation_id = dm.id
                LEFT JOIN locations_master lm ON jd.location_id = lm.id
                LEFT JOIN roles r ON jd.role_id = r.id
                WHERE jd.department_id = ?
                ORDER BY jd.is_current DESC, jd.effective_start_date DESC
            `;
        } else {
            query = `
                SELECT 
                    jd.*,
                    e.employee_code, e.first_name, e.last_name,
                    dm.designation_name,
                    lm.location_name,
                    r.name as role_name
                FROM employee_job_details jd
                JOIN employees e ON jd.employee_id = e.id
                LEFT JOIN designations_master dm ON jd.designation_id = dm.id
                LEFT JOIN locations_master lm ON jd.location_id = lm.id
                LEFT JOIN roles r ON jd.role_id = r.id
                WHERE jd.department_id = ? AND jd.is_current = TRUE
                ORDER BY dm.grade_level DESC, jd.effective_start_date DESC
            `;
        }
        const [rows] = await pool.query(query, [departmentId]);
        return rows;
    }

    static async getByLocation(locationId, includeHistory = false) {
        let query;
        if (includeHistory) {
            query = `
                SELECT 
                    jd.*,
                    e.employee_code, e.first_name, e.last_name,
                    d.department_name,
                    dm.designation_name,
                    r.name as role_name
                FROM employee_job_details jd
                JOIN employees e ON jd.employee_id = e.id
                LEFT JOIN departments d ON jd.department_id = d.id
                LEFT JOIN designations_master dm ON jd.designation_id = dm.id
                LEFT JOIN roles r ON jd.role_id = r.id
                WHERE jd.location_id = ?
                ORDER BY jd.is_current DESC, jd.effective_start_date DESC
            `;
        } else {
            query = `
                SELECT 
                    jd.*,
                    e.employee_code, e.first_name, e.last_name,
                    d.department_name,
                    dm.designation_name,
                    r.name as role_name
                FROM employee_job_details jd
                JOIN employees e ON jd.employee_id = e.id
                LEFT JOIN departments d ON jd.department_id = d.id
                LEFT JOIN designations_master dm ON jd.designation_id = dm.id
                LEFT JOIN roles r ON jd.role_id = r.id
                WHERE jd.location_id = ? AND jd.is_current = TRUE
                ORDER BY d.department_name, dm.grade_level DESC
            `;
        }
        const [rows] = await pool.query(query, [locationId]);
        return rows;
    }

    static async getEmployeeCount(departmentId = null, locationId = null, status = null) {
        let whereClause = 'WHERE jd.is_current = TRUE AND e.deleted_at IS NULL';
        const params = [];

        if (departmentId) {
            whereClause += ' AND jd.department_id = ?';
            params.push(departmentId);
        }

        if (locationId) {
            whereClause += ' AND jd.location_id = ?';
            params.push(locationId);
        }

        if (status) {
            whereClause += ' AND jd.employment_status = ?';
            params.push(status);
        }

        const query = `
            SELECT COUNT(*) as total
            FROM employee_job_details jd
            JOIN employees e ON jd.employee_id = e.id
            ${whereClause}
        `;
        const [rows] = await pool.query(query, params);
        return rows[0].total;
    }

    static async getDirectReports(managerId) {
        const query = `
            SELECT 
                jd.*,
                e.employee_code, e.first_name, e.last_name,
                d.department_name,
                dm.designation_name,
                lm.location_name,
                r.name as role_name
            FROM employee_job_details jd
            JOIN employees e ON jd.employee_id = e.id
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            WHERE jd.reporting_manager_id = ? AND jd.is_current = TRUE AND e.deleted_at IS NULL
            ORDER BY dm.grade_level DESC, e.first_name ASC
        `;
        const [rows] = await pool.query(query, [managerId]);
        return rows;
    }
}

module.exports = EmployeeJobModel;
