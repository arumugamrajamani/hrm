const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const employeeController = require('../controllers/employeeController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { auditLog } = require('../middlewares/auditLog');
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
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         employee_id:
 *           type: integer
 *           nullable: true
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         mobile:
 *           type: string
 *           nullable: true
 *         role_id:
 *           type: integer
 *         role_name:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           enum: [active, inactive, blocked, deleted]
 *         two_factor_enabled:
 *           type: boolean
 *         password_changed_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         last_login:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         employee_code:
 *           type: string
 *           nullable: true
 *         first_name:
 *           type: string
 *           nullable: true
 *         last_name:
 *           type: string
 *           nullable: true
 *         employee_name:
 *           type: string
 *           nullable: true
 *         profile_photo:
 *           type: string
 *           nullable: true
 *           description: Profile photo from linked employee record

 * /api/v1/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a paginated list of users with linked employee information. Supports search by username, email, mobile, or employee code. Profile photo is fetched from the linked employee record.
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
 *         description: Search by username, email, mobile, employee code, or employee name
 *         example: john
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, blocked, deleted]
 *         description: Filter by user account status
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: Users retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Create a new user (Admin only)
 *     description: Create a new user account. Does not create an employee record. To create employee + user together, use POST /api/v1/employees instead.
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
 *               - password
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@company.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass@123
 *               role_id:
 *                 type: integer
 *                 example: 2
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
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     message:
 *                       type: string
 *       400:
 *         description: Validation error (email/username/mobile already exists)
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - insufficient permissions
 */
router.get('/', generalLimiter, paginationValidation, userController.getAllUsers);

/**
 * @swagger
 * /api/v1/users/roles:
 *   get:
 *     summary: Get all roles
 *     description: Retrieve all available user roles for assignment.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles retrieved successfully
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
 *                   example: Roles retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       permissions:
 *                         type: array
 *                         items:
 *                           type: string
 */
router.get('/roles', userController.getAllRoles);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     summary: Create a new user
 *     description: Create a new user account. Does not create an employee record. To create employee + user together, use POST /api/v1/employees instead.
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
 *               - password
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@company.com
 *               mobile:
 *                 type: string
 *                 example: "9876543210"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: SecurePass@123
 *               role_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', checkPermission('users.write'), userController.createUser);

/**
 * @swagger
 * /api/v1/users/with-email:
 *   post:
 *     summary: Create user with email invitation
 *     description: Create a new user with auto-generated password. Password is sent to the user's email address.
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
 *               - role_id
 *             properties:
 *               username:
 *                 type: string
 *                 example: janedoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: jane@company.com
 *               mobile:
 *                 type: string
 *                 example: "9876543211"
 *               role_id:
 *                 type: integer
 *                 example: 2
 *     responses:
 *       201:
 *         description: User created and credentials sent via email
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/with-email', checkPermission('users.write'), createUserWithEmailValidation, userController.createUserWithEmail);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     summary: Update user
 *     description: Update user account details. Does not update employee information.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               status:
 *                 type: string
 *                 enum: [active, inactive, blocked]
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', checkPermission('users.update'), userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Delete user (soft delete)
 *     description: Soft delete a user by setting account_status to 'deleted'.
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
 *         description: Unauthorized
 */
router.delete('/:id', checkPermission('users.delete'), idValidation, userController.deleteUser);

/**
 * @swagger
 * /api/v1/users/{id}/activate:
 *   patch:
 *     summary: Activate user
 *     description: Set user account status to 'active'.
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
 *         description: Unauthorized
 */
router.patch('/:id/activate', checkPermission('users.update'), idValidation, userController.activateUser);

/**
 * @swagger
 * /api/v1/users/{id}/deactivate:
 *   patch:
 *     summary: Deactivate user
 *     description: Set user account status to 'inactive'.
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
 *         description: Unauthorized
 */
router.patch('/:id/deactivate', checkPermission('users.update'), idValidation, userController.deactivateUser);

