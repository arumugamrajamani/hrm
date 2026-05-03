const userService = require('../services/userService');
const { successResponse, errorResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class UserController {
    async getAllUsers(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const status = req.query.status || '';

            const result = await userService.getAllUsers({
                page,
                limit,
                search,
                status
            });

            if (!result.users || result.users.length === 0) {
                return noDataResponse(res, 'No users found');
            }

            const pagination = {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            };

            return paginatedResponse(res, result.users, pagination, 'Users retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getUserById(req, res, next) {
        try {
            const { id } = req.params;
            
            const user = await userService.getUserById(parseInt(id));

            if (!user) {
                return noDataResponse(res, 'User not found');
            }
            return successResponse(res, user, 'User retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createUser(req, res, next) {
        try {
            const { username, email, mobile, password, role_id } = req.body;
            
            let profile_photo = null;
            if (req.file) {
                profile_photo = `/uploads/${req.file.filename}`;
            }

            const result = await userService.createUser({
                username,
                email,
                mobile,
                password,
                role_id,
                profile_photo
            });

            return successResponse(res, result, 'User created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async createUserWithEmail(req, res, next) {
        try {
            const { username, email, mobile, role_id } = req.body;
            
            const result = await userService.createUserWithEmail({
                username,
                email,
                mobile,
                role_id
            });

            return successResponse(res, result, 'User created and credentials sent via email', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateUser(req, res, next) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (req.file) {
                updateData.profile_photo = `/uploads/${req.file.filename}`;
            }
            
            const result = await userService.updateUser(parseInt(id), updateData);

            return successResponse(res, result, 'User updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteUser(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await userService.deleteUser(parseInt(id));

            return successResponse(res, result, 'User deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateUser(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await userService.activateUser(parseInt(id));

            return successResponse(res, result, 'User activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateUser(req, res, next) {
        try {
            const { id } = req.params;
            
            const result = await userService.deactivateUser(parseInt(id));

            return successResponse(res, result, 'User deactivated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllRoles(req, res, next) {
        try {
            const roles = await userService.getAllRoles();
            
            if (!roles || roles.length === 0) {
                return noDataResponse(res, 'No roles found');
            }
            return successResponse(res, roles, 'Roles retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new UserController();
