const { CourseModel } = require('../models');

class CourseRepository {
    async findAll(params) {
        return await CourseModel.findAll(params);
    }

    async findById(id) {
        return await CourseModel.findById(id);
    }

    async findByName(courseName, excludeId = null) {
        return await CourseModel.findByName(courseName, excludeId);
    }

    async findByCode(courseCode, excludeId = null) {
        return await CourseModel.findByCode(courseCode, excludeId);
    }

    async create(courseData) {
        return await CourseModel.create(courseData);
    }

    async update(id, courseData) {
        return await CourseModel.update(id, courseData);
    }

    async softDelete(id) {
        return await CourseModel.softDelete(id);
    }

    async activate(id) {
        return await CourseModel.activate(id);
    }

    async deactivate(id) {
        return await CourseModel.deactivate(id);
    }

    async courseNameExists(courseName, excludeId = null) {
        return await CourseModel.courseNameExists(courseName, excludeId);
    }

    async courseCodeExists(courseCode, excludeId = null) {
        return await CourseModel.courseCodeExists(courseCode, excludeId);
    }

    async hasMappings(id) {
        return await CourseModel.hasMappings(id);
    }
}

module.exports = new CourseRepository();
