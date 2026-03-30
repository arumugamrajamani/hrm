const Joi = require('joi');

const createEducationSchema = Joi.object({
    education_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Education name is required',
            'string.min': 'Education name must be at least 2 characters',
            'string.max': 'Education name must not exceed 100 characters',
            'any.required': 'Education name is required'
        }),
    
    education_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .required()
        .messages({
            'string.empty': 'Education code is required',
            'string.min': 'Education code must be at least 2 characters',
            'string.max': 'Education code must not exceed 20 characters',
            'any.required': 'Education code is required'
        }),
    
    level: Joi.string()
        .valid('School', 'UG', 'PG', 'Doctorate', 'Certification')
        .required()
        .messages({
            'any.only': 'Level must be one of: School, UG, PG, Doctorate, Certification',
            'any.required': 'Level is required'
        }),
    
    description: Joi.string()
        .trim()
        .max(1000)
        .allow('', null)
        .messages({
            'string.max': 'Description must not exceed 1000 characters'
        }),
    
    status: Joi.string()
        .valid('active', 'inactive')
        .default('active')
        .messages({
            'any.only': 'Status must be either active or inactive'
        })
});

const updateEducationSchema = Joi.object({
    education_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Education name cannot be empty',
            'string.min': 'Education name must be at least 2 characters',
            'string.max': 'Education name must not exceed 100 characters'
        }),
    
    education_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .messages({
            'string.empty': 'Education code cannot be empty',
            'string.min': 'Education code must be at least 2 characters',
            'string.max': 'Education code must not exceed 20 characters'
        }),
    
    level: Joi.string()
        .valid('School', 'UG', 'PG', 'Doctorate', 'Certification')
        .messages({
            'any.only': 'Level must be one of: School, UG, PG, Doctorate, Certification'
        }),
    
    description: Joi.string()
        .trim()
        .max(1000)
        .allow('', null)
        .messages({
            'string.max': 'Description must not exceed 1000 characters'
        }),
    
    status: Joi.string()
        .valid('active', 'inactive')
        .messages({
            'any.only': 'Status must be either active or inactive'
        })
});

const educationIdSchema = Joi.object({
    id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'ID must be a number',
            'number.integer': 'ID must be an integer',
            'number.positive': 'ID must be a positive number',
            'any.required': 'ID is required'
        })
});

const educationQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),
    
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit must not exceed 100'
        }),
    
    search: Joi.string()
        .trim()
        .max(100)
        .allow('', null)
        .messages({
            'string.max': 'Search must not exceed 100 characters'
        }),
    
    level: Joi.string()
        .valid('School', 'UG', 'PG', 'Doctorate', 'Certification')
        .allow('', null)
        .messages({
            'any.only': 'Level must be one of: School, UG, PG, Doctorate, Certification'
        }),
    
    status: Joi.string()
        .valid('active', 'inactive')
        .allow('', null)
        .messages({
            'any.only': 'Status must be either active or inactive'
        })
});

module.exports = {
    createEducationSchema,
    updateEducationSchema,
    educationIdSchema,
    educationQuerySchema
};
