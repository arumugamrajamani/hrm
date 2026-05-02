const masterDataService = require('../services/masterDataService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class MasterDataController {
    // ==================== COMPANIES ====================
    async getAllCompanies(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || '';

            const result = await masterDataService.getAllCompanies({ page, limit, status });

            if (!result.companies || result.companies.length === 0) {
                return noDataResponse(res, 'No companies found');
            }

            return paginatedResponse(res, result.companies, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Companies retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCompanyById(req, res, next) {
        try {
            const { id } = req.params;
            const company = await masterDataService.getCompanyById(parseInt(id));
            
            if (!company) {
                return noDataResponse(res, 'Company not found');
            }
            return successResponse(res, company, 'Company retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createCompany(req, res, next) {
        try {
            const companyData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const company = await masterDataService.createCompany(companyData);
            return successResponse(res, company, 'Company created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateCompany(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const company = await masterDataService.updateCompany(parseInt(id), data);
            return successResponse(res, company, 'Company updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteCompany(req, res, next) {
        try {
            const { id } = req.params;
            const result = await masterDataService.deleteCompany(parseInt(id));
            return successResponse(res, result, 'Company deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== BUSINESS UNITS ====================
    async getAllBusinessUnits(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const company_id = req.query.company_id ? parseInt(req.query.company_id) : null;
            const status = req.query.status || '';

            const result = await masterDataService.getAllBusinessUnits({ page, limit, company_id, status });

            if (!result.business_units || result.business_units.length === 0) {
                return noDataResponse(res, 'No business units found');
            }

            return paginatedResponse(res, result.business_units, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Business units retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getBusinessUnitById(req, res, next) {
        try {
            const { id } = req.params;
            const unit = await masterDataService.getBusinessUnitById(parseInt(id));
            
            if (!unit) {
                return noDataResponse(res, 'Business unit not found');
            }
            return successResponse(res, unit, 'Business unit retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createBusinessUnit(req, res, next) {
        try {
            const unitData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const unit = await masterDataService.createBusinessUnit(unitData);
            return successResponse(res, unit, 'Business unit created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateBusinessUnit(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const unit = await masterDataService.updateBusinessUnit(parseInt(id), data);
            return successResponse(res, unit, 'Business unit updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteBusinessUnit(req, res, next) {
        try {
            const { id } = req.params;
            const result = await masterDataService.deleteBusinessUnit(parseInt(id));
            return successResponse(res, result, 'Business unit deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== GRADES ====================
    async getAllGrades(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const band = req.query.band || '';
            const status = req.query.status || '';

            const result = await masterDataService.getAllGrades({ page, limit, band, status });

            if (!result.grades || result.grades.length === 0) {
                return noDataResponse(res, 'No grades found');
            }

            return paginatedResponse(res, result.grades, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Grades retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getGradeById(req, res, next) {
        try {
            const { id } = req.params;
            const grade = await masterDataService.getGradeById(parseInt(id));
            
            if (!grade) {
                return noDataResponse(res, 'Grade not found');
            }
            return successResponse(res, grade, 'Grade retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createGrade(req, res, next) {
        try {
            const gradeData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const grade = await masterDataService.createGrade(gradeData);
            return successResponse(res, grade, 'Grade created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateGrade(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const grade = await masterDataService.updateGrade(parseInt(id), data);
            return successResponse(res, grade, 'Grade updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteGrade(req, res, next) {
        try {
            const { id } = req.params;
            const result = await masterDataService.deleteGrade(parseInt(id));
            return successResponse(res, result, 'Grade deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== CHECKLIST TEMPLATES ====================
    async getAllTemplates(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const is_active = req.query.is_active !== undefined ? req.query.is_active === 'true' : null;

            const result = await masterDataService.getAllTemplates({ page, limit, is_active });

            if (!result.templates || result.templates.length === 0) {
                return noDataResponse(res, 'No templates found');
            }

            return paginatedResponse(res, result.templates, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Templates retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getTemplateById(req, res, next) {
        try {
            const { id } = req.params;
            const template = await masterDataService.getTemplateById(parseInt(id));
            
            if (!template) {
                return noDataResponse(res, 'Template not found');
            }
            return successResponse(res, template, 'Template retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createTemplate(req, res, next) {
        try {
            const templateData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const template = await masterDataService.createTemplate(templateData);
            return successResponse(res, template, 'Template created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateTemplate(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const template = await masterDataService.updateTemplate(parseInt(id), data);
            return successResponse(res, template, 'Template updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // ==================== CHECKLIST ITEMS ====================
    async getTemplateItems(req, res, next) {
        try {
            const { templateId } = req.params;
            const items = await masterDataService.getTemplateItems(parseInt(templateId));
            
            if (!items || items.length === 0) {
                return noDataResponse(res, 'No checklist items found');
            }
            return successResponse(res, items, 'Checklist items retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createChecklistItem(req, res, next) {
        try {
            const itemData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const result = await masterDataService.createChecklistItem(itemData);
            return successResponse(res, result, 'Checklist item created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateChecklistItem(req, res, next) {
        try {
            const { id } = req.params;
            const data = { ...req.body };

            const result = await masterDataService.updateChecklistItem(parseInt(id), data);
            return successResponse(res, result, 'Checklist item updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new MasterDataController();
