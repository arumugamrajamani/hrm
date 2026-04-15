const { pool } = require('../config/database');
const { parseJSON } = require('../utils/helpers');
const config = require('../config');

const transformUserWithProfileUrl = (user) => {
    if (!user) return null;
    const transformed = { ...user };
    if (transformed.profile_photo) {
        transformed.profile_photo = `${config.API_URL}${transformed.profile_photo}`;
    }
    return transformed;
};

const transformUsersWithProfileUrl = (users) => {
    return users.map(transformUserWithProfileUrl);
};

class UserModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = "WHERE u.status != 'deleted'";
        const params = [];

        if (search) {
            whereClause += " AND (u.username LIKE ? OR u.email LIKE ? OR u.mobile LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += " AND u.status = ?";
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM users u 
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                u.id, u.username, u.email, u.mobile, u.status, 
                u.profile_photo, u.two_factor_enabled, u.password_changed_at,
                u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            users: transformUsersWithProfileUrl(rows),
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                u.id, u.username, u.email, u.mobile, u.status, 
                u.profile_photo, u.two_factor_enabled, u.password_changed_at,
                u.password, u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.id = ? AND u.status != 'deleted'
        `;
        const [rows] = await pool.query(query, [id]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async findByEmail(email) {
        const query = `
            SELECT 
                u.*, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.email = ? AND u.status != 'deleted'
        `;
        const [rows] = await pool.query(query, [email]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async findByUsername(username) {
        const query = `
            SELECT 
                u.*, r.name as role_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            WHERE u.username = ? AND u.status != 'deleted'
        `;
        const [rows] = await pool.query(query, [username]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async create(userData) {
        const { username, email, mobile, password, role_id, status = 'active', profile_photo } = userData;
        
        const query = `
            INSERT INTO users (username, email, mobile, password, role_id, status, profile_photo, password_changed_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [username, email, mobile, password, role_id, status, profile_photo || null]);
        return result.insertId;
    }

    static async update(id, userData) {
        const allowedFields = ['username', 'email', 'mobile', 'role_id', 'status', 'profile_photo'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (userData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(userData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async updatePassword(id, passwordHash) {
        const query = `
            UPDATE users 
            SET password = ?, password_changed_at = NOW(), updated_at = NOW() 
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [passwordHash, id]);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE users SET status = 'deleted', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE users SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async block(id) {
        const query = `UPDATE users SET status = 'blocked', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async enableTwoFactor(id) {
        const query = `UPDATE users SET two_factor_enabled = TRUE, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async disableTwoFactor(id) {
        const query = `UPDATE users SET two_factor_enabled = FALSE, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async emailExists(email, excludeId = null) {
        let query = 'SELECT id FROM users WHERE email = ?';
        const params = [email];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async usernameExists(username, excludeId = null) {
        let query = 'SELECT id FROM users WHERE username = ?';
        const params = [username];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async mobileExists(mobile, excludeId = null) {
        let query = 'SELECT id FROM users WHERE mobile = ?';
        const params = [mobile];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }
}

class RoleModel {
    static async findAll() {
        const query = 'SELECT * FROM roles ORDER BY id ASC';
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findById(id) {
        const query = 'SELECT * FROM roles WHERE id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(name) {
        const query = 'SELECT * FROM roles WHERE name = ?';
        const [rows] = await pool.query(query, [name]);
        return rows[0] || null;
    }
}

class LoginAttemptModel {
    static async findByUserId(userId) {
        const query = 'SELECT * FROM login_attempts WHERE user_id = ?';
        const [rows] = await pool.query(query, [userId]);
        return rows[0] || null;
    }

    static async createOrUpdate(userId, attempts = 1) {
        const query = `
            INSERT INTO login_attempts (user_id, attempts, last_attempt_time)
            VALUES (?, ?, NOW())
            ON DUPLICATE KEY UPDATE
            attempts = VALUES(attempts),
            last_attempt_time = VALUES(last_attempt_time)
        `;
        await pool.query(query, [userId, attempts]);
    }

    static async incrementAttempts(userId) {
        const query = `
            INSERT INTO login_attempts (user_id, attempts, last_attempt_time)
            VALUES (?, 1, NOW())
            ON DUPLICATE KEY UPDATE
            attempts = attempts + 1,
            last_attempt_time = NOW()
        `;
        await pool.query(query, [userId]);
    }

    static async setBlockedUntil(userId, blockedUntil) {
        const query = `
            UPDATE login_attempts 
            SET blocked_until = ? 
            WHERE user_id = ?
        `;
        await pool.query(query, [blockedUntil, userId]);
    }

    static async resetAttempts(userId) {
        const query = `
            UPDATE login_attempts 
            SET attempts = 0, blocked_until = NULL 
            WHERE user_id = ?
        `;
        await pool.query(query, [userId]);
    }
}

class PasswordHistoryModel {
    static async findByUserId(userId, limit = 3) {
        const query = `
            SELECT * FROM password_history 
            WHERE user_id = ? 
            ORDER BY created_at DESC 
            LIMIT ?
        `;
        const [rows] = await pool.query(query, [userId, limit]);
        return rows;
    }

    static async create(userId, passwordHash) {
        const query = `
            INSERT INTO password_history (user_id, password_hash, created_at)
            VALUES (?, ?, NOW())
        `;
        await pool.query(query, [userId, passwordHash]);

        const deleteQuery = `
            DELETE FROM password_history 
            WHERE user_id = ? 
            AND id NOT IN (
                SELECT id FROM (
                    SELECT id FROM password_history 
                    WHERE user_id = ? 
                    ORDER BY created_at DESC 
                    LIMIT ?
                ) AS recent
            )
        `;
        await pool.query(deleteQuery, [userId, userId, 3]);
    }
}

class PasswordResetTokenModel {
    static async findByOtp(otp) {
        const query = `
            SELECT * FROM password_reset_tokens 
            WHERE otp = ? AND used = FALSE AND expires_at > NOW()
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [otp]);
        return rows[0] || null;
    }

    static async findByToken(token) {
        const query = `
            SELECT * FROM password_reset_tokens 
            WHERE token = ? AND used = FALSE AND expires_at > NOW()
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0] || null;
    }

    static async create(userId, { token = null, otp, expiresAt }) {
        const query = `
            INSERT INTO password_reset_tokens (user_id, token, otp, expires_at, used, created_at)
            VALUES (?, ?, ?, ?, FALSE, NOW())
        `;
        const [result] = await pool.query(query, [userId, token, otp, expiresAt]);
        return result.insertId;
    }

    static async markAsUsed(id) {
        const query = 'UPDATE password_reset_tokens SET used = TRUE WHERE id = ?';
        await pool.query(query, [id]);
    }

    static async deleteByUserId(userId) {
        const query = 'DELETE FROM password_reset_tokens WHERE user_id = ?';
        await pool.query(query, [userId]);
    }
}

class RefreshTokenModel {
    static async findByToken(token) {
        const query = `
            SELECT * FROM refresh_tokens 
            WHERE token = ? AND expires_at > NOW()
        `;
        const [rows] = await pool.query(query, [token]);
        return rows[0] || null;
    }

    static async findByUserId(userId) {
        const query = `
            SELECT * FROM refresh_tokens 
            WHERE user_id = ? AND expires_at > NOW()
        `;
        const [rows] = await pool.query(query, [userId]);
        return rows;
    }

    static async create(userId, token, expiresAt) {
        const query = `
            INSERT INTO refresh_tokens (user_id, token, expires_at, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        const [result] = await pool.query(query, [userId, token, expiresAt]);
        return result.insertId;
    }

    static async deleteByToken(token) {
        const query = 'DELETE FROM refresh_tokens WHERE token = ?';
        const [result] = await pool.query(query, [token]);
        return result.affectedRows > 0;
    }

    static async deleteByUserId(userId) {
        const query = 'DELETE FROM refresh_tokens WHERE user_id = ?';
        await pool.query(query, [userId]);
    }

    static async deleteExpired() {
        const query = 'DELETE FROM refresh_tokens WHERE expires_at < NOW()';
        await pool.query(query);
    }
}

class DepartmentModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '', includeHierarchy = false }) {
        const offset = (page - 1) * limit;
        let whereClause = "WHERE 1=1";
        const params = [];

        if (search) {
            whereClause += " AND (d.department_name LIKE ? OR d.department_code LIKE ? OR d.description LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += " AND d.status = ?";
            params.push(status);
        }

        let dataQuery;
        if (includeHierarchy) {
            dataQuery = `
                SELECT 
                    d.*,
                    pd.id as parent_id,
                    pd.department_name as parent_department_name,
                    pd.department_code as parent_department_code,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM departments d
                LEFT JOIN departments pd ON d.parent_department_id = pd.id
                LEFT JOIN users cu ON d.created_by = cu.id
                LEFT JOIN users uu ON d.updated_by = uu.id
                ${whereClause}
                ORDER BY d.department_name ASC
                LIMIT ? OFFSET ?
            `;
        } else {
            dataQuery = `
                SELECT 
                    d.*,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM departments d
                LEFT JOIN users cu ON d.created_by = cu.id
                LEFT JOIN users uu ON d.updated_by = uu.id
                ${whereClause}
                ORDER BY d.department_name ASC
                LIMIT ? OFFSET ?
            `;
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM departments d
            ${whereClause}
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            departments: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id, includeHierarchy = false) {
        let query;
        if (includeHierarchy) {
            query = `
                SELECT 
                    d.*,
                    pd.id as parent_id,
                    pd.department_name as parent_department_name,
                    pd.department_code as parent_department_code,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM departments d
                LEFT JOIN departments pd ON d.parent_department_id = pd.id
                LEFT JOIN users cu ON d.created_by = cu.id
                LEFT JOIN users uu ON d.updated_by = uu.id
                WHERE d.id = ?
            `;
        } else {
            query = `
                SELECT 
                    d.*,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM departments d
                LEFT JOIN users cu ON d.created_by = cu.id
                LEFT JOIN users uu ON d.updated_by = uu.id
                WHERE d.id = ?
            `;
        }
        
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(departmentName, excludeId = null) {
        let query = 'SELECT * FROM departments WHERE department_name = ?';
        const params = [departmentName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(departmentCode, excludeId = null) {
        let query = 'SELECT * FROM departments WHERE department_code = ?';
        const params = [departmentCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByParentId(parentId) {
        const query = 'SELECT * FROM departments WHERE parent_department_id = ? ORDER BY department_name ASC';
        const [rows] = await pool.query(query, [parentId]);
        return rows;
    }

    static async getHierarchyTree() {
        const query = `
            WITH RECURSIVE department_tree AS (
                SELECT 
                    id, 
                    department_name, 
                    department_code, 
                    parent_department_id,
                    description,
                    status,
                    1 as level,
                    CAST(id AS CHAR(1000)) as path
                FROM departments 
                WHERE parent_department_id IS NULL
                
                UNION ALL
                
                SELECT 
                    d.id, 
                    d.department_name, 
                    d.department_code, 
                    d.parent_department_id,
                    d.description,
                    d.status,
                    dt.level + 1,
                    CONCAT(dt.path, ',', d.id)
                FROM departments d
                INNER JOIN department_tree dt ON d.parent_department_id = dt.id
            )
            SELECT * FROM department_tree ORDER BY path ASC
        `;
        
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getAllChildren(parentId) {
        const query = `
            WITH RECURSIVE child_departments AS (
                SELECT id FROM departments WHERE parent_department_id = ?
                UNION ALL
                SELECT d.id FROM departments d
                INNER JOIN child_departments cd ON d.parent_department_id = cd.id
            )
            SELECT id FROM child_departments
        `;
        
        const [rows] = await pool.query(query, [parentId]);
        return rows.map(row => row.id);
    }

    static async create(departmentData) {
        const { department_name, department_code, parent_department_id, description, status = 'active', created_by } = departmentData;
        
        const query = `
            INSERT INTO departments (department_name, department_code, parent_department_id, description, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [department_name, department_code, parent_department_id || null, description || null, status, created_by || null]);
        return result.insertId;
    }

    static async update(id, departmentData) {
        const allowedFields = ['department_name', 'department_code', 'parent_department_id', 'description', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (departmentData[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (field === 'parent_department_id' && departmentData[field] === null) {
                    params.push(null);
                } else {
                    params.push(departmentData[field]);
                }
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE departments SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE departments SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE departments SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE departments SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async hasChildren(id) {
        const query = 'SELECT COUNT(*) as count FROM departments WHERE parent_department_id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0].count > 0;
    }

    static async departmentNameExists(departmentName, excludeId = null) {
        let query = 'SELECT id FROM departments WHERE department_name = ?';
        const params = [departmentName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async departmentCodeExists(departmentCode, excludeId = null) {
        let query = 'SELECT id FROM departments WHERE department_code = ?';
        const params = [departmentCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async parentDepartmentExists(parentId) {
        const query = 'SELECT id FROM departments WHERE id = ?';
        const [rows] = await pool.query(query, [parentId]);
        return rows.length > 0;
    }
}

class EducationModel {
    static async findAll({ page = 1, limit = 10, search = '', level = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (e.education_name LIKE ? OR e.education_code LIKE ? OR e.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (level) {
            whereClause += ' AND e.level = ?';
            params.push(level);
        }

        if (status) {
            whereClause += ' AND e.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM education_master e
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                e.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM education_master e
            LEFT JOIN users cu ON e.created_by = cu.id
            LEFT JOIN users uu ON e.updated_by = uu.id
            ${whereClause}
            ORDER BY e.education_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            educations: rows,
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
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM education_master e
            LEFT JOIN users cu ON e.created_by = cu.id
            LEFT JOIN users uu ON e.updated_by = uu.id
            WHERE e.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(educationName, excludeId = null) {
        let query = 'SELECT * FROM education_master WHERE education_name = ?';
        const params = [educationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(educationCode, excludeId = null) {
        let query = 'SELECT * FROM education_master WHERE education_code = ?';
        const params = [educationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async create(educationData) {
        const { education_name, education_code, level, description, status = 'active', created_by } = educationData;
        
        const query = `
            INSERT INTO education_master (education_name, education_code, level, description, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [education_name, education_code, level, description || null, status, created_by || null]);
        return result.insertId;
    }

    static async update(id, educationData) {
        const allowedFields = ['education_name', 'education_code', 'level', 'description', 'status', 'updated_by'];
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
        const query = `UPDATE education_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE education_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE education_master SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE education_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async educationNameExists(educationName, excludeId = null) {
        let query = 'SELECT id FROM education_master WHERE education_name = ?';
        const params = [educationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async educationCodeExists(educationCode, excludeId = null) {
        let query = 'SELECT id FROM education_master WHERE education_code = ?';
        const params = [educationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async hasMappings(id) {
        const query = 'SELECT COUNT(*) as count FROM education_course_map WHERE education_id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0].count > 0;
    }
}

class CourseModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (c.course_name LIKE ? OR c.course_code LIKE ? OR c.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND c.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM course_master c
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                c.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM course_master c
            LEFT JOIN users cu ON c.created_by = cu.id
            LEFT JOIN users uu ON c.updated_by = uu.id
            ${whereClause}
            ORDER BY c.course_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            courses: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                c.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM course_master c
            LEFT JOIN users cu ON c.created_by = cu.id
            LEFT JOIN users uu ON c.updated_by = uu.id
            WHERE c.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(courseName, excludeId = null) {
        let query = 'SELECT * FROM course_master WHERE course_name = ?';
        const params = [courseName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(courseCode, excludeId = null) {
        let query = 'SELECT * FROM course_master WHERE course_code = ?';
        const params = [courseCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async create(courseData) {
        const { course_name, course_code, description, status = 'active', created_by } = courseData;
        
        const query = `
            INSERT INTO course_master (course_name, course_code, description, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [course_name, course_code, description || null, status, created_by || null]);
        return result.insertId;
    }

    static async update(id, courseData) {
        const allowedFields = ['course_name', 'course_code', 'description', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (courseData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(courseData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE course_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE course_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE course_master SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE course_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async courseNameExists(courseName, excludeId = null) {
        let query = 'SELECT id FROM course_master WHERE course_name = ?';
        const params = [courseName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async courseCodeExists(courseCode, excludeId = null) {
        let query = 'SELECT id FROM course_master WHERE course_code = ?';
        const params = [courseCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async hasMappings(id) {
        const query = 'SELECT COUNT(*) as count FROM education_course_map WHERE course_id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0].count > 0;
    }
}

class EducationCourseMapModel {
    static async findAll() {
        const query = `
            SELECT 
                ecm.*,
                e.education_name,
                e.education_code,
                c.course_name,
                c.course_code,
                u.username as created_by_username
            FROM education_course_map ecm
            LEFT JOIN education_master e ON ecm.education_id = e.id
            LEFT JOIN course_master c ON ecm.course_id = c.id
            LEFT JOIN users u ON ecm.created_by = u.id
            ORDER BY e.education_name ASC, c.course_name ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findById(id) {
        const query = `
            SELECT 
                ecm.*,
                e.education_name,
                e.education_code,
                c.course_name,
                c.course_code,
                u.username as created_by_username
            FROM education_course_map ecm
            LEFT JOIN education_master e ON ecm.education_id = e.id
            LEFT JOIN course_master c ON ecm.course_id = c.id
            LEFT JOIN users u ON ecm.created_by = u.id
            WHERE ecm.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEducationId(educationId) {
        const query = `
            SELECT 
                ecm.id,
                ecm.education_id,
                ecm.course_id,
                ecm.created_at,
                c.course_name,
                c.course_code,
                c.description as course_description,
                c.status as course_status
            FROM education_course_map ecm
            LEFT JOIN course_master c ON ecm.course_id = c.id
            WHERE ecm.education_id = ?
            ORDER BY c.course_name ASC
        `;
        const [rows] = await pool.query(query, [educationId]);
        return rows;
    }

    static async findByCourseId(courseId) {
        const query = `
            SELECT 
                ecm.id,
                ecm.education_id,
                ecm.course_id,
                ecm.created_at,
                e.education_name,
                e.education_code,
                e.level,
                e.description as education_description,
                e.status as education_status
            FROM education_course_map ecm
            LEFT JOIN education_master e ON ecm.education_id = e.id
            WHERE ecm.course_id = ?
            ORDER BY e.education_name ASC
        `;
        const [rows] = await pool.query(query, [courseId]);
        return rows;
    }

    static async create(mapData) {
        const { education_id, course_id, created_by } = mapData;
        
        const query = `
            INSERT INTO education_course_map (education_id, course_id, created_by, created_at)
            VALUES (?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [education_id, course_id, created_by || null]);
        return result.insertId;
    }

    static async delete(id) {
        const query = 'DELETE FROM education_course_map WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async mappingExists(educationId, courseId) {
        const query = 'SELECT id FROM education_course_map WHERE education_id = ? AND course_id = ?';
        const [rows] = await pool.query(query, [educationId, courseId]);
        return rows.length > 0;
    }
}

class LocationModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '', includeHierarchy = false }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (l.location_name LIKE ? OR l.location_code LIKE ? OR l.city LIKE ? OR l.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND l.status = ?';
            params.push(status);
        }

        let dataQuery;
        if (includeHierarchy) {
            dataQuery = `
                SELECT 
                    l.*,
                    pl.id as parent_id,
                    pl.location_name as parent_location_name,
                    pl.location_code as parent_location_code,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM locations_master l
                LEFT JOIN locations_master pl ON l.parent_location_id = pl.id
                LEFT JOIN users cu ON l.created_by = cu.id
                LEFT JOIN users uu ON l.updated_by = uu.id
                ${whereClause}
                ORDER BY l.location_name ASC
                LIMIT ? OFFSET ?
            `;
        } else {
            dataQuery = `
                SELECT 
                    l.*,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM locations_master l
                LEFT JOIN users cu ON l.created_by = cu.id
                LEFT JOIN users uu ON l.updated_by = uu.id
                ${whereClause}
                ORDER BY l.location_name ASC
                LIMIT ? OFFSET ?
            `;
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM locations_master l
            ${whereClause}
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            locations: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id, includeHierarchy = false) {
        let query;
        if (includeHierarchy) {
            query = `
                SELECT 
                    l.*,
                    pl.id as parent_id,
                    pl.location_name as parent_location_name,
                    pl.location_code as parent_location_code,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM locations_master l
                LEFT JOIN locations_master pl ON l.parent_location_id = pl.id
                LEFT JOIN users cu ON l.created_by = cu.id
                LEFT JOIN users uu ON l.updated_by = uu.id
                WHERE l.id = ?
            `;
        } else {
            query = `
                SELECT 
                    l.*,
                    cu.username as created_by_username,
                    uu.username as updated_by_username
                FROM locations_master l
                LEFT JOIN users cu ON l.created_by = cu.id
                LEFT JOIN users uu ON l.updated_by = uu.id
                WHERE l.id = ?
            `;
        }
        
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(locationName, excludeId = null) {
        let query = 'SELECT * FROM locations_master WHERE location_name = ?';
        const params = [locationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(locationCode, excludeId = null) {
        let query = 'SELECT * FROM locations_master WHERE location_code = ?';
        const params = [locationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByParentId(parentId) {
        const query = 'SELECT * FROM locations_master WHERE parent_location_id = ? ORDER BY location_name ASC';
        const [rows] = await pool.query(query, [parentId]);
        return rows;
    }

    static async getHierarchyTree() {
        const query = `
            WITH RECURSIVE location_tree AS (
                SELECT 
                    id, 
                    location_name, 
                    location_code, 
                    parent_location_id,
                    address,
                    city,
                    state,
                    country,
                    description,
                    status,
                    is_headquarters,
                    1 as level,
                    CAST(id AS CHAR(1000)) as path
                FROM locations_master 
                WHERE parent_location_id IS NULL
                
                UNION ALL
                
                SELECT 
                    l.id, 
                    l.location_name, 
                    l.location_code, 
                    l.parent_location_id,
                    l.address,
                    l.city,
                    l.state,
                    l.country,
                    l.description,
                    l.status,
                    l.is_headquarters,
                    lt.level + 1,
                    CONCAT(lt.path, ',', l.id)
                FROM locations_master l
                INNER JOIN location_tree lt ON l.parent_location_id = lt.id
            )
            SELECT * FROM location_tree ORDER BY path ASC
        `;
        
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getAllChildren(parentId) {
        const query = `
            WITH RECURSIVE child_locations AS (
                SELECT id FROM locations_master WHERE parent_location_id = ?
                UNION ALL
                SELECT l.id FROM locations_master l
                INNER JOIN child_locations cl ON l.parent_location_id = cl.id
            )
            SELECT id FROM child_locations
        `;
        
        const [rows] = await pool.query(query, [parentId]);
        return rows.map(row => row.id);
    }

    static async getHeadquarters() {
        const query = 'SELECT * FROM locations_master WHERE is_headquarters = TRUE LIMIT 1';
        const [rows] = await pool.query(query);
        return rows[0] || null;
    }

    static async create(locationData) {
        const { 
            location_name, 
            location_code, 
            parent_location_id, 
            address, 
            city, 
            state, 
            country = 'India',
            pincode,
            phone,
            email,
            is_headquarters = false,
            description, 
            status = 'active', 
            created_by 
        } = locationData;
        
        const query = `
            INSERT INTO locations_master (
                location_name, location_code, parent_location_id, address, city, state, country, 
                pincode, phone, email, is_headquarters, description, status, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            location_name, location_code, parent_location_id || null, address || null, 
            city || null, state || null, country, pincode || null, phone || null, 
            email || null, is_headquarters, description || null, status, created_by || null
        ]);
        return result.insertId;
    }

    static async update(id, locationData) {
        const allowedFields = [
            'location_name', 'location_code', 'parent_location_id', 'address', 'city', 'state', 
            'country', 'pincode', 'phone', 'email', 'is_headquarters', 'description', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (locationData[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (field === 'parent_location_id' && locationData[field] === null) {
                    params.push(null);
                } else {
                    params.push(locationData[field]);
                }
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE locations_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE locations_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE locations_master SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE locations_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async setAsHeadquarters(id) {
        const query1 = `UPDATE locations_master SET is_headquarters = FALSE WHERE is_headquarters = TRUE`;
        await pool.query(query1);
        
        const query2 = `UPDATE locations_master SET is_headquarters = TRUE, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query2, [id]);
        return result.affectedRows > 0;
    }

    static async hasChildren(id) {
        const query = 'SELECT COUNT(*) as count FROM locations_master WHERE parent_location_id = ?';
        const [rows] = await pool.query(query, [id]);
        return rows[0].count > 0;
    }

    static async locationNameExists(locationName, excludeId = null) {
        let query = 'SELECT id FROM locations_master WHERE location_name = ?';
        const params = [locationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async locationCodeExists(locationCode, excludeId = null) {
        let query = 'SELECT id FROM locations_master WHERE location_code = ?';
        const params = [locationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async parentLocationExists(parentId) {
        const query = 'SELECT id FROM locations_master WHERE id = ?';
        const [rows] = await pool.query(query, [parentId]);
        return rows.length > 0;
    }

    static async generateBranchCode(prefix = 'BR') {
        const query = `
            SELECT location_code FROM locations_master 
            WHERE location_code LIKE ? 
            ORDER BY location_code DESC 
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [`${prefix}%`]);
        
        if (rows.length === 0) {
            return `${prefix}001`;
        }
        
        const lastCode = rows[0].location_code;
        const numPart = parseInt(lastCode.replace(prefix, ''), 10);
        const newNum = numPart + 1;
        return `${prefix}${String(newNum).padStart(3, '0')}`;
    }
}

class DesignationModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (d.designation_name LIKE ? OR d.designation_code LIKE ? OR d.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND d.status = ?';
            params.push(status);
        }

        const dataQuery = `
            SELECT 
                d.*,
                cu.username as created_by_username,
                uu.username as updated_by_username,
                dep.department_name as department_name
            FROM designations_master d
            LEFT JOIN users cu ON d.created_by = cu.id
            LEFT JOIN users uu ON d.updated_by = uu.id
            LEFT JOIN departments dep ON d.department_id = dep.id
            ${whereClause}
            ORDER BY d.designation_name ASC
            LIMIT ? OFFSET ?
        `;

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM designations_master d
            ${whereClause}
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            designations: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                d.*,
                cu.username as created_by_username,
                uu.username as updated_by_username,
                dep.department_name as department_name
            FROM designations_master d
            LEFT JOIN users cu ON d.created_by = cu.id
            LEFT JOIN users uu ON d.updated_by = uu.id
            LEFT JOIN departments dep ON d.department_id = dep.id
            WHERE d.id = ?
        `;
        
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(designationName, excludeId = null) {
        let query = 'SELECT * FROM designations_master WHERE designation_name = ?';
        const params = [designationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(designationCode, excludeId = null) {
        let query = 'SELECT * FROM designations_master WHERE designation_code = ?';
        const params = [designationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByDepartmentId(departmentId) {
        const query = 'SELECT * FROM designations_master WHERE department_id = ? AND status = "active" ORDER BY designation_name ASC';
        const [rows] = await pool.query(query, [departmentId]);
        return rows;
    }

    static async create(designationData) {
        const { 
            designation_name, 
            designation_code, 
            department_id, 
            grade_level,
            description, 
            status = 'active', 
            created_by 
        } = designationData;
        
        const query = `
            INSERT INTO designations_master (
                designation_name, designation_code, department_id, grade_level, description, status, created_by, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            designation_name, designation_code, department_id || null, grade_level || null, 
            description || null, status, created_by || null
        ]);
        return result.insertId;
    }

    static async update(id, designationData) {
        const allowedFields = [
            'designation_name', 'designation_code', 'department_id', 'grade_level', 'description', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (designationData[field] !== undefined) {
                updates.push(`${field} = ?`);
                if (field === 'department_id' && designationData[field] === null) {
                    params.push(null);
                } else {
                    params.push(designationData[field]);
                }
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE designations_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE designations_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE designations_master SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE designations_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async hasEmployees(id) {
        const query = 'SELECT COUNT(*) as count FROM employees WHERE designation_id = ? AND status = "active"';
        const [rows] = await pool.query(query, [id]);
        return rows[0].count > 0;
    }

    static async designationNameExists(designationName, excludeId = null) {
        let query = 'SELECT id FROM designations_master WHERE designation_name = ?';
        const params = [designationName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async designationCodeExists(designationCode, excludeId = null) {
        let query = 'SELECT id FROM designations_master WHERE designation_code = ?';
        const params = [designationCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async generateDesignationCode(prefix = 'DES') {
        const query = `
            SELECT designation_code FROM designations_master 
            WHERE designation_code LIKE ? 
            ORDER BY designation_code DESC 
            LIMIT 1
        `;
        const [rows] = await pool.query(query, [`${prefix}%`]);
        
        if (rows.length === 0) {
            return `${prefix}001`;
        }
        
        const lastCode = rows[0].designation_code;
        const numPart = parseInt(lastCode.replace(prefix, ''), 10);
        const newNum = numPart + 1;
        return `${prefix}${String(newNum).padStart(3, '0')}`;
    }
}

module.exports = {
    UserModel,
    RoleModel,
    LoginAttemptModel,
    PasswordHistoryModel,
    PasswordResetTokenModel,
    RefreshTokenModel,
    DepartmentModel,
    EducationModel,
    CourseModel,
    EducationCourseMapModel,
    LocationModel,
    DesignationModel
};
