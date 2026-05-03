const locationRepository = require('../repositories/locationRepository');

class LocationService {
    async createLocation(locationData) {
        const { location_name, location_code, parent_location_id, is_headquarters } = locationData;

        const nameExists = await locationRepository.locationNameExists(location_name);
        if (nameExists) {
            const error = new Error('Location name already exists');
            error.statusCode = 409;
            throw error;
        }

        let finalLocationCode = location_code;
        if (!finalLocationCode) {
            finalLocationCode = await locationRepository.generateBranchCode('LOC');
        } else {
            const codeExists = await locationRepository.locationCodeExists(finalLocationCode);
            if (codeExists) {
                const error = new Error('Location code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (parent_location_id) {
            const parentExists = await locationRepository.findById(parent_location_id);
            if (!parentExists) {
                const error = new Error('Parent location does not exist');
                error.statusCode = 400;
                throw error;
            }
        }

        if (is_headquarters === true) {
            const headquarters = await locationRepository.getHeadquarters();
            if (headquarters) {
                const error = new Error('Headquarters already exists. Please unset it from existing location first.');
                error.statusCode = 409;
                throw error;
            }
        }

        const locationId = await locationRepository.create({
            ...locationData,
            location_code: finalLocationCode
        });

        const location = await locationRepository.findById(locationId);

        return location;
    }

    async getAllLocations(params) {
        return await locationRepository.findAll(params);
    }

    async getLocationById(id) {
        const location = await locationRepository.findById(id, true);
        
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        return location;
    }

    async getLocationHierarchy() {
        const hierarchy = await locationRepository.getHierarchyTree();
        return this.buildHierarchyTree(hierarchy);
    }

    buildHierarchyTree(flatList) {
        const map = {};
        const roots = [];

        flatList.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        flatList.forEach(item => {
            if (item.parent_location_id && map[item.parent_location_id]) {
                map[item.parent_location_id].children.push(map[item.id]);
            } else if (!item.parent_location_id) {
                roots.push(map[item.id]);
            }
        });

        return roots;
    }

    async getChildLocations(parentId) {
        const children = await locationRepository.findByParentId(parentId);
        
        if (children.length === 0) {
            const parentExists = await locationRepository.findById(parentId);
            if (!parentExists) {
                const error = new Error('Parent location not found');
                error.statusCode = 404;
                throw error;
            }
        }

        return children;
    }

    async updateLocation(id, locationData) {
        const existingLocation = await locationRepository.findById(id);
        
        if (!existingLocation) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        const { location_name, location_code, parent_location_id, is_headquarters } = locationData;

        if (location_name && location_name !== existingLocation.location_name) {
            const nameExists = await locationRepository.locationNameExists(location_name, id);
            if (nameExists) {
                const error = new Error('Location name already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (location_code && location_code !== existingLocation.location_code) {
            const codeExists = await locationRepository.locationCodeExists(location_code, id);
            if (codeExists) {
                const error = new Error('Location code already exists');
                error.statusCode = 409;
                throw error;
            }
        }

        if (parent_location_id !== undefined && parent_location_id !== null) {
            if (parent_location_id === id) {
                const error = new Error('Location cannot be its own parent');
                error.statusCode = 400;
                throw error;
            }

            const parentExists = await locationRepository.findById(parent_location_id);
            if (!parentExists) {
                const error = new Error('Parent location does not exist');
                error.statusCode = 400;
                throw error;
            }

            const wouldCreateCircle = await this.checkCircularHierarchy(id, parent_location_id);
            if (wouldCreateCircle) {
                const error = new Error('Cannot set parent: would create circular hierarchy');
                error.statusCode = 400;
                throw error;
            }
        }

        if (is_headquarters === true && !existingLocation.is_headquarters) {
            const headquarters = await locationRepository.getHeadquarters();
            if (headquarters && headquarters.id !== id) {
                const error = new Error('Headquarters already exists. Please unset it from existing location first.');
                error.statusCode = 409;
                throw error;
            }
        }

        const updateData = { ...locationData };
        if (locationData.parent_location_id === '') {
            updateData.parent_location_id = null;
        }

        const updated = await locationRepository.update(id, updateData);
        
        if (!updated) {
            const error = new Error('Failed to update location');
            error.statusCode = 500;
            throw error;
        }

        return await locationRepository.findById(id, true);
    }

    async checkCircularHierarchy(locationId, newParentId) {
        let currentId = newParentId;
        const visited = new Set();

        while (currentId !== null) {
            if (currentId === locationId) {
                return true;
            }

            if (visited.has(currentId)) {
                return true;
            }

            visited.add(currentId);

            const parent = await locationRepository.findById(currentId);
            if (!parent || !parent.parent_location_id) {
                break;
            }

            currentId = parent.parent_location_id;
        }

        return false;
    }

    async deleteLocation(id) {
        const location = await locationRepository.findById(id);
        
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        if (location.is_headquarters) {
            const error = new Error('Cannot delete headquarters location');
            error.statusCode = 400;
            throw error;
        }

        const hasChildren = await locationRepository.hasChildren(id);
        if (hasChildren) {
            const error = new Error('Cannot delete location with child locations. Please reassign or delete child locations first.');
            error.statusCode = 400;
            throw error;
        }

        const deleted = await locationRepository.softDelete(id);
        
        if (!deleted) {
            const error = new Error('Failed to delete location');
            error.statusCode = 500;
            throw error;
        }

        return { message: 'Location deleted successfully' };
    }

    async activateLocation(id) {
        const location = await locationRepository.findById(id);
        
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        const activated = await locationRepository.activate(id);
        
        if (!activated) {
            const error = new Error('Failed to activate location');
            error.statusCode = 500;
            throw error;
        }

        return await locationRepository.findById(id, true);
    }

    async deactivateLocation(id) {
        const location = await locationRepository.findById(id);
        
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        if (location.is_headquarters) {
            const error = new Error('Cannot deactivate headquarters location');
            error.statusCode = 400;
            throw error;
        }

        const hasChildren = await locationRepository.hasChildren(id);
        if (hasChildren) {
            const error = new Error('Cannot deactivate location with active child locations');
            error.statusCode = 400;
            throw error;
        }

        const deactivated = await locationRepository.deactivate(id);
        
        if (!deactivated) {
            const error = new Error('Failed to deactivate location');
            error.statusCode = 500;
            throw error;
        }

        return await locationRepository.findById(id, true);
    }

    async setAsHeadquarters(id) {
        const location = await locationRepository.findById(id);
        
        if (!location) {
            const error = new Error('Location not found');
            error.statusCode = 404;
            throw error;
        }

        if (location.status === 'inactive') {
            const error = new Error('Cannot set inactive location as headquarters');
            error.statusCode = 400;
            throw error;
        }

        const updated = await locationRepository.setAsHeadquarters(id);
        
        if (!updated) {
            const error = new Error('Failed to set location as headquarters');
            error.statusCode = 500;
            throw error;
        }

        return await locationRepository.findById(id, true);
    }

    async generateBranchCode(prefix) {
        return await locationRepository.generateBranchCode(prefix);
    }
}

module.exports = new LocationService();