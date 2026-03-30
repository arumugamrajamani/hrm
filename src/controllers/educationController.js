const educationService = require('../services/educationService');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/helpers');

class EducationController {
    async getAllEducations(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', level = '', status = '' } = req.query;
            
            const result = await educationService.getAllEducations({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                level,
                status
            });

            return paginatedResponse(
                res,
                result.educations,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Educations retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getEducationById(req, res, next) {
        try {
            const { id } = req.params;
            const education = await educationService.getEducationById(parseInt(id));
            return successResponse(res, education, 'Education retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createEducation(req, res, next) {
        try {
            const educationData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const education = await educationService.createEducation(educationData);
            return successResponse(res, education, 'Education created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateEducation(req, res, next) {
        try {
            const { id } = req.params;
            const educationData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const education = await educationService.updateEducation(parseInt(id), educationData);
            return successResponse(res, education, 'Education updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteEducation(req, res, next) {
        try {
            const { id } = req.params;
            await educationService.deleteEducation(parseInt(id));
            return successResponse(res, null, 'Education deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateEducation(req, res, next) {
        try {
            const { id } = req.params;
            const education = await educationService.activateEducation(parseInt(id));
            return successResponse(res, education, 'Education activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateEducation(req, res, next) {
        try {
            const { id } = req.params;
            const education = await educationService.deactivateEducation(parseInt(id));
            return successResponse(res, education, 'Education deactivated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCoursesByEducation(req, res, next) {
        try {
            const { id } = req.params;
            const result = await educationService.getCoursesByEducation(parseInt(id));
            return successResponse(res, result, 'Courses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EducationController();
