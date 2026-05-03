const {
    PerformanceCycleModel,
    PerformanceGoalModel,
    PerformanceSelfRatingModel,
    PerformanceManagerRatingModel,
    PerformanceOverallRatingModel,
    PerformanceAnnualSummaryModel,
    PerformanceNotificationModel
} = require('../models');

class PerformanceCycleRepository {
    async findAll(params) {
        return await PerformanceCycleModel.findAll(params);
    }

    async findById(id) {
        return await PerformanceCycleModel.findById(id);
    }

    async findByFiscalYearAndQuarter(fiscal_year, quarter) {
        return await PerformanceCycleModel.findByFiscalYearAndQuarter(fiscal_year, quarter);
    }

    async create(cycleData) {
        return await PerformanceCycleModel.create(cycleData);
    }

    async update(id, cycleData) {
        return await PerformanceCycleModel.update(id, cycleData);
    }

    async updateStatus(id, status) {
        return await PerformanceCycleModel.updateStatus(id, status);
    }

    async findActiveCycles() {
        return await PerformanceCycleModel.findActiveCycles();
    }

    async findCyclesForNotification(type) {
        return await PerformanceCycleModel.findCyclesForNotification(type);
    }
}

class PerformanceGoalRepository {
    async findAll(params) {
        return await PerformanceGoalModel.findAll(params);
    }

    async findById(id) {
        return await PerformanceGoalModel.findById(id);
    }

    async findByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceGoalModel.findByCycleAndEmployee(cycle_id, employee_id);
    }

    async create(goalData) {
        return await PerformanceGoalModel.create(goalData);
    }

    async update(id, goalData) {
        return await PerformanceGoalModel.update(id, goalData);
    }

    async delete(id) {
        return await PerformanceGoalModel.delete(id);
    }

    async getGoalsWithRatings(cycle_id, employee_id) {
        return await PerformanceGoalModel.getGoalsWithRatings(cycle_id, employee_id);
    }
}

class PerformanceSelfRatingRepository {
    async findByGoalId(goal_id) {
        return await PerformanceSelfRatingModel.findByGoalId(goal_id);
    }

    async findByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceSelfRatingModel.findByCycleAndEmployee(cycle_id, employee_id);
    }

    async create(ratingData) {
        return await PerformanceSelfRatingModel.create(ratingData);
    }

    async update(goal_id, ratingData) {
        return await PerformanceSelfRatingModel.update(goal_id, ratingData);
    }

    async submitAll(cycle_id, employee_id) {
        return await PerformanceSelfRatingModel.submitAll(cycle_id, employee_id);
    }
}

class PerformanceManagerRatingRepository {
    async findByGoalId(goal_id) {
        return await PerformanceManagerRatingModel.findByGoalId(goal_id);
    }

    async findByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceManagerRatingModel.findByCycleAndEmployee(cycle_id, employee_id);
    }

    async create(ratingData) {
        return await PerformanceManagerRatingModel.create(ratingData);
    }

    async update(goal_id, ratingData) {
        return await PerformanceManagerRatingModel.update(goal_id, ratingData);
    }

    async submitAll(cycle_id, manager_id) {
        return await PerformanceManagerRatingModel.submitAll(cycle_id, manager_id);
    }
}

class PerformanceOverallRatingRepository {
    async findByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceOverallRatingModel.findByCycleAndEmployee(cycle_id, employee_id);
    }

    async create(ratingData) {
        return await PerformanceOverallRatingModel.create(ratingData);
    }

    async update(cycle_id, employee_id, ratingData) {
        return await PerformanceOverallRatingModel.update(cycle_id, employee_id, ratingData);
    }

    async hrApprove(cycle_id, employee_id, hr_approved_by) {
        return await PerformanceOverallRatingModel.hrApprove(cycle_id, employee_id, hr_approved_by);
    }

    async findAll(params) {
        return await PerformanceOverallRatingModel.findAll(params);
    }
}

class PerformanceAnnualSummaryRepository {
    async findByYearAndEmployee(fiscal_year, employee_id) {
        return await PerformanceAnnualSummaryModel.findByYearAndEmployee(fiscal_year, employee_id);
    }

    async create(summaryData) {
        return await PerformanceAnnualSummaryModel.create(summaryData);
    }

    async update(fiscal_year, employee_id, summaryData) {
        return await PerformanceAnnualSummaryModel.update(fiscal_year, employee_id, summaryData);
    }

    async hrApprove(fiscal_year, employee_id, hr_approved_by) {
        return await PerformanceAnnualSummaryModel.hrApprove(fiscal_year, employee_id, hr_approved_by);
    }

    async findAll(params) {
        return await PerformanceAnnualSummaryModel.findAll(params);
    }
}

class PerformanceNotificationRepository {
    async create(notificationData) {
        return await PerformanceNotificationModel.create(notificationData);
    }

    async updateStatus(id, status, sent_at = null) {
        return await PerformanceNotificationModel.updateStatus(id, status, sent_at);
    }

    async findPendingNotifications() {
        return await PerformanceNotificationModel.findPendingNotifications();
    }

    async findByCycleAndRecipient(cycle_id, recipient_id, notification_type) {
        return await PerformanceNotificationModel.findByCycleAndRecipient(cycle_id, recipient_id, notification_type);
    }
}

module.exports = {
    PerformanceCycleRepository: new PerformanceCycleRepository(),
    PerformanceGoalRepository: new PerformanceGoalRepository(),
    PerformanceSelfRatingRepository: new PerformanceSelfRatingRepository(),
    PerformanceManagerRatingRepository: new PerformanceManagerRatingRepository(),
    PerformanceOverallRatingRepository: new PerformanceOverallRatingRepository(),
    PerformanceAnnualSummaryRepository: new PerformanceAnnualSummaryRepository(),
    PerformanceNotificationRepository: new PerformanceNotificationRepository()
};
