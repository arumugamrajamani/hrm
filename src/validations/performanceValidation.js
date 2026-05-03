const Joi = require('joi');

const createCycleSchema = Joi.object({
    cycle_name: Joi.string()
        .trim()
        .min(3)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Cycle name is required',
            'string.min': 'Cycle name must be at least 3 characters',
            'string.max': 'Cycle name must not exceed 100 characters',
            'any.required': 'Cycle name is required'
        }),
    
    cycle_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .required()
        .messages({
            'string.empty': 'Cycle code is required',
            'string.min': 'Cycle code must be at least 2 characters',
            'string.max': 'Cycle code must not exceed 20 characters',
            'any.required': 'Cycle code is required'
        }),
    
    cycle_type: Joi.string()
        .valid('quarterly', 'annual')
        .required()
        .messages({
            'any.only': 'Cycle type must be either quarterly or annual',
            'any.required': 'Cycle type is required'
        }),
    
    fiscal_year: Joi.number()
        .integer()
        .min(2000)
        .max(2100)
        .required()
        .messages({
            'number.base': 'Fiscal year must be a number',
            'number.min': 'Fiscal year must be at least 2000',
            'number.max': 'Fiscal year must not exceed 2100',
            'any.required': 'Fiscal year is required'
        }),
    
    quarter: Joi.number()
        .integer()
        .min(1)
        .max(4)
        .when('cycle_type', {
            is: 'quarterly',
            then: Joi.required(),
            otherwise: Joi.optional().allow(null)
        })
        .messages({
            'number.base': 'Quarter must be a number',
            'number.min': 'Quarter must be between 1 and 4',
            'number.max': 'Quarter must be between 1 and 4',
            'any.required': 'Quarter is required for quarterly cycles'
        }),
    
    start_date: Joi.date()
        .required()
        .messages({
            'any.required': 'Start date is required'
        }),
    
    end_date: Joi.date()
        .greater(Joi.ref('start_date'))
        .required()
        .messages({
            'date.greater': 'End date must be after start date',
            'any.required': 'End date is required'
        }),
    
    self_rating_start: Joi.date()
        .required()
        .messages({
            'any.required': 'Self-rating start date is required'
        }),
    
    self_rating_end: Joi.date()
        .greater(Joi.ref('self_rating_start'))
        .required()
        .messages({
            'date.greater': 'Self-rating end date must be after start date',
            'any.required': 'Self-rating end date is required'
        }),
    
    manager_rating_start: Joi.date()
        .required()
        .messages({
            'any.required': 'Manager rating start date is required'
        }),
    
    manager_rating_end: Joi.date()
        .greater(Joi.ref('manager_rating_start'))
        .required()
        .messages({
            'date.greater': 'Manager rating end date must be after start date',
            'any.required': 'Manager rating end date is required'
        }),
    
    hr_review_start: Joi.date()
        .optional()
        .allow(null, ''),
    
    hr_review_end: Joi.date()
        .optional()
        .allow(null, '')
});

const updateCycleSchema = Joi.object({
    cycle_name: Joi.string()
        .trim()
        .min(3)
        .max(100),
    
    cycle_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase(),
    
    status: Joi.string()
        .valid('draft', 'active', 'self_rating_open', 'self_rating_closed', 'manager_rating_open', 'manager_rating_closed', 'hr_review', 'completed')
});

const createGoalSchema = Joi.object({
    cycle_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'Cycle ID is required'
        }),
    
    employee_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'Employee ID is required'
        }),
    
    goal_title: Joi.string()
        .trim()
        .min(3)
        .max(255)
        .required()
        .messages({
            'string.empty': 'Goal title is required',
            'string.min': 'Goal title must be at least 3 characters',
            'any.required': 'Goal title is required'
        }),
    
    goal_description: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    kpi_description: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    target_value: Joi.string()
        .trim()
        .max(100)
        .allow('', null),
    
    weightage: Joi.number()
        .precision(2)
        .min(0)
        .max(100)
        .default(0),
    
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'critical')
        .default('medium')
});

const updateGoalSchema = Joi.object({
    goal_title: Joi.string()
        .trim()
        .min(3)
        .max(255),
    
    goal_description: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    kpi_description: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    target_value: Joi.string()
        .trim()
        .max(100)
        .allow('', null),
    
    weightage: Joi.number()
        .precision(2)
        .min(0)
        .max(100),
    
    priority: Joi.string()
        .valid('low', 'medium', 'high', 'critical'),
    
    status: Joi.string()
        .valid('pending', 'in_progress', 'completed', 'cancelled')
});

const selfRatingSchema = Joi.object({
    self_rating: Joi.number()
        .precision(2)
        .min(1.00)
        .max(5.00)
        .required()
        .messages({
            'number.min': 'Rating must be at least 1.00',
            'number.max': 'Rating must not exceed 5.00',
            'any.required': 'Self rating is required'
        }),
    
    achievement_summary: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    what_achieved: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    what_missed: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    challenges_faced: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    supporting_evidence: Joi.string()
        .trim()
        .max(3000)
        .allow('', null)
});

const managerRatingSchema = Joi.object({
    manager_rating: Joi.number()
        .precision(2)
        .min(1.00)
        .max(5.00)
        .required()
        .messages({
            'number.min': 'Rating must be at least 1.00',
            'number.max': 'Rating must not exceed 5.00',
            'any.required': 'Manager rating is required'
        }),
    
    manager_comments: Joi.string()
        .trim()
        .max(2000)
        .allow('', null),
    
    what_employee_did_well: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    areas_of_improvement: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    manager_feedback: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    final_rating: Joi.number()
        .precision(2)
        .min(1.00)
        .max(5.00)
});

const overallRatingSchema = Joi.object({
    manager_summary: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    employee_comments: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    hr_comments: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    rating_category: Joi.string()
        .valid('exceptional', 'exceeds_expectations', 'meets_expectations', 'needs_improvement', 'unsatisfactory')
});

const annualSummarySchema = Joi.object({
    manager_overall_comments: Joi.string()
        .trim()
        .max(3000)
        .allow('', null),
    
    hr_overall_comments: Joi.string()
        .trim()
        .max(3000)
        .allow('', null)
});

const cycleIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'Cycle ID is required'
        })
});

const goalIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'any.required': 'Goal ID is required'
        })
});

const performanceQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10),
    
    cycle_id: Joi.number()
        .integer()
        .positive()
        .allow(null, ''),
    
    employee_id: Joi.number()
        .integer()
        .positive()
        .allow(null, ''),
    
    manager_id: Joi.number()
        .integer()
        .positive()
        .allow(null, ''),
    
    status: Joi.string()
        .allow('', null),
    
    cycle_type: Joi.string()
        .valid('quarterly', 'annual')
        .allow('', null),
    
    fiscal_year: Joi.number()
        .integer()
        .min(2000)
        .max(2100)
        .allow(null, '')
});

module.exports = {
    createCycleSchema,
    updateCycleSchema,
    createGoalSchema,
    updateGoalSchema,
    selfRatingSchema,
    managerRatingSchema,
    overallRatingSchema,
    annualSummarySchema,
    cycleIdSchema,
    goalIdSchema,
    performanceQuerySchema
};
