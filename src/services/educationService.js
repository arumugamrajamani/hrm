const educationRepository = require('../repositories/educationRepository');
const educationCourseMapRepository = require('../repositories/educationCourseMapRepository');

class EducationService {
    async createEducation(educationData) {
        const { education_name, education_code } = educationData;

        const nameExists = await educationRepository.educationNameExists(education_name);
        if (nameExists) {
            const error = new Error('Education name already exists');
            error.statusCode = 409;
            throw error;
        }

        const codeExists = await educationRepository.educationCodeExists(education_code);
        if (codeExists) {
            const error = new Error('Education code already exists');
            error.statusCode = 409;
            throw error;
        }

        const educationId = await educationRepository.create(educationData);
        const education = await educationRepository.findById(educationId);

        return education;
    }

    async getAllEducations(params) {
        return await educationRepository.findAll(params);
    }

    async getEducationById(id) {
        const education = await educationRepository.findById(id);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        return education;
    }

    async updateEducation(id, educationData) {
        const existingEducation = await educationRepository.findById(id);
        
        if (!existingEducation) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const { education_name, education_code } = educationData;

        if (education_name && education_name.toLowerCase() !== existingEducation.education_name.toLowerCase()) {
            const nameExists = await educationRepository.educationNameExists(education_name, id);
            if (nameExists) {
                const error = new Error('Education name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (education_code && education_code.toLowerCase() !== existingEducation.education_code.toLowerCase()) {
            const codeExists = await educationRepository.educationCodeExists(education_code, id);
            if (codeExists) {
                const error = new Error('Education code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await educationRepository.update(id, educationData);
        
        if (!updated) {
            const error = new Error('Failed to update education');
            error.statusCode = 500;
            throw error;
        }

        return await educationRepository.findById(id);
    }

    async deleteEducation(id) {
        const education = await educationRepository.findById(id);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const deleted = await educationRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete education');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Education deleted successfully' };
    }

    async activateEducation(id) {
        const education = await educationRepository.findById(id);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await educationRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate education');
            error.statusCode = 500;
            throw error;
        }

        return await educationRepository.findById(id);
    }

    async deactivateEducation(id) {
        const education = await educationRepository.findById(id);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const deactivated = await educationRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate education');
            error.statusCode = 500;
            throw error;
        }

        return await educationRepository.findById(id);
    }

    async getCoursesByEducation(educationId) {
        const education = await educationRepository.findById(educationId);
        
        if (!education) {
            const error = new Error('Education not found');
            error.statusCode = 404;
            throw error;
        }

        const courses = await educationCourseMapRepository.findByEducationId(educationId);
        
        return {
            education: {
                id: education.id,
                education_name: education.education_name,
                education_code: education.education_code,
                level: education.level
            },
            courses: courses
        };
    }
}

module.exports = new EducationService();