/**
 * @swagger
 * /api/v1/users/employee:
 *   get:
 *     summary: Get all employees
 *     description: Retrieve a paginated list of employees with search and filters.
 *     tags: [Users]
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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/employee', auditLog('READ', 'employees'), employeeController.getAllEmployees);

/**
 * @swagger
 * /api/v1/users/employee:
 *   post:
 *     summary: Create new employee with optional user account
 *     description: Create a new employee record with contact details, job details, and optional user account.
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
 *               - first_name
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               employee_code:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *               profile_photo:
 *                 type: string
 *               lifecycle_state:
 *                 type: string
 *                 default: draft
 *               email:
 *                 type: string
 *                 example: john@company.com
 *               mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *                 example: "9876543210"
 *               alternate_mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *               personal_email:
 *                 type: string
 *               linkedin_url:
 *                 type: string
 *               emergency_contact_name:
 *                 type: string
 *               emergency_contact_relation:
 *                 type: string
 *               emergency_contact_mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *               department_id:
 *                 type: integer
 *               designation_id:
 *                 type: integer
 *               location_id:
 *                 type: integer
 *               role_id:
 *                 type: integer
 *               reporting_manager_id:
 *                 type: integer
 *               employment_type:
 *                 type: string
 *                 default: full_time
 *               employment_status:
 *                 type: string
 *                 default: active
 *               date_of_joining:
 *                 type: string
 *                 format: date
 *                 description: Must not be a future date
 *               confirmation_date:
 *                 type: string
 *                 format: date
 *               effective_start_date:
 *                 type: string
 *                 format: date
 *               username:
 *                 type: string
 *                 description: Auto-generated from first/last name if not provided
 *               password:
 *                 type: string
 *               account_status:
 *                 type: string
 *                 default: active
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error (invalid mobile, future date, duplicate email/username)
 *       401:
 *         description: Unauthorized
 */
router.post('/employee', auditLog('CREATE', 'employees'), employeeController.createEmployee);

