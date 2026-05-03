const employmentTypeService = require('../services/employmentTypeService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class EmploymentTypeController {
    async getAllEmploymentTypes(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '' } = req.query;
            
            const result = await employmentTypeService.getAllEmploymentTypes({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status
            });

            if (!result.employment_types || result.employment_types.length === 0) {
                return noDataResponse(res, 'No employment types found');
            }

            return paginatedResponse(
                res,
                result.employment_types,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Employment types retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getEmploymentTypeById(req, res, next) {
        try {
            const { id } = req.params;
            const employmentType = await employmentTypeService.getEmploymentTypeById(parseInt(id));
            
            if (!employmentType) {
                return noDataResponse(res, 'Employment type not found');
            }
            return successResponse(res, employmentType, 'Employment type retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createEmploymentType(req, res, next) {
        try {
            const employmentTypeData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const employmentType = await employmentTypeService.createEmploymentType(employmentTypeData);
            return successResponse(res, employmentType, 'Employment type created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateEmploymentType(req, res, next) {
        try {
            const { id } = req.params;
            const employmentTypeData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const employmentType = await employmentTypeService.updateEmploymentType(parseInt(id), employmentTypeData);
            return successResponse(res, employmentType, 'Employment type updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteEmploymentType(req, res, next) {
        try {
            const { id } = req.params;
            await employmentTypeService.deleteEmploymentType(parseInt(id));
            return successResponse(res, null, 'Employment type deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateEmploymentType(req, res, next) {
        try {
            const { id } = req.params;
            const employmentType = await employmentTypeService.activateEmploymentType(parseInt(id));
            return successResponse(res, employmentType, 'Employment type activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateEmploymentType(req, res, next) {
        try {
            const { id } = req.params;
            const employmentType = await employmentTypeService.deactivateEmploymentType(parseInt(id));
            return successResponse(res, employmentType, 'Employment type deactivated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EmploymentTypeController();
