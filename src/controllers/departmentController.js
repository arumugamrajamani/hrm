const departmentService = require('../services/departmentService');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/helpers');

class DepartmentController {
    async getAllDepartments(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '', hierarchy = false } = req.query;
            
            const result = await departmentService.getAllDepartments({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                includeHierarchy: hierarchy === 'true' || hierarchy === true
            });

            return paginatedResponse(
                res,
                result.departments,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Departments retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getDepartmentById(req, res, next) {
        try {
            const { id } = req.params;
            const department = await departmentService.getDepartmentById(parseInt(id));
            return successResponse(res, department, 'Department retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getDepartmentHierarchy(req, res, next) {
        try {
            const hierarchy = await departmentService.getDepartmentHierarchy();
            return successResponse(res, hierarchy, 'Department hierarchy retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getChildDepartments(req, res, next) {
        try {
            const { id } = req.params;
            const children = await departmentService.getChildDepartments(parseInt(id));
            return successResponse(res, children, 'Child departments retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createDepartment(req, res, next) {
        try {
            const departmentData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const department = await departmentService.createDepartment(departmentData);
            return successResponse(res, department, 'Department created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const departmentData = {
                ...req.body,
                updated_by: req.user?.id || null
            };
            
            const department = await departmentService.updateDepartment(parseInt(id), departmentData);
            return successResponse(res, department, 'Department updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const result = await departmentService.deleteDepartment(parseInt(id));
            return successResponse(res, result, 'Department deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const department = await departmentService.activateDepartment(parseInt(id));
            return successResponse(res, department, 'Department activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateDepartment(req, res, next) {
        try {
            const { id } = req.params;
            const department = await departmentService.deactivateDepartment(parseInt(id));
            return successResponse(res, department, 'Department deactivated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new DepartmentController();
