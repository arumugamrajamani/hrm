const { EmploymentTypeModel } = require('../models');

class EmploymentTypeRepository {
    async findAll(params) {
        return await EmploymentTypeModel.findAll(params);
    }

    async findById(id) {
        return await EmploymentTypeModel.findById(id);
    }

    async findByName(employmentTypeName, excludeId = null) {
        return await EmploymentTypeModel.findByName(employmentTypeName, excludeId);
    }

    async findByCode(employmentTypeCode, excludeId = null) {
        return await EmploymentTypeModel.findByCode(employmentTypeCode, excludeId);
    }

    async create(employmentTypeData) {
        return await EmploymentTypeModel.create(employmentTypeData);
    }

    async update(id, employmentTypeData) {
        return await EmploymentTypeModel.update(id, employmentTypeData);
    }

    async softDelete(id) {
        return await EmploymentTypeModel.softDelete(id);
    }

    async activate(id) {
        return await EmploymentTypeModel.activate(id);
    }

    async deactivate(id) {
        return await EmploymentTypeModel.deactivate(id);
    }

    async employmentTypeNameExists(employmentTypeName, excludeId = null) {
        return await EmploymentTypeModel.employmentTypeNameExists(employmentTypeName, excludeId);
    }

    async employmentTypeCodeExists(employmentTypeCode, excludeId = null) {
        return await EmploymentTypeModel.employmentTypeCodeExists(employmentTypeCode, excludeId);
    }

    async hasMappings(id) {
        return await EmploymentTypeModel.hasMappings(id);
    }
}

module.exports = new EmploymentTypeRepository();
