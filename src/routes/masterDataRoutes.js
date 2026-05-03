const express = require('express');
const router = express.Router();
const masterDataController = require('../controllers/masterDataController');
const { authMiddleware } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/auditLog');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const {
    createCompanySchema, updateCompanySchema,
    createBusinessUnitSchema, updateBusinessUnitSchema,
    createGradeSchema, updateGradeSchema,
    createTemplateSchema, updateTemplateSchema,
    createChecklistItemSchema, updateChecklistItemSchema,
    idSchema, templateIdSchema, querySchema
} = require('../validations/masterDataValidation');

router.use(authMiddleware);

// ==================== COMPANIES ====================
/**
 * @swagger
 * /api/v1/master/companies:
 *   get:
 *     summary: Get all companies
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Companies retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/companies', validateQuery(querySchema), auditLog('READ', 'companies'), masterDataController.getAllCompanies);

/**
 * @swagger
 * /api/v1/master/companies:
 *   post:
 *     summary: Create company
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/companies', checkPermission('master.write'), validate(createCompanySchema), auditLog('CREATE', 'companies'), masterDataController.createCompany);

/**
 * @swagger
 * /api/v1/master/companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Master Data]
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
 *         description: Company retrieved successfully
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 */
router.get('/companies/:id', validateParams(idSchema), auditLog('READ', 'companies'), masterDataController.getCompanyById);

/**
 * @swagger
 * /api/v1/master/companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Master Data]
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
 *             $ref: '#/components/schemas/Company'
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       404:
 *         description: Company not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/companies/:id', checkPermission('master.update'), validateParams(idSchema), validate(updateCompanySchema), auditLog('UPDATE', 'companies'), masterDataController.updateCompany);

// ==================== BUSINESS UNITS ====================
/**
 * @swagger
 * /api/v1/master/business-units:
 *   get:
 *     summary: Get all business units
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: company_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Business units retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/business-units', validateQuery(querySchema), auditLog('READ', 'business_units'), masterDataController.getAllBusinessUnits);

/**
 * @swagger
 * /api/v1/master/business-units:
 *   post:
 *     summary: Create business unit
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BusinessUnit'
 *     responses:
 *       201:
 *         description: Business unit created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/business-units', checkPermission('master.write'), validate(createBusinessUnitSchema), auditLog('CREATE', 'business_units'), masterDataController.createBusinessUnit);

/**
 * @swagger
 * /api/v1/master/business-units/{id}:
 *   get:
 *     summary: Get business unit by ID
 *     tags: [Master Data]
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
 *         description: Business unit retrieved successfully
 *       404:
 *         description: Business unit not found
 *       401:
 *         description: Unauthorized
 */
router.get('/business-units/:id', validateParams(idSchema), auditLog('READ', 'business_units'), masterDataController.getBusinessUnitById);

/**
 * @swagger
 * /api/v1/master/business-units/{id}:
 *   put:
 *     summary: Update business unit
 *     tags: [Master Data]
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
 *             $ref: '#/components/schemas/BusinessUnit'
 *     responses:
 *       200:
 *         description: Business unit updated successfully
 *       404:
 *         description: Business unit not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/business-units/:id', checkPermission('master.update'), validateParams(idSchema), validate(updateBusinessUnitSchema), auditLog('UPDATE', 'business_units'), masterDataController.updateBusinessUnit);

// ==================== GRADES ====================
/**
 * @swagger
 * /api/v1/master/grades:
 *   get:
 *     summary: Get all grades
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: band
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Grades retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/grades', validateQuery(querySchema), auditLog('READ', 'grades_master'), masterDataController.getAllGrades);

/**
 * @swagger
 * /api/v1/master/grades:
 *   post:
 *     summary: Create grade
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       201:
 *         description: Grade created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/grades', checkPermission('master.write'), validate(createGradeSchema), auditLog('CREATE', 'grades_master'), masterDataController.createGrade);

/**
 * @swagger
 * /api/v1/master/grades/{id}:
 *   get:
 *     summary: Get grade by ID
 *     tags: [Master Data]
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
 *         description: Grade retrieved successfully
 *       404:
 *         description: Grade not found
 *       401:
 *         description: Unauthorized
 */
