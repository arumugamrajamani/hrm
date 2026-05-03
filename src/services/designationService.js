const designationRepository = require('../repositories/designationRepository');

class DesignationService {
    async createDesignation(designationData) {
        const { designation_name, designation_code, department_id } = designationData;

        const nameExists = await designationRepository.designationNameExists(designation_name);
        if (nameExists) {
            const error = new Error('Designation name already exists');
            error.statusCode = 409;
            throw error;
        }

        let finalDesignationCode = designation_code;
        if (!finalDesignationCode) {
            finalDesignationCode = await designationRepository.generateDesignationCode('DES');
        } else {
            const codeExists = await designationRepository.designationCodeExists(finalDesignationCode);
            if (codeExists) {
                const error = new Error('Designation code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const designationId = await designationRepository.create({
            ...designationData,
            designation_code: finalDesignationCode
        });

        const designation = await designationRepository.findById(designationId);

        return designation;
    }

    async getAllDesignations(params) {
        return await designationRepository.findAll(params);
    }

    async getDesignationById(id) {
        const designation = await designationRepository.findById(id);
        
        if (!designation) {
            const error = new Error('Designation not found');
            error.statusCode = 404;
            throw error;
        }

        return designation;
    }

    async getDesignationsByDepartment(departmentId) {
        const designations = await designationRepository.findByDepartmentId(departmentId);
        return designations;
    }

    async updateDesignation(id, designationData) {
        const existingDesignation = await designationRepository.findById(id);
        
        if (!existingDesignation) {
            const error = new Error('Designation not found');
            error.statusCode = 404;
            throw error;
        }

        const { designation_name, designation_code } = designationData;

        if (designation_name && designation_name !== existingDesignation.designation_name) {
            const nameExists = await designationRepository.designationNameExists(designation_name, id);
            if (nameExists) {
                const error = new Error('Designation name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (designation_code && designation_code !== existingDesignation.designation_code) {
            const codeExists = await designationRepository.designationCodeExists(designation_code, id);
            if (codeExists) {
                const error = new Error('Designation code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await designationRepository.update(id, designationData);
        
        if (!updated) {
            const error = new Error('Failed to update designation');
            error.statusCode = 500;
            throw error;
        }

        return await designationRepository.findById(id);
    }

    async deleteDesignation(id) {
        const designation = await designationRepository.findById(id);
        
        if (!designation) {
            const error = new Error('Designation not found');
            error.statusCode = 404;
            throw error;
        }

        const hasEmployees = await designationRepository.hasEmployees(id);
        if (hasEmployees) {
            const error = new Error('Cannot delete designation with active employees. Please reassign employees first.');
            error.statusCode = 400;
            throw error;
        }

        const deleted = await designationRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete designation');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Designation deleted successfully' };
    }

    async activateDesignation(id) {
        const designation = await designationRepository.findById(id);
        
        if (!designation) {
            const error = new Error('Designation not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await designationRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate designation');
            error.statusCode = 500;
            throw error;
        }

        return await designationRepository.findById(id);
    }

    async deactivateDesignation(id) {
        const designation = await designationRepository.findById(id);
        
        if (!designation) {
            const error = new Error('Designation not found');
            error.statusCode = 404;
            throw error;
        }

        const hasEmployees = await designationRepository.hasEmployees(id);
        if (hasEmployees) {
            const error = new Error('Cannot deactivate designation with active employees');
            error.statusCode = 400;
            throw error;
        }

        const deactivated = await designationRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate designation');
            error.statusCode = 500;
            throw error;
        }

        return await designationRepository.findById(id);
    }

    async generateDesignationCode(prefix) {
        return await designationRepository.generateDesignationCode(prefix);
    }
}

module.exports = new DesignationService();
