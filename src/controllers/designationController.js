const designationService = require('../services/designationService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class DesignationController {
    async getAllDesignations(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '' } = req.query;
            
            const result = await designationService.getAllDesignations({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status
            });

            if (!result.designations || result.designations.length === 0) {
                return noDataResponse(res, 'No designations found');
            }

            return paginatedResponse(
                res,
                result.designations,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Designations retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getDesignationById(req, res, next) {
        try {
            const { id } = req.params;
            const designation = await designationService.getDesignationById(parseInt(id));
            
            if (!designation) {
                return noDataResponse(res, 'Designation not found');
            }
            return successResponse(res, designation, 'Designation retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getDesignationsByDepartment(req, res, next) {
        try {
            const { departmentId } = req.params;
            const designations = await designationService.getDesignationsByDepartment(parseInt(departmentId));
            
            if (!designations || designations.length === 0) {
                return noDataResponse(res, 'No designations found for this department');
            }
            return successResponse(res, designations, 'Designations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createDesignation(req, res, next) {
        try {
            const designationData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const designation = await designationService.createDesignation(designationData);
            return successResponse(res, designation, 'Designation created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateDesignation(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const designationData = {
                ...req.body,
                updated_by: req.user?.id || null
            };
            
            const designation = await designationService.updateDesignation(id, designationData);
            return successResponse(res, designation, 'Designation updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteDesignation(req, res, next) {
        try {
            const { id } = req.params;
            const result = await designationService.deleteDesignation(parseInt(id));
            
            if (!result) {
                return noDataResponse(res, 'Designation not found');
            }
            return successResponse(res, result, 'Designation deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateDesignation(req, res, next) {
        try {
            const { id } = req.params;
            const designation = await designationService.activateDesignation(parseInt(id));
            
            if (!designation) {
                return noDataResponse(res, 'Designation not found');
            }
            return successResponse(res, designation, 'Designation activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateDesignation(req, res, next) {
        try {
            const { id } = req.params;
            const designation = await designationService.deactivateDesignation(parseInt(id));
            
            if (!designation) {
                return noDataResponse(res, 'Designation not found');
            }
            return successResponse(res, designation, 'Designation deactivated successfully');
        } catch (error) {
            next(error);
        }
    }

    async generateDesignationCode(req, res, next) {
        try {
            const code = await designationService.generateDesignationCode();
            return successResponse(res, { designation_code: code }, 'Designation code generated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DesignationController();
