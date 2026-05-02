const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { 
    createLocationValidation,
    updateLocationValidation,
    locationIdValidation,
    paginationValidation
} = require('../middlewares/validator');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

/**
 * @swagger
 * /api/v1/locations:
 *   get:
 *     summary: Get all locations
 *     description: Retrieve a paginated list of locations with optional search, filtering, and hierarchy support. Requires authentication.
 *     tags: [Locations]
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
 *         description: Search by location name, code, city, or description
 *         example: "Delhi"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by location status
 *       - in: query
 *         name: hierarchy
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Include parent location information in response
 *     responses:
 *       200:
 *         description: List of locations retrieved successfully
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
 *                   example: "Locations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
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
router.get('/', generalLimiter, paginationValidation, locationController.getAllLocations);

/**
 * @swagger
 * /api/v1/locations/hierarchy:
 *   get:
 *     summary: Get location hierarchy
 *     description: Retrieve the complete location hierarchy as a nested tree structure. Requires authentication.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Location hierarchy retrieved successfully
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
 *                   example: "Location hierarchy retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LocationHierarchy'
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/hierarchy', locationController.getLocationHierarchy);

/**
 * @swagger
 * /api/v1/locations/{id}/children:
 *   get:
 *     summary: Get child locations
 *     description: Retrieve all direct child locations of a specific location. Requires authentication.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Parent location ID
 *     responses:
 *       200:
 *         description: Child locations retrieved successfully
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
 *                   example: "Child locations retrieved successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
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
router.get('/:id/children', locationIdValidation, locationController.getChildLocations);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   get:
 *     summary: Get location by ID
 *     description: Retrieve a specific location by its ID with parent location information. Requires authentication.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location details retrieved successfully
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
 *                   example: "Location retrieved successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
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
router.get('/:id', locationIdValidation, locationController.getLocationById);

/**
 * @swagger
 * /api/v1/locations/generate-code/code:
 *   get:
 *     summary: Generate branch code
 *     description: Generate a new unique branch code. Requires authentication.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: prefix
 *         schema:
 *           type: string
 *           default: LOC
 *         description: Code prefix (e.g., "MUM", "DEL")
 *     responses:
 *       200:
 *         description: Branch code generated successfully
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
 *                   example: "Branch code generated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     branch_code:
 *                       type: string
 *                       example: "LOC001"
 *       401:
 *         description: Unauthorized - Access token required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/generate-code/code', locationController.generateBranchCode);

/**
 * @swagger
 * /api/v1/locations:
 *   post:
 *     summary: Create a new location (Admin only)
 *     description: Create a new location/branch. This endpoint requires admin privileges. Branch code is auto-generated if not provided.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - location_name
 *             properties:
 *               location_name:
 *                 type: string
 *                 example: "Mumbai Branch"
 *                 description: Unique location name (2-100 characters)
 *               location_code:
 *                 type: string
 *                 nullable: true
 *                 example: "MUM001"
 *                 description: Unique location code (2-20 characters, auto-generated if not provided)
 *               parent_location_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Optional parent location ID for hierarchy
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: "123 Business Park, Andheri East"
 *                 description: Full address
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *                 description: City name
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *                 description: State name
 *               country:
 *                 type: string
 *                 default: "India"
 *                 example: "India"
 *                 description: Country name
 *               pincode:
 *                 type: string
 *                 nullable: true
 *                 example: "400093"
 *                 description: Postal code
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+912212345678"
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 nullable: true
 *                 format: email
 *                 example: "mumbai@company.com"
 *                 description: Contact email
 *               is_headquarters:
 *                 type: boolean
 *                 default: false
 *                 example: false
 *                 description: Set as company headquarters (only one allowed)
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Main Mumbai office branch"
 *                 description: Location description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: "active"
 *                 example: "active"
 *     responses:
 *       201:
 *         description: Location created successfully
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
 *                   example: "Location created successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
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
 *         description: Location name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', checkPermission('master.write'), createLocationValidation, locationController.createLocation);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   put:
 *     summary: Update location (Admin only)
 *     description: Update an existing location. This endpoint requires admin privileges. Supports circular hierarchy prevention.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location_name:
 *                 type: string
 *                 example: "Mumbai Branch"
 *                 description: Unique location name (2-100 characters)
 *               location_code:
 *                 type: string
 *                 nullable: true
 *                 example: "MUM001"
 *                 description: Unique location code (2-20 characters)
 *               parent_location_id:
 *                 type: integer
 *                 nullable: true
 *                 example: 1
 *                 description: Parent location ID for hierarchy (cannot create circular hierarchy)
 *               address:
 *                 type: string
 *                 nullable: true
 *                 example: "123 Business Park, Andheri East"
 *                 description: Full address
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *                 description: City name
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *                 description: State name
 *               country:
 *                 type: string
 *                 example: "India"
 *                 description: Country name
 *               pincode:
 *                 type: string
 *                 nullable: true
 *                 example: "400093"
 *                 description: Postal code
 *               phone:
 *                 type: string
 *                 nullable: true
 *                 example: "+912212345678"
 *                 description: Contact phone number
 *               email:
 *                 type: string
 *                 nullable: true
 *                 format: email
 *                 example: "mumbai@company.com"
 *                 description: Contact email
 *               is_headquarters:
 *                 type: boolean
 *                 example: false
 *                 description: Set as company headquarters
 *               description:
 *                 type: string
 *                 nullable: true
 *                 example: "Main Mumbai office branch"
 *                 description: Location description (max 1000 characters)
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: "active"
 *     responses:
 *       200:
 *         description: Location updated successfully
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
 *                   example: "Location updated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Validation error, circular hierarchy, or duplicate entry
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
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
 *         description: Location name or code already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:id', checkPermission('master.update'), updateLocationValidation, locationController.updateLocation);

/**
 * @swagger
 * /api/v1/locations/{id}:
 *   delete:
 *     summary: Delete (deactivate) location (Admin only)
 *     description: Soft delete a location by marking it as inactive. This endpoint requires admin privileges. Locations with child locations cannot be deleted. Headquarters cannot be deleted.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deleted successfully
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
 *                   example: "Location deleted successfully"
 *       400:
 *         description: Cannot delete location with child locations or headquarters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
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
router.delete('/:id', checkPermission('master.delete'), locationIdValidation, locationController.deleteLocation);

/**
 * @swagger
 * /api/v1/locations/{id}/activate:
 *   patch:
 *     summary: Activate location (Admin only)
 *     description: Activate a deactivated location. This endpoint requires admin privileges.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location activated successfully
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
 *                   example: "Location activated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       404:
 *         description: Location not found
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
router.patch('/:id/activate', checkPermission('master.update'), locationIdValidation, locationController.activateLocation);

/**
 * @swagger
 * /api/v1/locations/{id}/deactivate:
 *   patch:
 *     summary: Deactivate location (Admin only)
 *     description: Deactivate an active location. This endpoint requires admin privileges. Locations with child locations or headquarters cannot be deactivated.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location deactivated successfully
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
 *                   example: "Location deactivated successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Cannot deactivate location with child locations or headquarters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
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
router.patch('/:id/deactivate', checkPermission('master.update'), locationIdValidation, locationController.deactivateLocation);

/**
 * @swagger
 * /api/v1/locations/{id}/headquarters:
 *   patch:
 *     summary: Set location as headquarters (Admin only)
 *     description: Set a location as the company headquarters. Only one headquarters allowed. This endpoint requires admin privileges.
 *     tags: [Locations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Location ID
 *     responses:
 *       200:
 *         description: Location set as headquarters successfully
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
 *                   example: "Location set as headquarters successfully"
 *                 data:
 *                   $ref: '#/components/schemas/Location'
 *       400:
 *         description: Cannot set inactive location as headquarters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Location not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Headquarters already exists
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
router.patch('/:id/headquarters', checkPermission('master.update'), locationIdValidation, locationController.setAsHeadquarters);

module.exports = router;