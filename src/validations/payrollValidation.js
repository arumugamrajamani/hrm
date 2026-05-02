const Joi = require('joi');

// ==================== SALARY COMPONENTS ====================
const createSalaryComponentSchema = Joi.object({
    component_code: Joi.string().trim().min(2).max(20).uppercase().required().messages({
        'string.empty': 'Component code is required',
        'string.min': 'Component code must be at least 2 characters',
        'string.max': 'Component code must not exceed 20 characters',
        'any.required': 'Component code is required'
    }),
    component_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Component name is required',
        'string.min': 'Component name must be at least 2 characters',
        'string.max': 'Component name must not exceed 100 characters',
        'any.required': 'Component name is required'
    }),
    component_type: Joi.string().valid('earning', 'deduction', 'statutory').required().messages({
        'any.only': 'Component type must be earning, deduction, or statutory',
        'any.required': 'Component type is required'
    }),
    calculation_type: Joi.string().valid('fixed', 'percentage', 'formula').default('fixed').messages({
        'any.only': 'Calculation type must be fixed, percentage, or formula',
        'any.required': 'Calculation type is required'
    }),
    is_taxable: Joi.boolean().default(false),
    is_statutory: Joi.boolean().default(false),
    display_order: Joi.number().integer().min(0).default(0)
});

const updateSalaryComponentSchema = Joi.object({
    component_code: Joi.string().trim().min(2).max(20).uppercase(),
    component_name: Joi.string().trim().min(2).max(100),
    component_type: Joi.string().valid('earning', 'deduction', 'statutory'),
    calculation_type: Joi.string().valid('fixed', 'percentage', 'formula'),
    is_taxable: Joi.boolean(),
    is_statutory: Joi.boolean(),
    display_order: Joi.number().integer().min(0),
    is_active: Joi.boolean()
});

// ==================== SALARY STRUCTURES ====================
const createSalaryStructureSchema = Joi.object({
    structure_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Structure name is required',
        'string.min': 'Structure name must be at least 2 characters',
        'string.max': 'Structure name must not exceed 100 characters',
        'any.required': 'Structure name is required'
    }),
    grade_id: Joi.number().integer().positive().allow(null),
    designation_id: Joi.number().integer().positive().allow(null),
    company_id: Joi.number().integer().positive().allow(null),
    business_unit_id: Joi.number().integer().positive().allow(null),
    effective_from: Joi.date().required().messages({
        'date.base': 'Effective from must be a valid date',
        'any.required': 'Effective from date is required'
    }),
    effective_to: Joi.date().min(Joi.ref('effective_from')).allow(null).messages({
        'date.base': 'Effective to must be a valid date',
        'date.min': 'Effective to must be after effective from'
    })
});

const updateSalaryStructureSchema = Joi.object({
    structure_name: Joi.string().trim().min(2).max(100),
    grade_id: Joi.number().integer().positive().allow(null),
    designation_id: Joi.number().integer().positive().allow(null),
    company_id: Joi.number().integer().positive().allow(null),
    business_unit_id: Joi.number().integer().positive().allow(null),
    effective_from: Joi.date(),
    effective_to: Joi.date().allow(null),
    is_active: Joi.boolean()
});

// ==================== STRUCTURE COMPONENTS ====================
const addStructureComponentSchema = Joi.object({
    structure_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Structure ID must be a number',
        'number.positive': 'Structure ID must be positive',
        'any.required': 'Structure ID is required'
    }),
    component_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Component ID must be a number',
        'number.positive': 'Component ID must be positive',
        'any.required': 'Component ID is required'
    }),
    default_value: Joi.number().min(0).required().messages({
        'number.base': 'Default value must be a number',
        'number.min': 'Default value cannot be negative',
        'any.required': 'Default value is required'
    }),
    min_value: Joi.number().min(0).allow(null),
    max_value: Joi.number().min(0).allow(null),
    percentage_of: Joi.string().trim().max(100).allow('', null),
    formula: Joi.string().trim().max(500).allow('', null),
    is_mandatory: Joi.boolean().default(false)
});

