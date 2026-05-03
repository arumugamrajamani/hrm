const { pool } = require('../config/database');

class EmployeeDocumentModel {
    static async findById(id) {
        const query = `
            SELECT 
                ed.*,
                e.employee_code, e.first_name, e.last_name,
                dm.document_name, dm.document_code, dm.is_mandatory,
                u1.username as uploaded_by_username,
                u2.username as verified_by_username
            FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.verified_by = u2.id
            WHERE ed.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByEmployeeId(employeeId) {
        const query = `
            SELECT 
                ed.*,
                dm.document_name, dm.document_code, dm.is_mandatory,
                u1.username as uploaded_by_username,
                u2.username as verified_by_username
            FROM employee_documents ed
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.verified_by = u2.id
            WHERE ed.employee_id = ?
            ORDER BY dm.is_mandatory DESC, dm.document_name ASC, ed.uploaded_at DESC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async findByDocumentType(employeeId, documentId) {
        const query = `
            SELECT 
                ed.*,
                dm.document_name, dm.document_code, dm.is_mandatory,
                u1.username as uploaded_by_username,
                u2.username as verified_by_username
            FROM employee_documents ed
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            LEFT JOIN users u2 ON ed.verified_by = u2.id
            WHERE ed.employee_id = ? AND ed.document_id = ?
            ORDER BY ed.uploaded_at DESC
        `;
        const [rows] = await pool.query(query, [employeeId, documentId]);
        return rows;
    }

    static async create(documentData) {
        const query = `
            INSERT INTO employee_documents (
                employee_id, document_id, file_path, file_name, file_type, file_size,
                verified_status, uploaded_by, uploaded_at, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `;

        const [result] = await pool.query(query, [
            documentData.employee_id,
            documentData.document_id,
            documentData.file_path,
            documentData.file_name || null,
            documentData.file_type || null,
            documentData.file_size || null,
            documentData.verified_status || 'pending',
            documentData.uploaded_by || null
        ]);

        return result.insertId;
    }

    static async update(id, documentData) {
        const allowedFields = ['file_path', 'file_name', 'file_type', 'file_size', 'expires_at', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (documentData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(documentData[field]);
            }
        }

        if (updates.length === 0) return false;

        params.push(id);
        const query = `UPDATE employee_documents SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async verify(id, verifiedBy) {
        const query = `
            UPDATE employee_documents
            SET verified_status = 'verified', verified_by = ?, verified_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [verifiedBy, id]);
        return result.affectedRows > 0;
    }

