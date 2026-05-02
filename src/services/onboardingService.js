const onboardingModel = require('../models/onboardingModel');
const employeeModel = require('../models/employeeModel');
const masterDataModel = require('../models/masterDataModel');
const { errorResponse } = require('../utils/helpers');

class OnboardingService {
    async getAllOnboarding(params) {
        return await onboardingModel.findAll(params);
    }

    async getOnboardingById(id) {
        const onboarding = await onboardingModel.findById(id);
        if (!onboarding) {
            const error = new Error('Onboarding record not found');
            error.statusCode = 404;
            throw error;
        }

        const checklist = await onboardingModel.getChecklistProgress(id);
        onboarding.checklist_progress = checklist;

        return onboarding;
    }

    async getOnboardingByEmployeeId(employeeId) {
        const onboarding = await onboardingModel.findByEmployeeId(employeeId);
        if (!onboarding) {
            const error = new Error('No onboarding record found for this employee');
            error.statusCode = 404;
            throw error;
        }

        const checklist = await onboardingModel.getChecklistProgress(onboarding.id);
        onboarding.checklist_progress = checklist;

        return onboarding;
    }

    async createOnboarding(onboardingData) {
        const { employee_id, template_id, joining_date, created_by } = onboardingData;

        const employee = await employeeModel.findById(employee_id);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const existingOnboarding = await onboardingModel.findByEmployeeId(employee_id);
        if (existingOnboarding) {
            const error = new Error('Onboarding record already exists for this employee');
            error.statusCode = 400;
            throw error;
        }

        if (template_id) {
            const template = await masterDataModel.findTemplateById(template_id);
            if (!template) {
                const error = new Error('Checklist template not found');
                error.statusCode = 404;
                throw error;
            }
        }

        const onboardingId = await onboardingModel.create({
            employee_id,
            template_id,
            joining_date,
            created_by
        });

        const onboarding = await onboardingModel.findById(onboardingId);
        onboarding.checklist_progress = await onboardingModel.getChecklistProgress(onboardingId);

        return onboarding;
    }

    async updateOnboarding(id, data) {
        const existing = await onboardingModel.findById(id);
        if (!existing) {
            const error = new Error('Onboarding record not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await onboardingModel.update(id, data);
        if (!updated) {
            const error = new Error('Failed to update onboarding record');
            error.statusCode = 500;
            throw error;
        }

        return await onboardingModel.findById(id);
    }

    async updateChecklistItem(onboardingId, itemId, { status, remarks, attachment_path, completed_by }) {
        const onboarding = await onboardingModel.findById(onboardingId);
        if (!onboarding) {
            const error = new Error('Onboarding record not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await onboardingModel.updateChecklistItem(onboardingId, itemId, {
            status,
            remarks,
            attachment_path,
            completed_by
        });

        if (!updated) {
            const error = new Error('Failed to update checklist item');
            error.statusCode = 500;
            throw error;
        }

        return await onboardingModel.getChecklistProgress(onboardingId);
    }

    async getProbationTracking(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await onboardingModel.getProbationTracking(employeeId);
    }

    async createProbationTracking(employeeId, { probation_start_date, probation_end_date, created_by }) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const existing = await onboardingModel.getProbationTracking(employeeId);
        if (existing) {
            const error = new Error('Probation tracking already exists for this employee');
            error.statusCode = 400;
            throw error;
        }

        const id = await onboardingModel.createProbationTracking({
            employee_id: employeeId,
            probation_start_date,
            probation_end_date,
            created_by
        });

        return await onboardingModel.getProbationTracking(employeeId);
    }

    async updateProbationStatus(employeeId, data) {
        const existing = await onboardingModel.getProbationTracking(employeeId);
        if (!existing) {
            const error = new Error('Probation tracking not found for this employee');
            error.statusCode = 404;
            throw error;
        }

        const updated = await onboardingModel.updateProbationStatus(employeeId, data);
        if (!updated) {
            const error = new Error('Failed to update probation status');
            error.statusCode = 500;
            throw error;
        }

        return await onboardingModel.getProbationTracking(employeeId);
    }
}

module.exports = new OnboardingService();
