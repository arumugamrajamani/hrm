const educationCourseMapRepository = require('../repositories/educationCourseMapRepository');
const educationRepository = require('../repositories/educationRepository');
const courseRepository = require('../repositories/courseRepository');

class EducationCourseMapService {
    async createMapping(mapData) {
        const { education_id, course_id } = mapData;

        const education = await educationRepository.findById(education_id);
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const course = await courseRepository.findById(course_id);
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const mappingExists = await educationCourseMapRepository.mappingExists(education_id, course_id);
        if (mappingExists) {
            const error = new Error('Mapping already exists between this education and course');
            error.statusCode = 409;
            throw error;
        }

        const mapId = await educationCourseMapRepository.create(mapData);
        const mapping = await educationCourseMapRepository.findById(mapId);

        return mapping;
    }

    async getAllMappings() {
        return await educationCourseMapRepository.findAll();
    }

    async getMappingById(id) {
        const mapping = await educationCourseMapRepository.findById(id);
        
        if (!mapping) {
            const error = new Error('Mapping not found');
            error.statusCode = 404;
            throw error;
        }

        return mapping;
    }

    async deleteMapping(id) {
        const mapping = await educationCourseMapRepository.findById(id);
        
        if (!mapping) {
            const error = new Error('Mapping not found');
            error.statusCode = 404;
            throw error;
        }

        const deleted = await educationCourseMapRepository.delete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete mapping');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Mapping deleted successfully' };
    }

    async getCoursesByEducation(educationId) {
        const education = await educationRepository.findById(educationId);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const courses = await educationCourseMapRepository.findByEducationId(educationId);
        
        return {
            education: {
                id: education.id,
                education_name: education.education_name,
                education_code: education.education_code,
                level: education.level
            },
            courses: courses
        };
    }

    async getEducationsByCourse(courseId) {
        const course = await courseRepository.findById(courseId);
        
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const educations = await educationCourseMapRepository.findByCourseId(courseId);
        
        return {
            course: {
                id: course.id,
                course_name: course.course_name,
                course_code: course.course_code
            },
            educations: educations
        };
    }
}

module.exports = new EducationCourseMapService();
