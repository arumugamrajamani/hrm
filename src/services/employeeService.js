const employeeModel = require('../models/employeeModel');
const employeeJobModel = require('../models/employeeJobModel');
const employeeAddressModel = require('../models/employeeAddressModel');
const employeeBankModel = require('../models/employeeBankModel');
const employeeEducationModel = require('../models/employeeEducationModel');
const employeeExperienceModel = require('../models/employeeExperienceModel');
const employeeDocumentModel = require('../models/employeeDocumentModel');

class EmployeeService {
    async createEmployee(employeeData) {
        const { first_name, last_name, date_of_birth, gender, profile_photo, created_by } = employeeData;

        if (!first_name) {
            const error = new Error('First name is required');
            error.statusCode = 400;
            throw error;
        }

        const employeeId = await employeeModel.create({
            first_name,
            last_name,
            date_of_birth,
            gender,
            profile_photo,
            created_by
        });

        const employee = await employeeModel.findById(employeeId);
        return employee;
    }

    async getAllEmployees(params) {
        return await employeeModel.findAll(params);
    }

    async getEmployeeById(id) {
        const employee = await employeeModel.findById(id);
        
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return employee;
    }

    async getEmployeeFullProfile(id) {
        const profile = await employeeModel.getFullProfile(id);
        
        if (!profile) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return profile;
    }

    async updateEmployee(id, employeeData) {
        const existingEmployee = await employeeModel.findById(id);
        
        if (!existingEmployee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const updated = await employeeModel.update(id, employeeData);
        
        if (!updated) {
            const error = new Error('Failed to update employee');
            error.statusCode = 500;
            throw error;
        }

        return await employeeModel.findById(id);
    }

    async deleteEmployee(id) {
        const existingEmployee = await employeeModel.findById(id);
        
        if (!existingEmployee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const deleted = await employeeModel.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete employee');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Employee deleted successfully' };
    }

    async restoreEmployee(id) {
        const employee = await employeeModel.findById(id);
        
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const restored = await employeeModel.restore(id);
        
        if (!restored) {
            const error = new Error('Failed to restore employee');
            error.statusCode = 500;
            throw error;
        }

        return await employeeModel.findById(id);
    }

    async getJobDetails(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getJobDetails(employeeId);
    }

    async getCurrentJobDetails(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getCurrentJobDetails(employeeId);
    }

    async updateJobDetails(employeeId, jobData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const jobId = await employeeJobModel.create({
            ...jobData,
            employee_id: employeeId
        });

        return await employeeJobModel.findById(jobId);
    }

    async getAddresses(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getAddresses(employeeId);
    }

    async getCurrentAddresses(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getCurrentAddresses(employeeId);
    }

    async addAddress(employeeId, addressData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const addressId = await employeeAddressModel.create({
            ...addressData,
            employee_id: employeeId
        });

        return await employeeAddressModel.findById(addressId);
    }

    async getBankDetails(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getBankDetails(employeeId);
    }

    async getCurrentBankDetails(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getCurrentBankDetails(employeeId);
    }

    async addBankDetails(employeeId, bankData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const bankId = await employeeBankModel.create({
            ...bankData,
            employee_id: employeeId
        });

        return await employeeBankModel.findById(bankId);
    }

    async getEducation(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getEducation(employeeId);
    }

    async addEducation(employeeId, educationData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const educationId = await employeeEducationModel.create({
            ...educationData,
            employee_id: employeeId
        });

        return await employeeEducationModel.findById(educationId);
    }

    async getExperience(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getExperience(employeeId);
    }

    async addExperience(employeeId, experienceData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const experienceId = await employeeExperienceModel.create({
            ...experienceData,
            employee_id: employeeId
        });

        return await employeeExperienceModel.findById(experienceId);
    }

    async getDocuments(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getDocuments(employeeId);
    }

    async addDocument(employeeId, documentData) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        const documentId = await employeeDocumentModel.create({
            ...documentData,
            employee_id: employeeId
        });

        return await employeeDocumentModel.findById(documentId);
    }

    async getEmergencyContacts(employeeId) {
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
            const error = new Error('Employee not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getEmergencyContacts(employeeId);
    }

    async getReportingEmployees(managerId) {
        const manager = await employeeModel.findById(managerId);
        if (!manager) {
            const error = new Error('Manager not found');
            error.statusCode = 404;
            throw error;
        }

        return await employeeModel.getReportingEmployees(managerId);
    }
}

module.exports = new EmployeeService();
