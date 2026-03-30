const educationCourseMapService = require('../services/educationCourseMapService');
const { successResponse, errorResponse } = require('../utils/helpers');

class EducationCourseMapController {
    async getAllMappings(req, res, next) {
        try {
            const mappings = await educationCourseMapService.getAllMappings();
            return successResponse(res, mappings, 'Mappings retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMappingById(req, res, next) {
        try {
            const { id } = req.params;
            const mapping = await educationCourseMapService.getMappingById(parseInt(id));
            return successResponse(res, mapping, 'Mapping retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createMapping(req, res, next) {
        try {
            const mapData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const mapping = await educationCourseMapService.createMapping(mapData);
            return successResponse(res, mapping, 'Mapping created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async deleteMapping(req, res, next) {
        try {
            const { id } = req.params;
            await educationCourseMapService.deleteMapping(parseInt(id));
            return successResponse(res, null, 'Mapping deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCoursesByEducation(req, res, next) {
        try {
            const { id } = req.params;
            const result = await educationCourseMapService.getCoursesByEducation(parseInt(id));
            return successResponse(res, result, 'Courses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getEducationsByCourse(req, res, next) {
        try {
            const { id } = req.params;
            const result = await educationCourseMapService.getEducationsByCourse(parseInt(id));
            return successResponse(res, result, 'Educations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EducationCourseMapController();
