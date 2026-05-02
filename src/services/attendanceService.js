const attenanceModel = require('../models/attendanceModel');
const { errorResponse } = require('../utils/helpers');

class AttendanceService {
    // =================== SHIFTS ===================
    async getAllShifts(params) {
        return await attenanceModel.findAllShifts(params);
    }

    async getShiftById(id) {
        const shift = await attenanceModel.findShiftById(id);
        if (!shift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }
        return shift;
    }

    async createShift(shiftData) {
        const id = await attenanceModel.createShift(shiftData);
        return await attenanceModel.findShiftById(id);
    }

    async updateShift(id, shiftData) {
        const existing = await attenanceModel.findShiftById(id);
        if (!existing) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await attenanceModel.updateShift(id, shiftData);
        if (!updated) {
            const error = new Error('Failed to update shift');
            error.statusCode = 500;
            throw error;
        }

        return await attenanceModel.findShiftById(id);
    }

    // =================== HOLIDAYS ===================
    async getAllHolidays(params) {
        return await attenanceModel.findAllHolidays(params);
    }

    async getHolidayById(id) {
        const holiday = await attenanceModel.findHolidayById(id);
        if (!holiday) {
            const error = new Error('Holiday not found');
            error.statusCode = 404;
            throw error;
        }
        return holiday;
    }

    async createHoliday(holidayData) {
        const id = await attenanceModel.createHoliday(holidayData);
        return await attenanceModel.findHolidayById(id);
    }

    async updateHoliday(id, holidayData) {
        const existing = await attenanceModel.findHolidayById(id);
        if (!existing) {
            const error = new Error('Holiday not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await attenanceModel.updateHoliday(id, holidayData);
        if (!updated) {
            const error = new Error('Failed to update holiday');
            error.statusCode = 500;
            throw error;
        }

        return await attenanceModel.findHolidayById(id);
    }

    // =================== ATTENDANCE RECORDS ===================
    async getAllAttendance(params) {
        return await attenanceModel.findAllAttendance(params);
    }

    async getAttendanceById(id) {
        const record = await attenanceModel.findAttendanceById(id);
        if (!record) {
            const error = new Error('Attendance record not found');
            error.statusCode = 404;
            throw error;
        }
        return record;
    }

    async markAttendance(attendanceData) {
        const { employee_id, attendance_date } = attendanceData;

        const existing = await attenanceModel.findAttendanceByEmployeeAndDate(employee_id, attendance_date);
        if (existing) {
            const error = new Error('Attendance already marked for this date');
            error.statusCode = 400;
            throw error;
        }

        const result = await attenanceModel.markAttendance(attendanceData);
        if (typeof result === 'number') {
            return await attenanceModel.findAttendanceById(result);
        }
        return { message: 'Attendance updated successfully' };
    }

    async regularizeAttendance(id, { regularization_reason, regularized_by }) {
        const existing = await attenanceModel.findAttendanceById(id);
        if (!existing) {
            const error = new Error('Attendance record not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await attenanceModel.regularizeAttendance(id, {
            regularization_reason,
            regularized_by
        });

        if (!updated) {
            const error = new Error('Failed to regularize attendance');
            error.statusCode = 500;
            throw error;
        }

        return await attenanceModel.findAttendanceById(id);
    }

    // =================== LEAVE TYPES ===================
    async getAllLeaveTypes(params) {
        return await attenanceModel.findAllLeaveTypes(params);
    }

    async getLeaveTypeById(id) {
        const leaveType = await attenanceModel.findLeaveTypeById(id);
        if (!leaveType) {
            const error = new Error('Leave type not found');
            error.statusCode = 404;
            throw error;
        }
        return leaveType;
    }

    async createLeaveType(leaveTypeData) {
        const id = await attenanceModel.createLeaveType(leaveTypeData);
        return await attenanceModel.findLeaveTypeById(id);
    }

    async updateLeaveType(id, leaveTypeData) {
        const existing = await attenanceModel.findLeaveTypeById(id);
        if (!existing) {
            const error = new Error('Leave type not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await attenanceModel.updateLeaveType(id, leaveTypeData);
        if (!updated) {
            const error = new Error('Failed to update leave type');
            error.statusCode = 500;
            throw error;
        }

        return await attenanceModel.findLeaveTypeById(id);
    }

    // =================== LEAVE BALANCES ===================
    async getLeaveBalances(employee_id, year = null) {
        const employee = await attenanceModel.findEmployeeById(employee_id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await attenanceModel.getLeaveBalances(employee_id, year);
    }

    async initializeLeaveBalances(employee_id, year) {
        const employee = await attenanceModel.findEmployeeById(employee_id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await attenanceModel.initializeLeaveBalances(employee_id, year);
    }

    // =================== LEAVE REQUESTS ===================
    async getAllLeaveRequests(params) {
        return await attenanceModel.findAllLeaveRequests(params);
    }

    async getLeaveRequestById(id) {
        const request = await attenanceModel.findLeaveRequestById(id);
        if (!request) {
            const error = new Error('Leave request not found');
            error.statusCode = 404;
            throw error;
        }
        return request;
    }

    async createLeaveRequest(requestData) {
        const { employee_id } = requestData;

        const employee = await attenanceModel.findEmployeeById(employee_id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const id = await attenanceModel.createLeaveRequest(requestData);
        return await attenanceModel.findLeaveRequestById(id);
    }

    async updateLeaveRequestStatus(id, { status, approved_by, rejection_reason }) {
        const existing = await attenanceModel.findLeaveRequestById(id);
        if (!existing) {
            const error = new Error('Leave request not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await attenanceModel.updateLeaveRequestStatus(id, {
            status,
            approved_by,
            rejection_reason
        });

        if (!updated) {
            const error = new Error('Failed to update leave request');
            error.statusCode = 500;
            throw error;
        }

        return await attenanceModel.findLeaveRequestById(id);
    }

    // =================== TIMESHEETS ===================
    async getAllTimesheets(params) {
        return await attenanceModel.findAllTimesheets(params);
    }

    async createTimesheet(timesheetData) {
        const { employee_id } = timesheetData;

        const employee = await attenanceModel.findEmployeeById(employee_id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const id = await attenanceModel.createTimesheet(timesheetData);
        return { id, message: 'Timesheet created successfully' };
    }

    async updateTimesheetStatus(id, { status, approved_by, rejection_reason }) {
        const updated = await attenanceModel.updateTimesheetStatus(id, {
            status,
            approved_by,
            rejection_reason
        });

        if (!updated) {
            const error = new Error('Timesheet not found or no changes');
            error.statusCode = 404;
            throw error;
        }

        return { message: 'Timesheet status updated successfully' };
    }
}

module.exports = new AttendanceService();