router.get('/grades/:id', validateParams(idSchema), auditLog('READ', 'grades_master'), masterDataController.getGradeById);

/**
 * @swagger
 * /api/v1/master/grades/{id}:
 *   put:
 *     summary: Update grade
 *     tags: [Master Data]
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
 *             $ref: '#/components/schemas/Grade'
 *     responses:
 *       200:
 *         description: Grade updated successfully
 *       404:
 *         description: Grade not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/grades/:id', checkPermission('master.update'), validateParams(idSchema), validate(updateGradeSchema), auditLog('UPDATE', 'grades_master'), masterDataController.updateGrade);

// ==================== CHECKLIST TEMPLATES ====================
/**
 * @swagger
 * /api/v1/master/checklist-templates:
 *   get:
 *     summary: Get all checklist templates
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/checklist-templates', validateQuery(querySchema), auditLog('READ', 'onboarding_checklist_templates'), masterDataController.getAllTemplates);

/**
 * @swagger
 * /api/v1/master/checklist-templates:
 *   post:
 *     summary: Create checklist template
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChecklistTemplate'
 *     responses:
 *       201:
 *         description: Template created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/checklist-templates', checkPermission('master.write'), validate(createTemplateSchema), auditLog('CREATE', 'onboarding_checklist_templates'), masterDataController.createTemplate);

/**
 * @swagger
 * /api/v1/master/checklist-templates/{id}:
 *   get:
 *     summary: Get template by ID (includes checklist items)
 *     tags: [Master Data]
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
 *         description: Template retrieved successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 */
router.get('/checklist-templates/:id', validateParams(idSchema), auditLog('READ', 'onboarding_checklist_templates'), masterDataController.getTemplateById);

/**
 * @swagger
 * /api/v1/master/checklist-templates/{id}:
 *   put:
 *     summary: Update checklist template
 *     tags: [Master Data]
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
 *             $ref: '#/components/schemas/ChecklistTemplate'
 *     responses:
 *       200:
 *         description: Template updated successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/checklist-templates/:id', checkPermission('master.update'), validateParams(idSchema), validate(updateTemplateSchema), auditLog('UPDATE', 'onboarding_checklist_templates'), masterDataController.updateTemplate);

// ==================== CHECKLIST ITEMS ====================
/**
 * @swagger
 * /api/v1/master/templates/{templateId}/items:
 *   get:
 *     summary: Get checklist items for template
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: templateId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Checklist items retrieved successfully
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 */
router.get('/templates/:templateId/items', validateParams(templateIdSchema), auditLog('READ', 'checklist_items'), masterDataController.getTemplateItems);

/**
 * @swagger
 * /api/v1/master/checklist-items:
 *   post:
 *     summary: Create checklist item
 *     tags: [Master Data]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChecklistItem'
 *     responses:
 *       201:
 *         description: Checklist item created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/checklist-items', checkPermission('master.write'), validate(createChecklistItemSchema), auditLog('CREATE', 'checklist_items'), masterDataController.createChecklistItem);

/**
 * @swagger
 * /api/v1/master/checklist-items/{id}:
 *   put:
 *     summary: Update checklist item
 *     tags: [Master Data]
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
 *             $ref: '#/components/schemas/ChecklistItem'
 *     responses:
 *       200:
 *         description: Checklist item updated successfully
 *       404:
 *         description: Checklist item not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/checklist-items/:id', checkPermission('master.update'), validateParams(idSchema), validate(updateChecklistItemSchema), auditLog('UPDATE', 'checklist_items'), masterDataController.updateChecklistItem);

module.exports = router;
