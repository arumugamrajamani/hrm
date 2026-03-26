const { UserModel, RoleModel } = require('../models');

class UserRepository {
    async findAll(params) {
        return await UserModel.findAll(params);
    }

    async findById(id) {
        return await UserModel.findById(id);
    }

    async findByEmail(email) {
        return await UserModel.findByEmail(email);
    }

    async findByUsername(username) {
        return await UserModel.findByUsername(username);
    }

    async create(userData) {
        return await UserModel.create(userData);
    }

    async update(id, userData) {
        return await UserModel.update(id, userData);
    }

    async delete(id) {
        return await UserModel.softDelete(id);
    }

    async activate(id) {
        return await UserModel.activate(id);
    }

    async deactivate(id) {
        return await UserModel.deactivate(id);
    }

    async enableTwoFactor(id) {
        return await UserModel.enableTwoFactor(id);
    }

    async disableTwoFactor(id) {
        return await UserModel.disableTwoFactor(id);
    }

    async emailExists(email, excludeId = null) {
        return await UserModel.emailExists(email, excludeId);
    }

    async usernameExists(username, excludeId = null) {
        return await UserModel.usernameExists(username, excludeId);
    }

    async mobileExists(mobile, excludeId = null) {
        return await UserModel.mobileExists(mobile, excludeId);
    }

    async getAllRoles() {
        return await RoleModel.findAll();
    }

    async getRoleById(id) {
        return await RoleModel.findById(id);
    }
}

module.exports = new UserRepository();
