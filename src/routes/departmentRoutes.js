const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/departmentController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');
const { 
    createDepartmentValidation,
    updateDepartmentValidation,
    departmentIdValidation,
    paginationValidation
} = require('../middlewares/validator');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Get all departments
 *     description: Retrieve a paginated list of departments with optional search, filtering, and hierarchy support. Requires authentication.
 *     tags: [Departments]
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
 *         description: Search by department name, code, or description
 *         example: "Engineering"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by department status
 *       - in: query
 *         name: hierarchy
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include parent department information in response
 *     responses:
 *       200:
 *         description: List of departments retrieved successfully
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
 *                   example: "Departments retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
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
router.get('/', generalLimiter, paginationValidation, departmentController.getAllDepartments);

/**
 * @swagger
 * /api/v1/departments/hierarchy:
 *   get:
 *     summary: Get department hierarchy
 *     description: Retrieve the complete department hierarchy as a nested tree structure. Requires authentication.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Department hierarchy retrieved successfully
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
 *                   example: "Department hierarchy retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DepartmentHierarchy'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/hierarchy', departmentController.getDepartmentHierarchy);

/**
 * @swagger
 * /api/v1/departments/{id}/children:
 *   get:
 *     summary: Get child departments
 *     description: Retrieve all direct child departments of a specific department. Requires authentication.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent department ID
 *     responses:
 *       200:
 *         description: Child departments retrieved successfully
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
 *                   example: "Child departments retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
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
router.get('/:id/children', departmentIdValidation, departmentController.getChildDepartments);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   get:
 *     summary: Get department by ID
 *     description: Retrieve a specific department by its ID with parent department information. Requires authentication.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department details retrieved successfully
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
 *                   example: "Department retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
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
router.get('/:id', departmentIdValidation, departmentController.getDepartmentById);

/**
 * @swagger
 * /api/v1/departments:
 *   post:
 *     summary: Create a new department (Admin only)
 *     description: Create a new department. This endpoint requires admin privileges.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - department_name
 *               - department_code
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: "Frontend Engineering"
 *                 description: Unique department name (2-100 characters)
 *               department_code:
 *                 type: string
 *                 example: "FE"
 *                 description: Unique department code (2-20 uppercase characters, must start with letter)
 *               parent_department_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Optional parent department ID for hierarchy
 *               description:
 *                 type: string
 *                 example: "Frontend development team"
 *                 description: Optional department description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Department created successfully
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
 *                   example: "Department created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Department'
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
 *         description: Department name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', isAdmin, createDepartmentValidation, departmentController.createDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   put:
 *     summary: Update department (Admin only)
 *     description: Update an existing department. This endpoint requires admin privileges. Supports circular hierarchy prevention.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_name:
 *                 type: string
 *                 example: "Frontend Engineering"
 *                 description: Unique department name (2-100 characters)
 *               department_code:
 *                 type: string
 *                 example: "FE"
 *                 description: Unique department code (2-20 uppercase characters)
 *               parent_department_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Parent department ID for hierarchy (cannot create circular hierarchy)
 *               description:
 *                 type: string
 *                 example: "Frontend development team"
 *                 description: Department description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Department updated successfully
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
 *                   example: "Department updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: Validation error, circular hierarchy, or duplicate entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Department not found
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
 *         description: Department name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', isAdmin, updateDepartmentValidation, departmentController.updateDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}:
 *   delete:
 *     summary: Delete (deactivate) department (Admin only)
 *     description: Soft delete a department by marking it as inactive. This endpoint requires admin privileges. Departments with child departments cannot be deleted.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deleted successfully
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
 *                   example: "Department deleted successfully"
 *       400:
 *         description: Cannot delete department with child departments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Department not found
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
router.delete('/:id', isAdmin, departmentIdValidation, departmentController.deleteDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}/activate:
 *   patch:
 *     summary: Activate department (Admin only)
 *     description: Activate a deactivated department. This endpoint requires admin privileges.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department activated successfully
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
 *                   example: "Department activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
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
router.patch('/:id/activate', isAdmin, departmentIdValidation, departmentController.activateDepartment);

/**
 * @swagger
 * /api/v1/departments/{id}/deactivate:
 *   patch:
 *     summary: Deactivate department (Admin only)
 *     description: Deactivate an active department. This endpoint requires admin privileges. Departments with child departments cannot be deactivated.
 *     tags: [Departments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Department ID
 *     responses:
 *       200:
 *         description: Department deactivated successfully
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
 *                   example: "Department deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Department'
 *       400:
 *         description: Cannot deactivate department with child departments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Department not found
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
router.patch('/:id/deactivate', isAdmin, departmentIdValidation, departmentController.deactivateDepartment);

module.exports = router;
