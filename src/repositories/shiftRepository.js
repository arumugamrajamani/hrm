const ShiftModel = require('../models/shiftModel');

class ShiftRepository {
    async findAll(params) {
        return await ShiftModel.findAll(params);
    }

    async findById(id) {
        return await ShiftModel.findById(id);
    }

    async findByName(shiftName, excludeId = null) {
        return await ShiftModel.findByName(shiftName, excludeId);
    }

    async findByCode(shiftCode, excludeId = null) {
        return await ShiftModel.findByCode(shiftCode, excludeId);
    }

    async create(shiftData) {
        return await ShiftModel.create(shiftData);
    }

    async update(id, shiftData) {
        return await ShiftModel.update(id, shiftData);
    }

    async softDelete(id) {
        return await ShiftModel.softDelete(id);
    }

    async activate(id) {
        return await ShiftModel.activate(id);
    }

    async deactivate(id) {
        return await ShiftModel.deactivate(id);
    }

    async shiftNameExists(shiftName, excludeId = null) {
        return await ShiftModel.shiftNameExists(shiftName, excludeId);
    }

    async shiftCodeExists(shiftCode, excludeId = null) {
        return await ShiftModel.shiftCodeExists(shiftCode, excludeId);
    }
}

module.exports = new ShiftRepository();
