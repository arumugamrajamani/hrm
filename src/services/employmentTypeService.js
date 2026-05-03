const employmentTypeRepository = require('../repositories/employmentTypeRepository');

class EmploymentTypeService {
    async createEmploymentType(employmentTypeData) {
        const { employment_type_name, employment_type_code } = employmentTypeData;

        const nameExists = await employmentTypeRepository.employmentTypeNameExists(employment_type_name);
        if (nameExists) {
            const error = new Error('Employment type name already exists');
            error.statusCode = 409;
            throw error;
        }

        const codeExists = await employmentTypeRepository.employmentTypeCodeExists(employment_type_code);
        if (codeExists) {
            const error = new Error('Employment type code already exists');
            error.statusCode = 409;
            throw error;
        }

        const employmentTypeId = await employmentTypeRepository.create(employmentTypeData);
        const employmentType = await employmentTypeRepository.findById(employmentTypeId);

        return employmentType;
    }

    async getAllEmploymentTypes(params) {
        return await employmentTypeRepository.findAll(params);
    }

    async getEmploymentTypeById(id) {
        const employmentType = await employmentTypeRepository.findById(id);
        
        if (!employmentType) {
            const error = new Error('Employment type not found');
            error.statusCode = 404;
            throw error;
        }

        return employmentType;
    }

    async updateEmploymentType(id, employmentTypeData) {
        const existingEmploymentType = await employmentTypeRepository.findById(id);
        
        if (!existingEmploymentType) {
            const error = new Error('Employment type not found');
            error.statusCode = 404;
            throw error;
        }

        const { employment_type_name, employment_type_code } = employmentTypeData;

        if (employment_type_name && employment_type_name.toLowerCase() !== existingEmploymentType.employment_type_name.toLowerCase()) {
            const nameExists = await employmentTypeRepository.employmentTypeNameExists(employment_type_name, id);
            if (nameExists) {
                const error = new Error('Employment type name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (employment_type_code && employment_type_code.toLowerCase() !== existingEmploymentType.employment_type_code.toLowerCase()) {
            const codeExists = await employmentTypeRepository.employmentTypeCodeExists(employment_type_code, id);
            if (codeExists) {
                const error = new Error('Employment type code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await employmentTypeRepository.update(id, employmentTypeData);
        
        if (!updated) {
            const error = new Error('Failed to update employment type');
            error.statusCode = 500;
            throw error;
        }

        return await employmentTypeRepository.findById(id);
    }

    async deleteEmploymentType(id) {
        const employmentType = await employmentTypeRepository.findById(id);
        
        if (!employmentType) {
            const error = new Error('Employment type not found');
            error.statusCode = 404;
            throw error;
        }

        const deleted = await employmentTypeRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete employment type');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Employment type deleted successfully' };
    }

    async activateEmploymentType(id) {
        const employmentType = await employmentTypeRepository.findById(id);
        
        if (!employmentType) {
            const error = new Error('Employment type not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await employmentTypeRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate employment type');
            error.statusCode = 500;
            throw error;
        }

        return await employmentTypeRepository.findById(id);
    }

    async deactivateEmploymentType(id) {
        const employmentType = await employmentTypeRepository.findById(id);
        
        if (!employmentType) {
            const error = new Error('Employment type not found');
            error.statusCode = 404;
            throw error;
        }

        const deactivated = await employmentTypeRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate employment type');
            error.statusCode = 500;
            throw error;
        }

        return await employmentTypeRepository.findById(id);
    }
}

module.exports = new EmploymentTypeService();
