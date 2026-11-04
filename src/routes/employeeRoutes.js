const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/auditLog');
const { employeeIdValidation, paginationValidation } = require('../middlewares/validator');

router.use(authMiddleware);

/**
 * @swagger
 * components:
 *   schemas:
 *     Employee:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         employee_code:
 *           type: string
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *           nullable: true
 *         full_name:
 *           type: string
 *         date_of_birth:
 *           type: string
 *           format: date
 *           nullable: true
 *         gender:
 *           type: string
 *           enum: [Male, Female, Other]
 *           nullable: true
 *         profile_photo:
 *           type: string
 *           nullable: true
 *         status:
 *           type: string
 *           nullable: true
 *         lifecycle_state:
 *           type: string
 *           nullable: true
 *         email:
 *           type: string
 *           nullable: true
 *         mobile:
 *           type: string
 *           nullable: true
 *         department_id:
 *           type: integer
 *           nullable: true
 *         department_name:
 *           type: string
 *           nullable: true
 *         designation_id:
 *           type: integer
 *           nullable: true
 *         designation_name:
 *           type: string
 *           nullable: true
 *         location_id:
 *           type: integer
 *           nullable: true
 *         location_name:
 *           type: string
 *           nullable: true
 *         role_id:
 *           type: integer
 *           nullable: true
 *         role_name:
 *           type: string
 *           nullable: true
 *         employment_type:
 *           type: string
 *           nullable: true
 *         employment_status:
 *           type: string
 *           nullable: true
 *         date_of_joining:
 *           type: string
 *           format: date
 *           nullable: true
 *         user_id:
 *           type: integer
 *           nullable: true
 *         username:
 *           type: string
 *           nullable: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time

 * /api/v1/employees:
 *   get:
 *     summary: Get all employees
 *     description: Retrieve a paginated list of employees with their job details. Supports search, filtering by status, department, and location.
 *     tags: [Employees]
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
 *         description: Search by employee code, name, email, or mobile
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, terminated, resigned]
 *         description: Filter by employee status
 *       - in: query
 *         name: department
 *         schema:
 *           type: integer
 *         description: Filter by department ID
 *       - in: query
 *         name: location
 *         schema:
 *           type: integer
 *         description: Filter by location ID
 *       - in: query
 *         name: lifecycle_state
 *         schema:
 *           type: string
 *           enum: [draft, onboarding, active, probation, confirmed, notice_period, exited]
 *         description: Filter by lifecycle state
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
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
 *                   example: Employees retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
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
 *     summary: Create new employee with optional user account
 *     description: Create a new employee record. Optionally creates a linked user account if username/email is provided. Handles employee basic info, contact details, job details, and user account creation in a single request.
 *     tags: [Employees]
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
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               employee_code:
 *                 type: string
 *                 description: Auto-generated if not provided
 *                 example: EMP001
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               gender:
 *                 type: string
 *                 enum: [Male, Female, Other]
 *                 example: Male
 *               profile_photo:
 *                 type: string
 *                 description: URL or file path for profile photo
 *                 example: /uploads/profiles/emp001.jpg
 *               lifecycle_state:
 *                 type: string
 *                 enum: [draft, onboarding, active, probation, confirmed, notice_period, exited]
 *                 default: draft
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@company.com
 *               mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *                 example: "9876543210"
 *                 pattern: "^[6-9]\\d{9}$"
 *               alternate_mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *                 example: "9876543211"
 *               personal_email:
 *                 type: string
 *                 format: email
 *                 example: john.personal@gmail.com
 *               linkedin_url:
 *                 type: string
 *                 format: uri
 *                 example: https://linkedin.com/in/johndoe
 *               emergency_contact_name:
 *                 type: string
 *                 example: Jane Doe
 *               emergency_contact_relation:
 *                 type: string
 *                 example: Spouse
 *               emergency_contact_mobile:
 *                 type: string
 *                 description: Indian mobile number (10 digits, starts with 6-9)
 *                 example: "9876543212"
 *               department_id:
 *                 type: integer
 *                 example: 1
 *               designation_id:
 *                 type: integer
 *                 example: 2
 *               location_id:
 *                 type: integer
 *                 example: 1
 *               role_id:
 *                 type: integer
 *                 description: Used for user account creation
 *                 example: 3
 *               reporting_manager_id:
 *                 type: integer
 *                 example: 5
 *               employment_type:
 *                 type: string
 *                 enum: [full_time, part_time, contract, intern]
 *                 default: full_time
 *               employment_status:
 *                 type: string
 *                 default: active
 *               date_of_joining:
 *                 type: string
 *                 format: date
 *                 description: Must not be a future date
 *                 example: 2026-05-06
 *               confirmation_date:
 *                 type: string
 *                 format: date
 *               effective_start_date:
 *                 type: string
 *                 format: date
 *               username:
 *                 type: string
 *                 description: Auto-generated from first/last name if not provided
 *                 example: john_doe
 *               password:
 *                 type: string
 *                 description: Optional. If not provided, a secure random password is auto-generated and sent via welcome email
 *                 example: SecurePass@123
 *               account_status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *     responses:
 *       201:
 *         description: Employee created successfully. Welcome email with credentials sent if user account was created.
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
 *                   example: Employee created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *                 generated_username:
 *                   type: string
 *                   nullable: true
 *                   description: Auto-generated username if user account was created
 *                   example: john_doe
 *       400:
 *         description: Validation error (invalid mobile, future date, duplicate email/username)
 *       401:
 *         description: Unauthorized
 */
