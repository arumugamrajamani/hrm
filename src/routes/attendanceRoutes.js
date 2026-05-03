const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authMiddleware } = require('../middlewares/auth');
const { auditLog } = require('../middlewares/auditLog');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const {
    createShiftSchema, updateShiftSchema,
    createHolidaySchema, updateHolidaySchema,
    markAttendanceSchema, regularizeAttendanceSchema,
    createLeaveTypeSchema,
    initializeLeaveBalanceSchema,
    createLeaveRequestSchema, updateLeaveRequestStatusSchema,
    createTimesheetSchema, updateTimesheetStatusSchema,
    idSchema, querySchema
} = require('../validations/attendanceValidation');

router.use(authMiddleware);

// ==================== SHIFTS ====================
/**
 * @swagger
 * /api/v1/attendance/shifts:
 *   get:
 *     summary: Get all shifts
 *     tags: [Attendance]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Shifts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/shifts', validateQuery(querySchema), auditLog('READ', 'shifts'), attendanceController.getAllShifts);

/**
 * @swagger
 * /api/v1/attendance/shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Shift retrieved successfully
 *       404:
 *         description: Shift not found
 */
router.get('/shifts/:id', validateParams(idSchema), auditLog('READ', 'shifts'), attendanceController.getShiftById);

/**
 * @swagger
 * /api/v1/attendance/shifts:
 *   post:
 *     summary: Create shift
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shift'
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/shifts', checkPermission('attendance.write'), validate(createShiftSchema), auditLog('CREATE', 'shifts'), attendanceController.createShift);

/**
 * @swagger
 * /api/v1/attendance/shifts/{id}:
 *   put:
 *     summary: Update shift
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Shift'
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       404:
 *         description: Shift not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/shifts/:id', checkPermission('attendance.update'), validateParams(idSchema), validate(updateShiftSchema), auditLog('UPDATE', 'shifts'), attendanceController.updateShift);

// ==================== HOLIDAYS ====================
/**
 * @swagger
 * /api/v1/attendance/holidays:
 *   get:
 *     summary: Get all holidays
 *     tags: [Attendance]
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
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Holidays retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/holidays', validateQuery(querySchema), auditLog('READ', 'holiday_calendar'), attendanceController.getAllHolidays);

/**
 * @swagger
 * /api/v1/attendance/holidays/{id}:
 *   get:
 *     summary: Get holiday by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Holiday retrieved successfully
 *       404:
 *         description: Holiday not found
 */
router.get('/holidays/:id', validateParams(idSchema), auditLog('READ', 'holiday_calendar'), attendanceController.getHolidayById);

/**
 * @swagger
 * /api/v1/attendance/holidays:
 *   post:
 *     summary: Create holiday
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HolidayCalendar'
 *     responses:
 *       201:
 *         description: Holiday created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/holidays', checkPermission('attendance.write'), validate(createHolidaySchema), auditLog('CREATE', 'holiday_calendar'), attendanceController.createHoliday);

/**
 * @swagger
 * /api/v1/attendance/holidays/{id}:
 *   put:
 *     summary: Update holiday
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/HolidayCalendar'
 *     responses:
 *       200:
 *         description: Holiday updated successfully
 *       404:
 *         description: Holiday not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/holidays/:id', checkPermission('attendance.update'), validateParams(idSchema), validate(updateHolidaySchema), auditLog('UPDATE', 'holiday_calendar'), attendanceController.updateHoliday);

// ==================== ATTENDANCE RECORDS ====================
/**
 * @swagger
 * /api/v1/attendance/records:
 *   get:
 *     summary: Get attendance records
 *     tags: [Attendance]
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
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Attendance records retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/records', validateQuery(querySchema), auditLog('READ', 'attendance_records'), attendanceController.getAllAttendance);

/**
 * @swagger
 * /api/v1/attendance/records/{id}:
 *   get:
 *     summary: Get attendance record by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Attendance record retrieved successfully
 *       404:
 *         description: Attendance record not found
 */
router.get('/records/:id', validateParams(idSchema), auditLog('READ', 'attendance_records'), attendanceController.getAttendanceById);

/**
 * @swagger
 * /api/v1/attendance/mark:
 *   post:
 *     summary: Mark attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AttendanceRecord'
 *     responses:
 *       201:
 *         description: Attendance marked successfully
 *       400:
 *         description: Attendance already marked or validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/mark', validate(markAttendanceSchema), auditLog('CREATE', 'attendance_records'), attendanceController.markAttendance);

/**
 * @swagger
 * /api/v1/attendance/regularize/{id}:
 *   patch:
 *     summary: Regularize attendance
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - regularization_reason
 *             properties:
 *               regularization_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Attendance regularized successfully
 *       404:
 *         description: Attendance record not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.patch('/regularize/:id', checkPermission('attendance.update'), validateParams(idSchema), validate(regularizeAttendanceSchema), auditLog('UPDATE', 'attendance_records'), attendanceController.regularizeAttendance);

// ==================== LEAVE TYPES ====================
/**
 * @swagger
 * /api/v1/attendance/leave-types:
 *   get:
 *     summary: Get all leave types
 *     tags: [Attendance]
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
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave types retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/leave-types', validateQuery(querySchema), auditLog('READ', 'leave_types'), attendanceController.getAllLeaveTypes);

/**
 * @swagger
 * /api/v1/attendance/leave-types/{id}:
 *   get:
 *     summary: Get leave type by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave type retrieved successfully
 *       404:
 *         description: Leave type not found
 */
