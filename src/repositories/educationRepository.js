const { EducationModel } = require('../models');

class EducationRepository {
    async findAll(params) {
        return await EducationModel.findAll(params);
    }

    async findById(id) {
        return await EducationModel.findById(id);
    }

    async findByName(educationName, excludeId = null) {
        return await EducationModel.findByName(educationName, excludeId);
    }

    async findByCode(educationCode, excludeId = null) {
        return await EducationModel.findByCode(educationCode, excludeId);
    }

    async create(educationData) {
        return await EducationModel.create(educationData);
    }

    async update(id, educationData) {
        return await EducationModel.update(id, educationData);
    }

    async softDelete(id) {
        return await EducationModel.softDelete(id);
    }

    async activate(id) {
        return await EducationModel.activate(id);
    }

    async deactivate(id) {
        return await EducationModel.deactivate(id);
    }

    async educationNameExists(educationName, excludeId = null) {
        return await EducationModel.educationNameExists(educationName, excludeId);
    }

    async educationCodeExists(educationCode, excludeId = null) {
        return await EducationModel.educationCodeExists(educationCode, excludeId);
    }

    async hasMappings(id) {
        return await EducationModel.hasMappings(id);
    }
}

module.exports = new EducationRepository();
