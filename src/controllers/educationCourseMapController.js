const educationCourseMapService = require('../services/educationCourseMapService');
const { successResponse, noDataResponse } = require('../utils/helpers');

class EducationCourseMapController {
    async getAllMappings(req, res, next) {
        try {
            const mappings = await educationCourseMapService.getAllMappings();
            
            if (!mappings || mappings.length === 0) {
                return noDataResponse(res, 'No mappings found');
            }
            return successResponse(res, mappings, 'Mappings retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getMappingById(req, res, next) {
        try {
            const { id } = req.params;
            const mapping = await educationCourseMapService.getMappingById(parseInt(id));
            
            if (!mapping) {
                return noDataResponse(res, 'Mapping not found');
            }
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
            
            if (!result || result.length === 0) {
                return noDataResponse(res, 'No courses found for this education');
            }
            return successResponse(res, result, 'Courses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getEducationsByCourse(req, res, next) {
        try {
            const { id } = req.params;
            const result = await educationCourseMapService.getEducationsByCourse(parseInt(id));
            
            if (!result || result.length === 0) {
                return noDataResponse(res, 'No educations found for this course');
            }
            return successResponse(res, result, 'Educations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EducationCourseMapController();
