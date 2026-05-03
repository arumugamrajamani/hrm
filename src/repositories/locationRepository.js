const { LocationModel } = require('../models');

class LocationRepository {
    async findAll(params) {
        return await LocationModel.findAll(params);
    }

    async findById(id, includeHierarchy = false) {
        return await LocationModel.findById(id, includeHierarchy);
    }

    async findByName(locationName, excludeId = null) {
        return await LocationModel.findByName(locationName, excludeId);
    }

    async findByCode(locationCode, excludeId = null) {
        return await LocationModel.findByCode(locationCode, excludeId);
    }

    async findByParentId(parentId) {
        return await LocationModel.findByParentId(parentId);
    }

    async getHierarchyTree() {
        return await LocationModel.getHierarchyTree();
    }

    async getAllChildren(parentId) {
        return await LocationModel.getAllChildren(parentId);
    }

    async getHeadquarters() {
        return await LocationModel.getHeadquarters();
    }

    async create(locationData) {
        return await LocationModel.create(locationData);
    }

    async update(id, locationData) {
        return await LocationModel.update(id, locationData);
    }

    async softDelete(id) {
        return await LocationModel.softDelete(id);
    }

    async activate(id) {
        return await LocationModel.activate(id);
    }

    async deactivate(id) {
        return await LocationModel.deactivate(id);
    }

    async setAsHeadquarters(id) {
        return await LocationModel.setAsHeadquarters(id);
    }

    async hasChildren(id) {
        return await LocationModel.hasChildren(id);
    }

    async locationNameExists(locationName, excludeId = null) {
        return await LocationModel.locationNameExists(locationName, excludeId);
    }

    async locationCodeExists(locationCode, excludeId = null) {
        return await LocationModel.locationCodeExists(locationCode, excludeId);
    }

    async parentLocationExists(parentId) {
        return await LocationModel.parentLocationExists(parentId);
    }

    async generateBranchCode(prefix) {
        return await LocationModel.generateBranchCode(prefix);
    }
}

module.exports = new LocationRepository();