const Joi = require('joi');

const createCourseSchema = Joi.object({
    course_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.empty': 'Course name is required',
            'string.min': 'Course name must be at least 2 characters',
            'string.max': 'Course name must not exceed 100 characters',
            'any.required': 'Course name is required'
        }),
    
    course_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .required()
        .messages({
            'string.empty': 'Course code is required',
            'string.min': 'Course code must be at least 2 characters',
            'string.max': 'Course code must not exceed 20 characters',
            'any.required': 'Course code is required'
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

const updateCourseSchema = Joi.object({
    course_name: Joi.string()
        .trim()
        .min(2)
        .max(100)
        .messages({
            'string.empty': 'Course name cannot be empty',
            'string.min': 'Course name must be at least 2 characters',
            'string.max': 'Course name must not exceed 100 characters'
        }),
    
    course_code: Joi.string()
        .trim()
        .min(2)
        .max(20)
        .uppercase()
        .messages({
            'string.empty': 'Course code cannot be empty',
            'string.min': 'Course code must be at least 2 characters',
            'string.max': 'Course code must not exceed 20 characters'
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

const courseIdSchema = Joi.object({
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

const courseQuerySchema = Joi.object({
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
    createCourseSchema,
    updateCourseSchema,
    courseIdSchema,
    courseQuerySchema
};
