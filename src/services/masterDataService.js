const masterDataModel = require('../models/masterDataModel');
const { errorResponse } = require('../utils/helpers');

class MasterDataService {
    // ==================== COMPANIES ====================
    async getAllCompanies(params) {
        return await masterDataModel.findAllCompanies(params);
    }

    async getCompanyById(id) {
        const company = await masterDataModel.findCompanyById(id);
        if (!company) {
            const error = new Error('Company not found');
            error.statusCode = 404;
            throw error;
        }
        return company;
    }

    async createCompany(companyData) {
        const id = await masterDataModel.createCompany(companyData);
        return await masterDataModel.findCompanyById(id);
    }

    async updateCompany(id, companyData) {
        const existing = await masterDataModel.findCompanyById(id);
        if (!existing) {
            const error = new Error('Company not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await masterDataModel.updateCompany(id, companyData);
        if (!updated) {
            const error = new Error('Failed to update company');
            error.statusCode = 500;
            throw error;
        }

        return await masterDataModel.findCompanyById(id);
    }

    async deleteCompany(id) {
        const existing = await masterDataModel.findCompanyById(id);
        if (!existing) {
            const error = new Error('Company not found');
            error.statusCode = 404;
            throw error;
        }

        const result = await masterDataModel.updateCompany(id, { status: 'deleted' });
        return { message: 'Company marked as deleted' };
    }

    // ==================== BUSINESS UNITS ====================
    async getAllBusinessUnits(params) {
        return await masterDataModel.findAllBusinessUnits(params);
    }

    async getBusinessUnitById(id) {
        const unit = await masterDataModel.findBusinessUnitById(id);
        if (!unit) {
            const error = new Error('Business unit not found');
            error.statusCode = 404;
            throw error;
        }
        return unit;
    }

    async createBusinessUnit(unitData) {
        const id = await masterDataModel.createBusinessUnit(unitData);
        return await masterDataModel.findBusinessUnitById(id);
    }

    async updateBusinessUnit(id, unitData) {
        const existing = await masterDataModel.findBusinessUnitById(id);
        if (!existing) {
            const error = new Error('Business unit not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await masterDataModel.updateBusinessUnit(id, unitData);
        if (!updated) {
            const error = new Error('Failed to update business unit');
            error.statusCode = 500;
            throw error;
        }

        return await masterDataModel.findBusinessUnitById(id);
    }

    async deleteBusinessUnit(id) {
        const existing = await masterDataModel.findBusinessUnitById(id);
        if (!existing) {
            const error = new Error('Business unit not found');
            error.statusCode = 404;
            throw error;
        }

        const result = await masterDataModel.updateBusinessUnit(id, { status: 'deleted' });
        return { message: 'Business unit marked as deleted' };
    }

    // ==================== GRADES ====================
    async getAllGrades(params) {
        return await masterDataModel.findAllGrades(params);
    }

    async getGradeById(id) {
        const grade = await masterDataModel.findGradeById(id);
        if (!grade) {
            const error = new Error('Grade not found');
            error.statusCode = 404;
            throw error;
        }
        return grade;
    }

    async createGrade(gradeData) {
        const id = await masterDataModel.createGrade(gradeData);
        return await masterDataModel.findGradeById(id);
    }

    async updateGrade(id, gradeData) {
        const existing = await masterDataModel.findGradeById(id);
        if (!existing) {
            const error = new Error('Grade not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await masterDataModel.updateGrade(id, gradeData);
        if (!updated) {
            const error = new Error('Failed to update grade');
            error.statusCode = 500;
            throw error;
        }

        return await masterDataModel.findGradeById(id);
    }

    async deleteGrade(id) {
        const existing = await masterDataModel.findGradeById(id);
        if (!existing) {
            const error = new Error('Grade not found');
            error.statusCode = 404;
            throw error;
        }

        const result = await masterDataModel.updateGrade(id, { status: 'deleted' });
        return { message: 'Grade marked as deleted' };
    }

    // ==================== CHECKLIST TEMPLATES ====================
    async getAllTemplates(params) {
        return await masterDataModel.findAllTemplates(params);
    }

    async getTemplateById(id) {
        const template = await masterDataModel.findTemplateById(id);
        if (!template) {
            const error = new Error('Template not found');
            error.statusCode = 404;
            throw error;
        }

        const items = await masterDataModel.findTemplateItems(id);
        template.checklist_items = items;

        return template;
    }

    async createTemplate(templateData) {
        const id = await masterDataModel.createTemplate(templateData);
        return await masterDataModel.findTemplateById(id);
    }

    async updateTemplate(id, templateData) {
        const existing = await masterDataModel.findTemplateById(id);
        if (!existing) {
            const error = new Error('Template not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await masterDataModel.updateTemplate(id, templateData);
        if (!updated) {
            const error = new Error('Failed to update template');
            error.statusCode = 500;
            throw error;
        }

        return await masterDataModel.findTemplateById(id);
    }

    // ==================== CHECKLIST ITEMS ====================
    async getTemplateItems(templateId) {
        const template = await masterDataModel.findTemplateById(templateId);
        if (!template) {
            const error = new Error('Template not found');
            error.statusCode = 404;
            throw error;
        }

        return await masterDataModel.findTemplateItems(templateId);
    }

    async createChecklistItem(itemData) {
        const template = await masterDataModel.findTemplateById(itemData.template_id);
        if (!template) {
            const error = new Error('Template not found');
            error.statusCode = 404;
            throw error;
        }

        const id = await masterDataModel.createChecklistItem(itemData);
        return { id, message: 'Checklist item created successfully' };
    }

    async updateChecklistItem(id, itemData) {
        const updated = await masterDataModel.updateChecklistItem(id, itemData);
        if (!updated) {
            const error = new Error('Checklist item not found or no changes');
            error.statusCode = 404;
            throw error;
        }

        return { message: 'Checklist item updated successfully' };
    }
}

module.exports = new MasterDataService();