const updateStructureComponentSchema = Joi.object({
    default_value: Joi.number().min(0),
    min_value: Joi.number().min(0).allow(null),
    max_value: Joi.number().min(0).allow(null),
    percentage_of: Joi.string().trim().max(100).allow('', null),
    formula: Joi.string().trim().max(500).allow('', null),
    is_mandatory: Joi.boolean()
});

// ==================== EMPLOYEE SALARY ====================
const createEmployeeSalarySchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Employee ID must be a number',
        'number.positive': 'Employee ID must be positive',
        'any.required': 'Employee ID is required'
    }),
    structure_id: Joi.number().integer().positive().allow(null),
    basic_salary: Joi.number().positive().required().messages({
        'number.base': 'Basic salary must be a number',
        'number.positive': 'Basic salary must be positive',
        'any.required': 'Basic salary is required'
    }),
    total_earnings: Joi.number().min(0).default(0),
    total_deductions: Joi.number().min(0).default(0),
    net_salary: Joi.number().min(0).allow(null).default(null),
    effective_from: Joi.date().required().messages({
        'date.base': 'Effective from must be a valid date',
        'any.required': 'Effective from date is required'
    }),
    revision_reason: Joi.string().trim().max(500).allow('', null),
    components: Joi.array().items(Joi.object({
        component_id: Joi.number().integer().positive().required(),
        component_value: Joi.number().min(0).required(),
        calculation_value: Joi.number().allow(null),
        remark: Joi.string().trim().max(200).allow('', null)
    })).allow(null)
});

const updateEmployeeSalarySchema = Joi.object({
    basic_salary: Joi.number().positive(),
    total_earnings: Joi.number().min(0),
    total_deductions: Joi.number().min(0),
    net_salary: Joi.number().min(0),
    effective_to: Joi.date().allow(null),
    revision_reason: Joi.string().trim().max(500).allow('', null)
});

// ==================== PAYROLL RUNS ====================
const createPayrollRunSchema = Joi.object({
    payroll_month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'Payroll month must be in YYYY-MM format',
        'any.required': 'Payroll month is required'
    }),
    run_name: Joi.string().trim().min(2).max(100).required().messages({
        'string.empty': 'Run name is required',
        'string.min': 'Run name must be at least 2 characters',
        'string.max': 'Run name must not exceed 100 characters',
        'any.required': 'Run name is required'
    }),
    run_type: Joi.string().valid('monthly', 'bonus', 'arrear', 'adjustment').default('monthly'),
    company_id: Joi.number().integer().positive().allow(null),
    business_unit_id: Joi.number().integer().positive().allow(null)
});

const updatePayrollRunSchema = Joi.object({
    run_name: Joi.string().trim().min(2).max(100),
    status: Joi.string().valid('draft', 'processing', 'completed', 'failed', 'cancelled'),
    total_employees: Joi.number().integer().min(0),
    total_gross: Joi.number().min(0),
    total_deductions: Joi.number().min(0),
    total_net: Joi.number().min(0),
    remarks: Joi.string().trim().max(1000).allow('', null)
});

// ==================== PAYSLIPS ====================
const createPayslipSchema = Joi.object({
    payroll_run_id: Joi.number().integer().positive().required().messages({
        'number.base': 'Payroll run ID must be a number',
        'number.positive': 'Payroll run ID must be positive',
        'any.required': 'Payroll run ID is required'
    }),
    employee_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Employee ID is required'
    }),
    employee_code: Joi.string().trim().max(50).required().messages({
        'any.required': 'Employee code is required'
    }),
    employee_name: Joi.string().trim().max(200).required().messages({
        'any.required': 'Employee name is required'
    }),
    designation: Joi.string().trim().max(100).allow('', null),
    department: Joi.string().trim().max(100).allow('', null),
    pan_number: Joi.string().trim().max(20).allow('', null),
    bank_account: Joi.string().trim().max(50).allow('', null),
    bank_name: Joi.string().trim().max(100).allow('', null),
    payroll_month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'Payroll month must be in YYYY-MM format',
        'any.required': 'Payroll month is required'
    }),
    working_days: Joi.number().min(0).default(0),
    present_days: Joi.number().min(0).default(0),
    lop_days: Joi.number().min(0).default(0),
    gross_earnings: Joi.number().min(0).default(0),
    total_deductions: Joi.number().min(0).default(0),
    net_pay: Joi.number().min(0).default(0),
    arrears: Joi.number().default(0),
    adjustments: Joi.number().default(0)
});

