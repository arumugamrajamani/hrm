const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const { authMiddleware } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/auditLog');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const {
    createOnboardingSchema, updateOnboardingSchema,
    updateChecklistItemSchema,
    createProbationSchema, updateProbationSchema,
    idSchema, onboardingIdSchema, itemIdSchema,
    querySchema
} = require('../validations/onboardingValidation');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/onboarding:
 *   get:
 *     summary: Get all onboarding records
 *     tags: [Onboarding]
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
 *         description: Filter by status (pending, in_progress, completed, delayed)
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *         description: Filter by employee ID
 *     responses:
 *       200:
 *         description: Onboarding records retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', validateQuery(querySchema), auditLog('READ', 'employee_onboarding'), onboardingController.getAllOnboarding);

/**
 * @swagger
 * /api/v1/onboarding:
 *   post:
 *     summary: Create onboarding record
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Onboarding'
 *     responses:
 *       201:
 *         description: Onboarding record created successfully
 *       400:
 *         description: Onboarding already exists or validation error
 *       404:
 *         description: Employee or template not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', checkPermission('onboarding.write'), validate(createOnboardingSchema), auditLog('CREATE', 'employee_onboarding'), onboardingController.createOnboarding);

/**
 * @swagger
 * /api/v1/onboarding/{id}:
 *   get:
 *     summary: Get onboarding record by ID
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Onboarding ID
 *     responses:
 *       200:
 *         description: Onboarding record retrieved successfully
 *       404:
 *         description: Onboarding record not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', validateParams(idSchema), auditLog('READ', 'employee_onboarding'), onboardingController.getOnboardingById);

/**
 * @swagger
 * /api/v1/onboarding/employee/{id}:
 *   get:
 *     summary: Get onboarding by employee ID
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Onboarding record retrieved successfully
 *       404:
 *         description: No onboarding record found
 *       401:
 *         description: Unauthorized
 */
router.get('/employee/:id', validateParams(idSchema), auditLog('READ', 'employee_onboarding'), onboardingController.getOnboardingByEmployeeId);

/**
 * @swagger
 * /api/v1/onboarding/{id}:
 *   put:
 *     summary: Update onboarding record
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Onboarding ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Onboarding'
 *     responses:
 *       200:
 *         description: Onboarding record updated successfully
 *       404:
 *         description: Onboarding record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/:id', checkPermission('onboarding.update'), validateParams(idSchema), validate(updateOnboardingSchema), auditLog('UPDATE', 'employee_onboarding'), onboardingController.updateOnboarding);

/**
 * @swagger
 * /api/v1/onboarding/{onboardingId}/checklist/{itemId}:
 *   patch:
 *     summary: Update checklist item status
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: onboardingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Onboarding ID
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Checklist Item ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, skipped]
 *               remarks:
 *                 type: string
 *               attachment_path:
 *                 type: string
 *     responses:
 *       200:
 *         description: Checklist item updated successfully
 *       404:
 *         description: Onboarding or item not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:onboardingId/checklist/:itemId', validateParams(onboardingIdSchema.keys(itemIdSchema.fields)), validate(updateChecklistItemSchema), auditLog('UPDATE', 'employee_checklist_progress'), onboardingController.updateChecklistItem);

/**
 * @swagger
 * /api/v1/onboarding/probation/{id}:
 *   get:
 *     summary: Get probation tracking
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     responses:
 *       200:
 *         description: Probation tracking retrieved
 *       401:
 *         description: Unauthorized
 */
router.get('/probation/:id', validateParams(idSchema), auditLog('READ', 'probation_tracking'), onboardingController.getProbationTracking);

/**
 * @swagger
 * /api/v1/onboarding/probation/{id}:
 *   post:
 *     summary: Create probation tracking
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - probation_start_date
 *               - probation_end_date
 *             properties:
 *               probation_start_date:
 *                 type: string
 *                 format: date
 *               probation_end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Probation tracking created
 *       400:
 *         description: Already exists or validation error
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/probation/:id', checkPermission('onboarding.write'), validateParams(idSchema), validate(createProbationSchema), auditLog('CREATE', 'probation_tracking'), onboardingController.createProbationTracking);

/**
 * @swagger
 * /api/v1/onboarding/probation/{id}:
 *   patch:
 *     summary: Update probation status
 *     tags: [Onboarding]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [in_progress, confirmed, extended, terminated]
 *               performance_rating:
 *                 type: string
 *                 enum: [excellent, good, average, poor]
 *               manager_feedback:
 *                 type: string
 *               hr_feedback:
 *                 type: string
 *               self_assessment:
 *                 type: string
 *               confirmation_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Probation status updated
 *       404:
 *         description: Probation tracking not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.patch('/probation/:id', checkPermission('onboarding.update'), validateParams(idSchema), validate(updateProbationSchema), auditLog('UPDATE', 'probation_tracking'), onboardingController.updateProbationStatus);

module.exports = router;
