const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const {
    createSalaryComponentSchema, updateSalaryComponentSchema,
    createSalaryStructureSchema, updateSalaryStructureSchema,
    addStructureComponentSchema, updateStructureComponentSchema,
    createEmployeeSalarySchema, updateEmployeeSalarySchema,
    createPayrollRunSchema, updatePayrollRunSchema,
    createPayslipSchema, updatePayslipSchema,
    calculateTaxSchema,
    createBonusSchema, updateBonusSchema,
    idSchema, querySchema
} = require('../validations/payrollValidation');

// Salary Components Routes
/**
 * @swagger
 * /api/v1/payroll/salary-components:
 *   post:
 *     summary: Create a new salary component
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryComponent'
 *     responses:
 *       201:
 *         description: Salary component created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/salary-components', authMiddleware, checkPermission('payroll.write'), validate(createSalaryComponentSchema), payrollController.createSalaryComponent);

/**
 * @swagger
 * /api/v1/payroll/salary-components:
 *   get:
 *     summary: Get all salary components
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: component_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of salary components
 */
router.get('/salary-components', authMiddleware, validateQuery(querySchema), payrollController.getSalaryComponents);

/**
 * @swagger
 * /api/v1/payroll/salary-components/{id}:
 *   get:
 *     summary: Get salary component by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salary component details
 *       404:
 *         description: Component not found
 */
router.get('/salary-components/:id', authMiddleware, validateParams(idSchema), payrollController.getSalaryComponentById);

/**
 * @swagger
 * /api/v1/payroll/salary-components/{id}:
 *   put:
 *     summary: Update salary component
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryComponent'
 *     responses:
 *       200:
 *         description: Component updated
 *       404:
 *         description: Component not found
 *       403:
 *         description: Admin access required
 */
