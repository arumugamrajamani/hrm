const Joi = require('joi');

const createShiftSchema = Joi.object({
    shift_name: Joi.string().min(2).max(100).required()
        .messages({
            'string.min': 'Shift name must be at least 2 characters long',
            'string.max': 'Shift name must not exceed 100 characters',
            'any.required': 'Shift name is required'
        }),
    shift_code: Joi.string().min(2).max(20).optional()
        .messages({
            'string.min': 'Shift code must be at least 2 characters long',
            'string.max': 'Shift code must not exceed 20 characters'
        }),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required()
        .messages({
            'string.pattern.base': 'Start time must be in HH:MM:SS format',
            'any.required': 'Start time is required'
        }),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).required()
        .messages({
            'string.pattern.base': 'End time must be in HH:MM:SS format',
            'any.required': 'End time is required'
        }),
    break_duration: Joi.number().integer().min(0).max(480).optional()
        .messages({
            'number.min': 'Break duration must be at least 0 minutes',
            'number.max': 'Break duration must not exceed 480 minutes'
        }),
    weekoff_days: Joi.string().max(100).optional()
        .messages({
            'string.max': 'Weekoff days must not exceed 100 characters'
        }),
    is_flexible: Joi.boolean().optional(),
    grace_period_minutes: Joi.number().integer().min(0).max(60).optional()
        .messages({
            'number.min': 'Grace period must be at least 0 minutes',
            'number.max': 'Grace period must not exceed 60 minutes'
        }),
    status: Joi.string().valid('active', 'inactive').optional()
});

const updateShiftSchema = Joi.object({
    shift_name: Joi.string().min(2).max(100).optional(),
    shift_code: Joi.string().min(2).max(20).optional(),
    start_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    end_time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    break_duration: Joi.number().integer().min(0).max(480).optional(),
    weekoff_days: Joi.string().max(100).optional(),
    is_flexible: Joi.boolean().optional(),
    grace_period_minutes: Joi.number().integer().min(0).max(60).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

const shiftIdSchema = Joi.object({
    id: Joi.number().integer().positive().required()
        .messages({
            'number.base': 'Shift ID must be a number',
            'number.integer': 'Shift ID must be an integer',
            'number.positive': 'Shift ID must be positive',
            'any.required': 'Shift ID is required'
        })
});

const shiftQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
    search: Joi.string().max(100).optional(),
    status: Joi.string().valid('active', 'inactive').optional()
});

module.exports = {
    createShiftSchema,
    updateShiftSchema,
    shiftIdSchema,
    shiftQuerySchema
};
