const departmentRepository = require('../repositories/departmentRepository');

class DepartmentService {
    async createDepartment(departmentData) {
        const { department_name, department_code, parent_department_id } = departmentData;

        const nameExists = await departmentRepository.departmentNameExists(department_name);
        if (nameExists) {
            const error = new Error('Department name already exists');
            error.statusCode = 409;
            throw error;
        }

        const codeExists = await departmentRepository.departmentCodeExists(department_code);
        if (codeExists) {
            const error = new Error('Department code already exists');
            error.statusCode = 409;
            throw error;
        }

        if (parent_department_id) {
            const parentExists = await departmentRepository.findById(parent_department_id);
            if (!parentExists) {
                const error = new Error('Parent department does not exist');
                error.statusCode = 400;
                throw error;
            }
        }

        const departmentId = await departmentRepository.create(departmentData);
        const department = await departmentRepository.findById(departmentId);

        return department;
    }

    async getAllDepartments(params) {
        return await departmentRepository.findAll(params);
    }

    async getDepartmentById(id) {
        const department = await departmentRepository.findById(id, true);
        
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 404;
            throw error;
        }

        return department;
    }

    async getDepartmentHierarchy() {
        const hierarchy = await departmentRepository.getHierarchyTree();
        return this.buildHierarchyTree(hierarchy);
    }

    buildHierarchyTree(flatList) {
        const map = {};
        const roots = [];

        flatList.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        flatList.forEach(item => {
            if (item.parent_department_id && map[item.parent_department_id]) {
                map[item.parent_department_id].children.push(map[item.id]);
            } else if (!item.parent_department_id) {
                roots.push(map[item.id]);
            }
        });

        return roots;
    }

    async getChildDepartments(parentId) {
        const children = await departmentRepository.findByParentId(parentId);
        
        if (children.length === 0) {
            const parentExists = await departmentRepository.findById(parentId);
            if (!parentExists) {
                const error = new Error('Parent department not found');
                error.statusCode = 404;
                throw error;
            }
        }

        return children;
    }

    async updateDepartment(id, departmentData) {
        const existingDepartment = await departmentRepository.findById(id);
        
        if (!existingDepartment) {
            const error = new Error('Department not found');
            error.statusCode = 404;
            throw error;
        }

        const { department_name, department_code, parent_department_id } = departmentData;

        if (department_name && department_name !== existingDepartment.department_name) {
            const nameExists = await departmentRepository.departmentNameExists(department_name, id);
            if (nameExists) {
                const error = new Error('Department name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (department_code && department_code !== existingDepartment.department_code) {
            const codeExists = await departmentRepository.departmentCodeExists(department_code, id);
            if (codeExists) {
                const error = new Error('Department code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (parent_department_id !== undefined && parent_department_id !== null) {
            if (parent_department_id === id) {
                const error = new Error('Department cannot be its own parent');
                error.statusCode = 400;
                throw error;
            }

            const parentExists = await departmentRepository.findById(parent_department_id);
            if (!parentExists) {
                const error = new Error('Parent department does not exist');
                error.statusCode = 400;
                throw error;
            }

            const wouldCreateCircle = await this.checkCircularHierarchy(id, parent_department_id);
            if (wouldCreateCircle) {
                const error = new Error('Cannot set parent: would create circular hierarchy');
                error.statusCode = 400;
                throw error;
            }
        }

        const updateData = { ...departmentData };
        if (departmentData.parent_department_id === '') {
            updateData.parent_department_id = null;
        }

        const updated = await departmentRepository.update(id, updateData);
        
        if (!updated) {
            const error = new Error('Failed to update department');
            error.statusCode = 500;
            throw error;
        }

        return await departmentRepository.findById(id, true);
    }

    async checkCircularHierarchy(departmentId, newParentId) {
        let currentId = newParentId;
        const visited = new Set();

        while (currentId !== null) {
            if (currentId === departmentId) {
                return true;
            }

            if (visited.has(currentId)) {
                return true;
            }

            visited.add(currentId);

            const parent = await departmentRepository.findById(currentId);
            if (!parent || !parent.parent_department_id) {
                break;
            }

            currentId = parent.parent_department_id;
        }

        return false;
    }

    async deleteDepartment(id) {
        const department = await departmentRepository.findById(id);
        
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 404;
            throw error;
        }

        const hasChildren = await departmentRepository.hasChildren(id);
        if (hasChildren) {
            const error = new Error('Cannot delete department with child departments. Please reassign or delete child departments first.');
            error.statusCode = 400;
            throw error;
        }

        const deleted = await departmentRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete department');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Department deleted successfully' };
    }

    async activateDepartment(id) {
        const department = await departmentRepository.findById(id);
        
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await departmentRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate department');
            error.statusCode = 500;
            throw error;
        }

        return await departmentRepository.findById(id, true);
    }

    async deactivateDepartment(id) {
        const department = await departmentRepository.findById(id);
        
        if (!department) {
            const error = new Error('Department not found');
            error.statusCode = 404;
            throw error;
        }

        const hasChildren = await departmentRepository.hasChildren(id);
        if (hasChildren) {
            const error = new Error('Cannot deactivate department with active child departments');
            error.statusCode = 400;
            throw error;
        }

        const deactivated = await departmentRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate department');
            error.statusCode = 500;
            throw error;
        }

        return await departmentRepository.findById(id, true);
    }
}

module.exports = new DepartmentService();
