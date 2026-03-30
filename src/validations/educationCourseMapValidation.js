const Joi = require('joi');

const createMappingSchema = Joi.object({
    education_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Education ID must be a number',
            'number.integer': 'Education ID must be an integer',
            'number.positive': 'Education ID must be a positive number',
            'any.required': 'Education ID is required'
        }),
    
    course_id: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.base': 'Course ID must be a number',
            'number.integer': 'Course ID must be an integer',
            'number.positive': 'Course ID must be a positive number',
            'any.required': 'Course ID is required'
        })
});

const mappingIdSchema = Joi.object({
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

module.exports = {
    createMappingSchema,
    mappingIdSchema
};
