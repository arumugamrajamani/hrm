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

module.exports = {
    UserModel,
    RoleModel,
    LoginAttemptModel,
    PasswordHistoryModel,
    PasswordResetTokenModel,
    RefreshTokenModel
};
