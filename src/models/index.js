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
        let whereClause = "WHERE 1=1";
        const params = [];

        if (search) {
            whereClause += " AND (u.username LIKE ? OR u.email LIKE ? OR u.mobile LIKE ? OR e.employee_code LIKE ? OR e.first_name LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += " AND u.account_status = ?";
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM users u
            LEFT JOIN employees e ON u.employee_id = e.id
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                u.id, u.employee_id, u.username, u.email, u.mobile, u.account_status as status, 
                u.profile_photo, u.two_factor_enabled, u.password_changed_at, u.last_login,
                u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name,
                e.employee_code, e.first_name, e.last_name,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN employees e ON u.employee_id = e.id
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
                u.id, u.employee_id, u.username, u.email, u.mobile, u.account_status as status, 
                u.profile_photo, u.two_factor_enabled, u.password_changed_at, u.last_login,
                u.password, u.created_at, u.updated_at,
                r.id as role_id, r.name as role_name,
                e.employee_code, e.first_name, e.last_name,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN employees e ON u.employee_id = e.id
            WHERE u.id = ? AND u.account_status != 'deleted'
        `;
        const [rows] = await pool.query(query, [id]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async findByEmail(email) {
        const query = `
            SELECT 
                u.*, r.name as role_name,
                e.employee_code, e.first_name, e.last_name,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN employees e ON u.employee_id = e.id
            WHERE u.email = ? AND u.account_status != 'deleted'
        `;
        const [rows] = await pool.query(query, [email]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async findByUsername(username) {
        const query = `
            SELECT 
                u.*, r.name as role_name,
                e.employee_code, e.first_name, e.last_name,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name
            FROM users u
            LEFT JOIN roles r ON u.role_id = r.id
            LEFT JOIN employees e ON u.employee_id = e.id
            WHERE u.username = ? AND u.account_status != 'deleted'
        `;
        const [rows] = await pool.query(query, [username]);
        return transformUserWithProfileUrl(rows[0] || null);
    }

    static async create(userData) {
        const { username, email, mobile, password, role_id, employee_id, status = 'active', profile_photo, created_by } = userData;
        
        const query = `
            INSERT INTO users (username, email, mobile, password, role_id, employee_id, account_status, profile_photo, password_changed_at, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `;
        
        const [result] = await pool.query(query, [username, email, mobile, password, role_id, employee_id || null, status, profile_photo || null, created_by || null]);
        return result.insertId;
    }

    static async update(id, userData) {
        const allowedFields = ['username', 'email', 'mobile', 'role_id', 'account_status', 'profile_photo', 'updated_by'];
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
        const query = `UPDATE users SET account_status = 'deleted', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE users SET account_status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE users SET account_status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async block(id) {
        const query = `UPDATE users SET account_status = 'blocked', updated_at = NOW() WHERE id = ?`;
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

class EmploymentTypeModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += ' AND (et.employment_type_name LIKE ? OR et.employment_type_code LIKE ? OR et.description LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND et.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM employment_type_master et
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                et.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM employment_type_master et
            LEFT JOIN users cu ON et.created_by = cu.id
            LEFT JOIN users uu ON et.updated_by = uu.id
            ${whereClause}
            ORDER BY et.employment_type_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            employment_types: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                et.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM employment_type_master et
            LEFT JOIN users cu ON et.created_by = cu.id
            LEFT JOIN users uu ON et.updated_by = uu.id
            WHERE et.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByName(employmentTypeName, excludeId = null) {
        let query = 'SELECT * FROM employment_type_master WHERE employment_type_name = ?';
        const params = [employmentTypeName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async findByCode(employmentTypeCode, excludeId = null) {
        let query = 'SELECT * FROM employment_type_master WHERE employment_type_code = ?';
        const params = [employmentTypeCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows[0] || null;
    }

    static async create(employmentTypeData) {
        const { employment_type_name, employment_type_code, description, status = 'active', created_by } = employmentTypeData;
        
        const query = `
            INSERT INTO employment_type_master (employment_type_name, employment_type_code, description, status, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [employment_type_name, employment_type_code, description || null, status, created_by || null]);
        return result.insertId;
    }

    static async update(id, employmentTypeData) {
        const allowedFields = ['employment_type_name', 'employment_type_code', 'description', 'status', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (employmentTypeData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(employmentTypeData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employment_type_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async softDelete(id) {
        const query = `UPDATE employment_type_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async activate(id) {
        const query = `UPDATE employment_type_master SET status = 'active', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deactivate(id) {
        const query = `UPDATE employment_type_master SET status = 'inactive', updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async employmentTypeNameExists(employmentTypeName, excludeId = null) {
        let query = 'SELECT id FROM employment_type_master WHERE employment_type_name = ?';
        const params = [employmentTypeName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async employmentTypeCodeExists(employmentTypeCode, excludeId = null) {
        let query = 'SELECT id FROM employment_type_master WHERE employment_type_code = ?';
        const params = [employmentTypeCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async hasMappings(id) {
        const query = 'SELECT COUNT(*) as count FROM employee_job_details WHERE employment_type_id = ?';
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
        const query = 'SELECT * FROM designations_master WHERE department_id = ? AND status = \'active\' ORDER BY designation_name ASC';
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
        const query = 'SELECT COUNT(*) as count FROM employees WHERE designation_id = ? AND deleted_at IS NULL';
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

// =====================================================================
// SECTION 10: PERFORMANCE MANAGEMENT MODELS
// =====================================================================

class PerformanceCycleModel {
    static async findAll({ page = 1, limit = 10, status = '', cycle_type = '', fiscal_year = null }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND pc.status = ?';
            params.push(status);
        }

        if (cycle_type) {
            whereClause += ' AND pc.cycle_type = ?';
            params.push(cycle_type);
        }

        if (fiscal_year) {
            whereClause += ' AND pc.fiscal_year = ?';
            params.push(fiscal_year);
        }

        const countQuery = `SELECT COUNT(*) as total FROM performance_cycles pc ${whereClause}`;
        const dataQuery = `
            SELECT 
                pc.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM performance_cycles pc
            LEFT JOIN users cu ON pc.created_by = cu.id
            LEFT JOIN users uu ON pc.updated_by = uu.id
            ${whereClause}
            ORDER BY pc.start_date DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            cycles: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                pc.*,
                cu.username as created_by_username,
                uu.username as updated_by_username
            FROM performance_cycles pc
            LEFT JOIN users cu ON pc.created_by = cu.id
            LEFT JOIN users uu ON pc.updated_by = uu.id
            WHERE pc.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByFiscalYearAndQuarter(fiscal_year, quarter) {
        const query = 'SELECT * FROM performance_cycles WHERE fiscal_year = ? AND quarter = ? AND cycle_type = "quarterly"';
        const [rows] = await pool.query(query, [fiscal_year, quarter]);
        return rows[0] || null;
    }

    static async create(cycleData) {
        const { cycle_name, cycle_code, cycle_type, fiscal_year, quarter, start_date, end_date, self_rating_start, self_rating_end, manager_rating_start, manager_rating_end, hr_review_start, hr_review_end, created_by } = cycleData;
        
        const query = `
            INSERT INTO performance_cycles (
                cycle_name, cycle_code, cycle_type, fiscal_year, quarter, start_date, end_date,
                self_rating_start, self_rating_end, manager_rating_start, manager_rating_end,
                hr_review_start, hr_review_end, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            cycle_name, cycle_code, cycle_type, fiscal_year, quarter, start_date, end_date,
            self_rating_start, self_rating_end, manager_rating_start, manager_rating_end,
            hr_review_start, hr_review_end, created_by
        ]);
        return result.insertId;
    }

    static async update(id, cycleData) {
        const allowedFields = [
            'cycle_name', 'cycle_code', 'cycle_type', 'fiscal_year', 'quarter',
            'start_date', 'end_date', 'self_rating_start', 'self_rating_end',
            'manager_rating_start', 'manager_rating_end', 'hr_review_start', 'hr_review_end',
            'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (cycleData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(cycleData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE performance_cycles SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async updateStatus(id, status) {
        const query = `UPDATE performance_cycles SET status = ?, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, [status, id]);
        return result.affectedRows > 0;
    }

    static async findActiveCycles() {
        const query = 'SELECT * FROM performance_cycles WHERE status IN ("active", "self_rating_open", "manager_rating_open") ORDER BY start_date DESC';
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findCyclesForNotification(type) {
        const now = new Date();
        let dateField;
        
        switch(type) {
            case 'self_rating_reminder':
                dateField = 'self_rating_end';
                break;
            case 'manager_rating_reminder':
                dateField = 'manager_rating_end';
                break;
            default:
                dateField = 'end_date';
        }
        
        const query = `
            SELECT * FROM performance_cycles 
            WHERE status IN ('self_rating_open', 'manager_rating_open') 
            AND DATEDIFF(?, ${dateField}) <= 15 
            AND DATEDIFF(?, ${dateField}) >= 0
        `;
        const [rows] = await pool.query(query, [now, now]);
        return rows;
    }
}

class PerformanceGoalModel {
    static async findAll({ page = 1, limit = 10, cycle_id = null, employee_id = null, manager_id = null, status = '', paginate = true }) {
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (cycle_id) {
            whereClause += ' AND g.cycle_id = ?';
            params.push(cycle_id);
        }

        if (employee_id) {
            whereClause += ' AND g.employee_id = ?';
            params.push(employee_id);
        }

        if (manager_id) {
            whereClause += ' AND g.manager_id = ?';
            params.push(manager_id);
        }

        if (status) {
            whereClause += ' AND g.status = ?';
            params.push(status);
        }

        let countResult = null;
        if (paginate) {
            const countQuery = `SELECT COUNT(*) as total FROM performance_goals g ${whereClause}`;
            const [countRes] = await pool.query(countQuery, params);
            countResult = countRes;
        }

        const dataQuery = `
            SELECT 
                g.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                m.employee_code as manager_code,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                pc.cycle_name,
                cu.username as created_by_username
            FROM performance_goals g
            LEFT JOIN employees e ON g.employee_id = e.id
            LEFT JOIN employees m ON g.manager_id = m.id
            LEFT JOIN performance_cycles pc ON g.cycle_id = pc.id
            LEFT JOIN users cu ON g.created_by = cu.id
            ${whereClause}
            ORDER BY g.created_at DESC
            ${paginate ? 'LIMIT ? OFFSET ?' : ''}
        `;

        const queryParams = [...params];
        if (paginate) {
            queryParams.push(limit, (page - 1) * limit);
        }

        const [rows] = await pool.query(dataQuery, queryParams);

        if (paginate) {
            return {
                goals: rows,
                total: countResult[0].total,
                page,
                limit,
                totalPages: Math.ceil(countResult[0].total / limit)
            };
        } else {
            return {
                goals: rows,
                total: rows.length
            };
        }
    }

    static async findById(id) {
        const query = `
            SELECT 
                g.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                m.employee_code as manager_code,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                pc.cycle_name
            FROM performance_goals g
            LEFT JOIN employees e ON g.employee_id = e.id
            LEFT JOIN employees m ON g.manager_id = m.id
            LEFT JOIN performance_cycles pc ON g.cycle_id = pc.id
            WHERE g.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByCycleAndEmployee(cycle_id, employee_id) {
        const query = `
            SELECT * FROM performance_goals 
            WHERE cycle_id = ? AND employee_id = ? 
            ORDER BY priority DESC, created_at ASC
        `;
        const [rows] = await pool.query(query, [cycle_id, employee_id]);
        return rows;
    }

    static async create(goalData) {
        const { cycle_id, employee_id, manager_id, goal_title, goal_description, kpi_description, target_value, weightage, priority, created_by } = goalData;
        
        const query = `
            INSERT INTO performance_goals (
                cycle_id, employee_id, manager_id, goal_title, goal_description,
                kpi_description, target_value, weightage, priority, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            cycle_id, employee_id, manager_id, goal_title, goal_description,
            kpi_description, target_value, weightage, priority, created_by
        ]);
        return result.insertId;
    }

    static async update(id, goalData) {
        const allowedFields = [
            'goal_title', 'goal_description', 'kpi_description', 'target_value',
            'weightage', 'priority', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (goalData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(goalData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE performance_goals SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM performance_goals WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async getGoalsWithRatings(cycle_id, employee_id) {
        const query = `
            SELECT 
                g.*,
                sr.self_rating,
                sr.what_achieved,
                sr.what_missed,
                sr.achievement_summary,
                mr.manager_rating,
                mr.what_employee_did_well,
                mr.areas_of_improvement
            FROM performance_goals g
            LEFT JOIN performance_self_ratings sr ON g.id = sr.goal_id
            LEFT JOIN performance_manager_ratings mr ON g.id = mr.goal_id
            WHERE g.cycle_id = ? AND g.employee_id = ?
            ORDER BY g.priority DESC, g.created_at ASC
        `;
        const [rows] = await pool.query(query, [cycle_id, employee_id]);
        return rows;
    }
}

class PerformanceSelfRatingModel {
    static async findByGoalId(goal_id) {
        const query = 'SELECT * FROM performance_self_ratings WHERE goal_id = ?';
        const [rows] = await pool.query(query, [goal_id]);
        return rows[0] || null;
    }

    static async findByCycleAndEmployee(cycle_id, employee_id) {
        const query = `
            SELECT sr.*, g.goal_title, g.weightage
            FROM performance_self_ratings sr
            JOIN performance_goals g ON sr.goal_id = g.id
            WHERE sr.cycle_id = ? AND sr.employee_id = ?
        `;
        const [rows] = await pool.query(query, [cycle_id, employee_id]);
        return rows;
    }

    static async create(ratingData) {
        const { goal_id, employee_id, cycle_id, self_rating, achievement_summary, what_achieved, what_missed, challenges_faced, supporting_evidence, created_by } = ratingData;
        
        const query = `
            INSERT INTO performance_self_ratings (
                goal_id, employee_id, cycle_id, self_rating, achievement_summary,
                what_achieved, what_missed, challenges_faced, supporting_evidence, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            goal_id, employee_id, cycle_id, self_rating, achievement_summary,
            what_achieved, what_missed, challenges_faced, supporting_evidence, created_by
        ]);
        return result.insertId;
    }

    static async update(goal_id, ratingData) {
        const allowedFields = [
            'self_rating', 'achievement_summary', 'what_achieved', 'what_missed',
            'challenges_faced', 'supporting_evidence', 'status', 'submitted_at', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (ratingData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(ratingData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(goal_id);
        const query = `UPDATE performance_self_ratings SET ${updates.join(', ')}, updated_at = NOW() WHERE goal_id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async submitAll(cycle_id, employee_id) {
        const query = `
            UPDATE performance_self_ratings 
            SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
            WHERE cycle_id = ? AND employee_id = ? AND status = 'draft'
        `;
        const [result] = await pool.query(query, [cycle_id, employee_id]);
        return result.affectedRows > 0;
    }
}

class PerformanceManagerRatingModel {
    static async findByGoalId(goal_id) {
        const query = 'SELECT * FROM performance_manager_ratings WHERE goal_id = ?';
        const [rows] = await pool.query(query, [goal_id]);
        return rows[0] || null;
    }

    static async findByCycleAndEmployee(cycle_id, employee_id) {
        const query = `
            SELECT mr.*, g.goal_title, g.weightage, sr.self_rating
            FROM performance_manager_ratings mr
            JOIN performance_goals g ON mr.goal_id = g.id
            LEFT JOIN performance_self_ratings sr ON g.id = sr.goal_id
            WHERE mr.cycle_id = ? AND mr.employee_id = ?
        `;
        const [rows] = await pool.query(query, [cycle_id, employee_id]);
        return rows;
    }

    static async create(ratingData) {
        const { goal_id, employee_id, manager_id, cycle_id, manager_rating, manager_comments, what_employee_did_well, areas_of_improvement, manager_feedback, final_rating, created_by } = ratingData;
        
        const query = `
            INSERT INTO performance_manager_ratings (
                goal_id, employee_id, manager_id, cycle_id, manager_rating, manager_comments,
                what_employee_did_well, areas_of_improvement, manager_feedback, final_rating, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            goal_id, employee_id, manager_id, cycle_id, manager_rating, manager_comments,
            what_employee_did_well, areas_of_improvement, manager_feedback, final_rating, created_by
        ]);
        return result.insertId;
    }

    static async update(goal_id, ratingData) {
        const allowedFields = [
            'manager_rating', 'manager_comments', 'what_employee_did_well', 'areas_of_improvement',
            'manager_feedback', 'final_rating', 'status', 'submitted_at', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (ratingData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(ratingData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(goal_id);
        const query = `UPDATE performance_manager_ratings SET ${updates.join(', ')}, updated_at = NOW() WHERE goal_id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async submitAll(cycle_id, manager_id) {
        const query = `
            UPDATE performance_manager_ratings 
            SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
            WHERE cycle_id = ? AND manager_id = ? AND status = 'pending'
        `;
        const [result] = await pool.query(query, [cycle_id, manager_id]);
        return result.affectedRows > 0;
    }
}

class PerformanceOverallRatingModel {
    static async findByCycleAndEmployee(cycle_id, employee_id) {
        const query = 'SELECT * FROM performance_overall_ratings WHERE cycle_id = ? AND employee_id = ?';
        const [rows] = await pool.query(query, [cycle_id, employee_id]);
        return rows[0] || null;
    }

    static async create(ratingData) {
        const { cycle_id, employee_id, manager_id, average_self_rating, average_manager_rating, overall_rating, rating_category, manager_summary, created_by } = ratingData;
        
        const query = `
            INSERT INTO performance_overall_ratings (
                cycle_id, employee_id, manager_id, average_self_rating, average_manager_rating,
                overall_rating, rating_category, manager_summary, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            cycle_id, employee_id, manager_id, average_self_rating, average_manager_rating,
            overall_rating, rating_category, manager_summary, created_by
        ]);
        return result.insertId;
    }

    static async update(cycle_id, employee_id, ratingData) {
        const allowedFields = [
            'average_self_rating', 'average_manager_rating', 'overall_rating', 'rating_category',
            'manager_summary', 'employee_comments', 'hr_comments', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (ratingData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(ratingData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(cycle_id, employee_id);
        const query = `UPDATE performance_overall_ratings SET ${updates.join(', ')}, updated_at = NOW() WHERE cycle_id = ? AND employee_id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async hrApprove(cycle_id, employee_id, hr_approved_by) {
        const query = `
            UPDATE performance_overall_ratings 
            SET status = 'hr_approved', hr_approved_by = ?, hr_approved_at = NOW(), updated_at = NOW()
            WHERE cycle_id = ? AND employee_id = ?
        `;
        const [result] = await pool.query(query, [hr_approved_by, cycle_id, employee_id]);
        return result.affectedRows > 0;
    }

    static async findAll({ page = 1, limit = 10, cycle_id = null, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (cycle_id) {
            whereClause += ' AND orat.cycle_id = ?';
            params.push(cycle_id);
        }

        if (status) {
            whereClause += ' AND orat.status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM performance_overall_ratings orat ${whereClause}`;
        
        const dataQuery = `
            SELECT 
                orat.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name,
                CONCAT(m.first_name, ' ', COALESCE(m.last_name, '')) as manager_name,
                pc.cycle_name
            FROM performance_overall_ratings orat
            LEFT JOIN employees e ON orat.employee_id = e.id
            LEFT JOIN employees m ON orat.manager_id = m.id
            LEFT JOIN performance_cycles pc ON orat.cycle_id = pc.id
            ${whereClause}
            ORDER BY orat.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            ratings: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }
}

class PerformanceAnnualSummaryModel {
    static async findByYearAndEmployee(fiscal_year, employee_id) {
        const query = 'SELECT * FROM performance_annual_summaries WHERE fiscal_year = ? AND employee_id = ?';
        const [rows] = await pool.query(query, [fiscal_year, employee_id]);
        return rows[0] || null;
    }

    static async create(summaryData) {
        const { fiscal_year, employee_id, q1_rating, q2_rating, q3_rating, q4_rating, annual_average_rating, final_rating_category, manager_overall_comments, created_by } = summaryData;
        
        const query = `
            INSERT INTO performance_annual_summaries (
                fiscal_year, employee_id, q1_rating, q2_rating, q3_rating, q4_rating,
                annual_average_rating, final_rating_category, manager_overall_comments, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            fiscal_year, employee_id, q1_rating, q2_rating, q3_rating, q4_rating,
            annual_average_rating, final_rating_category, manager_overall_comments, created_by
        ]);
        return result.insertId;
    }

    static async update(fiscal_year, employee_id, summaryData) {
        const allowedFields = [
            'q1_rating', 'q2_rating', 'q3_rating', 'q4_rating', 'annual_average_rating',
            'final_rating_category', 'manager_overall_comments', 'hr_overall_comments', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (summaryData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(summaryData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(fiscal_year, employee_id);
        const query = `UPDATE performance_annual_summaries SET ${updates.join(', ')}, updated_at = NOW() WHERE fiscal_year = ? AND employee_id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async hrApprove(fiscal_year, employee_id, hr_approved_by) {
        const query = `
            UPDATE performance_annual_summaries 
            SET status = 'hr_approved', hr_approved_by = ?, hr_approved_at = NOW(), updated_at = NOW()
            WHERE fiscal_year = ? AND employee_id = ?
        `;
        const [result] = await pool.query(query, [hr_approved_by, fiscal_year, employee_id]);
        return result.affectedRows > 0;
    }

    static async findAll({ page = 1, limit = 10, fiscal_year = null, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (fiscal_year) {
            whereClause += ' AND pas.fiscal_year = ?';
            params.push(fiscal_year);
        }

        if (status) {
            whereClause += ' AND pas.status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM performance_annual_summaries pas ${whereClause}`;
        
        const dataQuery = `
            SELECT 
                pas.*,
                e.employee_code,
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as employee_name
            FROM performance_annual_summaries pas
            LEFT JOIN employees e ON pas.employee_id = e.id
            ${whereClause}
            ORDER BY pas.fiscal_year DESC, pas.created_at DESC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            summaries: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }
}

class PerformanceNotificationModel {
    static async create(notificationData) {
        const { cycle_id, recipient_id, sender_id, notification_type, subject, message, scheduled_for, created_by } = notificationData;
        
        const query = `
            INSERT INTO performance_notifications (
                cycle_id, recipient_id, sender_id, notification_type, subject, message, scheduled_for, created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            cycle_id, recipient_id, sender_id, notification_type, subject, message, scheduled_for, created_by
        ]);
        return result.insertId;
    }

    static async updateStatus(id, status, sent_at = null) {
        const query = `UPDATE performance_notifications SET status = ?, sent_at = ? WHERE id = ?`;
        const [result] = await pool.query(query, [status, sent_at, id]);
        return result.affectedRows > 0;
    }

    static async findPendingNotifications() {
        const query = `
            SELECT * FROM performance_notifications 
            WHERE status = 'pending' AND scheduled_for <= NOW()
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findByCycleAndRecipient(cycle_id, recipient_id, notification_type) {
        const query = `
            SELECT * FROM performance_notifications 
            WHERE cycle_id = ? AND recipient_id = ? AND notification_type = ?
            ORDER BY created_at DESC LIMIT 1
        `;
        const [rows] = await pool.query(query, [cycle_id, recipient_id, notification_type]);
        return rows[0] || null;
    }
}

const EmployeeModel = require('./employeeModel');
const EmployeeJobModel = require('./employeeJobModel');
const EmployeeAddressModel = require('./employeeAddressModel');
const EmployeeBankModel = require('./employeeBankModel');
const EmployeeEducationModel = require('./employeeEducationModel');
const EmployeeExperienceModel = require('./employeeExperienceModel');
const DocumentsMasterModel = require('./documentsMasterModel');
const EmployeeDocumentModel = require('./employeeDocumentModel');
const ShiftModel = require('./shiftModel');

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
    EmploymentTypeModel,
    EducationCourseMapModel,
    LocationModel,
    DesignationModel,
    PerformanceCycleModel,
    PerformanceGoalModel,
    PerformanceSelfRatingModel,
    PerformanceManagerRatingModel,
    PerformanceOverallRatingModel,
    PerformanceAnnualSummaryModel,
    PerformanceNotificationModel,
    EmployeeModel,
    EmployeeJobModel,
    EmployeeAddressModel,
    EmployeeBankModel,
    EmployeeEducationModel,
    EmployeeExperienceModel,
    DocumentsMasterModel,
    EmployeeDocumentModel,
    ShiftModel
};
