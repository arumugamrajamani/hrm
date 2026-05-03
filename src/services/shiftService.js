const shiftRepository = require('../repositories/shiftRepository');

class ShiftService {
    async createShift(shiftData) {
        const { shift_name, shift_code } = shiftData;

        const nameExists = await shiftRepository.shiftNameExists(shift_name);
        if (nameExists) {
            const error = new Error('Shift name already exists');
            error.statusCode = 409;
            throw error;
        }

        if (shift_code) {
            const codeExists = await shiftRepository.shiftCodeExists(shift_code);
            if (codeExists) {
                const error = new Error('Shift code already exists');
                error.statusCode = 409;
                throw error;
            }
        } else {
            shiftData.shift_code = await this.generateShiftCode();
        }

        const shiftId = await shiftRepository.create(shiftData);
        const shift = await shiftRepository.findById(shiftId);

        return shift;
    }

    async getAllShifts(params) {
        return await shiftRepository.findAll(params);
    }

    async getShiftById(id) {
        const shift = await shiftRepository.findById(id);
        
        if (!shift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        return shift;
    }

    async updateShift(id, shiftData) {
        const existingShift = await shiftRepository.findById(id);
        
        if (!existingShift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        const { shift_name, shift_code } = shiftData;

        if (shift_name && shift_name.toLowerCase() !== existingShift.shift_name.toLowerCase()) {
            const nameExists = await shiftRepository.shiftNameExists(shift_name, id);
            if (nameExists) {
                const error = new Error('Shift name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (shift_code && shift_code.toLowerCase() !== existingShift.shift_code.toLowerCase()) {
            const codeExists = await shiftRepository.shiftCodeExists(shift_code, id);
            if (codeExists) {
                const error = new Error('Shift code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        const updated = await shiftRepository.update(id, shiftData);
        
        if (!updated) {
            const error = new Error('Failed to update shift');
            error.statusCode = 500;
            throw error;
        }

        return await shiftRepository.findById(id);
    }

    async deleteShift(id) {
        const shift = await shiftRepository.findById(id);
        
        if (!shift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        if (shift.usage_count > 0) {
            const error = new Error('Cannot delete shift that is in use. Deactivate it instead.');
            error.statusCode = 400;
            throw error;
        }

        const deleted = await shiftRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete shift');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Shift deleted successfully' };
    }

    async activateShift(id) {
        const shift = await shiftRepository.findById(id);
        
        if (!shift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await shiftRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate shift');
            error.statusCode = 500;
            throw error;
        }

        return await shiftRepository.findById(id);
    }

    async deactivateShift(id) {
        const shift = await shiftRepository.findById(id);
        
        if (!shift) {
            const error = new Error('Shift not found');
            error.statusCode = 404;
            throw error;
        }

        const deactivated = await shiftRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate shift');
            error.statusCode = 500;
            throw error;
        }

        return await shiftRepository.findById(id);
    }

    async generateShiftCode() {
        const prefix = 'SHF';
        const [rows] = await require('../config/database').pool.query(
            'SELECT COUNT(*) as count FROM shifts'
        );
        const count = rows[0].count + 1;
        return `${prefix}${count.toString().padStart(3, '0')}`;
    }
}

module.exports = new ShiftService();
