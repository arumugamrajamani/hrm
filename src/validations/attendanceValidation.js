const Joi = require('joi');

// ==================== SHIFTS ====================
const createShiftSchema = Joi.object({
    shift_name: Joi.string().trim().min(2).max(50).required().messages({
        'string.empty': 'Shift name is required',
        'string.min': 'Shift name must be at least 2 characters',
        'string.max': 'Shift name must not exceed 50 characters',
        'any.required': 'Shift name is required'
    }),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required().messages({
        'string.pattern.base': 'Start time must be in HH:MM:SS format',
        'any.required': 'Start time is required'
    }),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).required().messages({
        'string.pattern.base': 'End time must be in HH:MM:SS format',
        'any.required': 'End time is required'
    }),
    break_duration: Joi.number().integer().min(0).max(480).default(0).messages({
        'number.base': 'Break duration must be a number',
        'number.min': 'Break duration cannot be negative'
    }),
    weekoff_days: Joi.string().trim().max(100).allow('', null).messages({
        'string.max': 'Weekoff days must not exceed 100 characters'
    }),
    is_flexible: Joi.boolean().default(false),
    grace_period_minutes: Joi.number().integer().min(0).max(120).default(0).messages({
        'number.base': 'Grace period must be a number',
        'number.min': 'Grace period cannot be negative'
    }),
    status: Joi.string().valid('active', 'inactive').default('active').messages({
        'any.only': 'Status must be either active or inactive'
    })
});

const updateShiftSchema = Joi.object({
    shift_name: Joi.string().trim().min(2).max(50).messages({
        'string.empty': 'Shift name cannot be empty',
        'string.min': 'Shift name must be at least 2 characters',
        'string.max': 'Shift name must not exceed 50 characters'
    }),
    start_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).messages({
        'string.pattern.base': 'Start time must be in HH:MM:SS format'
    }),
    end_time: Joi.string().pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/).messages({
        'string.pattern.base': 'End time must be in HH:MM:SS format'
    }),
    break_duration: Joi.number().integer().min(0).max(480).messages({
        'number.base': 'Break duration must be a number'
    }),
    weekoff_days: Joi.string().trim().max(100).allow('', null),
    is_flexible: Joi.boolean(),
    grace_period_minutes: Joi.number().integer().min(0).max(120),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== HOLIDAYS ====================
const createHolidaySchema = Joi.object({
    holiday_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Holiday name is required',
        'string.min': 'Holiday name must be at least 2 characters',
        'string.max': 'Holiday name must not exceed 100 characters',
        'any.required': 'Holiday name is required'
    }),
    holiday_date: Joi.date().required().messages({
        'date.base': 'Holiday date must be a valid date',
        'any.required': 'Holiday date is required'
    }),
    description: Joi.string().trim().max(500).allow('', null).messages({
        'string.max': 'Description must not exceed 500 characters'
    }),
    is_national: Joi.boolean().default(false),
    location_id: Joi.number().integer().positive().allow(null).messages({
        'number.base': 'Location ID must be a number',
        'number.positive': 'Location ID must be positive'
    }),
    status: Joi.string().valid('active', 'inactive').default('active')
});

const updateHolidaySchema = Joi.object({
    holiday_name: Joi.string().trim().min(2).max(100).messages({
        'string.empty': 'Holiday name cannot be empty',
        'string.max': 'Holiday name must not exceed 100 characters'
    }),
    holiday_date: Joi.date().messages({
        'date.base': 'Holiday date must be a valid date'
    }),
    description: Joi.string().trim().max(500).allow('', null),
    is_national: Joi.boolean(),
    location_id: Joi.number().integer().positive().allow(null),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== ATTENDANCE RECORDS ====================
const markAttendanceSchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Employee ID must be a number',
        'number.positive': 'Employee ID must be positive',
        'any.required': 'Employee ID is required'
    }),
    attendance_date: Joi.date().required().messages({
        'date.base': 'Attendance date must be a valid date',
        'any.required': 'Attendance date is required'
    }),
    shift_id: Joi.number().integer().positive().allow(null),
    check_in: Joi.date().allow(null),
    check_out: Joi.date().allow(null),
    status: Joi.string().valid('present', 'absent', 'half_day', 'late', 'on_leave').default('present'),
    is_late: Joi.boolean().default(false),
    late_minutes: Joi.number().integer().min(0).default(0),
    is_early_departure: Joi.boolean().default(false),
    early_departure_minutes: Joi.number().integer().min(0).default(0)
});

const regularizeAttendanceSchema = Joi.object({
    regularization_reason: Joi.string().trim().min(2).max(500).required().messages({
        'string.empty': 'Regularization reason is required',
        'string.min': 'Reason must be at least 2 characters',
        'string.max': 'Reason must not exceed 500 characters',
        'any.required': 'Regularization reason is required'
    })
});

// ==================== LEAVE TYPES ====================
const createLeaveTypeSchema = Joi.object({
    leave_code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
        'string.empty': 'Leave code is required',
        'string.min': 'Leave code must be at least 2 characters',
        'string.max': 'Leave code must not exceed 20 characters',
        'any.required': 'Leave code is required'
    }),
    leave_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Leave name is required',
        'string.min': 'Leave name must be at least 2 characters',
        'string.max': 'Leave name must not exceed 100 characters',
        'any.required': 'Leave name is required'
    }),
    description: Joi.string().trim().max(500).allow('', null),
    max_days_per_year: Joi.number().integer().min(0).default(0),
    carry_forward: Joi.boolean().default(false),
    encashable: Joi.boolean().default(false),
    requires_approval: Joi.boolean().default(true),
    min_days_notice: Joi.number().integer().min(0).default(1),
    status: Joi.string().valid('active', 'inactive').default('active')
});