const updatePayslipSchema = Joi.object({
    working_days: Joi.number().min(0),
    present_days: Joi.number().min(0),
    lop_days: Joi.number().min(0),
    gross_earnings: Joi.number().min(0),
    total_deductions: Joi.number().min(0),
    net_pay: Joi.number().min(0),
    arrears: Joi.number(),
    adjustments: Joi.number(),
    status: Joi.string().valid('draft', 'generated', 'approved', 'paid')
});

// ==================== TAX CALCULATION ====================
const calculateTaxSchema = Joi.object({
    annual_income: Joi.number().positive().required().messages({
        'number.base': 'Annual income must be a number',
        'number.positive': 'Annual income must be positive',
        'any.required': 'Annual income is required'
    }),
    tax_year: Joi.string().pattern(/^\d{4}-\d{4}$/).allow(null).messages({
        'string.pattern.base': 'Tax year must be in YYYY-YYYY format'
    })
});

// ==================== BONUS RECORDS ====================
const createBonusSchema = Joi.object({
    employee_id: Joi.number().integer().positive().required().messages({
        'any.required': 'Employee ID is required'
    }),
    bonus_type: Joi.string().trim().max(50).required().messages({
        'string.empty': 'Bonus type is required',
        'any.required': 'Bonus type is required'
    }),
    bonus_month: Joi.string().pattern(/^\d{4}-\d{2}$/).required().messages({
        'string.pattern.base': 'Bonus month must be in YYYY-MM format',
        'any.required': 'Bonus month is required'
    }),
    bonus_amount: Joi.number().positive().required().messages({
        'number.base': 'Bonus amount must be a number',
        'number.positive': 'Bonus amount must be positive',
        'any.required': 'Bonus amount is required'
    }),
    taxable_amount: Joi.number().min(0).allow(null),
    tax_deducted: Joi.number().min(0).default(0),
    net_amount: Joi.number().min(0).default(0),
    reason: Joi.string().trim().max(500).allow('', null)
});

const updateBonusSchema = Joi.object({
    bonus_amount: Joi.number().positive(),
    taxable_amount: Joi.number().min(0).allow(null),
    tax_deducted: Joi.number().min(0),
    net_amount: Joi.number().min(0),
    status: Joi.string().valid('pending', 'approved', 'paid', 'cancelled'),
    paid_on: Joi.date().allow(null)
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
    component_type: Joi.string().valid('earning', 'deduction', 'statutory').allow(null),
    is_active: Joi.boolean().allow(null),
    payroll_month: Joi.string().pattern(/^\d{4}-\d{2}$/).allow(null),
    status: Joi.string().trim().max(50).allow(null),
    employee_id: Joi.number().integer().positive().allow(null),
    current_only: Joi.string().valid('true', 'false').default('true'),
    tax_year: Joi.string().pattern(/^\d{4}-\d{4}$/).allow(null),
    effective_date: Joi.date().allow(null)
});

module.exports = {
    createSalaryComponentSchema,
    updateSalaryComponentSchema,
    createSalaryStructureSchema,
    updateSalaryStructureSchema,
    addStructureComponentSchema,
    updateStructureComponentSchema,
    createEmployeeSalarySchema,
    updateEmployeeSalarySchema,
    createPayrollRunSchema,
    updatePayrollRunSchema,
    createPayslipSchema,
    updatePayslipSchema,
    calculateTaxSchema,
    createBonusSchema,
    updateBonusSchema,
    idSchema,
    querySchema
};
