const express = require('express');
const router = express.Router();
const {
    PerformanceCycleController,
    PerformanceGoalController,
    PerformanceSelfRatingController,
    PerformanceManagerRatingController,
    PerformanceOverallRatingController,
    PerformanceAnnualSummaryController,
    PerformanceNotificationController
} = require('../controllers/performanceController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, checkPermission } = require('../middlewares/roleCheck');
const { validate, validateParams, validateQuery } = require('../validations/joiValidator');
const { 
    createCycleSchema, 
    updateCycleSchema,
    createGoalSchema,
    updateGoalSchema,
    selfRatingSchema,
    managerRatingSchema,
    overallRatingSchema,
    annualSummarySchema,
    cycleIdSchema,
    goalIdSchema,
    performanceQuerySchema
} = require('../validations/performanceValidation');
const { generalLimiter } = require('../middlewares/rateLimiter');

router.use(authMiddleware);

// ==================== PERFORMANCE CYCLES ====================

/**
 * @swagger
 * /api/v1/performance/cycles:
 *   get:
 *     summary: Get all performance cycles
 *     tags: [Performance Cycles]
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
 *       - in: query
 *         name: cycle_type
 *         schema:
 *           type: string
 *           enum: [quarterly, annual]
 *       - in: query
 *         name: fiscal_year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of performance cycles
 */
router.get('/cycles', generalLimiter, validateQuery(performanceQuerySchema), PerformanceCycleController.getAllCycles);

/**
 * @swagger
 * /api/v1/performance/cycles/{id}:
 *   get:
 *     summary: Get performance cycle by ID
 *     tags: [Performance Cycles]
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
 *         description: Performance cycle details
 */
router.get('/cycles/:id', validateParams(cycleIdSchema), PerformanceCycleController.getCycleById);

/**
 * @swagger
 * /api/v1/performance/cycles:
 *   post:
 *     summary: Create performance cycle (Admin only)
 *     tags: [Performance Cycles]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cycle_name
 *               - cycle_code
 *               - cycle_type
 *               - fiscal_year
 *               - start_date
 *               - end_date
 *               - self_rating_start
 *               - self_rating_end
 *               - manager_rating_start
 *               - manager_rating_end
 *             properties:
 *               cycle_name:
 *                 type: string
 *               cycle_code:
 *                 type: string
 *               cycle_type:
 *                 type: string
 *                 enum: [quarterly, annual]
 *               fiscal_year:
 *                 type: integer
 *               quarter:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 4
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *               self_rating_start:
 *                 type: string
 *                 format: date
 *               self_rating_end:
 *                 type: string
 *                 format: date
 *               manager_rating_start:
 *                 type: string
 *                 format: date
 *               manager_rating_end:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Cycle created successfully
 */
router.post('/cycles', checkPermission('performance.write'), validate(createCycleSchema), PerformanceCycleController.createCycle);

/**
 * @swagger
 * /api/v1/performance/cycles/{id}:
 *   put:
 *     summary: Update performance cycle (Admin only)
 *     tags: [Performance Cycles]
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
 *             properties:
 *               cycle_name:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, active, self_rating_open, self_rating_closed, manager_rating_open, manager_rating_closed, hr_review, completed]
 *     responses:
 *       200:
 *         description: Cycle updated successfully
 */
router.put('/cycles/:id', checkPermission('performance.update'), validateParams(cycleIdSchema), validate(updateCycleSchema), PerformanceCycleController.updateCycle);

/**
 * @swagger
 * /api/v1/performance/cycles/{id}/status:
 *   patch:
 *     summary: Update cycle status (Admin only)
 *     tags: [Performance Cycles]
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
 *     responses:
 *       200:
 *         description: Status updated successfully
 */
router.patch('/cycles/:id/status', checkPermission('performance.update'), validateParams(cycleIdSchema), PerformanceCycleController.updateCycleStatus);

// ==================== PERFORMANCE GOALS ====================

/**
 * @swagger
 * /api/v1/performance/goals:
 *   get:
 *     summary: Get all performance goals
 *     tags: [Performance Goals]
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
 *         name: cycle_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: employee_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: manager_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of performance goals
 */
router.get('/goals', generalLimiter, validateQuery(performanceQuerySchema), PerformanceGoalController.getAllGoals);

/**
 * @swagger
 * /api/v1/performance/goals/{id}:
 *   get:
 *     summary: Get performance goal by ID
 *     tags: [Performance Goals]
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
 *         description: Goal details
 */
router.get('/goals/:id', validateParams(goalIdSchema), PerformanceGoalController.getGoalById);

/**
 * @swagger
 * /api/v1/performance/goals:
 *   post:
 *     summary: Create performance goal (Manager only)
 *     tags: [Performance Goals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cycle_id
 *               - employee_id
 *               - goal_title
 *             properties:
 *               cycle_id:
 *                 type: integer
 *               employee_id:
 *                 type: integer
 *               goal_title:
 *                 type: string
 *               goal_description:
 *                 type: string
 *               kpi_description:
 *                 type: string
 *               target_value:
 *                 type: string
 *               weightage:
 *                 type: number
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, critical]
 *     responses:
 *       201:
 *         description: Goal created successfully
 */
router.post('/goals', checkPermission('performance.write'), validate(createGoalSchema), PerformanceGoalController.createGoal);

/**
 * @swagger
 * /api/v1/performance/goals/{id}:
 *   put:
 *     summary: Update performance goal (Manager only)
 *     tags: [Performance Goals]
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
 *             properties:
 *               goal_title:
 *                 type: string
 *               goal_description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, completed, cancelled]
 *     responses:
 *       200:
 *         description: Goal updated successfully
 */
router.put('/goals/:id', checkPermission('performance.update'), validateParams(goalIdSchema), validate(updateGoalSchema), PerformanceGoalController.updateGoal);

/**
 * @swagger
 * /api/v1/performance/goals/{id}:
 *   delete:
 *     summary: Delete performance goal (Manager only)
 *     tags: [Performance Goals]
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
 *         description: Goal deleted successfully
 */
router.delete('/goals/:id', checkPermission('performance.delete'), validateParams(goalIdSchema), PerformanceGoalController.deleteGoal);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/goals:
 *   get:
 *     summary: Get goals by cycle and employee
 *     tags: [Performance Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Goals retrieved successfully
 */
router.get('/cycles/:cycle_id/employees/:employee_id/goals', PerformanceGoalController.getGoalsByCycleAndEmployee);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/goals-with-ratings:
 *   get:
 *     summary: Get goals with ratings by cycle and employee
 *     tags: [Performance Goals]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Goals with ratings retrieved successfully
 */
router.get('/cycles/:cycle_id/employees/:employee_id/goals-with-ratings', PerformanceGoalController.getGoalsWithRatings);

// ==================== SELF RATINGS ====================

/**
 * @swagger
 * /api/v1/performance/goals/{goal_id}/self-rating:
 *   post:
 *     summary: Submit self-rating (Employee only)
 *     tags: [Self Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goal_id
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
 *               - self_rating
 *             properties:
 *               self_rating:
 *                 type: number
 *                 minimum: 1.00
 *                 maximum: 5.00
 *               achievement_summary:
 *                 type: string
 *               what_achieved:
 *                 type: string
 *               what_missed:
 *                 type: string
 *               challenges_faced:
 *                 type: string
 *     responses:
 *       200:
 *         description: Self-rating submitted successfully
 */
router.post('/goals/:goal_id/self-rating', checkPermission('performance.self_rating'), validate(selfRatingSchema), PerformanceSelfRatingController.submitSelfRating);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/submit-all-self-ratings:
 *   post:
 *     summary: Submit all self-ratings for a cycle (Employee only)
 *     tags: [Self Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All self-ratings submitted successfully
 */
router.post('/cycles/:cycle_id/submit-all-self-ratings', checkPermission('performance.self_rating'), PerformanceSelfRatingController.submitAllSelfRatings);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/self-ratings:
 *   get:
 *     summary: Get self-ratings by cycle and employee
 *     tags: [Self Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Self-ratings retrieved successfully
 */
router.get('/cycles/:cycle_id/employees/:employee_id/self-ratings', PerformanceSelfRatingController.getSelfRatingsByCycleAndEmployee);

// ==================== MANAGER RATINGS ====================

/**
 * @swagger
 * /api/v1/performance/goals/{goal_id}/manager-rating:
 *   post:
 *     summary: Submit manager rating (Manager only)
 *     tags: [Manager Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: goal_id
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
 *               - manager_rating
 *             properties:
 *               manager_rating:
 *                 type: number
 *                 minimum: 1.00
 *                 maximum: 5.00
 *               manager_comments:
 *                 type: string
 *               what_employee_did_well:
 *                 type: string
 *               areas_of_improvement:
 *                 type: string
 *               manager_feedback:
 *                 type: string
 *     responses:
 *       200:
 *         description: Manager rating submitted successfully
 */
router.post('/goals/:goal_id/manager-rating', checkPermission('performance.manager_rating'), validate(managerRatingSchema), PerformanceManagerRatingController.submitManagerRating);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/submit-all-manager-ratings:
 *   post:
 *     summary: Submit all manager ratings for a cycle (Manager only)
 *     tags: [Manager Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: All manager ratings submitted successfully
 */
router.post('/cycles/:cycle_id/submit-all-manager-ratings', checkPermission('performance.manager_rating'), PerformanceManagerRatingController.submitAllManagerRatings);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/manager-ratings:
 *   get:
 *     summary: Get manager ratings by cycle and employee
 *     tags: [Manager Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Manager ratings retrieved successfully
 */
router.get('/cycles/:cycle_id/employees/:employee_id/manager-ratings', PerformanceManagerRatingController.getManagerRatingsByCycleAndEmployee);

// ==================== OVERALL RATINGS ====================

/**
 * @swagger
 * /api/v1/performance/overall-ratings:
 *   get:
 *     summary: Get all overall ratings
 *     tags: [Overall Ratings]
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
 *         name: cycle_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of overall ratings
 */
router.get('/overall-ratings', checkPermission('performance.hr_review'), validateQuery(performanceQuerySchema), PerformanceOverallRatingController.getAllOverallRatings);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/overall-rating:
 *   get:
 *     summary: Get overall rating by cycle and employee
 *     tags: [Overall Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overall rating details
 */
router.get('/cycles/:cycle_id/employees/:employee_id/overall-rating', PerformanceOverallRatingController.getOverallRatingByCycleAndEmployee);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/overall-rating:
 *   put:
 *     summary: Update overall rating (HR only)
 *     tags: [Overall Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               manager_summary:
 *                 type: string
 *               employee_comments:
 *                 type: string
 *               hr_comments:
 *                 type: string
 *               rating_category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Overall rating updated successfully
 */
router.put('/cycles/:cycle_id/employees/:employee_id/overall-rating', checkPermission('performance.hr_review'), PerformanceOverallRatingController.updateOverallRating);

/**
 * @swagger
 * /api/v1/performance/cycles/{cycle_id}/employees/{employee_id}/overall-rating/approve:
 *   patch:
 *     summary: HR approve overall rating (HR only)
 *     tags: [Overall Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cycle_id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Overall rating approved by HR
 */
router.patch('/cycles/:cycle_id/employees/:employee_id/overall-rating/approve', checkPermission('performance.hr_review'), PerformanceOverallRatingController.hrApprove);

// ==================== ANNUAL SUMMARIES ====================

/**
 * @swagger
 * /api/v1/performance/annual-summaries:
 *   get:
 *     summary: Get all annual summaries
 *     tags: [Annual Summaries]
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
 *         name: fiscal_year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of annual summaries
 */
router.get('/annual-summaries', checkPermission('performance.hr_review'), validateQuery(performanceQuerySchema), PerformanceAnnualSummaryController.getAllAnnualSummaries);

/**
 * @swagger
 * /api/v1/performance/fiscal-years/{fiscal_year}/employees/{employee_id}/annual-summary:
 *   post:
 *     summary: Generate annual summary (Manager only)
 *     tags: [Annual Summaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscal_year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual summary generated successfully
 */
router.post('/fiscal-years/:fiscal_year/employees/:employee_id/annual-summary', checkPermission('performance.write'), PerformanceAnnualSummaryController.generateAnnualSummary);

/**
 * @swagger
 * /api/v1/performance/fiscal-years/{fiscal_year}/employees/{employee_id}/annual-summary:
 *   get:
 *     summary: Get annual summary by year and employee
 *     tags: [Annual Summaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscal_year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual summary details
 */
router.get('/fiscal-years/:fiscal_year/employees/:employee_id/annual-summary', PerformanceAnnualSummaryController.getAnnualSummaryByYearAndEmployee);

/**
 * @swagger
 * /api/v1/performance/fiscal-years/{fiscal_year}/employees/{employee_id}/annual-summary/approve:
 *   patch:
 *     summary: HR approve annual summary (HR only)
 *     tags: [Annual Summaries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fiscal_year
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: employee_id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Annual summary approved by HR
 */
router.patch('/fiscal-years/:fiscal_year/employees/:employee_id/annual-summary/approve', checkPermission('performance.hr_review'), PerformanceAnnualSummaryController.hrApprove);

// ==================== NOTIFICATIONS ====================

/**
 * @swagger
 * /api/v1/performance/process-notifications:
 *   post:
 *     summary: Process pending notifications (Admin only)
 *     tags: [Performance Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notifications processed successfully
 */
router.post('/process-notifications', checkPermission('performance.update'), PerformanceNotificationController.processPendingNotifications);

/**
 * @swagger
 * /api/v1/performance/check-cycle-statuses:
 *   post:
 *     summary: Check and update cycle statuses (Admin only)
 *     tags: [Performance Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cycle statuses updated successfully
 */
router.post('/check-cycle-statuses', checkPermission('performance.update'), PerformanceNotificationController.checkAndUpdateCycleStatuses);

module.exports = router;
