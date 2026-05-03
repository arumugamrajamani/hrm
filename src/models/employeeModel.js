const { pool } = require('../config/database');
const config = require('../config');

class EmployeeModel {
    static async generateEmployeeCode() {
        const query = `
            SELECT employee_code FROM employees 
            ORDER BY id DESC LIMIT 1
        `;
        const [rows] = await pool.query(query);
        
        if (rows.length === 0) {
            return 'EMP001';
        }
        
        const lastCode = rows[0].employee_code;
        const numPart = parseInt(lastCode.replace('EMP', ''), 10);
        const newNum = numPart + 1;
        return `EMP${String(newNum).padStart(3, '0')}`;
    }

    static async findAll({ page = 1, limit = 10, search = '', status = '', department = '', location = '', lifecycle_state = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE e.deleted_at IS NULL';
        const params = [];

        if (search) {
            whereClause += " AND (e.employee_code LIKE ? OR e.first_name LIKE ? OR e.last_name LIKE ? OR cd.email LIKE ? OR cd.mobile LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += " AND u.account_status = ?";
            params.push(status);
        }

        if (lifecycle_state) {
            whereClause += " AND e.lifecycle_state = ?";
            params.push(lifecycle_state);
        }

        if (department) {
            whereClause += " AND jd.department_id = ?";
            params.push(department);
        }

        if (location) {
            whereClause += " AND jd.location_id = ?";
            params.push(location);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM employees e
            LEFT JOIN users u ON e.id = u.employee_id
            LEFT JOIN employee_contact_details cd ON e.id = cd.employee_id
            LEFT JOIN employee_job_details jd ON e.id = jd.employee_id AND jd.is_current = TRUE
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                e.id, e.employee_code, e.first_name, e.last_name, e.date_of_birth, e.gender,
                e.profile_photo, e.created_at, e.updated_at,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS full_name,
                cd.email, cd.mobile,
                u.id as user_id, u.username, u.account_status as status,
                jd.department_id, d.department_name,
                jd.designation_id, dm.designation_name,
                jd.location_id, lm.location_name,
                jd.role_id, r.name as role_name,
                jd.employment_type, jd.employment_status, jd.date_of_joining
            FROM employees e
            LEFT JOIN users u ON e.id = u.employee_id
            LEFT JOIN employee_contact_details cd ON e.id = cd.employee_id
            LEFT JOIN employee_job_details jd ON e.id = jd.employee_id AND jd.is_current = TRUE
            LEFT JOIN departments d ON jd.department_id = d.id
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN locations_master lm ON jd.location_id = lm.id
            LEFT JOIN roles r ON jd.role_id = r.id
            ${whereClause}
            ORDER BY e.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            employees: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                e.*,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS full_name,
                cd.id as contact_id, cd.email, cd.mobile, cd.alternate_mobile, 
                cd.personal_email, cd.linkedin_url,
                cd.emergency_contact_name, cd.emergency_contact_relation, cd.emergency_contact_mobile,
                u.id as user_id, u.username, u.email as user_email, u.account_status as status,
                u.two_factor_enabled, u.last_login,
                r.id as role_id, r.name as role_name
            FROM employees e
            LEFT JOIN employee_contact_details cd ON e.id = cd.employee_id
            LEFT JOIN users u ON e.id = u.employee_id
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE e.id = ? AND e.deleted_at IS NULL
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeCode(employeeCode) {
        const query = `
            SELECT * FROM employees 
            WHERE employee_code = ? AND deleted_at IS NULL
        `;
        const [rows] = await pool.query(query, [employeeCode]);
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const query = `
            SELECT e.*, cd.email
            FROM employees e
            JOIN employee_contact_details cd ON e.id = cd.employee_id
            WHERE cd.email = ? AND e.deleted_at IS NULL
        `;
        const [rows] = await pool.query(query, [email]);
        return rows[0] || null;
    }

    static async create(employeeData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const employeeCode = await EmployeeModel.generateEmployeeCode();
            
            const { first_name, last_name, date_of_birth, gender, profile_photo, created_by } = employeeData;
            
            const [empResult] = await conn.query(
                `INSERT INTO employees (employee_code, first_name, last_name, date_of_birth, gender, profile_photo, created_by, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
                [employeeCode, first_name, last_name, date_of_birth || null, gender || null, profile_photo || null, created_by || null]
            );
            
            const employeeId = empResult.insertId;
            await conn.commit();
            
            return { id: employeeId, employee_code: employeeCode };
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async update(id, employeeData) {
        const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'profile_photo', 'lifecycle_state', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (employeeData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(employeeData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employees SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE employees SET deleted_at = NOW(), updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async restore(id) {
        const query = `UPDATE employees SET deleted_at = NULL, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async getJobDetails(employeeId) {
        const query = `
            SELECT 
                jd.*,
                d.department_name,
                dm.designation_name,
                lm.location_name,
                r.name as role_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name
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

    static async getCurrentJobDetails(employeeId) {
        const query = `
            SELECT 
                jd.*,
                d.department_name,
                dm.designation_name,
                lm.location_name,
                r.name as role_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name
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

    static async getAddresses(employeeId) {
        const query = `
            SELECT * FROM employee_addresses
            WHERE employee_id = ?
            ORDER BY is_current DESC, effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getCurrentAddresses(employeeId) {
        const query = `
            SELECT * FROM employee_addresses
            WHERE employee_id = ? AND is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getBankDetails(employeeId) {
        const query = `
            SELECT eb.*, u.username as verified_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u ON eb.verified_by = u.id
            WHERE eb.employee_id = ?
            ORDER BY eb.is_current DESC, eb.effective_start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getCurrentBankDetails(employeeId) {
        const query = `
            SELECT eb.*, u.username as verified_by_username
            FROM employee_bank_details eb
            LEFT JOIN users u ON eb.verified_by = u.id
            WHERE eb.employee_id = ? AND eb.is_current = TRUE
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async getEducation(employeeId) {
        const query = `
            SELECT ee.*, em.education_name, em.level, cm.course_name,
                   u1.username as verified_by_username, u2.username as created_by_username
            FROM employee_education ee
            LEFT JOIN education_master em ON ee.education_id = em.id
            LEFT JOIN course_master cm ON ee.course_id = cm.id
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            WHERE ee.employee_id = ?
            ORDER BY ee.end_year DESC, ee.created_at DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getExperience(employeeId) {
        const query = `
            SELECT ee.*, u1.username as verified_by_username, u2.username as created_by_username
            FROM employee_experience ee
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            WHERE ee.employee_id = ?
            ORDER BY ee.is_current DESC, ee.start_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getDocuments(employeeId) {
        const query = `
            SELECT ed.*, dm.document_name, dm.document_code, dm.is_mandatory,
                   u1.username as uploaded_by_username, u2.username as verified_by_username
            FROM employee_documents ed
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.verified_by = u2.id
            WHERE ed.employee_id = ?
            ORDER BY dm.is_mandatory DESC, ed.uploaded_at DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async changeLifecycleState(employeeId, { fromState, toState, reason, remarks, changedBy, effectiveDate = new Date() }) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [currentEmployee] = await conn.query(
                'SELECT lifecycle_state FROM employees WHERE id = ? AND deleted_at IS NULL FOR UPDATE',
                [employeeId]
            );

            if (currentEmployee.length === 0) {
                throw new Error('Employee not found');
            }

            const currentState = currentState = currentEmployee[0].lifecycle_state || 'draft';

            const [stateCheck] = await conn.query(
                'SELECT allowed_transitions FROM employee_lifecycle_states WHERE state_code = ?',
                [currentState]
            );

            if (stateCheck.length > 0 && stateCheck[0].allowed_transitions) {
                const allowedTransitions = JSON.parse(stateCheck[0].allowed_transitions);
                if (!allowedTransitions.includes(toState)) {
                    throw new Error(`Invalid state transition from ${currentState} to ${toState}`);
                }
            }

            await conn.query(
                'UPDATE employees SET lifecycle_state = ?, updated_at = NOW(), updated_by = ? WHERE id = ?',
                [toState, changedBy, employeeId]
            );

            await conn.query(
                `INSERT INTO employee_lifecycle_history 
                (employee_id, from_state, to_state, changed_by, changed_at, reason, remarks, effective_date, approval_status, created_at)
                VALUES (?, ?, ?, ?, NOW(), ?, ?, ?, 'approved', NOW())`,
                [employeeId, currentState, toState, changedBy, reason, remarks, effectiveDate]
            );

            await conn.commit();
            return true;
        } catch (error) {
            await conn.rollback();
            throw error;
        } finally {
            conn.release();
        }
    }

    static async getLifecycleHistory(employeeId) {
        const query = `
            SELECT 
                lh.*,
                el.state_name as to_state_name,
                el.description as to_state_description,
                u.username as changed_by_username,
                au.username as approved_by_username
            FROM employee_lifecycle_history lh
            LEFT JOIN employee_lifecycle_states el ON lh.to_state = el.state_code
            LEFT JOIN users u ON lh.changed_by = u.id
            LEFT JOIN users au ON lh.approved_by = au.id
            WHERE lh.employee_id = ?
            ORDER BY lh.effective_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async addJobChange(jobChangeData) {
        const {
            employee_id,
            change_type,
            from_department_id,
            to_department_id,
            from_designation_id,
            to_designation_id,
            from_location_id,
            to_location_id,
            from_reporting_manager_id,
            to_reporting_manager_id,
            from_employment_type,
            to_employment_type,
            from_salary,
            to_salary,
            effective_date,
            reason,
            remarks,
            created_by
        } = jobChangeData;

        const query = `
            INSERT INTO employee_job_changes (
                employee_id, change_type,
                from_department_id, to_department_id,
                from_designation_id, to_designation_id,
                from_location_id, to_location_id,
                from_reporting_manager_id, to_reporting_manager_id,
                from_employment_type, to_employment_type,
                from_salary, to_salary,
                effective_date, reason, remarks, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            employee_id, change_type,
            from_department_id, to_department_id,
            from_designation_id, to_designation_id,
            from_location_id, to_location_id,
            from_reporting_manager_id, to_reporting_manager_id,
            from_employment_type, to_employment_type,
            from_salary, to_salary,
            effective_date, reason, remarks, created_by
        ]);

        return result.insertId;
    }

    static async getJobChanges(employeeId) {
        const query = `
            SELECT 
                jc.*,
                d1.department_name as from_department_name,
                d2.department_name as to_department_name,
                ds1.designation_name as from_designation_name,
                ds2.designation_name as to_designation_name,
                l1.location_name as from_location_name,
                l2.location_name as to_location_name,
                CONCAT(e1.first_name, ' ', COALESCE(e1.last_name, '')) as from_manager_name,
                CONCAT(e2.first_name, ' ', COALESCE(e2.last_name, '')) as to_manager_name,
                u1.username as created_by_username,
                u2.username as approved_by_username
            FROM employee_job_changes jc
            LEFT JOIN departments d1 ON jc.from_department_id = d1.id
            LEFT JOIN departments d2 ON jc.to_department_id = d2.id
            LEFT JOIN designations_master ds1 ON jc.from_designation_id = ds1.id
            LEFT JOIN designations_master ds2 ON jc.to_designation_id = ds2.id
            LEFT JOIN locations_master l1 ON jc.from_location_id = l1.id
            LEFT JOIN locations_master l2 ON jc.to_location_id = l2.id
            LEFT JOIN employees e1 ON jc.from_reporting_manager_id = e1.id
            LEFT JOIN employees e2 ON jc.to_reporting_manager_id = e2.id
            LEFT JOIN users u1 ON jc.created_by = u1.id
            LEFT JOIN users u2 ON jc.approved_by = u2.id
            WHERE jc.employee_id = ?
            ORDER BY jc.effective_date DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }
}

module.exports = EmployeeModel;