router.put('/salary-components/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updateSalaryComponentSchema), payrollController.updateSalaryComponent);

/**
 * @swagger
 * /api/v1/payroll/salary-components/{id}:
 *   delete:
 *     summary: Delete salary component (soft delete)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Component deleted
 *       404:
 *         description: Component not found
 *       403:
 *         description: Admin access required
 */
router.delete('/salary-components/:id', authMiddleware, checkPermission('payroll.delete'), validateParams(idSchema), payrollController.deleteSalaryComponent);

// Salary Structures Routes
/**
 * @swagger
 * /api/v1/payroll/salary-structures:
 *   post:
 *     summary: Create a new salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryStructure'
 *     responses:
 *       201:
 *         description: Salary structure created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/salary-structures', authMiddleware, checkPermission('payroll.write'), validate(createSalaryStructureSchema), payrollController.createSalaryStructure);

/**
 * @swagger
 * /api/v1/payroll/salary-structures:
 *   get:
 *     summary: Get all salary structures
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: List of salary structures
 */
router.get('/salary-structures', authMiddleware, validateQuery(querySchema), payrollController.getSalaryStructures);

/**
 * @swagger
 * /api/v1/payroll/salary-structures/{id}:
 *   get:
 *     summary: Get salary structure by ID with components
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Salary structure details with components
 *       404:
 *         description: Structure not found
 */
router.get('/salary-structures/:id', authMiddleware, validateParams(idSchema), payrollController.getSalaryStructureById);

/**
 * @swagger
 * /api/v1/payroll/salary-structures/{id}:
 *   put:
 *     summary: Update salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SalaryStructure'
 *     responses:
 *       200:
 *         description: Structure updated
 *       404:
 *         description: Structure not found
 *       403:
 *         description: Admin access required
 */
router.put('/salary-structures/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updateSalaryStructureSchema), payrollController.updateSalaryStructure);

/**
 * @swagger
 * /api/v1/payroll/salary-structures/{id}:
 *   delete:
 *     summary: Delete salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Structure deleted
 *       404:
 *         description: Structure not found
 *       403:
 *         description: Admin access required
 */
router.delete('/salary-structures/:id', authMiddleware, checkPermission('payroll.delete'), validateParams(idSchema), payrollController.deleteSalaryStructure);

/**
 * @swagger
 * /api/v1/payroll/salary-structures/{structureId}/components:
 *   post:
 *     summary: Add component to salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: structureId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - component_id
 *               - value
 *             properties:
 *               component_id:
 *                 type: integer
 *               value:
 *                 type: number
 *               is_percentage:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Component added
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/salary-structures/:structureId/components', authMiddleware, checkPermission('payroll.write'), validate(addStructureComponentSchema), payrollController.addStructureComponent);

/**
 * @swagger
 * /api/v1/payroll/salary-structures/{structureId}/components:
 *   get:
 *     summary: Get components for a salary structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: structureId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of structure components
 *       404:
 *         description: Structure not found
 */
router.get('/salary-structures/:structureId/components', authMiddleware, payrollController.getStructureComponents);

/**
 * @swagger
 * /api/v1/payroll/structure-components/{componentId}:
 *   put:
 *     summary: Update structure component
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *               is_percentage:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Component updated
 *       404:
 *         description: Component not found
 *       403:
 *         description: Admin access required
 */
router.put('/structure-components/:componentId', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updateStructureComponentSchema), payrollController.updateStructureComponent);

/**
 * @swagger
 * /api/v1/payroll/structure-components/{componentId}:
 *   delete:
 *     summary: Remove component from structure
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: componentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Component removed
 *       404:
 *         description: Component not found
 *       403:
 *         description: Admin access required
 */
router.delete('/structure-components/:componentId', authMiddleware, checkPermission('payroll.delete'), validateParams(idSchema), payrollController.removeStructureComponent);

// Employee Salary Routes
/**
 * @swagger
 * /api/v1/payroll/employees/{employeeId}/salary:
 *   post:
 *     summary: Create employee salary record (SCD Type 2)
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeSalary'
 *     responses:
 *       201:
 *         description: Salary record created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/employees/:employeeId/salary', authMiddleware, checkPermission('payroll.write'), validate(createEmployeeSalarySchema), payrollController.createEmployeeSalary);

/**
 * @swagger
 * /api/v1/payroll/employees/{employeeId}/salary:
 *   get:
 *     summary: Get employee salary records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: current_only
 *         schema:
 *           type: boolean
 *           default: true
 *     responses:
 *       200:
 *         description: List of salary records
 */
router.get('/employees/:employeeId/salary', authMiddleware, validateParams(idSchema), validateQuery(querySchema), payrollController.getEmployeeSalaries);

/**
 * @swagger
 * /api/v1/payroll/employees/{employeeId}/current-salary:
 *   get:
 *     summary: Get current salary for employee
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: employeeId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Current salary details
 *       404:
 *         description: No current salary found
 */
router.get('/employees/:employeeId/current-salary', authMiddleware, validateParams(idSchema), payrollController.getCurrentSalary);

/**
 * @swagger
 * /api/v1/payroll/employee-salaries/{id}:
 *   put:
 *     summary: Update employee salary record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmployeeSalary'
 *     responses:
 *       200:
 *         description: Salary record updated
 *       404:
 *         description: Record not found
 *       403:
 *         description: Admin access required
 */
router.put('/employee-salaries/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updateEmployeeSalarySchema), payrollController.updateEmployeeSalary);

// Payroll Runs Routes
/**
 * @swagger
 * /api/v1/payroll/runs:
 *   post:
 *     summary: Create a new payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollRun'
 *     responses:
 *       201:
 *         description: Payroll run created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/runs', authMiddleware, checkPermission('payroll.write'), validate(createPayrollRunSchema), payrollController.createPayrollRun);

/**
 * @swagger
 * /api/v1/payroll/runs:
 *   get:
 *     summary: Get all payroll runs
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payroll_month
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payroll runs
 */
router.get('/runs', authMiddleware, validateQuery(querySchema), payrollController.getPayrollRuns);

/**
 * @swagger
 * /api/v1/payroll/runs/{id}:
 *   get:
 *     summary: Get payroll run by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run details
 *       404:
 *         description: Run not found
 */
router.get('/runs/:id', authMiddleware, validateParams(idSchema), payrollController.getPayrollRunById);

/**
 * @swagger
 * /api/v1/payroll/runs/{id}:
 *   put:
 *     summary: Update payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PayrollRun'
 *     responses:
 *       200:
 *         description: Payroll run updated
 *       404:
 *         description: Run not found
 *       403:
 *         description: Admin access required
 */
router.put('/runs/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updatePayrollRunSchema), payrollController.updatePayrollRun);

/**
 * @swagger
 * /api/v1/payroll/runs/{id}/process:
 *   post:
 *     summary: Process payroll run
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payroll run processed
 *       400:
 *         description: Cannot process in current state
 *       403:
 *         description: Admin access required
 */
router.post('/runs/:id/process', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), payrollController.processPayrollRun);

// Payslips Routes
/**
 * @swagger
 * /api/v1/payroll/payslips:
 *   post:
 *     summary: Create a new payslip
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payslip'
 *     responses:
 *       201:
 *         description: Payslip created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/payslips', authMiddleware, checkPermission('payroll.write'), validate(createPayslipSchema), payrollController.createPayslip);

/**
 * @swagger
 * /api/v1/payroll/payslips:
 *   get:
 *     summary: Get all payslips
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payroll_run_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: payroll_month
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of payslips
 */
router.get('/payslips', authMiddleware, validateQuery(querySchema), payrollController.getPayslips);

/**
 * @swagger
 * /api/v1/payroll/payslips/{id}:
 *   get:
 *     summary: Get payslip by ID
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payslip details
 *       404:
 *         description: Payslip not found
 */
router.get('/payslips/:id', authMiddleware, validateParams(idSchema), payrollController.getPayslipById);

/**
 * @swagger
 * /api/v1/payroll/payslips/{id}:
 *   put:
 *     summary: Update payslip
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Payslip'
 *     responses:
 *       200:
 *         description: Payslip updated
 *       404:
 *         description: Payslip not found
 *       403:
 *         description: Admin access required
 */
router.put('/payslips/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updatePayslipSchema), payrollController.updatePayslip);

// Tax Calculation
/**
 * @swagger
 * /api/v1/payroll/tax/calculate:
 *   post:
 *     summary: Calculate tax for given annual income
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - annual_income
 *             properties:
 *               annual_income:
 *                 type: number
 *               tax_year:
 *                 type: string
 *                 description: Format YYYY-YYYY
 *     responses:
 *       200:
 *         description: Tax calculation result
 */
router.post('/tax/calculate', authMiddleware, validate(calculateTaxSchema), payrollController.calculateTax);

// Bonus Records
/**
 * @swagger
 * /api/v1/payroll/bonus:
 *   post:
 *     summary: Create bonus record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BonusRecord'
 *     responses:
 *       201:
 *         description: Bonus record created
 *       400:
 *         description: Invalid input
 *       403:
 *         description: Admin access required
 */
router.post('/bonus', authMiddleware, checkPermission('payroll.write'), validate(createBonusSchema), payrollController.createBonusRecord);

/**
 * @swagger
 * /api/v1/payroll/bonus:
 *   get:
 *     summary: Get all bonus records
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: bonus_type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of bonus records
 */
router.get('/bonus', authMiddleware, validateQuery(querySchema), payrollController.getBonusRecords);

/**
 * @swagger
 * /api/v1/payroll/bonus/{id}:
 *   put:
 *     summary: Update bonus record
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BonusRecord'
 *     responses:
 *       200:
 *         description: Bonus record updated
 *       404:
 *         description: Bonus not found
 *       403:
 *         description: Admin access required
 */
router.put('/bonus/:id', authMiddleware, checkPermission('payroll.update'), validateParams(idSchema), validate(updateBonusSchema), payrollController.updateBonusRecord);

// Configurations
/**
 * @swagger
 * /api/v1/payroll/config/pf:
 *   get:
 *     summary: Get PF configuration
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: effective_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: PF configuration
 */
router.get('/config/pf', authMiddleware, validateQuery(querySchema), payrollController.getPFConfig);

/**
 * @swagger
 * /api/v1/payroll/config/esi:
 *   get:
 *     summary: Get ESI configuration
 *     tags: [Payroll]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: effective_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: ESI configuration
 */
router.get('/config/esi', authMiddleware, validateQuery(querySchema), payrollController.getESIConfig);

module.exports = router;
