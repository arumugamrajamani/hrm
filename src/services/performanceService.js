const {
    PerformanceCycleRepository,
    PerformanceGoalRepository,
    PerformanceSelfRatingRepository,
    PerformanceManagerRatingRepository,
    PerformanceOverallRatingRepository,
    PerformanceAnnualSummaryRepository,
    PerformanceNotificationRepository
} = require('../repositories/performanceRepository');
const { EmployeeJobModel } = require('../models');

class PerformanceCycleService {
    async createCycle(cycleData) {
        const { cycle_name, cycle_code, cycle_type, fiscal_year, quarter } = cycleData;

        const existingCycle = await PerformanceCycleRepository.findByFiscalYearAndQuarter(fiscal_year, quarter);
        if (existingCycle && cycle_type === 'quarterly') {
            const error = new Error('Cycle already exists for this quarter and fiscal year');
            error.statusCode = 409;
            throw error;
        }

        const cycleId = await PerformanceCycleRepository.create(cycleData);
        const cycle = await PerformanceCycleRepository.findById(cycleId);

        await this.scheduleNotifications(cycleId);

        return cycle;
    }

    async getAllCycles(params) {
        return await PerformanceCycleRepository.findAll(params);
    }

    async getCycleById(id) {
        const cycle = await PerformanceCycleRepository.findById(id);
        
        if (!cycle) {
            const error = new Error('Performance cycle not found');
            error.statusCode = 404;
            throw error;
        }

        return cycle;
    }

