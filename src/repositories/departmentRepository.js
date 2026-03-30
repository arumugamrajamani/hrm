const { DepartmentModel } = require('../models');

class DepartmentRepository {
    async findAll(params) {
        return await DepartmentModel.findAll(params);
    }

    async findById(id, includeHierarchy = false) {
        return await DepartmentModel.findById(id, includeHierarchy);
    }

    async findByName(departmentName, excludeId = null) {
        return await DepartmentModel.findByName(departmentName, excludeId);
    }

    async findByCode(departmentCode, excludeId = null) {
        return await DepartmentModel.findByCode(departmentCode, excludeId);
    }

    async findByParentId(parentId) {
        return await DepartmentModel.findByParentId(parentId);
    }

    async getHierarchyTree() {
        return await DepartmentModel.getHierarchyTree();
    }

    async getAllChildren(parentId) {
        return await DepartmentModel.getAllChildren(parentId);
    }

    async create(departmentData) {
        return await DepartmentModel.create(departmentData);
    }

    async update(id, departmentData) {
        return await DepartmentModel.update(id, departmentData);
    }

    async softDelete(id) {
        return await DepartmentModel.softDelete(id);
    }

    async activate(id) {
        return await DepartmentModel.activate(id);
    }

    async deactivate(id) {
        return await DepartmentModel.deactivate(id);
    }

    async hasChildren(id) {
        return await DepartmentModel.hasChildren(id);
    }

    async departmentNameExists(departmentName, excludeId = null) {
        return await DepartmentModel.departmentNameExists(departmentName, excludeId);
    }

    async departmentCodeExists(departmentCode, excludeId = null) {
        return await DepartmentModel.departmentCodeExists(departmentCode, excludeId);
    }

    async parentDepartmentExists(parentId) {
        return await DepartmentModel.parentDepartmentExists(parentId);
    }
}

module.exports = new DepartmentRepository();
