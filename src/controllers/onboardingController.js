const onboardingService = require('../services/onboardingService');
const { successResponse, paginatedResponse } = require('../utils/helpers');

class OnboardingController {
    async getAllOnboarding(req, res, next) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const status = req.query.status || '';
            const employee_id = req.query.employee_id ? parseInt(req.query.employee_id) : null;

            const result = await onboardingService.getAllOnboarding({
                page, limit, status, employee_id
            });

            return paginatedResponse(res, result.onboarding, {
                page: result.page,
                limit: result.limit,
                total: result.total,
                totalPages: result.totalPages
            }, 'Onboarding records retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getOnboardingById(req, res, next) {
        try {
            const { id } = req.params;
            const onboarding = await onboardingService.getOnboardingById(parseInt(id));
            return successResponse(res, onboarding, 'Onboarding record retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getOnboardingByEmployeeId(req, res, next) {
        try {
            const { id } = req.params;
            const onboarding = await onboardingService.getOnboardingByEmployeeId(parseInt(id));
            return successResponse(res, onboarding, 'Onboarding record retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createOnboarding(req, res, next) {
        try {
            const onboardingData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const onboarding = await onboardingService.createOnboarding(onboardingData);
            return successResponse(res, onboarding, 'Onboarding record created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateOnboarding(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                updated_by: req.user?.id || null
            };

            const onboarding = await onboardingService.updateOnboarding(parseInt(id), data);
            return successResponse(res, onboarding, 'Onboarding record updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateChecklistItem(req, res, next) {
        try {
            const { onboardingId, itemId } = req.params;
            const data = {
                ...req.body,
                completed_by: req.user?.id || null
            };

            const checklist = await onboardingService.updateChecklistItem(
                parseInt(onboardingId), 
                parseInt(itemId), 
                data
            );
            return successResponse(res, checklist, 'Checklist item updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getProbationTracking(req, res, next) {
        try {
            const { id } = req.params;
            const tracking = await onboardingService.getProbationTracking(parseInt(id));
            
            if (!tracking) {
                return successResponse(res, null, 'No probation tracking found for this employee');
            }
            
            return successResponse(res, tracking, 'Probation tracking retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createProbationTracking(req, res, next) {
        try {
            const { id } = req.params;
            const trackingData = {
                ...req.body,
                created_by: req.user?.id || null
            };

            const tracking = await onboardingService.createProbationTracking(parseInt(id), trackingData);
            return successResponse(res, tracking, 'Probation tracking created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateProbationStatus(req, res, next) {
        try {
            const { id } = req.params;
            const data = {
                ...req.body,
                confirmed_by: req.user?.id || null
            };

            const tracking = await onboardingService.updateProbationStatus(parseInt(id), data);
            return successResponse(res, tracking, 'Probation status updated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new OnboardingController();
