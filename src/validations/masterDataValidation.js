const Joi = require('joi');

// ==================== COMPANIES ====================
const createCompanySchema = Joi.object({
    company_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Company name is required',
        'string.min': 'Company name must be at least 2 characters',
        'string.max': 'Company name must not exceed 100 characters',
        'any.required': 'Company name is required'
    }),
    company_code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
        'string.empty': 'Company code is required',
        'string.min': 'Company code must be at least 2 characters',
        'string.max': 'Company code must not exceed 20 characters',
        'any.required': 'Company code is required'
    }),
    registration_number: Joi.string().trim().max(50).allow('', null),
    tax_id: Joi.string().trim().max(50).allow('', null),
    address: Joi.string().trim().max(500).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    country: Joi.string().trim().max(100).default('India'),
    pincode: Joi.string().trim().pattern(/^\d{6}$/).allow('', null).messages({
        'string.pattern.base': 'Pincode must be a 6-digit number'
    }),
    phone: Joi.string().trim().max(20).allow('', null),
    email: Joi.string().email().allow('', null).messages({
        'string.email': 'Email must be a valid email address'
    }),
    website: Joi.string().uri().allow('', null).messages({
        'string.uri': 'Website must be a valid URL'
    }),
    is_headquarters: Joi.boolean().default(false),
    status: Joi.string().valid('active', 'inactive').default('active')
});

const updateCompanySchema = Joi.object({
    company_name: Joi.string().trim().min(2).max(100),
    company_code: Joi.string().trim().min(2).max(20).uppercase(),
    registration_number: Joi.string().trim().max(50).allow('', null),
    tax_id: Joi.string().trim().max(50).allow('', null),
    address: Joi.string().trim().max(500).allow('', null),
    city: Joi.string().trim().max(100).allow('', null),
    state: Joi.string().trim().max(100).allow('', null),
    country: Joi.string().trim().max(100),
    pincode: Joi.string().trim().pattern(/^\d{6}$/).allow('', null),
    phone: Joi.string().trim().max(20).allow('', null),
    email: Joi.string().email().allow('', null),
    website: Joi.string().uri().allow('', null),
    is_headquarters: Joi.boolean(),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== BUSINESS UNITS ====================
const createBusinessUnitSchema = Joi.object({
    unit_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Unit name is required',
        'string.min': 'Unit name must be at least 2 characters',
        'string.max': 'Unit name must not exceed 100 characters',
        'any.required': 'Unit name is required'
    }),
    unit_code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
        'string.empty': 'Unit code is required',
        'string.min': 'Unit code must be at least 2 characters',
        'string.max': 'Unit code must not exceed 20 characters',
        'any.required': 'Unit code is required'
    }),
    company_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Company ID must be a number',
        'number.positive': 'Company ID must be positive',
        'any.required': 'Company ID is required'
    }),
    parent_unit_id: Joi.number().integer().positive().allow(null),
    description: Joi.string().trim().max(500).allow('', null),
    head_of_unit: Joi.number().integer().positive().allow(null),
    cost_center: Joi.string().trim().max(50).allow('', null)
});

const updateBusinessUnitSchema = Joi.object({
    unit_name: Joi.string().trim().min(2).max(100),
    unit_code: Joi.string().trim().min(2).max(20).uppercase(),
    company_id: Joi.number().integer().positive(),
    parent_unit_id: Joi.number().integer().positive().allow(null),
    description: Joi.string().trim().max(500).allow('', null),
    head_of_unit: Joi.number().integer().positive().allow(null),
    cost_center: Joi.string().trim().max(50).allow('', null),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== GRADES ====================
const createGradeSchema = Joi.object({
    grade_code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
        'string.empty': 'Grade code is required',
        'string.min': 'Grade code must be at least 2 characters',
        'string.max': 'Grade code must not exceed 20 characters',
        'any.required': 'Grade code is required'
    }),
    grade_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Grade name is required',
        'string.min': 'Grade name must be at least 2 characters',
        'string.max': 'Grade name must not exceed 100 characters',
        'any.required': 'Grade name is required'
    }),
    level: Joi.number().integer().positive().required().messages({
        'number.base': 'Level must be a number',
        'number.positive': 'Level must be positive',
        'any.required': 'Level is required'
    }),
    min_salary: Joi.number().min(0).allow(null),
    max_salary: Joi.number().min(0).allow(null),
    band: Joi.string().trim().max(50).allow('', null),
    description: Joi.string().trim().max(500).allow('', null)
});

const updateGradeSchema = Joi.object({
    grade_code: Joi.string().trim().min(2).max(20).uppercase(),
    grade_name: Joi.string().trim().min(2).max(100),
    level: Joi.number().integer().positive(),
    min_salary: Joi.number().min(0).allow(null),
    max_salary: Joi.number().min(0).allow(null),
    band: Joi.string().trim().max(50).allow('', null),
    description: Joi.string().trim().max(500).allow('', null),
    status: Joi.string().valid('active', 'inactive')
});

// ==================== CHECKLIST TEMPLATES ====================
const createTemplateSchema = Joi.object({
    template_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Template name is required',
        'string.min': 'Template name must be at least 2 characters',
        'string.max': 'Template name must not exceed 100 characters',
        'any.required': 'Template name is required'
    }),
    description: Joi.string().trim().max(500).allow('', null),
    applicable_for: Joi.string().trim().max(50).allow('', null),
    applicable_id: Joi.number().integer().positive().allow(null),
    is_active: Joi.boolean().default(true)
});

const updateTemplateSchema = Joi.object({
    template_name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow('', null),
    applicable_for: Joi.string().trim().max(50).allow('', null),
    applicable_id: Joi.number().integer().positive().allow(null),
    is_active: Joi.boolean()
});

// ==================== CHECKLIST ITEMS ====================
const createChecklistItemSchema = Joi.object({
    template_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required'
    }),
    item_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Item name is required',
        'string.min': 'Item name must be at least 2 characters',
        'string.max': 'Item name must not exceed 100 characters',
        'any.required': 'Item name is required'
    }),
    description: Joi.string().trim().max(500).allow('', null),
    category: Joi.string().valid('document', 'it_asset', 'id_card', 'induction', 'training', 'other').default('other'),
    is_mandatory: Joi.boolean().default(false),
    sort_order: Joi.number().integer().min(0).default(0),
    estimated_days: Joi.number().integer().min(0).default(0)
});

const updateChecklistItemSchema = Joi.object({
    item_name: Joi.string().trim().min(2).max(100),
    description: Joi.string().trim().max(500).allow('', null),
    category: Joi.string().valid('document', 'it_asset', 'id_card', 'induction', 'training', 'other'),
    is_mandatory: Joi.boolean(),
    sort_order: Joi.number().integer().min(0),
    estimated_days: Joi.number().integer().min(0)
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

const templateIdSchema = Joi.object({
    templateId: Joi.number().integer().positive().required().messages({
        'number.base': 'Template ID must be a number',
        'number.positive': 'Template ID must be positive',
        'any.required': 'Template ID is required'
    })
});

const querySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().trim().max(50).allow('', null),
    company_id: Joi.number().integer().positive().allow(null),
    band: Joi.string().trim().max(50).allow('', null),
    is_active: Joi.boolean().allow(null)
});

module.exports = {
    createCompanySchema,
    updateCompanySchema,
    createBusinessUnitSchema,
    updateBusinessUnitSchema,
    createGradeSchema,
    updateGradeSchema,
    createTemplateSchema,
    updateTemplateSchema,
    createChecklistItemSchema,
    updateChecklistItemSchema,
    idSchema,
    templateIdSchema,
    querySchema
};