    static async reject(id, verifiedBy, reason) {
        const query = `
            UPDATE employee_documents
            SET verified_status = 'rejected', rejection_reason = ?, verified_by = ?, verified_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `;
        const [result] = await pool.query(query, [reason, verifiedBy, id]);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM employee_documents WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async deleteByEmployeeId(employeeId) {
        const query = 'DELETE FROM employee_documents WHERE employee_id = ?';
        const [result] = await pool.query(query, [employeeId]);
        return result.affectedRows;
    }

    static async getDocumentStatus(employeeId) {
        const query = `
            SELECT 
                dm.id as document_id,
                dm.document_name,
                dm.document_code,
                dm.is_mandatory,
                ed.id as uploaded_id,
                ed.verified_status,
                ed.uploaded_at,
                ed.expires_at,
                CASE 
                    WHEN ed.id IS NULL THEN 'missing'
                    WHEN ed.verified_status = 'verified' AND (ed.expires_at IS NULL OR ed.expires_at > NOW()) THEN 'valid'
                    WHEN ed.verified_status = 'verified' AND ed.expires_at <= NOW() THEN 'expired'
                    WHEN ed.verified_status = 'pending' THEN 'pending'
                    WHEN ed.verified_status = 'rejected' THEN 'rejected'
                    ELSE 'unknown'
                END as status
            FROM documents_master dm
            LEFT JOIN employee_documents ed ON dm.id = ed.document_id AND ed.employee_id = ?
            WHERE dm.status = 'active'
            ORDER BY dm.is_mandatory DESC, dm.document_name ASC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getMandatoryDocumentStatus(employeeId) {
        const query = `
            SELECT 
                dm.id as document_id,
                dm.document_name,
                dm.document_code,
                ed.id as uploaded_id,
                ed.verified_status,
                CASE 
                    WHEN ed.id IS NULL THEN 'missing'
                    WHEN ed.verified_status = 'verified' THEN 'uploaded'
                    WHEN ed.verified_status = 'pending' THEN 'pending'
                    WHEN ed.verified_status = 'rejected' THEN 'rejected'
                    ELSE 'unknown'
                END as status
            FROM documents_master dm
            LEFT JOIN employee_documents ed ON dm.id = ed.document_id AND ed.employee_id = ?
            WHERE dm.is_mandatory = TRUE AND dm.status = 'active'
            ORDER BY dm.document_name ASC
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows;
    }

    static async getPendingVerifications() {
        const query = `
            SELECT 
                ed.*,
                e.employee_code, e.first_name, e.last_name,
                dm.document_name, dm.document_code, dm.is_mandatory,
                u1.username as uploaded_by_username
            FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            WHERE ed.verified_status = 'pending' AND e.deleted_at IS NULL
            ORDER BY dm.is_mandatory DESC, ed.uploaded_at ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getExpiredDocuments() {
        const query = `
            SELECT 
                ed.*,
                e.employee_code, e.first_name, e.last_name,
                dm.document_name, dm.document_code,
                u1.username as uploaded_by_username
            FROM employee_documents ed
            JOIN employees e ON ed.employee_id = e.id
            JOIN documents_master dm ON ed.document_id = dm.id
            LEFT JOIN users u1 ON ed.uploaded_by = u1.id
            WHERE ed.expires_at <= NOW() 
                AND ed.verified_status = 'verified'
                AND e.deleted_at IS NULL
            ORDER BY ed.expires_at ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async getVerificationSummary(employeeId) {
        const query = `
            SELECT 
                COUNT(*) as total_required,
                SUM(CASE WHEN dm.is_mandatory = TRUE THEN 1 ELSE 0 END) as mandatory_count,
                SUM(CASE WHEN ed.id IS NOT NULL AND ed.verified_status = 'verified' THEN 1 ELSE 0 END) as verified_count,
                SUM(CASE WHEN ed.id IS NOT NULL AND ed.verified_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
                SUM(CASE WHEN ed.id IS NOT NULL AND ed.verified_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
                SUM(CASE WHEN ed.id IS NULL AND dm.is_mandatory = TRUE THEN 1 ELSE 0 END) as missing_count
            FROM documents_master dm
            LEFT JOIN employee_documents ed ON dm.id = ed.document_id AND ed.employee_id = ?
            WHERE dm.status = 'active'
        `;
        const [rows] = await pool.query(query, [employeeId]);
        return rows[0];
    }

    static async reupload(id, documentData) {
        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();

            const [existing] = await conn.query(
                'SELECT employee_id, document_id FROM employee_documents WHERE id = ?',
                [id]
            );

            if (existing.length === 0) {
                await conn.rollback();
                return null;
            }

            await conn.query(
                'UPDATE employee_documents SET verified_status = ? WHERE id = ?',
                ['reuploaded', id]
            );

            const insertQuery = `
                INSERT INTO employee_documents (
                    employee_id, document_id, file_path, file_name, file_type, file_size,
                    verified_status, uploaded_by, uploaded_at, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(), NOW())
            `;

            const [result] = await conn.query(insertQuery, [
                existing[0].employee_id,
                existing[0].document_id,
                documentData.file_path,
                documentData.file_name || null,
                documentData.file_type || null,
                documentData.file_size || null,
                documentData.uploaded_by || null
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
}

module.exports = EmployeeDocumentModel;