const updateLeaveTypeSchema = Joi.object({
    leave_code: Joi.string().trim().min(2).max(20).uppercase(),
    leave_name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow('', null),
    max_days_per_year: Joi.number().integer().min(0),
    carry_forward: Joi.boolean(),
    encashable: Joi.boolean(),
    requires_approval: Joi.boolean(),
    min_days_notice: Joi.number().integer().min(0),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== LEAVE BALANCES ====================
const initializeLeaveBalanceSchema = Joi.object({
    year: Joi.number().integer().min(2000).max(2100).required().messages({
        'number.base': 'Year must be a number',
        'number.min': 'Year must be at least 2000',
        'number.max': 'Year must not exceed 2100',
        'any.required': 'Year is required'
    })
});

// ==================== LEAVE REQUESTS ====================
const createLeaveRequestSchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Employee ID must be a number',
        'number.positive': 'Employee ID must be positive',
        'any.required': 'Employee ID is required'
    }),
    leave_type_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Leave type ID must be a number',
        'number.positive': 'Leave type ID must be positive',
        'any.required': 'Leave type ID is required'
    }),
    start_date: Joi.date().required().messages({
        'date.base': 'Start date must be a valid date',
        'any.required': 'Start date is required'
    }),
    end_date: Joi.date().min(Joi.ref('start_date')).required().messages({
        'date.base': 'End date must be a valid date',
        'any.ref': 'End date must be greater than or equal to start date',
        'date.min': 'End date must be greater than or equal to start date',
        'any.required': 'End date is required'
    }),
    total_days: Joi.number().positive().required().messages({
        'number.base': 'Total days must be a number',
        'number.positive': 'Total days must be positive',
        'any.required': 'Total days is required'
    }),
    reason: Joi.string().trim().min(2).max(1000).required().messages({
        'string.empty': 'Reason is required',
        'string.min': 'Reason must be at least 2 characters',
        'string.max': 'Reason must not exceed 1000 characters',
        'any.required': 'Reason is required'
    })
});

const updateLeaveRequestStatusSchema = Joi.object({
    status: Joi.string().valid('approved', 'rejected').required().messages({
        'any.only': 'Status must be either approved or rejected',
        'any.required': 'Status is required'
    }),
    rejection_reason: Joi.string().trim().max(500).allow('', null).when('status', {
        is: 'rejected',
        then: Joi.required().messages({ 'any.required': 'Rejection reason is required when rejecting' })
    })
});

// ==================== TIMESHEETS ====================
const createTimesheetSchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Employee ID must be a number',
        'number.positive': 'Employee ID must be positive',
        'any.required': 'Employee ID is required'
    }),
    timesheet_date: Joi.date().required().messages({
        'date.base': 'Timesheet date must be a valid date',
        'any.required': 'Timesheet date is required'
    }),
    project_code: Joi.string().trim().max(50).allow('', null),
    task_description: Joi.string().trim().min(2).max(1000).required().messages({
        'string.empty': 'Task description is required',
        'string.min': 'Description must be at least 2 characters',
        'string.max': 'Description must not exceed 1000 characters',
        'any.required': 'Task description is required'
    }),
    hours_worked: Joi.number().positive().max(24).required().messages({
        'number.base': 'Hours worked must be a number',
        'number.positive': 'Hours worked must be positive',
        'number.max': 'Hours worked cannot exceed 24',
        'any.required': 'Hours worked is required'
    }),
    is_billable: Joi.boolean().default(false)
});

const updateTimesheetStatusSchema = Joi.object({
    status: Joi.string().valid('submitted', 'approved', 'rejected').required().messages({
        'any.only': 'Status must be submitted, approved, or rejected',
        'any.required': 'Status is required'
    }),
    rejection_reason: Joi.string().trim().max(500).allow('', null)
});

// ==================== SHARED ====================
const idSchema = Joi.object({
    id: Joi.number().integer().positive().required().messages({
        'number.base': 'ID must be a number',
        'number.integer': 'ID must be an integer',
        'number.positive': 'ID must be positive',
        'any.required': 'ID is required'
    })
});

const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().trim().max(50).allow('', null),
    employee_id: Joi.number().integer().positive().allow(null),
    start_date: Joi.date().allow(null),
    end_date: Joi.date().allow(null),
    search: Joi.string().trim().max(100).allow('', null),
    year: Joi.number().integer().min(2000).max(2100).allow(null),
    location_id: Joi.number().integer().positive().allow(null),
    band: Joi.string().trim().max(50).allow('', null),
    is_active: Joi.boolean().allow(null)
});

module.exports = {
    createShiftSchema,
    updateShiftSchema,
    createHolidaySchema,
    updateHolidaySchema,
    markAttendanceSchema,
    regularizeAttendanceSchema,
    createLeaveTypeSchema,
    updateLeaveTypeSchema,
    initializeLeaveBalanceSchema,
    createLeaveRequestSchema,
    updateLeaveRequestStatusSchema,
    createTimesheetSchema,
    updateTimesheetStatusSchema,
    idSchema,
    querySchema
};
