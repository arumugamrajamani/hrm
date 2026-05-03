const express = require('express');
const router = express.Router();
const employmentTypeController = require('../controllers/employmentTypeController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const { 
    createEmploymentTypeSchema, 
    updateEmploymentTypeSchema, 
    employmentTypeIdSchema,
    employmentTypeQuerySchema 
} = require('../validations/employmentTypeValidation');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/employment-types:
 *   get:
 *     summary: Get all employment types
 *     description: Retrieve a paginated list of employment types with optional search and status filtering. Requires authentication.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page (max 100)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by employment type name, code, or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by employment type status
 *     responses:
 *       200:
 *         description: List of employment types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Employment types retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EmploymentType'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     totalPages:
 *                       type: integer
 *                       example: 10
 *       401:
 *         description: Unauthorized - Access token required
 */
router.get('/', generalLimiter, validateQuery(employmentTypeQuerySchema), employmentTypeController.getAllEmploymentTypes);

/**
 * @swagger
 * /api/v1/employment-types/{id}:
 *   get:
 *     summary: Get employment type by ID
 *     description: Retrieve a specific employment type by its ID. Requires authentication.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employment Type ID
 *     responses:
 *       200:
 *         description: Employment type details retrieved successfully
 *       404:
 *         description: Employment type not found
 *       401:
 *         description: Unauthorized - Access token required
 */
router.get('/:id', validateParams(employmentTypeIdSchema), employmentTypeController.getEmploymentTypeById);

/**
 * @swagger
 * /api/v1/employment-types:
 *   post:
 *     summary: Create a new employment type (Admin only)
 *     description: Create a new employment type. This endpoint requires master.write permission.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employment_type_name
 *               - employment_type_code
 *             properties:
 *               employment_type_name:
 *                 type: string
 *                 example: "Full-Time"
 *                 description: Unique employment type name (2-100 characters)
 *               employment_type_code:
 *                 type: string
 *                 example: "FT"
 *                 description: Unique employment type code (2-20 uppercase characters)
 *               description:
 *                 type: string
 *                 example: "Full-time employment"
 *                 description: Optional employment type description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *     responses:
 *       201:
 *         description: Employment type created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Employment type name or code already exists
 */
router.post('/', checkPermission('master.write'), validate(createEmploymentTypeSchema), employmentTypeController.createEmploymentType);

/**
 * @swagger
 * /api/v1/employment-types/{id}:
 *   put:
 *     summary: Update employment type (Admin only)
 *     description: Update an existing employment type. This endpoint requires master.update permission.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employment Type ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               employment_type_name:
 *                 type: string
 *                 example: "Full-Time"
 *               employment_type_code:
 *                 type: string
 *                 example: "FT"
 *               description:
 *                 type: string
 *                 example: "Full-time employment"
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *     responses:
 *       200:
 *         description: Employment type updated successfully
 *       400:
 *         description: Validation error or duplicate entry
 *       404:
 *         description: Employment type not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       409:
 *         description: Employment type name or code already exists
 */
router.put('/:id', checkPermission('master.update'), validateParams(employmentTypeIdSchema), validate(updateEmploymentTypeSchema), employmentTypeController.updateEmploymentType);

/**
 * @swagger
 * /api/v1/employment-types/{id}:
 *   delete:
 *     summary: Delete (deactivate) employment type (Admin only)
 *     description: Soft delete an employment type by marking it as inactive. This endpoint requires master.delete permission.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employment Type ID
 *     responses:
 *       200:
 *         description: Employment type deleted successfully
 *       404:
 *         description: Employment type not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.delete('/:id', checkPermission('master.delete'), validateParams(employmentTypeIdSchema), employmentTypeController.deleteEmploymentType);

/**
 * @swagger
 * /api/v1/employment-types/{id}/activate:
 *   patch:
 *     summary: Activate employment type (Admin only)
 *     description: Activate a deactivated employment type. This endpoint requires master.update permission.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employment Type ID
 *     responses:
 *       200:
 *         description: Employment type activated successfully
 *       404:
 *         description: Employment type not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch('/:id/activate', checkPermission('master.update'), validateParams(employmentTypeIdSchema), employmentTypeController.activateEmploymentType);

/**
 * @swagger
 * /api/v1/employment-types/{id}/deactivate:
 *   patch:
 *     summary: Deactivate employment type (Admin only)
 *     description: Deactivate an active employment type. This endpoint requires master.update permission.
 *     tags: [Employment Types]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employment Type ID
 *     responses:
 *       200:
 *         description: Employment type deactivated successfully
 *       404:
 *         description: Employment type not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Insufficient permissions
 */
router.patch('/:id/deactivate', checkPermission('master.update'), validateParams(employmentTypeIdSchema), employmentTypeController.deactivateEmploymentType);

module.exports = router;
