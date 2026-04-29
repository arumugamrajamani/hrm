const { pool } = require('../config/database');

class DocumentsMasterModel {
    static async findAll({ page = 1, limit = 10, search = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (search) {
            whereClause += " AND (dm.document_name LIKE ? OR dm.document_code LIKE ? OR dm.description LIKE ?)";
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        if (status) {
            whereClause += ' AND dm.status = ?';
            params.push(status);
        }

        const countQuery = `
            SELECT COUNT(*) as total 
            FROM documents_master dm
            ${whereClause}
        `;

        const dataQuery = `
            SELECT 
                dm.*,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM documents_master dm
            LEFT JOIN users u1 ON dm.created_by = u1.id
            LEFT JOIN users u2 ON dm.updated_by = u2.id
            ${whereClause}
            ORDER BY dm.is_mandatory DESC, dm.document_name ASC
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            documents: rows,
            total: countResult[0].total,
            page,
            limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findById(id) {
        const query = `
            SELECT 
                dm.*,
                u1.username as created_by_username,
                u2.username as updated_by_username
            FROM documents_master dm
            LEFT JOIN users u1 ON dm.created_by = u1.id
            LEFT JOIN users u2 ON dm.updated_by = u2.id
            WHERE dm.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async findByCode(code) {
        const query = 'SELECT * FROM documents_master WHERE document_code = ?';
        const [rows] = await pool.query(query, [code]);
        return rows[0] || null;
    }

    static async findByName(name) {
        const query = 'SELECT * FROM documents_master WHERE document_name = ?';
        const [rows] = await pool.query(query, [name]);
        return rows[0] || null;
    }

    static async findMandatory() {
        const query = `
            SELECT * FROM documents_master 
            WHERE is_mandatory = TRUE AND status = 'active'
            ORDER BY document_name ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async findActive() {
        const query = `
            SELECT * FROM documents_master 
            WHERE status = 'active'
            ORDER BY is_mandatory DESC, document_name ASC
        `;
        const [rows] = await pool.query(query);
        return rows;
    }

    static async create(documentData) {
        const query = `
            INSERT INTO documents_master (
                document_name, document_code, description, is_mandatory, status,
                created_by, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;

        const [result] = await pool.query(query, [
            documentData.document_name,
            documentData.document_code,
            documentData.description || null,
            documentData.is_mandatory || false,
            documentData.status || 'active',
            documentData.created_by || null
        ]);

        return result.insertId;
    }

    static async update(id, documentData) {
        const allowedFields = ['document_name', 'document_code', 'description', 'is_mandatory', 'status', 'updated_by'];
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
        const query = `UPDATE documents_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const query = 'DELETE FROM documents_master WHERE id = ?';
        const [result] = await pool.query(query, [id]);
        return result.affectedRows > 0;
    }

    static async documentNameExists(documentName, excludeId = null) {
        let query = 'SELECT id FROM documents_master WHERE document_name = ?';
        const params = [documentName];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }

    static async documentCodeExists(documentCode, excludeId = null) {
        let query = 'SELECT id FROM documents_master WHERE document_code = ?';
        const params = [documentCode];
        
        if (excludeId) {
            query += ' AND id != ?';
            params.push(excludeId);
        }
        
        const [rows] = await pool.query(query, params);
        return rows.length > 0;
    }
}

module.exports = DocumentsMasterModel;
