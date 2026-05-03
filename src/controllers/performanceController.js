const {
    PerformanceCycleService,
    PerformanceGoalService,
    PerformanceSelfRatingService,
    PerformanceManagerRatingService,
    PerformanceOverallRatingService,
    PerformanceAnnualSummaryService,
    PerformanceNotificationService
} = require('../services/performanceService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class PerformanceCycleController {
    async createCycle(req, res, next) {
        try {
            const cycleData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const cycle = await PerformanceCycleService.createCycle(cycleData);
            return successResponse(res, cycle, 'Performance cycle created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllCycles(req, res, next) {
        try {
            const { page = 1, limit = 10, status = '', cycle_type = '', fiscal_year = null } = req.query;
            
            const result = await PerformanceCycleService.getAllCycles({
                page: parseInt(page),
                limit: parseInt(limit),
                status,
                cycle_type,
                fiscal_year: fiscal_year ? parseInt(fiscal_year) : null
            });

            if (!result.cycles || result.cycles.length === 0) {
                return noDataResponse(res, 'No performance cycles found');
            }

            return paginatedResponse(
                res,
                result.cycles,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Performance cycles retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getCycleById(req, res, next) {
        try {
            const { id } = req.params;
            const cycle = await PerformanceCycleService.getCycleById(parseInt(id));
            
            if (!cycle) {
                return noDataResponse(res, 'Performance cycle not found');
            }
            return successResponse(res, cycle, 'Performance cycle retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateCycle(req, res, next) {
        try {
            const { id } = req.params;
            const cycleData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const cycle = await PerformanceCycleService.updateCycle(parseInt(id), cycleData);
            return successResponse(res, cycle, 'Performance cycle updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateCycleStatus(req, res, next) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            
            const result = await PerformanceCycleService.updateCycleStatus(parseInt(id), status);
            return successResponse(res, result, 'Cycle status updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceGoalController {
    async createGoal(req, res, next) {
        try {
            const goalData = {
                ...req.body,
                created_by: req.user.id
            };
            
            const goal = await PerformanceGoalService.createGoal(goalData);
            return successResponse(res, goal, 'Goal created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getAllGoals(req, res, next) {
        try {
            const { page = 1, limit = 10, cycle_id = null, employee_id = null, manager_id = null, status = '' } = req.query;
            
            const result = await PerformanceGoalService.getAllGoals({
                page: parseInt(page),
                limit: parseInt(limit),
                cycle_id: cycle_id ? parseInt(cycle_id) : null,
                employee_id: employee_id ? parseInt(employee_id) : null,
                manager_id: manager_id ? parseInt(manager_id) : null,
                status
            });

            if (!result.goals || result.goals.length === 0) {
                return noDataResponse(res, 'No goals found');
            }

            return paginatedResponse(
                res,
                result.goals,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Goals retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getGoalById(req, res, next) {
        try {
            const { id } = req.params;
            const goal = await PerformanceGoalService.getGoalById(parseInt(id));
            
            if (!goal) {
                return noDataResponse(res, 'Goal not found');
            }
            return successResponse(res, goal, 'Goal retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateGoal(req, res, next) {
        try {
            const { id } = req.params;
            const goalData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const goal = await PerformanceGoalService.updateGoal(parseInt(id), goalData);
            return successResponse(res, goal, 'Goal updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteGoal(req, res, next) {
        try {
            const { id } = req.params;
            await PerformanceGoalService.deleteGoal(parseInt(id));
            return successResponse(res, null, 'Goal deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getGoalsByCycleAndEmployee(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const goals = await PerformanceGoalService.getGoalsByCycleAndEmployee(parseInt(cycle_id), parseInt(employee_id));
            
            if (!goals || goals.length === 0) {
                return noDataResponse(res, 'No goals found for this cycle and employee');
            }
            return successResponse(res, goals, 'Goals retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getGoalsWithRatings(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const goals = await PerformanceGoalService.getGoalsWithRatings(parseInt(cycle_id), parseInt(employee_id));
            
            if (!goals || goals.length === 0) {
                return noDataResponse(res, 'No goals with ratings found');
            }
            return successResponse(res, goals, 'Goals with ratings retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceSelfRatingController {
    async submitSelfRating(req, res, next) {
        try {
            const { goal_id } = req.params;
            const employee_id = req.user.employee_id || req.body.employee_id;
            
            const rating = await PerformanceSelfRatingService.submitSelfRating(
                parseInt(goal_id),
                parseInt(employee_id),
                req.body
            );
            return successResponse(res, rating, 'Self-rating submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    async submitAllSelfRatings(req, res, next) {
        try {
            const { cycle_id } = req.params;
            const employee_id = req.user.employee_id || req.body.employee_id;
            
            const result = await PerformanceSelfRatingService.submitAllSelfRatings(
                parseInt(cycle_id),
                parseInt(employee_id)
            );
            return successResponse(res, result, 'All self-ratings submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getSelfRatingsByCycleAndEmployee(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const ratings = await PerformanceSelfRatingService.getSelfRatingsByCycleAndEmployee(
                parseInt(cycle_id),
                parseInt(employee_id)
            );
            
            if (!ratings || ratings.length === 0) {
                return noDataResponse(res, 'No self-ratings found');
            }
            return successResponse(res, ratings, 'Self-ratings retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceManagerRatingController {
    async submitManagerRating(req, res, next) {
        try {
            const { goal_id } = req.params;
            const manager_id = req.user.employee_id || req.body.manager_id;
            
            const rating = await PerformanceManagerRatingService.submitManagerRating(
                parseInt(goal_id),
                parseInt(manager_id),
                req.body
            );
            return successResponse(res, rating, 'Manager rating submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    async submitAllManagerRatings(req, res, next) {
        try {
            const { cycle_id } = req.params;
            const manager_id = req.user.employee_id || req.body.manager_id;
            
            const result = await PerformanceManagerRatingService.submitAllManagerRatings(
                parseInt(cycle_id),
                parseInt(manager_id)
            );
            return successResponse(res, result, 'All manager ratings submitted successfully');
        } catch (error) {
            next(error);
        }
    }

    async getManagerRatingsByCycleAndEmployee(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const ratings = await PerformanceManagerRatingService.getManagerRatingsByCycleAndEmployee(
                parseInt(cycle_id),
                parseInt(employee_id)
            );
            
            if (!ratings || ratings.length === 0) {
                return noDataResponse(res, 'No manager ratings found');
            }
            return successResponse(res, ratings, 'Manager ratings retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceOverallRatingController {
    async getAllOverallRatings(req, res, next) {
        try {
            const { page = 1, limit = 10, cycle_id = null, status = '' } = req.query;
            
            const result = await PerformanceOverallRatingService.getAllOverallRatings({
                page: parseInt(page),
                limit: parseInt(limit),
                cycle_id: cycle_id ? parseInt(cycle_id) : null,
                status
            });

            if (!result.ratings || result.ratings.length === 0) {
                return noDataResponse(res, 'No overall ratings found');
            }

            return paginatedResponse(
                res,
                result.ratings,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Overall ratings retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getOverallRatingByCycleAndEmployee(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const rating = await PerformanceOverallRatingService.getOverallRatingByCycleAndEmployee(
                parseInt(cycle_id),
                parseInt(employee_id)
            );
            
            if (!rating) {
                return noDataResponse(res, 'Overall rating not found');
            }
            return successResponse(res, rating, 'Overall rating retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateOverallRating(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            const ratingData = {
                ...req.body,
                updated_by: req.user.id
            };
            
            const rating = await PerformanceOverallRatingService.updateOverallRating(
                parseInt(cycle_id),
                parseInt(employee_id),
                ratingData
            );
            return successResponse(res, rating, 'Overall rating updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async hrApprove(req, res, next) {
        try {
            const { cycle_id, employee_id } = req.params;
            
            const result = await PerformanceOverallRatingService.hrApprove(
                parseInt(cycle_id),
                parseInt(employee_id),
                req.user.id
            );
            return successResponse(res, result, 'Overall rating approved by HR');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceAnnualSummaryController {
    async generateAnnualSummary(req, res, next) {
        try {
            const { fiscal_year, employee_id } = req.params;
            
            const summary = await PerformanceAnnualSummaryService.generateAnnualSummary(
                parseInt(fiscal_year),
                parseInt(employee_id)
            );
            return successResponse(res, summary, 'Annual summary generated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAllAnnualSummaries(req, res, next) {
        try {
            const { page = 1, limit = 10, fiscal_year = null, status = '' } = req.query;
            
            const result = await PerformanceAnnualSummaryService.getAllAnnualSummaries({
                page: parseInt(page),
                limit: parseInt(limit),
                fiscal_year: fiscal_year ? parseInt(fiscal_year) : null,
                status
            });

            if (!result.summaries || result.summaries.length === 0) {
                return noDataResponse(res, 'No annual summaries found');
            }

            return paginatedResponse(
                res,
                result.summaries,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Annual summaries retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getAnnualSummaryByYearAndEmployee(req, res, next) {
        try {
            const { fiscal_year, employee_id } = req.params;
            const summary = await PerformanceAnnualSummaryService.getAnnualSummaryByYearAndEmployee(
                parseInt(fiscal_year),
                parseInt(employee_id)
            );
            
            if (!summary) {
                return noDataResponse(res, 'Annual summary not found');
            }
            return successResponse(res, summary, 'Annual summary retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async hrApprove(req, res, next) {
        try {
            const { fiscal_year, employee_id } = req.params;
            
            const result = await PerformanceAnnualSummaryService.hrApprove(
                parseInt(fiscal_year),
                parseInt(employee_id),
                req.user.id
            );
            return successResponse(res, result, 'Annual summary approved by HR');
        } catch (error) {
            next(error);
        }
    }
}

class PerformanceNotificationController {
    async processPendingNotifications(req, res, next) {
        try {
            const result = await PerformanceNotificationService.processPendingNotifications();
            return successResponse(res, result, 'Notifications processed successfully');
        } catch (error) {
            next(error);
        }
    }

    async checkAndUpdateCycleStatuses(req, res, next) {
        try {
            const result = await PerformanceNotificationService.checkAndUpdateCycleStatuses();
            return successResponse(res, result, 'Cycle statuses updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = {
    PerformanceCycleController: new PerformanceCycleController(),
    PerformanceGoalController: new PerformanceGoalController(),
    PerformanceSelfRatingController: new PerformanceSelfRatingController(),
    PerformanceManagerRatingController: new PerformanceManagerRatingController(),
    PerformanceOverallRatingController: new PerformanceOverallRatingController(),
    PerformanceAnnualSummaryController: new PerformanceAnnualSummaryController(),
    PerformanceNotificationController: new PerformanceNotificationController()
};