/**
 * @swagger
 * /api/v1/users/{id}/employee:
 *   get:
 *     summary: Get employee by user ID
 *     description: Retrieve employee details linked to a user.
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
 *         description: Employee retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee', auditLog('READ', 'employees'), employeeController.getEmployeeById);

/**
 * @swagger
 * /api/v1/users/{id}/employee:
 *   put:
 *     summary: Update employee
 *     description: Update employee details.
 *     tags: [Users]
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *               lifecycle_state:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id/employee', auditLog('UPDATE', 'employees'), employeeController.updateEmployee);

/**
 * @swagger
 * /api/v1/users/{id}/employee/restore:
 *   patch:
 *     summary: Restore deleted employee
 *     description: Restore a soft-deleted employee record.
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
 *         description: Employee restored successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/employee/restore', auditLog('UPDATE', 'employees'), employeeController.restoreEmployee);

/**
 * @swagger
 * /api/v1/users/{id}/employee/lifecycle-state:
 *   patch:
 *     summary: Change employee lifecycle state
 *     description: Transition employee to a new lifecycle state (e.g., probation, confirmed, resigned).
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to_state
 *             properties:
 *               to_state:
 *                 type: string
 *                 enum: [active, probation, confirmed, on_leave, suspended, resigned, terminated, retired, transferred, cancelled]
 *               reason:
 *                 type: string
 *               remarks:
 *                 type: string
 *               effective_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Lifecycle state changed successfully
 *       400:
 *         description: Invalid state transition
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/employee/lifecycle-state', auditLog('UPDATE', 'employees'), employeeController.changeLifecycleState);

/**
 * @swagger
 * /api/v1/users/{id}/employee/lifecycle-history:
 *   get:
 *     summary: Get employee lifecycle history
 *     description: Retrieve the full lifecycle state change history for an employee.
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
 *         description: Lifecycle history retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/lifecycle-history', auditLog('READ', 'employees'), employeeController.getLifecycleHistory);

/**
 * @swagger
 * /api/v1/users/{id}/employee/job-changes:
 *   post:
 *     summary: Record job change
 *     description: Record a transfer, promotion, demotion, or confirmation for an employee.
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - change_type
 *             properties:
 *               change_type:
 *                 type: string
 *                 enum: [transfer, promotion, demotion, confirmation]
 *               to_department_id:
 *                 type: integer
 *               to_designation_id:
 *                 type: integer
 *               to_location_id:
 *                 type: integer
 *               to_reporting_manager_id:
 *                 type: integer
 *               to_employment_type:
 *                 type: string
 *               to_salary:
 *                 type: number
 *               effective_date:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job change recorded successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/job-changes', auditLog('CREATE', 'employee_job_changes'), employeeController.addJobChange);

/**
 * @swagger
 * /api/v1/users/{id}/employee/job-changes:
 *   get:
 *     summary: Get job change history
 *     description: Retrieve all job changes for an employee.
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
 *         description: Job changes retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/job-changes', auditLog('READ', 'employees'), employeeController.getJobChanges);

/**
 * @swagger
 * /api/v1/users/{id}/employee/profile:
 *   get:
 *     summary: Get full employee profile
 *     description: Retrieve complete employee profile including personal, job, and related data.
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
 *         description: Employee profile retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/profile', auditLog('READ', 'employees'), employeeController.getEmployeeFullProfile);

/**
 * @swagger
 * /api/v1/users/{id}/employee/job-details:
 *   get:
 *     summary: Get job details history
 *     description: Retrieve all job details records (SCD Type 2) for an employee.
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
 *         description: Job details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/job-details', auditLog('READ', 'employees'), employeeController.getJobDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/job-details/current:
 *   get:
 *     summary: Get current job details
 *     description: Retrieve the current active job details for an employee.
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
 *         description: Current job details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/job-details/current', auditLog('READ', 'employees'), employeeController.getCurrentJobDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/job-details:
 *   post:
 *     summary: Update job details (SCD Type 2)
 *     description: Create a new job details record, closing the current one.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               department_id:
 *                 type: integer
 *               designation_id:
 *                 type: integer
 *               location_id:
 *                 type: integer
 *               role_id:
 *                 type: integer
 *               reporting_manager_id:
 *                 type: integer
 *               employment_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *               employment_status:
 *                 type: string
 *               date_of_joining:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Job details updated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/job-details', auditLog('CREATE', 'employee_job_details'), employeeController.updateJobDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/addresses:
 *   get:
 *     summary: Get address history
 *     description: Retrieve all address records for an employee.
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
 *         description: Addresses retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/addresses', auditLog('READ', 'employees'), employeeController.getAddresses);

/**
 * @swagger
 * /api/v1/users/{id}/employee/addresses/current:
 *   get:
 *     summary: Get current addresses
 *     description: Retrieve the current active addresses for an employee.
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
 *         description: Current addresses retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/addresses/current', auditLog('READ', 'employees'), employeeController.getCurrentAddresses);

/**
 * @swagger
 * /api/v1/users/{id}/employee/addresses:
 *   post:
 *     summary: Add new address (SCD Type 2)
 *     description: Add a new address record, closing the current one of the same type.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [current, permanent]
 *               address_line1:
 *                 type: string
 *               address_line2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               country:
 *                 type: string
 *               pincode:
 *                 type: string
 *     responses:
 *       201:
 *         description: Address added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/addresses', auditLog('CREATE', 'employee_addresses'), employeeController.addAddress);

/**
 * @swagger
 * /api/v1/users/{id}/employee/bank-details:
 *   get:
 *     summary: Get bank details history
 *     description: Retrieve all bank detail records for an employee.
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
 *         description: Bank details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/bank-details', auditLog('READ', 'employees'), employeeController.getBankDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/bank-details/current:
 *   get:
 *     summary: Get current bank details
 *     description: Retrieve the current active bank details for an employee.
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
 *         description: Current bank details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/bank-details/current', auditLog('READ', 'employees'), employeeController.getCurrentBankDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/bank-details:
 *   post:
 *     summary: Add bank details (SCD Type 2)
 *     description: Add new bank details record with versioning.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               account_holder_name:
 *                 type: string
 *               account_number:
 *                 type: string
 *               ifsc_code:
 *                 type: string
 *               bank_name:
 *                 type: string
 *               branch:
 *                 type: string
 *               account_type:
 *                 type: string
 *                 enum: [savings, current]
 *               is_primary:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Bank details added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/bank-details', auditLog('CREATE', 'employee_bank_details'), employeeController.addBankDetails);

/**
 * @swagger
 * /api/v1/users/{id}/employee/education:
 *   get:
 *     summary: Get education records
 *     description: Retrieve all education records for an employee.
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
 *         description: Education records retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/education', auditLog('READ', 'employees'), employeeController.getEducation);

/**
 * @swagger
 * /api/v1/users/{id}/employee/education:
 *   post:
 *     summary: Add education record
 *     description: Add a new education record for an employee.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               education_id:
 *                 type: integer
 *               course_id:
 *                 type: integer
 *               institution_name:
 *                 type: string
 *               university_name:
 *                 type: string
 *               start_year:
 *                 type: integer
 *               end_year:
 *                 type: integer
 *               percentage:
 *                 type: number
 *               cgpa:
 *                 type: number
 *     responses:
 *       201:
 *         description: Education record added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/education', auditLog('CREATE', 'employee_education'), employeeController.addEducation);

/**
 * @swagger
 * /api/v1/users/{id}/employee/experience:
 *   get:
 *     summary: Get experience records
 *     description: Retrieve all previous work experience records for an employee.
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
 *         description: Experience records retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/experience', auditLog('READ', 'employees'), employeeController.getExperience);

/**
 * @swagger
 * /api/v1/users/{id}/employee/experience:
 *   post:
 *     summary: Add experience record
 *     description: Add a new work experience record for an employee.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               designation:
 *                 type: string
 *               department:
 *                 type: string
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               is_current:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Experience record added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/experience', auditLog('CREATE', 'employee_experience'), employeeController.addExperience);

/**
 * @swagger
 * /api/v1/users/{id}/employee/documents:
 *   get:
 *     summary: Get employee documents
 *     description: Retrieve all uploaded documents for an employee.
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
 *         description: Documents retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/documents', auditLog('READ', 'employees'), employeeController.getDocuments);

/**
 * @swagger
 * /api/v1/users/{id}/employee/documents:
 *   post:
 *     summary: Upload document
 *     description: Upload a new document for an employee.
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
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               document_id:
 *                 type: integer
 *               file_path:
 *                 type: string
 *               file_name:
 *                 type: string
 *               file_type:
 *                 type: string
 *               file_size:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Document added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/employee/documents', auditLog('CREATE', 'employee_documents'), employeeController.addDocument);

/**
 * @swagger
 * /api/v1/users/{id}/employee/emergency-contacts:
 *   get:
 *     summary: Get emergency contacts
 *     description: Retrieve emergency contact information for an employee.
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
 *         description: Emergency contacts retrieved successfully
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
 *                       employee_id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       relation:
 *                         type: string
 *                         nullable: true
 *                       mobile:
 *                         type: string
 *                       alternate_mobile:
 *                         type: string
 *                         nullable: true
 *                       email:
 *                         type: string
 *                         nullable: true
 *                       address:
 *                         type: string
 *                         nullable: true
 *                       priority_order:
 *                         type: integer
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/emergency-contacts', auditLog('READ', 'employees'), employeeController.getEmergencyContacts);

/**
 * @swagger
 * /api/v1/users/{id}/employee/reporting-employees:
 *   get:
 *     summary: Get reporting employees
 *     description: Retrieve all employees reporting to a given manager.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manager User ID
 *     responses:
 *       200:
 *         description: Reporting employees retrieved successfully
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/employee/reporting-employees', auditLog('READ', 'employees'), employeeController.getReportingEmployees);

// NOTE: Keep this catch-all route last so static paths such as /users/employee and
// /users/roles are matched first.
/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve user details including linked employee information. Profile photo is fetched from the employee record.
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
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: User retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', idValidation, userController.getUserById);

module.exports = router;
