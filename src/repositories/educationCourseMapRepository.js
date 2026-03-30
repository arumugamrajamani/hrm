const { EducationCourseMapModel } = require('../models');

class EducationCourseMapRepository {
    async findAll() {
        return await EducationCourseMapModel.findAll();
    }

    async findById(id) {
        return await EducationCourseMapModel.findById(id);
    }

    async findByEducationId(educationId) {
        return await EducationCourseMapModel.findByEducationId(educationId);
    }

    async findByCourseId(courseId) {
        return await EducationCourseMapModel.findByCourseId(courseId);
    }

    async create(mapData) {
        return await EducationCourseMapModel.create(mapData);
    }

    async delete(id) {
        return await EducationCourseMapModel.delete(id);
    }

    async mappingExists(educationId, courseId) {
        return await EducationCourseMapModel.mappingExists(educationId, courseId);
    }
}

module.exports = new EducationCourseMapRepository();
