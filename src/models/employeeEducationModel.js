const { pool } = require('../config/database');

class EmployeeEducationModel {
    static async findById(id) {
        const query = `
            SELECT 
                ee.*,
                e.employee_code, e.first_name, e.last_name,
                em.education_name, em.education_code, em.level,
                cm.course_name, cm.course_code,
                u1.username as verified_by_username,
                u2.username as created_by_username,
                u3.username as updated_by_username
            FROM employee_education ee
            JOIN employees e ON ee.employee_id = e.id
            LEFT JOIN education_master em ON ee.education_id = em.id
            LEFT JOIN course_master cm ON ee.course_id = cm.id
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            LEFT JOIN users u3 ON ee.updated_by = u3.id
            WHERE ee.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                ee.*,
                em.education_name, em.education_code, em.level,
                cm.course_name, cm.course_code,
                u1.username as verified_by_username,
                u2.username as created_by_username
            FROM employee_education ee
            LEFT JOIN education_master em ON ee.education_id = em.id
            LEFT JOIN course_master cm ON ee.course_id = cm.id
            LEFT JOIN users u1 ON ee.verified_by = u1.id
            LEFT JOIN users u2 ON ee.created_by = u2.id
            WHERE ee.employee_id = ?
            ORDER BY em.level DESC, ee.end_year DESC, ee.created_at DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async create(educationData) {
        const query = `
            INSERT INTO employee_education (
                employee_id, education_id, course_id, institution_name, university_name,
                start_year, end_year, percentage, cgpa, grade,
                is_verified, verified_by, verified_at,
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            educationData.employee_id,
            educationData.education_id || null,
            educationData.course_id || null,
            educationData.institution_name,
            educationData.university_name || null,
            educationData.start_year || null,
            educationData.end_year || null,
            educationData.percentage || null,
            educationData.cgpa || null,
            educationData.grade || null,
            educationData.is_verified || false,
            educationData.verified_by || null,
            educationData.verified_at || null,
            educationData.created_by || null
        ]);

        return result.insertId;
    }

    static async update(id, educationData) {
        const allowedFields = [
            'education_id', 'course_id', 'institution_name', 'university_name',
            'start_year', 'end_year', 'percentage', 'cgpa', 'grade', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (educationData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(educationData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employee_education SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async verify(id, verifiedBy) {
        const query = `
            UPDATE employee_education
            SET is_verified = TRUE, verified_by = ?, verified_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [verifiedBy, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_education WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_education WHERE employee_id = ?';
        const [result] = await pool.query(query, [employeeId]);
        return result.affectedRows;
    }

    static async getVerificationStatus(employeeId) {
        const query = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN is_verified = FALSE THEN 1 ELSE 0 END) as pending
            FROM employee_education
            WHERE employee_id = ?
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0];
    }

    static async getHighestQualification(employeeId) {
        const query = `
            SELECT 
                ee.*,
                em.education_name, em.level
            FROM employee_education ee
            LEFT JOIN education_master em ON ee.education_id = em.id
            WHERE ee.employee_id = ?
            ORDER BY 
                CASE em.level 
                    WHEN 'Doctorate' THEN 1 
                    WHEN 'PG' THEN 2 
                    WHEN 'UG' THEN 3 
                    WHEN 'School' THEN 4 
                    ELSE 5 
                END,
                ee.end_year DESC
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0] || null;
    }

    static async getAllPendingVerifications() {
        const query = `
            SELECT 
                ee.*,
                e.employee_code, e.first_name, e.last_name,
                em.education_name, em.level,
                cm.course_name,
                u1.username as created_by_username
            FROM employee_education ee
            JOIN employees e ON ee.employee_id = e.id
            LEFT JOIN education_master em ON ee.education_id = em.id
            LEFT JOIN course_master cm ON ee.course_id = cm.id
            LEFT JOIN users u1 ON ee.created_by = u1.id
            WHERE ee.is_verified = FALSE AND e.deleted_at IS NULL
            ORDER BY ee.created_at DESC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = EmployeeEducationModel;
