const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roleCheck');
const { 
    createUserValidation,
    createUserWithEmailValidation,
    updateUserValidation,
    idValidation,
    paginationValidation
} = require('../middlewares/validator');
const { generalLimiter } = require('../middlewares/rateLimiter');
const upload = require('../config/upload');

router.use(authMiddleware);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users. Supports search by username, email, or mobile. Requires authentication.
 *     tags: [Users]
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
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by username, email, or mobile number
 *         example: "john"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by user status
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
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
 *                   example: "Users retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 100
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         totalPages:
 *                           type: integer
 *                           example: 10
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', generalLimiter, paginationValidation, userController.getAllUsers);

/**
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all available user roles. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *       401:
 *         description: Unauthorized - Access token required
 */
router.get('/roles', userController.getAllRoles);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a specific user by their ID. Requires authentication.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 */
router.get('/:id', idValidation, userController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Create a new user account. This endpoint requires admin privileges. Supports multipart form data for profile photo upload.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - mobile
 *               - password
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               password:
 *                 type: string
 *                 example: "Password123!"
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               profile_photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo image (jpeg, jpg, png, gif, webp) max 5MB
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/', isAdmin, upload.single('profile_photo'), userController.createUser);

/**
 * @swagger
 * /api/users/with-email:
 *   post:
 *     summary: Create user with email invitation (Admin only)
 *     description: Create a new user and send an email invitation. This endpoint requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - mobile
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               role_id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User created and invitation sent
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post('/with-email', isAdmin, createUserWithEmailValidation, userController.createUserWithEmail);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     description: Update an existing user. This endpoint requires admin privileges. Supports multipart form data for profile photo upload.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: john_doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               role_id:
 *                 type: integer
 *                 example: 1
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               profile_photo:
 *                 type: string
 *                 format: binary
 *                 description: Profile photo image (jpeg, jpg, png, gif, webp) max 5MB
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.put('/:id', isAdmin, upload.single('profile_photo'), userController.updateUser);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     description: Delete a user permanently. This endpoint requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.delete('/:id', isAdmin, idValidation, userController.deleteUser);

/**
 * @swagger
 * /api/users/{id}/activate:
 *   patch:
 *     summary: Activate user (Admin only)
 *     description: Activate a deactivated user account. This endpoint requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User activated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/activate', isAdmin, idValidation, userController.activateUser);

/**
 * @swagger
 * /api/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user (Admin only)
 *     description: Deactivate a user account. This endpoint requires admin privileges.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deactivated successfully
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Access token required
 *       403:
 *         description: Forbidden - Admin access required
 */
router.patch('/:id/deactivate', isAdmin, idValidation, userController.deactivateUser);

module.exports = router;
