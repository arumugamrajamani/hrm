const { AuditService } = require('../services/auditService');
const ApiResponse = require('../utils/apiResponse');

class AuditController {
    async getAuditLogs(req, res, next) {
        try {
            const { page = 1, limit = 50, userId, action, entityType, startDate, endDate } = req.query;

            const filters = {
                page: parseInt(page) || 1,
                limit: Math.min(parseInt(limit) || 50, 100),
                userId: userId ? parseInt(userId) : null,
                action,
                entityType,
                startDate,
                endDate
            };

            const result = await AuditService.getAuditLogs(filters);

            const pagination = {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            };

            return ApiResponse.paginated(res, result.logs, pagination, 'Audit logs retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuditController();
