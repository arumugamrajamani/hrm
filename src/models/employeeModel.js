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

    static async findAll({ page = 1, limit = 10, search = '', status = '', department = '', location = '' }) {
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
        const allowedFields = ['first_name', 'last_name', 'date_of_birth', 'gender', 'profile_photo', 'updated_by'];
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

    static async getEmergencyContacts(employeeId) {
        const query = `
            SELECT * FROM employee_emergency_contacts
            WHERE employee_id = ?
            ORDER BY priority_order ASC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getReportingEmployees(managerId) {
        const query = `
            SELECT 
                e.id, e.employee_code, e.first_name, e.last_name,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) AS full_name,
                dm.designation_name, d.department_name
            FROM employees e
            JOIN employee_job_details jd ON e.id = jd.employee_id AND jd.is_current = TRUE
            LEFT JOIN designations_master dm ON jd.designation_id = dm.id
            LEFT JOIN departments d ON jd.department_id = d.id
            WHERE jd.reporting_manager_id = ? AND e.deleted_at IS NULL
        `;
        const [rows] = await pool.query(query, [managerId]);
        return rows;
    }

    static async getFullProfile(employeeId) {
        const employee = await EmployeeModel.findById(employeeId);
        if (!employee) return null;

        const [jobDetails, addresses, bankDetails, education, experience, documents, emergencyContacts] = await Promise.all([
            EmployeeModel.getJobDetails(employeeId),
            EmployeeModel.getAddresses(employeeId),
            EmployeeModel.getBankDetails(employeeId),
            EmployeeModel.getEducation(employeeId),
            EmployeeModel.getExperience(employeeId),
            EmployeeModel.getDocuments(employeeId),
            EmployeeModel.getEmergencyContacts(employeeId)
        ]);

        return {
            ...employee,
            job_details: jobDetails,
            current_job: jobDetails.find(j => j.is_current) || null,
            addresses,
            current_addresses: addresses.filter(a => a.is_current),
            bank_details: bankDetails,
            current_bank: bankDetails.find(b => b.is_current) || null,
            education,
            experience,
            documents,
            emergency_contacts: emergencyContacts
        };
    }
}

module.exports = EmployeeModel;
