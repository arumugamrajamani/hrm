const attenanceService = require('../services/attendanceService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class AttendanceController {
    // =================== SHIFTS ===================
    async getAllShifts(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || '';

            const result = await attenanceService.getAllShifts({ page, limit, status });

            if (!result.shifts || result.shifts.length === 0) {
                return noDataResponse(res, 'No shifts found');
            }

            return paginatedResponse(res, result.shifts, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Shifts retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getShiftById(req, res, next) {
        try {
            const { id } = req.params;
            const shift = await attenanceService.getShiftById(parseInt(id));
            
            if (!shift) {
                return noDataResponse(res, 'Shift not found');
            }
            return successResponse(res, shift, 'Shift retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createShift(req, res, next) {
        try {
            const shiftData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const shift = await attenanceService.createShift(shiftData);
            return successResponse(res, shift, 'Shift created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateShift(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const shift = await attenanceService.updateShift(parseInt(id), data);
            return successResponse(res, shift, 'Shift updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // =================== HOLIDAYS ===================
    async getAllHolidays(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const year = req.query.year ? parseInt(req.query.year) : null;
            const location_id = req.query.location_id ? parseInt(req.query.location_id) : null;

            const result = await attenanceService.getAllHolidays({ page, limit, year, location_id });

            if (!result.holidays || result.holidays.length === 0) {
                return noDataResponse(res, 'No holidays found');
            }

            return paginatedResponse(res, result.holidays, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Holidays retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getHolidayById(req, res, next) {
        try {
            const { id } = req.params;
            const holiday = await attenanceService.getHolidayById(parseInt(id));
            
            if (!holiday) {
                return noDataResponse(res, 'Holiday not found');
            }
            return successResponse(res, holiday, 'Holiday retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createHoliday(req, res, next) {
        try {
            const holidayData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const holiday = await attenanceService.createHoliday(holidayData);
            return successResponse(res, holiday, 'Holiday created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateHoliday(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const holiday = await attenanceService.updateHoliday(parseInt(id), data);
            return successResponse(res, holiday, 'Holiday updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // =================== ATTENDANCE RECORDS ===================
    async getAllAttendance(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const employee_id = req.query.employee_id ? parseInt(req.query.employee_id) : null;
            const start_date = req.query.start_date || null;
            const end_date = req.query.end_date || null;
            const status = req.query.status || '';

            const result = await attenanceService.getAllAttendance({
                page, limit, employee_id, start_date, end_date, status
            });

            if (!result.attendance || result.attendance.length === 0) {
                return noDataResponse(res, 'No attendance records found');
            }

            return paginatedResponse(res, result.attendance, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Attendance records retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAttendanceById(req, res, next) {
        try {
            const { id } = req.params;
            const record = await attenanceService.getAttendanceById(parseInt(id));
            
            if (!record) {
                return noDataResponse(res, 'Attendance record not found');
            }
            return successResponse(res, record, 'Attendance record retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async markAttendance(req, res, next) {
        try {
            const attendanceData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const result = await attenanceService.markAttendance(attendanceData);
            return successResponse(res, result, 'Attendance marked successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async regularizeAttendance(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                regularized_by: req.user?.id || null
            };

            const record = await attenanceService.regularizeAttendance(parseInt(id), data);
            return successResponse(res, record, 'Attendance regularized successfully');
        } catch (error) {
            next(error);
        }
    }

    // =================== LEAVE TYPES ===================
    async getAllLeaveTypes(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || '';

            const result = await attenanceService.getAllLeaveTypes({ page, limit, status });

            if (!result.leave_types || result.leave_types.length === 0) {
                return noDataResponse(res, 'No leave types found');
            }

            return paginatedResponse(res, result.leave_types, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Leave types retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getLeaveTypeById(req, res, next) {
        try {
            const { id } = req.params;
            const leaveType = await attenanceService.getLeaveTypeById(parseInt(id));
            
            if (!leaveType) {
                return noDataResponse(res, 'Leave type not found');
            }
            return successResponse(res, leaveType, 'Leave type retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createLeaveType(req, res, next) {
        try {
            const leaveTypeData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const leaveType = await attenanceService.createLeaveType(leaveTypeData);
            return successResponse(res, leaveType, 'Leave type created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    // =================== LEAVE BALANCES ===================
    async getLeaveBalances(req, res, next) {
        try {
            const { id } = req.params;
            const year = req.query.year ? parseInt(req.query.year) : null;

            const balances = await attenanceService.getLeaveBalances(parseInt(id), year);
            
            if (!balances || balances.length === 0) {
                return noDataResponse(res, 'No leave balances found');
            }
            return successResponse(res, balances, 'Leave balances retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async initializeLeaveBalances(req, res, next) {
        try {
            const { id } = req.params;
            const { year } = req.body;

            const result = await attenanceService.initializeLeaveBalances(parseInt(id), year);
            return successResponse(res, result, 'Leave balances initialized successfully');
        } catch (error) {
            next(error);
        }
    }

    // =================== LEAVE REQUESTS ===================
    async getAllLeaveRequests(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const employee_id = req.query.employee_id ? parseInt(req.query.employee_id) : null;
            const status = req.query.status || '';
            const start_date = req.query.start_date || null;
            const end_date = req.query.end_date || null;

            const result = await attenanceService.getAllLeaveRequests({
                page, limit, employee_id, status, start_date, end_date
            });

            if (!result.leave_requests || result.leave_requests.length === 0) {
                return noDataResponse(res, 'No leave requests found');
            }

            return paginatedResponse(res, result.leave_requests, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Leave requests retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getLeaveRequestById(req, res, next) {
        try {
            const { id } = req.params;
            const request = await attenanceService.getLeaveRequestById(parseInt(id));
            
            if (!request) {
                return noDataResponse(res, 'Leave request not found');
            }
            return successResponse(res, request, 'Leave request retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createLeaveRequest(req, res, next) {
        try {
            const requestData = {
                ...req.body,
                applied_by: req.user?.id || null
            };

            const request = await attenanceService.createLeaveRequest(requestData);
            return successResponse(res, request, 'Leave request created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateLeaveRequestStatus(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                approved_by: req.user?.id || null
            };

            const request = await attenanceService.updateLeaveRequestStatus(parseInt(id), data);
            return successResponse(res, request, 'Leave request status updated successfully');
        } catch (error) {
            next(error);
        }
    }

    // =================== TIMESHEETS ===================
    async getAllTimesheets(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const employee_id = req.query.employee_id ? parseInt(req.query.employee_id) : null;
            const start_date = req.query.start_date || null;
            const end_date = req.query.end_date || null;
            const status = req.query.status || '';

            const result = await attenanceService.getAllTimesheets({
                page, limit, employee_id, start_date, end_date, status
            });

            if (!result.timesheets || result.timesheets.length === 0) {
                return noDataResponse(res, 'No timesheets found');
            }

            return paginatedResponse(res, result.timesheets, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Timesheets retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getTimesheetById(req, res, next) {
        try {
            const { id } = req.params;
            const timesheet = await attenanceService.getTimesheetById(parseInt(id));
            
            if (!timesheet) {
                return noDataResponse(res, 'Timesheet not found');
            }
            return successResponse(res, timesheet, 'Timesheet retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createTimesheet(req, res, next) {
        try {
            const timesheetData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const result = await attenanceService.createTimesheet(timesheetData);
            return successResponse(res, result, 'Timesheet created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateTimesheetStatus(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                approved_by: req.user?.id || null
            };

            const result = await attenanceService.updateTimesheetStatus(parseInt(id), data);
            return successResponse(res, result, 'Timesheet status updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AttendanceController();
