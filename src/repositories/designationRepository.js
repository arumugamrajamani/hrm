const { DesignationModel } = require('../models');

class DesignationRepository {
    async findAll(params) {
        return await DesignationModel.findAll(params);
    }

    async findById(id) {
        return await DesignationModel.findById(id);
    }

    async findByName(designationName, excludeId = null) {
        return await DesignationModel.findByName(designationName, excludeId);
    }

    async findByCode(designationCode, excludeId = null) {
        return await DesignationModel.findByCode(designationCode, excludeId);
    }

    async findByDepartmentId(departmentId) {
        return await DesignationModel.findByDepartmentId(departmentId);
    }

    async create(designationData) {
        return await DesignationModel.create(designationData);
    }

    async update(id, designationData) {
        return await DesignationModel.update(id, designationData);
    }

    async softDelete(id) {
        return await DesignationModel.softDelete(id);
    }

    async activate(id) {
        return await DesignationModel.activate(id);
    }

    async deactivate(id) {
        return await DesignationModel.deactivate(id);
    }

    async hasEmployees(id) {
        return await DesignationModel.hasEmployees(id);
    }

    async designationNameExists(designationName, excludeId = null) {
        return await DesignationModel.designationNameExists(designationName, excludeId);
    }

    async designationCodeExists(designationCode, excludeId = null) {
        return await DesignationModel.designationCodeExists(designationCode, excludeId);
    }

    async generateDesignationCode(prefix) {
        return await DesignationModel.generateDesignationCode(prefix);
    }
}

module.exports = new DesignationRepository();