router.get('/', auditLog('READ', 'employees'), paginationValidation, employeeController.getAllEmployees);

router.post('/', auditLog('CREATE', 'employees'), employeeController.createEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     description: Retrieve detailed employee information including contact details and current job details.
 *     tags: [Employees]
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
 *         description: Employee retrieved successfully
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
 *                   example: Employee retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     summary: Update employee basic information
 *     description: Update employee's basic details, contact information, and/or job details. Supports partial updates.
 *     tags: [Employees]
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
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
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
 *                 enum: [draft, onboarding, active, probation, confirmed, notice_period, exited]
 *               status:
 *                 type: string
 *                 enum: [active, inactive, terminated, resigned]
 *               email:
 *                 type: string
 *                 format: email
 *               mobile:
 *                 type: string
 *               alternate_mobile:
 *                 type: string
 *               personal_email:
 *                 type: string
 *                 format: email
 *               linkedin_url:
 *                 type: string
 *                 format: uri
 *               emergency_contact_name:
 *                 type: string
 *               emergency_contact_relation:
 *                 type: string
 *               emergency_contact_mobile:
 *                 type: string
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
 *               employment_status:
 *                 type: string
 *               date_of_joining:
 *                 type: string
 *                 format: date
 *               confirmation_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   delete:
 *     summary: Delete employee (soft delete)
 *     description: Soft delete an employee by setting deleted_at timestamp and updating status to 'deleted'. Does not delete linked user account.
 *     tags: [Employees]
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
 *         description: Employee deleted successfully
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
 *                   example: Employee deleted successfully
 *                 data:
 *                   type: object
 *                   nullable: true
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /api/v1/employees/{id}/restore:
 *   patch:
 *     summary: Restore deleted employee
 *     tags: [Employees]
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
 *         description: Employee restored successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/restore', employeeIdValidation, auditLog('UPDATE', 'employees'), employeeController.restoreEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}/lifecycle-state:
 *   patch:
 *     summary: Change employee lifecycle state
 *     tags: [Employees]
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
router.get('/:id', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getEmployeeById);

router.put('/:id', employeeIdValidation, auditLog('UPDATE', 'employees'), employeeController.updateEmployee);

router.delete('/:id', employeeIdValidation, auditLog('DELETE', 'employees'), employeeController.deleteEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}/restore:
 *   patch:
 *     summary: Restore deleted employee
 *     description: Restore a soft-deleted employee by clearing the deleted_at timestamp.
 *     tags: [Employees]
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
 *         description: Employee restored successfully
 *       404:
 *         description: Employee not found or not deleted
 *       401:
 *         description: Unauthorized
 */
router.patch('/:id/restore', employeeIdValidation, auditLog('UPDATE', 'employees'), employeeController.restoreEmployee);

/**
 * @swagger
 * /api/v1/employees/{id}/lifecycle-state:
 *   patch:
 *     summary: Change employee lifecycle state
 *     description: Transition an employee to a new lifecycle state. Records the state change in employee_lifecycle_history table.
 *     tags: [Employees]
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
 *               - to_state
 *             properties:
 *               to_state:
 *                 type: string
 *                 enum: [draft, onboarding, active, probation, confirmed, on_leave, suspended, resigned, terminated, retired, transferred, cancelled, notice_period, exited]
 *                 example: probation
 *               reason:
 *                 type: string
 *                 example: Successful completion of probation period
 *               remarks:
 *                 type: string
 *               effective_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-06
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
router.patch('/:id/lifecycle-state', employeeIdValidation, auditLog('UPDATE', 'employees'), employeeController.changeLifecycleState);

/**
 * @swagger
 * /api/v1/employees/{id}/lifecycle-history:
 *   get:
 *     summary: Get employee lifecycle history
 *     description: Retrieve the complete lifecycle state change history for an employee.
 *     tags: [Employees]
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
 *         description: Lifecycle history retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/lifecycle-history', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getLifecycleHistory);

/**
 * @swagger
 * /api/v1/employees/{id}/job-changes:
 *   post:
 *     summary: Record job change (transfer/promotion/demotion/confirmation)
 *     description: Records a job change event. Creates a new job detail record with SCD Type 2 history tracking.
 *     tags: [Employees]
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
 *               - change_type
 *             properties:
 *               change_type:
 *                 type: string
 *                 enum: [transfer, promotion, demotion, confirmation]
 *                 example: promotion
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
 *                 example: 2026-06-01
 *               reason:
 *                 type: string
 *                 example: Annual performance review
 *               remarks:
 *                 type: string
 *     responses:
 *       201:
 *         description: Job change recorded successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   get:
 *     summary: Get employee job change history
 *     description: Retrieve all job changes (transfers, promotions, demotions, confirmations) for an employee.
 *     tags: [Employees]
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
 *         description: Job changes retrieved successfully
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
 *                   example: Job changes retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       change_type:
 *                         type: string
 *                       from_department_name:
 *                         type: string
 *                         nullable: true
 *                       to_department_name:
 *                         type: string
 *                         nullable: true
 *                       from_designation_name:
 *                         type: string
 *                         nullable: true
 *                       to_designation_name:
 *                         type: string
 *                         nullable: true
 *                       effective_date:
 *                         type: string
 *                         format: date
 *                       reason:
 *                         type: string
 *                         nullable: true
 *                       remarks:
 *                         type: string
 *                         nullable: true
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/:id/job-changes', employeeIdValidation, auditLog('CREATE', 'employee_job_changes'), employeeController.addJobChange);

/**
 * @swagger
 * /api/v1/employees/{id}/job-changes:
 *   get:
 *     summary: Get employee job change history
 *     tags: [Employees]
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
 *         description: Job changes retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/job-changes', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getJobChanges);

/**
 * @swagger
 * /api/v1/employees/{id}/profile:
 *   get:
 *     summary: Get full employee profile
 *     description: Retrieve complete employee profile including contact details, addresses, bank details, education, experience, and documents.
 *     tags: [Employees]
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
 *         description: Employee profile retrieved successfully
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
 *                   example: Employee profile retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     employee:
 *                       $ref: '#/components/schemas/Employee'
 *                     contact:
 *                       type: object
 *                       nullable: true
 *                     addresses:
 *                       type: array
 *                       items:
 *                         type: object
 *                     bank_details:
 *                       type: array
 *                       items:
 *                         type: object
 *                     education:
 *                       type: array
 *                       items:
 *                         type: object
 *                     experience:
 *                       type: array
 *                       items:
 *                         type: object
 *                     documents:
 *                       type: array
 *                       items:
 *                         type: object
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/profile', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getEmployeeFullProfile);

/**
 * @swagger
 * /api/v1/employees/{id}/job-details:
 *   get:
 *     summary: Get employee job details history
 *     description: Retrieve complete job change history using SCD Type 2 tracking.
 *     tags: [Employees]
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
 *         description: Job details history retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Update job details (SCD Type 2)
 *     description: Create a new job detail record and close the previous one. Maintains full history of job changes.
 *     tags: [Employees]
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
 *               effective_start_date:
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
router.get('/:id/job-details', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getJobDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/job-details/current:
 *   get:
 *     summary: Get current job details
 *     description: Retrieve the current active job details for an employee.
 *     tags: [Employees]
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
 *         description: Current job details retrieved successfully
 *       404:
 *         description: Employee not found or no current job details
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/job-details/current', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getCurrentJobDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/job-details:
 *   post:
 *     summary: Update job details (SCD Type 2)
 *     tags: [Employees]
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
router.post('/:id/job-details', employeeIdValidation, auditLog('CREATE', 'employee_job_details'), employeeController.updateJobDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/addresses:
 *   get:
 *     summary: Get employee addresses history
 *     description: Retrieve all address records (current and historical) using SCD Type 2 tracking.
 *     tags: [Employees]
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
 *         description: Addresses retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add new address (SCD Type 2)
 *     description: Add a new address record. If an address of the same type already exists, it is closed and a new one is created.
 *     tags: [Employees]
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
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [current, permanent]
 *                 example: current
 *               address_line1:
 *                 type: string
 *                 example: 123 Main Street
 *               address_line2:
 *                 type: string
 *                 example: Apt 4B
 *               city:
 *                 type: string
 *                 example: Mumbai
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *               country:
 *                 type: string
 *                 default: India
 *                 example: India
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *     responses:
 *       201:
 *         description: Address added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/addresses', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getAddresses);

/**
 * @swagger
 * /api/v1/employees/{id}/addresses/current:
 *   get:
 *     summary: Get current addresses
 *     description: Retrieve only the current (active) address records for an employee.
 *     tags: [Employees]
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
 *         description: Current addresses retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/addresses/current', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getCurrentAddresses);

/**
 * @swagger
 * /api/v1/employees/{id}/addresses:
 *   post:
 *     summary: Add new address (SCD Type 2)
 *     tags: [Employees]
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
router.post('/:id/addresses', employeeIdValidation, auditLog('CREATE', 'employee_addresses'), employeeController.addAddress);

/**
 * @swagger
 * /api/v1/employees/{id}/bank-details:
 *   get:
 *     summary: Get employee bank details history
 *     description: Retrieve all bank detail records (current and historical) using SCD Type 2 tracking.
 *     tags: [Employees]
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
 *         description: Bank details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add bank details (SCD Type 2)
 *     description: Add a new bank detail record. Closes previous bank details if they exist.
 *     tags: [Employees]
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
 *               account_holder_name:
 *                 type: string
 *                 example: John Doe
 *               account_number:
 *                 type: string
 *                 example: "1234567890"
 *               ifsc_code:
 *                 type: string
 *                 example: SBIN0001234
 *               bank_name:
 *                 type: string
 *                 example: State Bank of India
 *               branch:
 *                 type: string
 *                 example: Andheri West
 *               account_type:
 *                 type: string
 *                 enum: [savings, current]
 *                 example: savings
 *               is_primary:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Bank details added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/bank-details', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getBankDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/bank-details/current:
 *   get:
 *     summary: Get current bank details
 *     description: Retrieve only the current (active) bank details for an employee.
 *     tags: [Employees]
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
 *         description: Current bank details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/bank-details/current', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getCurrentBankDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/bank-details:
 *   post:
 *     summary: Add bank details (SCD Type 2)
 *     tags: [Employees]
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
router.post('/:id/bank-details', employeeIdValidation, auditLog('CREATE', 'employee_bank_details'), employeeController.addBankDetails);

/**
 * @swagger
 * /api/v1/employees/{id}/education:
 *   get:
 *     summary: Get employee education records
 *     description: Retrieve all education records for an employee including institution, degree, and grades.
 *     tags: [Employees]
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
 *         description: Education records retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add education record
 *     description: Add a new education record for an employee.
 *     tags: [Employees]
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
 *               education_id:
 *                 type: integer
 *                 description: Reference to education master table
 *               course_id:
 *                 type: integer
 *                 description: Reference to course master table
 *               institution_name:
 *                 type: string
 *                 example: Mumbai University
 *               university_name:
 *                 type: string
 *                 example: University of Mumbai
 *               specialization:
 *                 type: string
 *                 example: Computer Science
 *               start_year:
 *                 type: integer
 *                 example: 2016
 *               end_year:
 *                 type: integer
 *                 example: 2020
 *               percentage:
 *                 type: number
 *                 example: 85.5
 *               cgpa:
 *                 type: number
 *                 example: 8.5
 *               grade:
 *                 type: string
 *                 example: A+
 *     responses:
 *       201:
 *         description: Education record added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/education', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getEducation);

/**
 * @swagger
 * /api/v1/employees/{id}/education:
 *   post:
 *     summary: Add education record
 *     tags: [Employees]
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
router.post('/:id/education', employeeIdValidation, auditLog('CREATE', 'employee_education'), employeeController.addEducation);

/**
 * @swagger
 * /api/v1/employees/{id}/experience:
 *   get:
 *     summary: Get employee experience records
 *     description: Retrieve all previous work experience records for an employee.
 *     tags: [Employees]
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
 *         description: Experience records retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Add experience record
 *     description: Add a new previous work experience record for an employee.
 *     tags: [Employees]
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
 *               company_name:
 *                 type: string
 *                 example: ABC Technologies
 *               designation:
 *                 type: string
 *                 example: Software Engineer
 *               department:
 *                 type: string
 *                 example: Engineering
 *               location:
 *                 type: string
 *                 example: Bangalore
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: 2020-06-01
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: 2024-05-31
 *               is_current:
 *                 type: boolean
 *                 default: false
 *               reason_for_leaving:
 *                 type: string
 *                 example: Better opportunity
 *     responses:
 *       201:
 *         description: Experience record added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/experience', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getExperience);

/**
 * @swagger
 * /api/v1/employees/{id}/experience:
 *   post:
 *     summary: Add experience record
 *     tags: [Employees]
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
router.post('/:id/experience', employeeIdValidation, auditLog('CREATE', 'employee_experience'), employeeController.addExperience);

/**
 * @swagger
 * /api/v1/employees/{id}/documents:
 *   get:
 *     summary: Get employee documents
 *     description: Retrieve all uploaded documents for an employee.
 *     tags: [Employees]
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
 *         description: Documents retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *   post:
 *     summary: Upload document
 *     description: Add a new document record for an employee.
 *     tags: [Employees]
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
 *               document_id:
 *                 type: integer
 *                 description: Reference to documents master table
 *               file_path:
 *                 type: string
 *                 example: /uploads/documents/emp001_aadhaar.pdf
 *               file_name:
 *                 type: string
 *                 example: aadhaar_card.pdf
 *               file_type:
 *                 type: string
 *                 example: application/pdf
 *               file_size:
 *                 type: integer
 *                 description: File size in bytes
 *                 example: 245000
 *               uploaded_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Document added successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/documents', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getDocuments);

/**
 * @swagger
 * /api/v1/employees/{id}/documents:
 *   post:
 *     summary: Upload document
 *     tags: [Employees]
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
router.post('/:id/documents', employeeIdValidation, auditLog('CREATE', 'employee_documents'), employeeController.addDocument);

/**
 * @swagger
 * /api/v1/employees/{id}/emergency-contacts:
 *   get:
 *     summary: Get emergency contacts
 *     description: Retrieve emergency contact details for an employee (from contact details table).
 *     tags: [Employees]
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
 *         description: Emergency contacts retrieved successfully
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
 *                   example: Emergency contacts retrieved successfully
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
router.get('/:id/emergency-contacts', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getEmergencyContacts);

/**
 * @swagger
 * /api/v1/employees/{id}/reporting-employees:
 *   get:
 *     summary: Get direct reports (employees reporting to a manager)
 *     description: Retrieve all employees who report to the specified manager.
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manager's Employee ID
 *     responses:
 *       200:
 *         description: Reporting employees retrieved successfully
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
 *                   example: Reporting employees retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Employee'
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/reporting-employees', employeeIdValidation, auditLog('READ', 'employees'), employeeController.getReportingEmployees);

module.exports = router;
