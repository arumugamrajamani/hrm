const courseRepository = require('../repositories/courseRepository');
const educationCourseMapRepository = require('../repositories/educationCourseMapRepository');

class CourseService {
    async createCourse(courseData) {
        const { course_name, course_code } = courseData;

        const nameExists = await courseRepository.courseNameExists(course_name);
        if (nameExists) {
            const error = new Error('Course name already exists');
            error.statusCode = 409;
            throw error;
        }

        const codeExists = await courseRepository.courseCodeExists(course_code);
        if (codeExists) {
            const error = new Error('Course code already exists');
            error.statusCode = 409;
            throw error;
        }

        const courseId = await courseRepository.create(courseData);
        const course = await courseRepository.findById(courseId);

        return course;
    }

    async getAllCourses(params) {
        return await courseRepository.findAll(params);
    }

    async getCourseById(id) {
        const course = await courseRepository.findById(id);
        
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        return course;
    }

    async updateCourse(id, courseData) {
        const existingCourse = await courseRepository.findById(id);
        
        if (!existingCourse) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const { course_name, course_code } = courseData;

        if (course_name && course_name.toLowerCase() !== existingCourse.course_name.toLowerCase()) {
            const nameExists = await courseRepository.courseNameExists(course_name, id);
            if (nameExists) {
                const error = new Error('Course name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (course_code && course_code.toLowerCase() !== existingCourse.course_code.toLowerCase()) {
            const codeExists = await courseRepository.courseCodeExists(course_code, id);
            if (codeExists) {
                const error = new Error('Course code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await courseRepository.update(id, courseData);
        
        if (!updated) {
            const error = new Error('Failed to update course');
            error.statusCode = 500;
            throw error;
        }

        return await courseRepository.findById(id);
    }

    async deleteCourse(id) {
        const course = await courseRepository.findById(id);
        
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const deleted = await courseRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete course');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Course deleted successfully' };
    }

    async activateCourse(id) {
        const course = await courseRepository.findById(id);
        
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await courseRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate course');
            error.statusCode = 500;
            throw error;
        }

        return await courseRepository.findById(id);
    }

    async deactivateCourse(id) {
        const course = await courseRepository.findById(id);
        
        if (!course) {
            const error = new Error('Course not found');
            error.statusCode = 404;
            throw error;
        }

        const deactivated = await courseRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate course');
            error.statusCode = 500;
            throw error;
        }

        return await courseRepository.findById(id);
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

module.exports = new CourseService();