router.get('/leave-types/:id', validateParams(idSchema), auditLog('READ', 'leave_types'), attendanceController.getLeaveTypeById);

/**
 * @swagger
 * /api/v1/attendance/leave-types:
 *   post:
 *     summary: Create leave type
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveType'
 *     responses:
 *       201:
 *         description: Leave type created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/leave-types', checkPermission('attendance.write'), validate(createLeaveTypeSchema), auditLog('CREATE', 'leave_types'), attendanceController.createLeaveType);

// ==================== LEAVE BALANCES ====================
/**
 * @swagger
 * /api/v1/attendance/leave-balances/{id}:
 *   get:
 *     summary: Get leave balances for employee
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Employee ID
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave balances retrieved successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.get('/leave-balances/:id', validateParams(idSchema), auditLog('READ', 'leave_balances'), attendanceController.getLeaveBalances);

/**
 * @swagger
 * /api/v1/attendance/leave-balances/{id}/initialize:
 *   post:
 *     summary: Initialize leave balances for employee
 *     tags: [Attendance]
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
 *               - year
 *             properties:
 *               year:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Leave balances initialized successfully
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/leave-balances/:id/initialize', checkPermission('attendance.write'), validateParams(idSchema), validate(initializeLeaveBalanceSchema), auditLog('CREATE', 'leave_balances'), attendanceController.initializeLeaveBalances);

// ==================== LEAVE REQUESTS ====================
/**
 * @swagger
 * /api/v1/attendance/leave-requests:
 *   get:
 *     summary: Get all leave requests
 *     tags: [Attendance]
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
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Leave requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/leave-requests', validateQuery(querySchema), auditLog('READ', 'leave_requests'), attendanceController.getAllLeaveRequests);

/**
 * @swagger
 * /api/v1/attendance/leave-requests/{id}:
 *   get:
 *     summary: Get leave request by ID
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Leave request retrieved successfully
 *       404:
 *         description: Leave request not found
 */
router.get('/leave-requests/:id', validateParams(idSchema), auditLog('READ', 'leave_requests'), attendanceController.getLeaveRequestById);

/**
 * @swagger
 * /api/v1/attendance/leave-requests:
 *   post:
 *     summary: Create leave request
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LeaveRequest'
 *     responses:
 *       201:
 *         description: Leave request created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Employee or leave type not found
 *       401:
 *         description: Unauthorized
 */
router.post('/leave-requests', validate(createLeaveRequestSchema), auditLog('CREATE', 'leave_requests'), attendanceController.createLeaveRequest);

/**
 * @swagger
 * /api/v1/attendance/leave-requests/{id}/status:
 *   patch:
 *     summary: Update leave request status
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave request status updated successfully
 *       404:
 *         description: Leave request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.patch('/leave-requests/:id/status', checkPermission('attendance.update'), validateParams(idSchema), validate(updateLeaveRequestStatusSchema), auditLog('UPDATE', 'leave_requests'), attendanceController.updateLeaveRequestStatus);

// ==================== TIMESHEETS ====================
/**
 * @swagger
 * /api/v1/attendance/timesheets:
 *   get:
 *     summary: Get all timesheets
 *     tags: [Attendance]
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
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Timesheets retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/timesheets', validateQuery(querySchema), auditLog('READ', 'timesheets'), attendanceController.getAllTimesheets);

/**
 * @swagger
 * /api/v1/attendance/timesheets:
 *   post:
 *     summary: Create timesheet entry
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Timesheet'
 *     responses:
 *       201:
 *         description: Timesheet created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Employee not found
 *       401:
 *         description: Unauthorized
 */
router.post('/timesheets', validate(createTimesheetSchema), auditLog('CREATE', 'timesheets'), attendanceController.createTimesheet);

/**
 * @swagger
 * /api/v1/attendance/timesheets/{id}/status:
 *   patch:
 *     summary: Update timesheet status
 *     tags: [Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [submitted, approved, rejected]
 *               rejection_reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Timesheet status updated successfully
 *       404:
 *         description: Timesheet not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.patch('/timesheets/:id/status', checkPermission('attendance.update'), validateParams(idSchema), validate(updateTimesheetStatusSchema), auditLog('UPDATE', 'timesheets'), attendanceController.updateTimesheetStatus);

module.exports = router;
