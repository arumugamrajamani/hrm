const userService = require('../services/userService');
const { errorResponse } = require('../utils/helpers');

/**
 * Resolves the `:id` route parameter (a user id) to the employee id linked to
 * that user and rewrites `req.params.id` before the employee controller runs.
 *
 * This is required by the `/users/:id/employee/*` proxy routes, where the id
 * in the URL identifies a user account but the downstream controllers expect
 * an employee id.
 */
const resolveEmployeeId = async (req, res, next) => {
    try {
        const userId = parseInt(req.params.id, 10);

        if (Number.isNaN(userId)) {
            return errorResponse(res, 'Invalid user id', 400);
        }

        let user;
        try {
            user = await userService.getUserById(userId);
        } catch (error) {
            if (error.message === 'User not found') {
                return errorResponse(res, 'User not found', 404);
            }
            throw error;
        }

        if (!user.employee_id) {
            return errorResponse(res, 'No employee is linked to this user', 404);
        }

        req.employeeId = user.employee_id;
        req.params.id = String(user.employee_id);

        return next();
    } catch (error) {
        return next(error);
    }
};

module.exports = { resolveEmployeeId };
