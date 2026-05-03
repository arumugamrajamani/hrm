const Joi = require('joi');

// ==================== ONBOARDING RECORDS ====================
const createOnboardingSchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Employee ID must be a number',
        'number.positive': 'Employee ID must be positive',
        'any.required': 'Employee ID is required'
    }),
    template_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required'
    }),
    joining_date: Joi.date().required().messages({
        'date.base': 'Joining date must be a valid date',
        'any.required': 'Joining date is required'
    })
});

const updateOnboardingSchema = Joi.object({
    template_id: Joi.number().integer().positive().allow(null),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'delayed'),
    joining_date: Joi.date(),
    actual_joining_date: Joi.date().allow(null),
    probation_end_date: Joi.date().allow(null),
    confirmation_date: Joi.date().allow(null),
    onboarding_completion_date: Joi.date().allow(null),
    remarks: Joi.string().trim().max(1000).allow('', null)
});

// ==================== CHECKLIST PROGRESS ====================
const updateChecklistItemSchema = Joi.object({
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'skipped').required().messages({
        'any.only': 'Status must be pending, in_progress, completed, or skipped',
        'any.required': 'Status is required'
    }),
    remarks: Joi.string().trim().max(500).allow('', null),
    attachment_path: Joi.string().trim().max(500).allow('', null)
});

// ==================== PROBATION TRACKING ====================
const createProbationSchema = Joi.object({
    probation_start_date: Joi.date().required().messages({
        'date.base': 'Probation start date must be a valid date',
        'any.required': 'Probation start date is required'
    }),
    probation_end_date: Joi.date().min(Joi.ref('probation_start_date')).required().messages({
        'date.base': 'Probation end date must be a valid date',
        'date.min': 'Probation end date must be after start date',
        'any.required': 'Probation end date is required'
    })
});

const updateProbationSchema = Joi.object({
    status: Joi.string().valid('in_progress', 'confirmed', 'extended', 'terminated'),
    performance_rating: Joi.string().valid('excellent', 'good', 'average', 'poor'),
    manager_feedback: Joi.string().trim().max(1000).allow('', null),
    hr_feedback: Joi.string().trim().max(1000).allow('', null),
    self_assessment: Joi.string().trim().max(1000).allow('', null),
    confirmation_date: Joi.date().allow(null)
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

const onboardingIdSchema = Joi.object({
    onboardingId: Joi.number().integer().positive().required().messages({
        'number.base': 'Onboarding ID must be a number',
        'number.positive': 'Onboarding ID must be positive',
        'any.required': 'Onboarding ID is required'
    })
});

const itemIdSchema = Joi.object({
    itemId: Joi.number().integer().positive().required().messages({
        'number.base': 'Item ID must be a number',
        'number.positive': 'Item ID must be positive',
        'any.required': 'Item ID is required'
    })
});

const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('pending', 'in_progress', 'completed', 'delayed').allow('', null),
    employee_id: Joi.number().integer().positive().allow(null)
});

module.exports = {
    createOnboardingSchema,
    updateOnboardingSchema,
    updateChecklistItemSchema,
    createProbationSchema,
    updateProbationSchema,
    idSchema,
    onboardingIdSchema,
    itemIdSchema,
    querySchema
};
