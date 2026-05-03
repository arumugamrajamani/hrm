const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { authMiddleware } = require('../middlewares/auth');
const { isAdmin, isSuperAdmin, checkPermission } = require('../middlewares/roleCheck');

router.use(authMiddleware);
router.use(checkPermission('audit.read'));

/**
 * @swagger
 * /api/v1/audit-logs:
 *   get:
 *     summary: Get audit logs
 *     description: Retrieve audit logs with optional filtering. Requires admin privileges.
 *     tags: [Audit]
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
 *           default: 50
 *           maximum: 100
 *         description: Items per page
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action (e.g., user.created, auth.login)
 *       - in: query
 *         name: entityType
 *         schema:
 *           type: string
 *         description: Filter by entity type (e.g., user, department)
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/', auditController.getAuditLogs);

module.exports = router;
