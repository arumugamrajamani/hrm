const shiftService = require('../services/shiftService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class ShiftController {
    async getAllShifts(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '' } = req.query;
            
            const result = await shiftService.getAllShifts({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status
            });

            if (!result.shifts || result.shifts.length === 0) {
                return noDataResponse(res, 'No shifts found');
            }

            return paginatedResponse(
                res,
                result.shifts,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Shifts retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getShiftById(req, res, next) {
        try {
            const { id } = req.params;
            const shift = await shiftService.getShiftById(parseInt(id));
            
            return successResponse(res, shift, 'Shift retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createShift(req, res, next) {
        try {
            const shiftData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const shift = await shiftService.createShift(shiftData);
            return successResponse(res, shift, 'Shift created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateShift(req, res, next) {
        try {
            const { id } = req.params;
            const shiftData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const shift = await shiftService.updateShift(parseInt(id), shiftData);
            return successResponse(res, shift, 'Shift updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteShift(req, res, next) {
        try {
            const { id } = req.params;
            await shiftService.deleteShift(parseInt(id));
            return successResponse(res, null, 'Shift deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateShift(req, res, next) {
        try {
            const { id } = req.params;
            const shift = await shiftService.activateShift(parseInt(id));
            return successResponse(res, shift, 'Shift activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateShift(req, res, next) {
        try {
            const { id } = req.params;
            const shift = await shiftService.deactivateShift(parseInt(id));
            return successResponse(res, shift, 'Shift deactivated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new ShiftController();
