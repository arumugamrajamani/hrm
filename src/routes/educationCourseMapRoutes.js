const express = require('express');
const router = express.Router();
const educationCourseMapController = require('../controllers/educationCourseMapController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');
const { validate, validateParams } = require('../validations/joiValidator');
const { createMappingSchema, mappingIdSchema } = require('../validations/educationCourseMapValidation');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/education-course:
 *   get:
 *     summary: Get all education-course mappings
 *     description: Retrieve all mappings between educations and courses. Requires authentication.
 *     tags: [Education-Course Mapping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of mappings retrieved successfully
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
 *                   example: "Mappings retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EducationCourseMap'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', generalLimiter, educationCourseMapController.getAllMappings);

/**
 * @swagger
 * /api/education-course/{id}:
 *   get:
 *     summary: Get mapping by ID
 *     description: Retrieve a specific education-course mapping by its ID. Requires authentication.
 *     tags: [Education-Course Mapping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mapping ID
 *     responses:
 *       200:
 *         description: Mapping details retrieved successfully
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
 *                   example: "Mapping retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EducationCourseMap'
 *       404:
 *         description: Mapping not found
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
router.get('/:id', validateParams(mappingIdSchema), educationCourseMapController.getMappingById);

/**
 * @swagger
 * /api/education-course:
 *   post:
 *     summary: Create a new education-course mapping (Admin only)
 *     description: Create a mapping between an education and a course. This endpoint requires admin privileges.
 *     tags: [Education-Course Mapping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - education_id
 *               - course_id
 *             properties:
 *               education_id:
 *                 type: integer
 *                 example: 1
 *                 description: Education ID to map
 *               course_id:
 *                 type: integer
 *                 example: 1
 *                 description: Course ID to map
 *     responses:
 *       201:
 *         description: Mapping created successfully
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
 *                   example: "Mapping created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/EducationCourseMap'
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
 *       404:
 *         description: Education or Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Mapping already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', isAdmin, validate(createMappingSchema), educationCourseMapController.createMapping);

/**
 * @swagger
 * /api/education-course/{id}:
 *   delete:
 *     summary: Delete education-course mapping (Admin only)
 *     description: Remove a mapping between an education and a course. This endpoint requires admin privileges.
 *     tags: [Education-Course Mapping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Mapping ID
 *     responses:
 *       200:
 *         description: Mapping deleted successfully
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
 *                   example: "Mapping deleted successfully"
 *                 data:
 *                   type: null
 *                   example: null
 *       404:
 *         description: Mapping not found
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
router.delete('/:id', isAdmin, validateParams(mappingIdSchema), educationCourseMapController.deleteMapping);

module.exports = router;
