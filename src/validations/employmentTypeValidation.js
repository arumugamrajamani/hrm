const Joi = require('joi');

const createEmploymentTypeSchema = Joi.object({
    employment_type_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Employment type name is required',
            'string.min': 'Employment type name must be at least 2 characters',
            'string.max': 'Employment type name must not exceed 100 characters',
            'any.required': 'Employment type name is required'
        }),
    
    employment_type_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .required()
        .messages({
            'string.empty': 'Employment type code is required',
            'string.min': 'Employment type code must be at least 2 characters',
            'string.max': 'Employment type code must not exceed 20 characters',
            'any.required': 'Employment type code is required'
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

const updateEmploymentTypeSchema = Joi.object({
    employment_type_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Employment type name cannot be empty',
            'string.min': 'Employment type name must be at least 2 characters',
            'string.max': 'Employment type name must not exceed 100 characters'
        }),
    
    employment_type_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .messages({
            'string.empty': 'Employment type code cannot be empty',
            'string.min': 'Employment type code must be at least 2 characters',
            'string.max': 'Employment type code must not exceed 20 characters'
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

const employmentTypeIdSchema = Joi.object({
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

const employmentTypeQuerySchema = Joi.object({
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
    
    status: Joi.string()
        .valid('active', 'inactive')
        .allow('', null)
        .messages({
            'any.only': 'Status must be either active or inactive'
        })
});

module.exports = {
    createEmploymentTypeSchema,
    updateEmploymentTypeSchema,
    employmentTypeIdSchema,
    employmentTypeQuerySchema
};
