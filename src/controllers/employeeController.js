const employeeService = require('../services/employeeService');
const { successResponse, paginatedResponse, noDataResponse, errorResponse } = require('../utils/helpers');

class EmployeeController {
    async getAllEmployees(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '', department = '', location = '' } = req.query;
            
            const result = await employeeService.getAllEmployees({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                department,
                location
            });

            if (!result.employees || result.employees.length === 0) {
                return noDataResponse(res, 'No employees found');
            }

            return paginatedResponse(
                res,
                result.employees,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Employees retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeById(req, res, next) {
        try {
            const { id } = req.params;
            const employee = await employeeService.getEmployeeById(parseInt(id));
            if (!employee) {
                return noDataResponse(res, 'Employee not found');
            }
            return successResponse(res, employee, 'Employee retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getEmployeeFullProfile(req, res, next) {
        try {
            const { id } = req.params;
            const profile = await employeeService.getEmployeeFullProfile(parseInt(id));
            return successResponse(res, profile, 'Employee profile retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createEmployee(req, res, next) {
        try {
            const employeeData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const employee = await employeeService.createEmployee(employeeData);
            return successResponse(res, employee, 'Employee created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const employeeData = {
                ...req.body,
                updated_by: req.user?.id || null
            };
            
            const employee = await employeeService.updateEmployee(parseInt(id), employeeData);
            return successResponse(res, employee, 'Employee updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async changeLifecycleState(req, res, next) {
        try {
            const { id } = req.params;
            const { to_state, reason, remarks, effective_date } = req.body;
            
            const employee = await employeeService.changeLifecycleState(parseInt(id), {
                toState,
                reason,
                remarks,
                changedBy: req.user?.id || null,
                effectiveDate: effective_date || new Date()
            });
            
            return successResponse(res, employee, `Employee state changed to ${to_state} successfully`);
        } catch (error) {
            next(error);
        }
    }

    async getLifecycleHistory(req, res, next) {
        try {
            const { id } = req.params;
            const history = await employeeService.getLifecycleHistory(parseInt(id));
            if (!history || history.length === 0) {
                return noDataResponse(res, 'No lifecycle history found');
            }
            return successResponse(res, history, 'Lifecycle history retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addJobChange(req, res, next) {
        try {
            const { id } = req.params;
            const jobChangeData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const result = await employeeService.addJobChange(parseInt(id), jobChangeData);
            return successResponse(res, result, 'Job change recorded successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getJobChanges(req, res, next) {
        try {
            const { id } = req.params;
            const changes = await employeeService.getJobChanges(parseInt(id));
            if (!changes || changes.length === 0) {
                return noDataResponse(res, 'No job changes found');
            }
            return successResponse(res, changes, 'Job changes retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const result = await employeeService.deleteEmployee(parseInt(id));
            return successResponse(res, result, 'Employee deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async restoreEmployee(req, res, next) {
        try {
            const { id } = req.params;
            const employee = await employeeService.restoreEmployee(parseInt(id));
            return successResponse(res, employee, 'Employee restored successfully');
        } catch (error) {
            next(error);
        }
    }

    async getJobDetails(req, res, next) {
        try {
            const { id } = req.params;
            const jobDetails = await employeeService.getJobDetails(parseInt(id));
            return successResponse(res, jobDetails, 'Job details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentJobDetails(req, res, next) {
        try {
            const { id } = req.params;
            const jobDetails = await employeeService.getCurrentJobDetails(parseInt(id));
            return successResponse(res, jobDetails, 'Current job details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async updateJobDetails(req, res, next) {
        try {
            const { id } = req.params;
            const jobData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const jobDetails = await employeeService.updateJobDetails(parseInt(id), jobData);
            return successResponse(res, jobDetails, 'Job details updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async getAddresses(req, res, next) {
        try {
            const { id } = req.params;
            const addresses = await employeeService.getAddresses(parseInt(id));
            return successResponse(res, addresses, 'Addresses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentAddresses(req, res, next) {
        try {
            const { id } = req.params;
            const addresses = await employeeService.getCurrentAddresses(parseInt(id));
            return successResponse(res, addresses, 'Current addresses retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addAddress(req, res, next) {
        try {
            const { id } = req.params;
            const addressData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const address = await employeeService.addAddress(parseInt(id), addressData);
            return successResponse(res, address, 'Address added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getBankDetails(req, res, next) {
        try {
            const { id } = req.params;
            const bankDetails = await employeeService.getBankDetails(parseInt(id));
            return successResponse(res, bankDetails, 'Bank details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getCurrentBankDetails(req, res, next) {
        try {
            const { id } = req.params;
            const bankDetails = await employeeService.getCurrentBankDetails(parseInt(id));
            return successResponse(res, bankDetails, 'Current bank details retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addBankDetails(req, res, next) {
        try {
            const { id } = req.params;
            const bankData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const bankDetails = await employeeService.addBankDetails(parseInt(id), bankData);
            return successResponse(res, bankDetails, 'Bank details added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getEducation(req, res, next) {
        try {
            const { id } = req.params;
            const education = await employeeService.getEducation(parseInt(id));
            return successResponse(res, education, 'Education records retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addEducation(req, res, next) {
        try {
            const { id } = req.params;
            const educationData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const education = await employeeService.addEducation(parseInt(id), educationData);
            return successResponse(res, education, 'Education record added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getExperience(req, res, next) {
        try {
            const { id } = req.params;
            const experience = await employeeService.getExperience(parseInt(id));
            return successResponse(res, experience, 'Experience records retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addExperience(req, res, next) {
        try {
            const { id } = req.params;
            const experienceData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const experience = await employeeService.addExperience(parseInt(id), experienceData);
            return successResponse(res, experience, 'Experience record added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getDocuments(req, res, next) {
        try {
            const { id } = req.params;
            const documents = await employeeService.getDocuments(parseInt(id));
            if (!documents || documents.length === 0) {
                return noDataResponse(res, 'No documents found');
            }
            return successResponse(res, documents, 'Documents retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async addDocument(req, res, next) {
        try {
            const { id } = req.params;
            const documentData = {
                ...req.body,
                uploaded_by: req.user?.id || null
            };
            
            const document = await employeeService.addDocument(parseInt(id), documentData);
            return successResponse(res, document, 'Document added successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async getEmergencyContacts(req, res, next) {
        try {
            const { id } = req.params;
            const contacts = await employeeService.getEmergencyContacts(parseInt(id));
            if (!contacts || contacts.length === 0) {
                return noDataResponse(res, 'No emergency contacts found');
            }
            return successResponse(res, contacts, 'Emergency contacts retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getReportingEmployees(req, res, next) {
        try {
            const { id } = req.params;
            const employees = await employeeService.getReportingEmployees(parseInt(id));
            if (!employees || employees.length === 0) {
                return noDataResponse(res, 'No reporting employees found');
            }
            return successResponse(res, employees, 'Reporting employees retrieved successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new EmployeeController();
