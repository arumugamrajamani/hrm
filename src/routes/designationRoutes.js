const express = require('express');
const router = express.Router();
const designationController = require('../controllers/designationController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { 
    createDesignationValidation,
    updateDesignationValidation,
    designationIdValidation,
    paginationValidation
} = require('../middlewares/validator');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/designations:
 *   get:
 *     summary: Get all designations
 *     description: Retrieve a paginated list of designations with optional search and filtering. Requires authentication.
 *     tags: [Designations]
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
 *         description: Search by designation name, code, or description
 *         example: "Manager"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by designation status
 *     responses:
 *       200:
 *         description: List of designations retrieved successfully
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
 *                   example: "Designations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Designation'
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
router.get('/', generalLimiter, paginationValidation, designationController.getAllDesignations);

/**
 * @swagger
 * /api/v1/designations/department/{departmentId}:
 *   get:
 *     summary: Get designations by department
 *     description: Retrieve all active designations for a specific department. Requires authentication.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Designations retrieved successfully
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
 *                   example: "Designations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Designation'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/department/:departmentId', designationController.getDesignationsByDepartment);

/**
 * @swagger
 * /api/v1/designations/{id}:
 *   get:
 *     summary: Get designation by ID
 *     description: Retrieve a specific designation by its ID. Requires authentication.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     responses:
 *       200:
 *         description: Designation details retrieved successfully
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
 *                   example: "Designation retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       404:
 *         description: Designation not found
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
router.get('/:id', designationIdValidation, designationController.getDesignationById);

/**
 * @swagger
 * /api/v1/designations/generate-code/code:
 *   get:
 *     summary: Generate designation code
 *     description: Generate a new unique designation code. Requires authentication.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *           default: DES
 *         description: Code prefix (e.g., "MGR", "ENG")
 *     responses:
 *       200:
 *         description: Designation code generated successfully
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
 *                   example: "Designation code generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     designation_code:
 *                       type: string
 *                       example: "DES001"
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/generate-code/code', designationController.generateDesignationCode);

/**
 * @swagger
 * /api/v1/designations:
 *   post:
 *     summary: Create a new designation (Admin only)
 *     description: Create a new designation. This endpoint requires admin privileges. Designation code is auto-generated if not provided.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - designation_name
 *             properties:
 *               designation_name:
 *                 type: string
 *                 example: "Senior Manager"
 *                 description: Unique designation name (2-100 characters)
 *               designation_code:
 *                 type: string
 *                 nullable: true
 *                 example: "MGR001"
 *                 description: Unique designation code (2-20 characters, auto-generated if not provided)
 *               department_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Associated department ID
 *               grade_level:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *                 description: Grade level (1-20)
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Senior management role"
 *                 description: Designation description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Designation created successfully
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
 *                   example: "Designation created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       400:
 *         description: Validation error or duplicate entry
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
 *         description: Designation name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', checkPermission('master.write'), createDesignationValidation, designationController.createDesignation);

/**
 * @swagger
 * /api/v1/designations/{id}:
 *   put:
 *     summary: Update designation (Admin only)
 *     description: Update an existing designation. This endpoint requires admin privileges.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               designation_name:
 *                 type: string
 *                 example: "Senior Manager"
 *                 description: Unique designation name (2-100 characters)
 *               designation_code:
 *                 type: string
 *                 nullable: true
 *                 example: "MGR001"
 *                 description: Unique designation code (2-20 characters)
 *               department_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Associated department ID
 *               grade_level:
 *                 type: integer
 *                 nullable: true
 *                 example: 5
 *                 description: Grade level (1-20)
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Senior management role"
 *                 description: Designation description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Designation updated successfully
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
 *                   example: "Designation updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       400:
 *         description: Validation error or duplicate entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Designation not found
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
 *         description: Designation name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', checkPermission('master.update'), updateDesignationValidation, designationController.updateDesignation);

/**
 * @swagger
 * /api/v1/designations/{id}:
 *   delete:
 *     summary: Delete (deactivate) designation (Admin only)
 *     description: Soft delete a designation by marking it as inactive. This endpoint requires admin privileges. Designations with active employees cannot be deleted.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     responses:
 *       200:
 *         description: Designation deleted successfully
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
 *                   example: "Designation deleted successfully"
 *       400:
 *         description: Cannot delete designation with active employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Designation not found
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
router.delete('/:id', checkPermission('master.delete'), designationIdValidation, designationController.deleteDesignation);

/**
 * @swagger
 * /api/v1/designations/{id}/activate:
 *   patch:
 *     summary: Activate designation (Admin only)
 *     description: Activate a deactivated designation. This endpoint requires admin privileges.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     responses:
 *       200:
 *         description: Designation activated successfully
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
 *                   example: "Designation activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       404:
 *         description: Designation not found
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
router.patch('/:id/activate', checkPermission('master.update'), designationIdValidation, designationController.activateDesignation);

/**
 * @swagger
 * /api/v1/designations/{id}/deactivate:
 *   patch:
 *     summary: Deactivate designation (Admin only)
 *     description: Deactivate an active designation. This endpoint requires admin privileges. Designations with active employees cannot be deactivated.
 *     tags: [Designations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Designation ID
 *     responses:
 *       200:
 *         description: Designation deactivated successfully
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
 *                   example: "Designation deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Designation'
 *       400:
 *         description: Cannot deactivate designation with active employees
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Designation not found
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
router.patch('/:id/deactivate', checkPermission('master.update'), designationIdValidation, designationController.deactivateDesignation);

module.exports = router;
