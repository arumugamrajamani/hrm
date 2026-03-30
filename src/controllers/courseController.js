const courseService = require('../services/courseService');
const { successResponse, paginatedResponse, errorResponse } = require('../utils/helpers');

class CourseController {
    async getAllCourses(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '' } = req.query;
            
            const result = await courseService.getAllCourses({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status
            });

            return paginatedResponse(
                res,
                result.courses,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Courses retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getCourseById(req, res, next) {
        try {
            const { id } = req.params;
            const course = await courseService.getCourseById(parseInt(id));
            return successResponse(res, course, 'Course retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createCourse(req, res, next) {
        try {
            const courseData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const course = await courseService.createCourse(courseData);
            return successResponse(res, course, 'Course created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateCourse(req, res, next) {
        try {
            const { id } = req.params;
            const courseData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const course = await courseService.updateCourse(parseInt(id), courseData);
            return successResponse(res, course, 'Course updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteCourse(req, res, next) {
        try {
            const { id } = req.params;
            await courseService.deleteCourse(parseInt(id));
            return successResponse(res, null, 'Course deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateCourse(req, res, next) {
        try {
            const { id } = req.params;
            const course = await courseService.activateCourse(parseInt(id));
            return successResponse(res, course, 'Course activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateCourse(req, res, next) {
        try {
            const { id } = req.params;
            const course = await courseService.deactivateCourse(parseInt(id));
            return successResponse(res, course, 'Course deactivated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getEducationsByCourse(req, res, next) {
        try {
            const { id } = req.params;
            const result = await courseService.getEducationsByCourse(parseInt(id));
            return successResponse(res, result, 'Educations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CourseController();
