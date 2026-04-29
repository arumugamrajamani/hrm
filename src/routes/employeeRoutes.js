const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authMiddleware } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/auditLog');

router.use(authMiddleware);

/**
 * @swagger
 * /employees:
 *   get:
 *     summary: Get all employees
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
 *         description: Search by name, code, or email
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
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
 *     responses:
 *       200:
 *         description: Employees retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auditLog('READ', 'employees'), employeeController.getAllEmployees);

/**
 * @swagger
 * /employees:
 *   post:
 *     summary: Create new employee
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
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               profile_photo:
 *                 type: string
 *     responses:
 *       201:
 *         description: Employee created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', auditLog('CREATE', 'employees'), employeeController.createEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   get:
 *     summary: Get employee by ID
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
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', auditLog('READ', 'employees'), employeeController.getEmployeeById);

/**
 * @swagger
 * /employees/{id}:
 *   put:
 *     summary: Update employee
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
 *               last_name:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               profile_photo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', auditLog('UPDATE', 'employees'), employeeController.updateEmployee);

/**
 * @swagger
 * /employees/{id}:
 *   delete:
 *     summary: Delete employee (soft delete)
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
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', auditLog('DELETE', 'employees'), employeeController.deleteEmployee);

/**
 * @swagger
 * /employees/{id}/restore:
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
router.patch('/:id/restore', auditLog('UPDATE', 'employees'), employeeController.restoreEmployee);

/**
 * @swagger
 * /employees/{id}/profile:
 *   get:
 *     summary: Get full employee profile
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
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/profile', auditLog('READ', 'employees'), employeeController.getEmployeeFullProfile);

/**
 * @swagger
 * /employees/{id}/job-details:
 *   get:
 *     summary: Get employee job details history
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
 *         description: Job details retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/job-details', auditLog('READ', 'employees'), employeeController.getJobDetails);

/**
 * @swagger
 * /employees/{id}/job-details/current:
 *   get:
 *     summary: Get current job details
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
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/job-details/current', auditLog('READ', 'employees'), employeeController.getCurrentJobDetails);

/**
 * @swagger
 * /employees/{id}/job-details:
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
router.post('/:id/job-details', auditLog('CREATE', 'employee_job_details'), employeeController.updateJobDetails);

/**
 * @swagger
 * /employees/{id}/addresses:
 *   get:
 *     summary: Get employee addresses history
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
 */
router.get('/:id/addresses', auditLog('READ', 'employees'), employeeController.getAddresses);

/**
 * @swagger
 * /employees/{id}/addresses/current:
 *   get:
 *     summary: Get current addresses
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
router.get('/:id/addresses/current', auditLog('READ', 'employees'), employeeController.getCurrentAddresses);

/**
 * @swagger
 * /employees/{id}/addresses:
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
router.post('/:id/addresses', auditLog('CREATE', 'employee_addresses'), employeeController.addAddress);

/**
 * @swagger
 * /employees/{id}/bank-details:
 *   get:
 *     summary: Get employee bank details history
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
 */
router.get('/:id/bank-details', auditLog('READ', 'employees'), employeeController.getBankDetails);

/**
 * @swagger
 * /employees/{id}/bank-details/current:
 *   get:
 *     summary: Get current bank details
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
router.get('/:id/bank-details/current', auditLog('READ', 'employees'), employeeController.getCurrentBankDetails);

/**
 * @swagger
 * /employees/{id}/bank-details:
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
router.post('/:id/bank-details', auditLog('CREATE', 'employee_bank_details'), employeeController.addBankDetails);

/**
 * @swagger
 * /employees/{id}/education:
 *   get:
 *     summary: Get employee education records
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
 */
router.get('/:id/education', auditLog('READ', 'employees'), employeeController.getEducation);

/**
 * @swagger
 * /employees/{id}/education:
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
router.post('/:id/education', auditLog('CREATE', 'employee_education'), employeeController.addEducation);

/**
 * @swagger
 * /employees/{id}/experience:
 *   get:
 *     summary: Get employee experience records
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
 */
router.get('/:id/experience', auditLog('READ', 'employees'), employeeController.getExperience);

/**
 * @swagger
 * /employees/{id}/experience:
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
router.post('/:id/experience', auditLog('CREATE', 'employee_experience'), employeeController.addExperience);

/**
 * @swagger
 * /employees/{id}/documents:
 *   get:
 *     summary: Get employee documents
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
 */
router.get('/:id/documents', auditLog('READ', 'employees'), employeeController.getDocuments);

/**
 * @swagger
 * /employees/{id}/documents:
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
router.post('/:id/documents', auditLog('CREATE', 'employee_documents'), employeeController.addDocument);

/**
 * @swagger
 * /employees/{id}/emergency-contacts:
 *   get:
 *     summary: Get emergency contacts
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
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/emergency-contacts', auditLog('READ', 'employees'), employeeController.getEmergencyContacts);

/**
 * @swagger
 * /employees/{id}/reporting-employees:
 *   get:
 *     summary: Get reporting employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Manager ID
 *     responses:
 *       200:
 *         description: Reporting employees retrieved successfully
 *       404:
 *         description: Manager not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/reporting-employees', auditLog('READ', 'employees'), employeeController.getReportingEmployees);

module.exports = router;