    async updateCycle(id, cycleData) {
        const existingCycle = await PerformanceCycleRepository.findById(id);
        
        if (!existingCycle) {
            const error = new Error('Performance cycle not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await PerformanceCycleRepository.update(id, cycleData);
        
        if (!updated) {
            const error = new Error('Failed to update cycle');
            error.statusCode = 500;
            throw error;
        }

        return await PerformanceCycleRepository.findById(id);
    }

    async updateCycleStatus(id, status) {
        const cycle = await PerformanceCycleRepository.findById(id);
        
        if (!cycle) {
            const error = new Error('Performance cycle not found');
            error.statusCode = 404;
            throw error;
        }

        return await PerformanceCycleRepository.updateStatus(id, status);
    }

    async scheduleNotifications(cycleId) {
        const cycle = await PerformanceCycleRepository.findById(cycleId);
        
        const notifications = [
            {
                cycle_id: cycleId,
                notification_type: 'self_rating_reminder',
                subject: `Self-Rating Reminder: ${cycle.cycle_name}`,
                message: `Please complete your self-rating for ${cycle.cycle_name}. Deadline: ${cycle.self_rating_end}`,
                scheduled_for: new Date(new Date(cycle.self_rating_end).getTime() - 15 * 24 * 60 * 60 * 1000)
            },
            {
                cycle_id: cycleId,
                notification_type: 'self_rating_deadline',
                subject: `Self-Rating Deadline: ${cycle.cycle_name}`,
                message: `Last date for self-rating submission is today for ${cycle.cycle_name}.`,
                scheduled_for: cycle.self_rating_end
            },
            {
                cycle_id: cycleId,
                notification_type: 'manager_rating_reminder',
                subject: `Manager Rating Reminder: ${cycle.cycle_name}`,
                message: `Please complete manager ratings for ${cycle.cycle_name}. Deadline: ${cycle.manager_rating_end}`,
                scheduled_for: new Date(new Date(cycle.manager_rating_end).getTime() - 15 * 24 * 60 * 60 * 1000)
            }
        ];

        for (const notif of notifications) {
            await PerformanceNotificationRepository.create({
                ...notif,
                sender_id: null,
                recipient_id: null,
                created_by: cycle.created_by
            });
        }
    }

    async getCyclesForNotification(type) {
        return await PerformanceCycleRepository.findCyclesForNotification(type);
    }
}

class PerformanceGoalService {
    async createGoal(goalData) {
        const { cycle_id, employee_id, manager_id } = goalData;

        const cycle = await PerformanceCycleRepository.findById(cycle_id);
        if (!cycle) {
            const error = new Error('Performance cycle not found');
            error.statusCode = 404;
            throw error;
        }

        if (cycle.status === 'completed') {
            const error = new Error('Cannot add goals to a completed cycle');
            error.statusCode = 400;
            throw error;
        }

        const goalId = await PerformanceGoalRepository.create(goalData);
        return await PerformanceGoalRepository.findById(goalId);
    }

    async getAllGoals(params) {
        return await PerformanceGoalRepository.findAll(params);
    }

    async getGoalById(id) {
        const goal = await PerformanceGoalRepository.findById(id);
        
        if (!goal) {
            const error = new Error('Goal not found');
            error.statusCode = 404;
            throw error;
        }

        return goal;
    }

    async updateGoal(id, goalData) {
        const existingGoal = await PerformanceGoalRepository.findById(id);
        
        if (!existingGoal) {
            const error = new Error('Goal not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await PerformanceGoalRepository.update(id, goalData);
        
        if (!updated) {
            const error = new Error('Failed to update goal');
            error.statusCode = 500;
            throw error;
        }

        return await PerformanceGoalRepository.findById(id);
    }

    async deleteGoal(id) {
        const goal = await PerformanceGoalRepository.findById(id);
        
        if (!goal) {
            const error = new Error('Goal not found');
            error.statusCode = 404;
            throw error;
        }

        return await PerformanceGoalRepository.delete(id);
    }

    async getGoalsByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceGoalRepository.findByCycleAndEmployee(cycle_id, employee_id);
    }

    async getGoalsWithRatings(cycle_id, employee_id) {
        return await PerformanceGoalRepository.getGoalsWithRatings(cycle_id, employee_id);
    }
}

class PerformanceSelfRatingService {
    async submitSelfRating(goal_id, employee_id, ratingData) {
        const goal = await PerformanceGoalRepository.findById(goal_id);
        
        if (!goal) {
            const error = new Error('Goal not found');
            error.statusCode = 404;
            throw error;
        }

        if (goal.employee_id !== employee_id) {
            const error = new Error('You can only rate your own goals');
            error.statusCode = 403;
            throw error;
        }

        const cycle = await PerformanceCycleRepository.findById(goal.cycle_id);
        if (!cycle || cycle.status !== 'self_rating_open') {
            const error = new Error('Self-rating is not open for this cycle');
            error.statusCode = 400;
            throw error;
        }

        const now = new Date();
        if (now > new Date(cycle.self_rating_end)) {
            const error = new Error('Self-rating deadline has passed');
            error.statusCode = 400;
            throw error;
        }

        const existingRating = await PerformanceSelfRatingRepository.findByGoalId(goal_id);
        
        if (existingRating) {
            if (existingRating.status === 'submitted') {
                const error = new Error('Self-rating already submitted');
                error.statusCode = 400;
                throw error;
            }
            
            const updated = await PerformanceSelfRatingRepository.update(goal_id, {
                ...ratingData,
                employee_id,
                cycle_id: goal.cycle_id
            });
            
            return await PerformanceSelfRatingRepository.findByGoalId(goal_id);
        }

        const ratingId = await PerformanceSelfRatingRepository.create({
            goal_id,
            employee_id,
            cycle_id: goal.cycle_id,
            ...ratingData
        });

        return await PerformanceSelfRatingRepository.findByGoalId(goal_id);
    }

    async submitAllSelfRatings(cycle_id, employee_id) {
        const cycle = await PerformanceCycleRepository.findById(cycle_id);
        
        if (!cycle || cycle.status !== 'self_rating_open') {
            const error = new Error('Self-rating is not open for this cycle');
            error.statusCode = 400;
            throw error;
        }

        const now = new Date();
        if (now > new Date(cycle.self_rating_end)) {
            const error = new Error('Self-rating deadline has passed');
            error.statusCode = 400;
            throw error;
        }

        const result = await PerformanceSelfRatingRepository.submitAll(cycle_id, employee_id);

        return { message: 'All self-ratings submitted successfully' };
    }

    async getSelfRatingsByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceSelfRatingRepository.findByCycleAndEmployee(cycle_id, employee_id);
    }
}

class PerformanceManagerRatingService {
    async submitManagerRating(goal_id, manager_id, ratingData) {
        const goal = await PerformanceGoalRepository.findById(goal_id);
        
        if (!goal) {
            const error = new Error('Goal not found');
            error.statusCode = 404;
            throw error;
        }

        if (goal.manager_id !== manager_id) {
            const error = new Error('You can only rate goals of your reportees');
            error.statusCode = 403;
            throw error;
        }

        const cycle = await PerformanceCycleRepository.findById(goal.cycle_id);
        if (!cycle || cycle.status !== 'manager_rating_open') {
            const error = new Error('Manager rating is not open for this cycle');
            error.statusCode = 400;
            throw error;
        }

        const existingRating = await PerformanceManagerRatingRepository.findByGoalId(goal_id);
        
        if (existingRating) {
            if (existingRating.status === 'submitted') {
                const error = new Error('Manager rating already submitted');
                error.statusCode = 400;
                throw error;
            }
            
            const updated = await PerformanceManagerRatingRepository.update(goal_id, {
                ...ratingData,
                employee_id: goal.employee_id,
                cycle_id: goal.cycle_id
            });
            
            return await PerformanceManagerRatingRepository.findByGoalId(goal_id);
        }

        const ratingId = await PerformanceManagerRatingRepository.create({
            goal_id,
            employee_id: goal.employee_id,
            manager_id,
            cycle_id: goal.cycle_id,
            ...ratingData
        });

        return await PerformanceManagerRatingRepository.findByGoalId(goal_id);
    }

    async submitAllManagerRatings(cycle_id, manager_id) {
        const cycle = await PerformanceCycleRepository.findById(cycle_id);
        
        if (!cycle || cycle.status !== 'manager_rating_open') {
            const error = new Error('Manager rating is not open for this cycle');
            error.statusCode = 400;
            throw error;
        }

        const result = await PerformanceManagerRatingRepository.submitAll(cycle_id, manager_id);

        await this.calculateOverallRating(cycle_id, manager_id);

        return { message: 'All manager ratings submitted successfully' };
    }

    async calculateOverallRating(cycle_id, manager_id) {
        const goals = await PerformanceGoalRepository.findAll({ cycle_id, manager_id, paginate: false });
        const employeeRatings = {};

        for (const goal of goals.goals) {
            const selfRating = await PerformanceSelfRatingRepository.findByGoalId(goal.id);
            const managerRating = await PerformanceManagerRatingRepository.findByGoalId(goal.id);

            if (!employeeRatings[goal.employee_id]) {
                employeeRatings[goal.employee_id] = {
                    self_ratings: [],
                    manager_ratings: [],
                    total_weightage: 0
                };
            }

            if (selfRating) {
                employeeRatings[goal.employee_id].self_ratings.push({
                    rating: selfRating.self_rating,
                    weightage: goal.weightage
                });
            }

            if (managerRating) {
                employeeRatings[goal.employee_id].manager_ratings.push({
                    rating: managerRating.manager_rating,
                    weightage: goal.weightage
                });
                employeeRatings[goal.employee_id].total_weightage += parseFloat(goal.weightage) || 0;
            }
        }

        for (const [employee_id, data] of Object.entries(employeeRatings)) {
            let avgSelfRating = null;
            let avgManagerRating = null;

            if (data.self_ratings.length > 0) {
                const totalSelf = data.self_ratings.reduce((sum, r) => sum + (parseFloat(r.rating) * (parseFloat(r.weightage) || 1)), 0);
                const totalWeightage = data.self_ratings.reduce((sum, r) => sum + (parseFloat(r.weightage) || 1), 0);
                avgSelfRating = totalWeightage > 0 ? (totalSelf / totalWeightage).toFixed(2) : null;
            }

            if (data.manager_ratings.length > 0) {
                const totalManager = data.manager_ratings.reduce((sum, r) => sum + (parseFloat(r.rating) * (parseFloat(r.weightage) || 1)), 0);
                const totalWeightage = data.manager_ratings.reduce((sum, r) => sum + (parseFloat(r.weightage) || 1), 0);
                avgManagerRating = totalWeightage > 0 ? (totalManager / totalWeightage).toFixed(2) : null;
            }

            const overallRating = avgManagerRating || avgSelfRating;
            let ratingCategory = null;

            if (overallRating) {
                if (overallRating >= 4.5) ratingCategory = 'exceptional';
                else if (overallRating >= 3.5) ratingCategory = 'exceeds_expectations';
                else if (overallRating >= 2.5) ratingCategory = 'meets_expectations';
                else if (overallRating >= 1.5) ratingCategory = 'needs_improvement';
                else ratingCategory = 'unsatisfactory';
            }

            const existingOverall = await PerformanceOverallRatingRepository.findByCycleAndEmployee(cycle_id, parseInt(employee_id));

            if (existingOverall) {
                await PerformanceOverallRatingRepository.update(cycle_id, parseInt(employee_id), {
                    average_self_rating: avgSelfRating,
                    average_manager_rating: avgManagerRating,
                    overall_rating: overallRating,
                    rating_category: ratingCategory,
                    status: 'manager_submitted'
                });
            } else {
                await PerformanceOverallRatingRepository.create({
                    cycle_id,
                    employee_id: parseInt(employee_id),
                    manager_id,
                    average_self_rating: avgSelfRating,
                    average_manager_rating: avgManagerRating,
                    overall_rating: overallRating,
                    rating_category: ratingCategory,
                    status: 'manager_submitted'
                });
            }
        }
    }

    async getManagerRatingsByCycleAndEmployee(cycle_id, employee_id) {
        return await PerformanceManagerRatingRepository.findByCycleAndEmployee(cycle_id, employee_id);
    }
}

class PerformanceOverallRatingService {
    async getAllOverallRatings(params) {
        return await PerformanceOverallRatingRepository.findAll(params);
    }

    async getOverallRatingByCycleAndEmployee(cycle_id, employee_id) {
        const rating = await PerformanceOverallRatingRepository.findByCycleAndEmployee(cycle_id, employee_id);
        
        if (!rating) {
            const error = new Error('Overall rating not found');
            error.statusCode = 404;
            throw error;
        }

        return rating;
    }

    async hrApprove(cycle_id, employee_id, hr_approved_by) {
        const rating = await PerformanceOverallRatingRepository.findByCycleAndEmployee(cycle_id, employee_id);
        
        if (!rating) {
            const error = new Error('Overall rating not found');
            error.statusCode = 404;
            throw error;
        }

        if (rating.status !== 'manager_submitted') {
            const error = new Error('Rating has not been submitted by manager yet');
            error.statusCode = 400;
            throw error;
        }

        return await PerformanceOverallRatingRepository.hrApprove(cycle_id, employee_id, hr_approved_by);
    }

    async updateOverallRating(cycle_id, employee_id, ratingData) {
        const rating = await PerformanceOverallRatingRepository.findByCycleAndEmployee(cycle_id, employee_id);
        
        if (!rating) {
            const error = new Error('Overall rating not found');
            error.statusCode = 404;
            throw error;
        }

        return await PerformanceOverallRatingRepository.update(cycle_id, employee_id, ratingData);
    }
}

class PerformanceAnnualSummaryService {
    async generateAnnualSummary(fiscal_year, employee_id) {
        const quarters = [1, 2, 3, 4];
        const ratings = {};

        for (const q of quarters) {
            const cycle = await PerformanceCycleRepository.findByFiscalYearAndQuarter(fiscal_year, q);
            if (cycle) {
                const overallRating = await PerformanceOverallRatingRepository.findByCycleAndEmployee(cycle.id, employee_id);
                ratings[`q${q}_rating`] = overallRating ? overallRating.overall_rating : null;
            }
        }

        const validRatings = Object.values(ratings).filter(r => r !== null);
        const annualAverage = validRatings.length > 0 
            ? (validRatings.reduce((sum, r) => sum + parseFloat(r), 0) / validRatings.length).toFixed(2)
            : null;

        let finalRatingCategory = null;
        if (annualAverage) {
            if (annualAverage >= 4.5) finalRatingCategory = 'exceptional';
            else if (annualAverage >= 3.5) finalRatingCategory = 'exceeds_expectations';
            else if (annualAverage >= 2.5) finalRatingCategory = 'meets_expectations';
            else if (annualAverage >= 1.5) finalRatingCategory = 'needs_improvement';
            else finalRatingCategory = 'unsatisfactory';
        }

        const existingSummary = await PerformanceAnnualSummaryRepository.findByYearAndEmployee(fiscal_year, employee_id);

        if (existingSummary) {
            return await PerformanceAnnualSummaryRepository.update(fiscal_year, employee_id, {
                ...ratings,
                annual_average_rating: annualAverage,
                final_rating_category: finalRatingCategory
            });
        }

        return await PerformanceAnnualSummaryRepository.create({
            fiscal_year,
            employee_id,
            ...ratings,
            annual_average_rating: annualAverage,
            final_rating_category: finalRatingCategory
        });
    }

    async getAllAnnualSummaries(params) {
        return await PerformanceAnnualSummaryRepository.findAll(params);
    }

    async getAnnualSummaryByYearAndEmployee(fiscal_year, employee_id) {
        const summary = await PerformanceAnnualSummaryRepository.findByYearAndEmployee(fiscal_year, employee_id);
        
        if (!summary) {
            const error = new Error('Annual summary not found');
            error.statusCode = 404;
            throw error;
        }

        return summary;
    }

    async hrApprove(fiscal_year, employee_id, hr_approved_by) {
        const summary = await PerformanceAnnualSummaryRepository.findByYearAndEmployee(fiscal_year, employee_id);
        
        if (!summary) {
            const error = new Error('Annual summary not found');
            error.statusCode = 404;
            throw error;
        }

        return await PerformanceAnnualSummaryRepository.hrApprove(fiscal_year, employee_id, hr_approved_by);
    }
}

class PerformanceNotificationService {
    async processPendingNotifications() {
        const pendingNotifications = await PerformanceNotificationRepository.findPendingNotifications();
        const results = [];

        for (const notification of pendingNotifications) {
            try {
                await PerformanceNotificationRepository.updateStatus(notification.id, 'sent', new Date());
                results.push({ id: notification.id, status: 'sent' });
            } catch (error) {
                await PerformanceNotificationRepository.updateStatus(notification.id, 'failed');
                results.push({ id: notification.id, status: 'failed', error: error.message });
            }
        }

        return results;
    }

    async checkAndUpdateCycleStatuses() {
        const now = new Date();
        const activeCycles = await PerformanceCycleRepository.findActiveCycles();
        const updates = [];

        for (const cycle of activeCycles) {
            if (cycle.status === 'active' && now >= new Date(cycle.self_rating_start)) {
                await PerformanceCycleRepository.updateStatus(cycle.id, 'self_rating_open');
                updates.push({ cycle_id: cycle.id, old_status: 'active', new_status: 'self_rating_open' });
            }

            if (cycle.status === 'self_rating_open' && now > new Date(cycle.self_rating_end)) {
                await PerformanceCycleRepository.updateStatus(cycle.id, 'self_rating_closed');
                updates.push({ cycle_id: cycle.id, old_status: 'self_rating_open', new_status: 'self_rating_closed' });
            }

            if (cycle.status === 'self_rating_closed' && now >= new Date(cycle.manager_rating_start)) {
                await PerformanceCycleRepository.updateStatus(cycle.id, 'manager_rating_open');
                updates.push({ cycle_id: cycle.id, old_status: 'self_rating_closed', new_status: 'manager_rating_open' });
            }

            if (cycle.status === 'manager_rating_open' && now > new Date(cycle.manager_rating_end)) {
                await PerformanceCycleRepository.updateStatus(cycle.id, 'manager_rating_closed');
                updates.push({ cycle_id: cycle.id, old_status: 'manager_rating_open', new_status: 'manager_rating_closed' });
            }

            if (cycle.status === 'manager_rating_closed' && cycle.hr_review_start && now >= new Date(cycle.hr_review_start)) {
                await PerformanceCycleRepository.updateStatus(cycle.id, 'hr_review');
                updates.push({ cycle_id: cycle.id, old_status: 'manager_rating_closed', new_status: 'hr_review' });
            }
        }

        return updates;
    }
}

module.exports = {
    PerformanceCycleService: new PerformanceCycleService(),
    PerformanceGoalService: new PerformanceGoalService(),
    PerformanceSelfRatingService: new PerformanceSelfRatingService(),
    PerformanceManagerRatingService: new PerformanceManagerRatingService(),
    PerformanceOverallRatingService: new PerformanceOverallRatingService(),
    PerformanceAnnualSummaryService: new PerformanceAnnualSummaryService(),
    PerformanceNotificationService: new PerformanceNotificationService()
};
