const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const { 
    createShiftSchema, 
    updateShiftSchema, 
    shiftIdSchema,
    shiftQuerySchema 
} = require('../validations/shiftValidation');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/shifts:
 *   get:
 *     summary: Get all shifts
 *     description: Retrieve a paginated list of shifts with optional search and status filtering. Requires authentication.
 *     tags: [Shifts]
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
 *         description: Search by shift name or code
 *         example: "Morning"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by shift status
 *     responses:
 *       200:
 *         description: List of shifts retrieved successfully
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
 *                   example: "Shifts retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Shift'
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
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', generalLimiter, validateQuery(shiftQuerySchema), shiftController.getAllShifts);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     description: Retrieve a specific shift by its ID. Requires authentication.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details retrieved successfully
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
 *                   example: "Shift retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Shift'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', validateParams(shiftIdSchema), shiftController.getShiftById);

/**
 * @swagger
 * /api/v1/shifts:
 *   post:
 *     summary: Create a new shift (Admin only)
 *     description: Create a new shift. This endpoint requires admin privileges. Shift code is auto-generated if not provided.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shift_name
 *               - start_time
 *               - end_time
 *             properties:
 *               shift_name:
 *                 type: string
 *                 example: "Morning Shift"
 *                 description: Unique shift name (2-100 characters)
 *               shift_code:
 *                 type: string
 *                 example: "MOR"
 *                 description: Unique shift code (2-20 characters, optional - auto-generated)
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *                 description: Shift start time in HH:MM:SS format
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "18:00:00"
 *                 description: Shift end time in HH:MM:SS format
 *               break_duration:
 *                 type: integer
 *                 example: 60
 *                 description: Break duration in minutes (0-480)
 *               weekoff_days:
 *                 type: string
 *                 example: "Saturday,Sunday"
 *                 description: Comma-separated week off days
 *               is_flexible:
 *                 type: boolean
 *                 example: false
 *                 description: Whether the shift has flexible timing
 *               grace_period_minutes:
 *                 type: integer
 *                 example: 15
 *                 description: Grace period in minutes (0-60)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Shift created successfully
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
 *                   example: "Shift created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Shift name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', checkPermission('master.write'), validate(createShiftSchema), shiftController.createShift);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   put:
 *     summary: Update shift (Admin only)
 *     description: Update an existing shift. This endpoint requires admin privileges.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shift_name:
 *                 type: string
 *                 example: "Morning Shift Updated"
 *                 description: Unique shift name (2-100 characters)
 *               shift_code:
 *                 type: string
 *                 example: "MOR"
 *                 description: Unique shift code (2-20 characters)
 *               start_time:
 *                 type: string
 *                 format: time
 *                 example: "09:00:00"
 *               end_time:
 *                 type: string
 *                 format: time
 *                 example: "18:00:00"
 *               break_duration:
 *                 type: integer
 *                 example: 60
 *               weekoff_days:
 *                 type: string
 *                 example: "Saturday,Sunday"
 *               is_flexible:
 *                 type: boolean
 *                 example: false
 *               grace_period_minutes:
 *                 type: integer
 *                 example: 15
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Shift updated successfully
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
 *                   example: "Shift updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Shift'
 *       400:
 *         description: Validation error or duplicate entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Shift name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', checkPermission('master.update'), validateParams(shiftIdSchema), validate(updateShiftSchema), shiftController.updateShift);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   delete:
 *     summary: Delete (deactivate) shift (Admin only)
 *     description: Soft delete a shift by marking it as inactive. Cannot delete shifts that are in use. Requires admin privileges.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
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
 *                   example: "Shift deleted successfully"
 *                 data:
 *                   type: null
 *                   example: null
 *       400:
 *         description: Cannot delete shift that is in use
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:id', checkPermission('master.delete'), validateParams(shiftIdSchema), shiftController.deleteShift);

/**
 * @swagger
 * /api/v1/shifts/{id}/activate:
 *   patch:
 *     summary: Activate shift (Admin only)
 *     description: Activate a deactivated shift. This endpoint requires admin privileges.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift activated successfully
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
 *                   example: "Shift activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Shift'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/activate', checkPermission('master.update'), validateParams(shiftIdSchema), shiftController.activateShift);

/**
 * @swagger
 * /api/v1/shifts/{id}/deactivate:
 *   patch:
 *     summary: Deactivate shift (Admin only)
 *     description: Deactivate an active shift. This endpoint requires admin privileges.
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deactivated successfully
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
 *                   example: "Shift deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Shift'
 *       404:
 *         description: Shift not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.patch('/:id/deactivate', checkPermission('master.update'), validateParams(shiftIdSchema), shiftController.deactivateShift);

module.exports = router;
