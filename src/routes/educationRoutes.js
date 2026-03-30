const express = require('express');
const router = express.Router();
const educationController = require('../controllers/educationController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const { 
    createEducationSchema, 
    updateEducationSchema, 
    educationIdSchema,
    educationQuerySchema 
} = require('../validations/educationValidation');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/education:
 *   get:
 *     summary: Get all educations
 *     description: Retrieve a paginated list of educations with optional search, filtering by level and status. Requires authentication.
 *     tags: [Education]
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
 *         description: Search by education name, code, or description
 *         example: "Engineering"
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [School, UG, PG, Doctorate, Certification]
 *         description: Filter by education level
 *         example: "UG"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by education status
 *     responses:
 *       200:
 *         description: List of educations retrieved successfully
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
 *                   example: "Educations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Education'
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
router.get('/', generalLimiter, validateQuery(educationQuerySchema), educationController.getAllEducations);

/**
 * @swagger
 * /api/v1/education/{id}:
 *   get:
 *     summary: Get education by ID
 *     description: Retrieve a specific education by its ID. Requires authentication.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Education details retrieved successfully
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
 *                   example: "Education retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Education'
 *       404:
 *         description: Education not found
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
router.get('/:id', validateParams(educationIdSchema), educationController.getEducationById);

/**
 * @swagger
 * /api/v1/education/{id}/courses:
 *   get:
 *     summary: Get all courses under an education
 *     description: Retrieve all courses mapped to a specific education. Requires authentication.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Courses retrieved successfully
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
 *                   example: "Courses retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     education:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                           example: 1
 *                         education_name:
 *                           type: string
 *                           example: "Bachelor of Engineering"
 *                         education_code:
 *                           type: string
 *                           example: "BE"
 *                         level:
 *                           type: string
 *                           example: "UG"
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           course_id:
 *                             type: integer
 *                             example: 1
 *                           course_name:
 *                             type: string
 *                             example: "Computer Science"
 *                           course_code:
 *                             type: string
 *                             example: "CSE"
 *                           course_description:
 *                             type: string
 *                             example: "Computer Science and Engineering"
 *                           course_status:
 *                             type: string
 *                             example: "active"
 *       404:
 *         description: Education not found
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
router.get('/:id/courses', validateParams(educationIdSchema), educationController.getCoursesByEducation);

/**
 * @swagger
 * /api/v1/education:
 *   post:
 *     summary: Create a new education (Admin only)
 *     description: Create a new education/degree. This endpoint requires admin privileges.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - education_name
 *               - education_code
 *               - level
 *             properties:
 *               education_name:
 *                 type: string
 *                 example: "Bachelor of Engineering"
 *                 description: Unique education name (2-100 characters)
 *               education_code:
 *                 type: string
 *                 example: "BE"
 *                 description: Unique education code (2-20 uppercase characters)
 *               level:
 *                 type: string
 *                 enum: [School, UG, PG, Doctorate, Certification]
 *                 example: "UG"
 *                 description: Education level
 *               description:
 *                 type: string
 *                 example: "Undergraduate engineering degree program"
 *                 description: Optional education description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Education created successfully
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
 *                   example: "Education created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Education'
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
 *         description: Education name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', isAdmin, validate(createEducationSchema), educationController.createEducation);

/**
 * @swagger
 * /api/v1/education/{id}:
 *   put:
 *     summary: Update education (Admin only)
 *     description: Update an existing education. This endpoint requires admin privileges.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               education_name:
 *                 type: string
 *                 example: "Bachelor of Technology"
 *                 description: Unique education name (2-100 characters)
 *               education_code:
 *                 type: string
 *                 example: "BTECH"
 *                 description: Unique education code (2-20 uppercase characters)
 *               level:
 *                 type: string
 *                 enum: [School, UG, PG, Doctorate, Certification]
 *                 example: "UG"
 *                 description: Education level
 *               description:
 *                 type: string
 *                 example: "Updated description"
 *                 description: Education description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Education updated successfully
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
 *                   example: "Education updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Education'
 *       400:
 *         description: Validation error or duplicate entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Education not found
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
 *         description: Education name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', isAdmin, validateParams(educationIdSchema), validate(updateEducationSchema), educationController.updateEducation);

/**
 * @swagger
 * /api/v1/education/{id}:
 *   delete:
 *     summary: Delete (deactivate) education (Admin only)
 *     description: Soft delete an education by marking it as inactive. This endpoint requires admin privileges.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Education deleted successfully
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
 *                   example: "Education deleted successfully"
 *                 data:
 *                   type: null
 *                   example: null
 *       404:
 *         description: Education not found
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
router.delete('/:id', isAdmin, validateParams(educationIdSchema), educationController.deleteEducation);

/**
 * @swagger
 * /api/v1/education/{id}/activate:
 *   patch:
 *     summary: Activate education (Admin only)
 *     description: Activate a deactivated education. This endpoint requires admin privileges.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Education activated successfully
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
 *                   example: "Education activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Education'
 *       404:
 *         description: Education not found
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
router.patch('/:id/activate', isAdmin, validateParams(educationIdSchema), educationController.activateEducation);

/**
 * @swagger
 * /api/v1/education/{id}/deactivate:
 *   patch:
 *     summary: Deactivate education (Admin only)
 *     description: Deactivate an active education. This endpoint requires admin privileges.
 *     tags: [Education]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Education ID
 *     responses:
 *       200:
 *         description: Education deactivated successfully
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
 *                   example: "Education deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Education'
 *       404:
 *         description: Education not found
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
router.patch('/:id/deactivate', isAdmin, validateParams(educationIdSchema), educationController.deactivateEducation);

module.exports = router;
