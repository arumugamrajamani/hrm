const { pool } = require('../config/database');

class MasterDataModel {
    // ==================== COMPANIES ====================
    static async findAllCompanies({ page = 1, limit = 10, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM companies ${whereClause}`;
        const dataQuery = `
            SELECT *, 
                (SELECT COUNT(*) FROM business_units WHERE company_id = companies.id) as unit_count
            FROM companies 
            ${whereClause}
            ORDER BY company_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            companies: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findCompanyById(id) {
        const query = `SELECT * FROM companies WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createCompany(companyData) {
        const { company_name, company_code, registration_number, tax_id, address, city, state, country, pincode, phone, email, website, is_headquarters, created_by } = companyData;
        
        const query = `
            INSERT INTO companies 
            (company_name, company_code, registration_number, tax_id, address, city, state, country, pincode, phone, email, website, is_headquarters, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            company_name, company_code, registration_number, tax_id, address, city, state, country, pincode, phone, email, website, is_headquarters, created_by
        ]);
        
        return result.insertId;
    }

    static async updateCompany(id, companyData) {
        const allowedFields = [
            'company_name', 'company_code', 'registration_number', 'tax_id', 'address',
            'city', 'state', 'country', 'pincode', 'phone', 'email', 'website',
            'is_headquarters', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (companyData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(companyData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE companies SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    // ==================== BUSINESS UNITS ====================
    static async findAllBusinessUnits({ page = 1, limit = 10, company_id = null, status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (company_id) {
            whereClause += ' AND bu.company_id = ?';
            params.push(company_id);
        }

        if (status) {
            whereClause += ' AND bu.status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM business_units bu ${whereClause}`;
        const dataQuery = `
            SELECT 
                bu.*, c.company_name, 
                CONCAT(e.first_name, ' ', COALESCE(e.last_name, '')) as head_name,
                (SELECT COUNT(*) FROM departments WHERE business_unit_id = bu.id) as dept_count
            FROM business_units bu
            LEFT JOIN companies c ON bu.company_id = c.id
            LEFT JOIN employees e ON bu.head_of_unit = e.id
            ${whereClause}
            ORDER BY bu.unit_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            business_units: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findBusinessUnitById(id) {
        const query = `
            SELECT bu.*, c.company_name
            FROM business_units bu
            LEFT JOIN companies c ON bu.company_id = c.id
            WHERE bu.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createBusinessUnit(unitData) {
        const { unit_name, unit_code, company_id, parent_unit_id, description, head_of_unit, cost_center, created_by } = unitData;
        
        const query = `
            INSERT INTO business_units 
            (unit_name, unit_code, company_id, parent_unit_id, description, head_of_unit, cost_center, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            unit_name, unit_code, company_id, parent_unit_id, description, head_of_unit, cost_center, created_by
        ]);
        
        return result.insertId;
    }

    static async updateBusinessUnit(id, unitData) {
        const allowedFields = [
            'unit_name', 'unit_code', 'company_id', 'parent_unit_id', 'description',
            'head_of_unit', 'cost_center', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (unitData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(unitData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE business_units SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    // ==================== GRADES ====================
    static async findAllGrades({ page = 1, limit = 10, band = '', status = '' }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (band) {
            whereClause += ' AND band = ?';
            params.push(band);
        }

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        const countQuery = `SELECT COUNT(*) as total FROM grades_master ${whereClause}`;
        const dataQuery = `
            SELECT * FROM grades_master 
            ${whereClause}
            ORDER BY level
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            grades: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findGradeById(id) {
        const query = `SELECT * FROM grades_master WHERE id = ?`;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createGrade(gradeData) {
        const { grade_code, grade_name, level, min_salary, max_salary, band, description, created_by } = gradeData;
        
        const query = `
            INSERT INTO grades_master 
            (grade_code, grade_name, level, min_salary, max_salary, band, description, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            grade_code, grade_name, level, min_salary, max_salary, band, description, created_by
        ]);
        
        return result.insertId;
    }

    static async updateGrade(id, gradeData) {
        const allowedFields = [
            'grade_code', 'grade_name', 'level', 'min_salary', 'max_salary',
            'band', 'description', 'status', 'updated_by'
        ];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (gradeData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(gradeData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE grades_master SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    // ==================== CHECKLIST TEMPLATES ====================
    static async findAllTemplates({ page = 1, limit = 10, is_active = null }) {
        const offset = (page - 1) * limit;
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (is_active !== null) {
            whereClause += ' AND is_active = ?';
            params.push(is_active);
        }

        const countQuery = `SELECT COUNT(*) as total FROM onboarding_checklist_templates ${whereClause}`;
        const dataQuery = `
            SELECT 
                oct.*,
                (SELECT COUNT(*) FROM checklist_items WHERE template_id = oct.id) as item_count,
                u.username as created_by_username
            FROM onboarding_checklist_templates oct
            LEFT JOIN users u ON oct.created_by = u.id
            ${whereClause}
            ORDER BY oct.template_name
            LIMIT ? OFFSET ?
        `;

        const [countResult] = await pool.query(countQuery, params);
        const [rows] = await pool.query(dataQuery, [...params, limit, offset]);

        return {
            templates: rows,
            total: countResult[0].total,
            page, limit,
            totalPages: Math.ceil(countResult[0].total / limit)
        };
    }

    static async findTemplateById(id) {
        const query = `
            SELECT oct.*, u.username as created_by_username
            FROM onboarding_checklist_templates oct
            LEFT JOIN users u ON oct.created_by = u.id
            WHERE oct.id = ?
        `;
        const [rows] = await pool.query(query, [id]);
        return rows[0] || null;
    }

    static async createTemplate(templateData) {
        const { template_name, description, applicable_for, applicable_id, is_active, created_by } = templateData;
        
        const query = `
            INSERT INTO onboarding_checklist_templates 
            (template_name, description, applicable_for, applicable_id, is_active, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            template_name, description, applicable_for, applicable_id, is_active, created_by
        ]);
        
        return result.insertId;
    }

    static async updateTemplate(id, templateData) {
        const allowedFields = ['template_name', 'description', 'applicable_for', 'applicable_id', 'is_active', 'updated_by'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (templateData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(templateData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE onboarding_checklist_templates SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }

    // ==================== CHECKLIST ITEMS ====================
    static async findTemplateItems(templateId) {
        const query = `
            SELECT * FROM checklist_items 
            WHERE template_id = ? 
            ORDER BY sort_order
        `;
        const [rows] = await pool.query(query, [templateId]);
        return rows;
    }

    static async createChecklistItem(itemData) {
        const { template_id, item_name, description, category, is_mandatory, sort_order, estimated_days, created_by } = itemData;
        
        const query = `
            INSERT INTO checklist_items 
            (template_id, item_name, description, category, is_mandatory, sort_order, estimated_days, created_by, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `;
        
        const [result] = await pool.query(query, [
            template_id, item_name, description, category, is_mandatory, sort_order, estimated_days, created_by
        ]);
        
        return result.insertId;
    }

    static async updateChecklistItem(id, itemData) {
        const allowedFields = ['item_name', 'description', 'category', 'is_mandatory', 'sort_order', 'estimated_days'];
        const updates = [];
        const params = [];

        for (const field of allowedFields) {
            if (itemData[field] !== undefined) {
                updates.push(`${field} = ?`);
                params.push(itemData[field]);
            }
        }

        if (updates.length === 0) return false;
        params.push(id);
        
        const query = `UPDATE checklist_items SET ${updates.join(', ')} WHERE id = ?`;
        const [result] = await pool.query(query, params);
        return result.affectedRows > 0;
    }
}

module.exports = MasterDataModel;
