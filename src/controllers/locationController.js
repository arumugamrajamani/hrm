const locationService = require('../services/locationService');
const { successResponse, paginatedResponse, noDataResponse } = require('../utils/helpers');

class LocationController {
    async getAllLocations(req, res, next) {
        try {
            const { page = 1, limit = 10, search = '', status = '', hierarchy = false } = req.query;
            
            const result = await locationService.getAllLocations({
                page: parseInt(page),
                limit: parseInt(limit),
                search,
                status,
                includeHierarchy: hierarchy === 'true' || hierarchy === true
            });

            if (!result.locations || result.locations.length === 0) {
                return noDataResponse(res, 'No locations found');
            }

            return paginatedResponse(
                res,
                result.locations,
                { page: result.page, limit: result.limit, total: result.total, totalPages: result.totalPages },
                'Locations retrieved successfully'
            );
        } catch (error) {
            next(error);
        }
    }

    async getLocationById(req, res, next) {
        try {
            const { id } = req.params;
            const location = await locationService.getLocationById(parseInt(id));
            
            if (!location) {
                return noDataResponse(res, 'Location not found');
            }
            return successResponse(res, location, 'Location retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getLocationHierarchy(req, res, next) {
        try {
            const hierarchy = await locationService.getLocationHierarchy();
            
            if (!hierarchy || hierarchy.length === 0) {
                return noDataResponse(res, 'No location hierarchy found');
            }
            return successResponse(res, hierarchy, 'Location hierarchy retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async getChildLocations(req, res, next) {
        try {
            const { id } = req.params;
            const children = await locationService.getChildLocations(parseInt(id));
            
            if (!children || children.length === 0) {
                return noDataResponse(res, 'No child locations found');
            }
            return successResponse(res, children, 'Child locations retrieved successfully');
        } catch (error) {
            next(error);
        }
    }

    async createLocation(req, res, next) {
        try {
            const locationData = {
                ...req.body,
                created_by: req.user?.id || null
            };
            
            const location = await locationService.createLocation(locationData);
            return successResponse(res, location, 'Location created successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async updateLocation(req, res, next) {
        try {
            const id = parseInt(req.params.id);
            const locationData = {
                ...req.body,
                updated_by: req.user?.id || null
            };
            
            const location = await locationService.updateLocation(id, locationData);
            return successResponse(res, location, 'Location updated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deleteLocation(req, res, next) {
        try {
            const { id } = req.params;
            const result = await locationService.deleteLocation(parseInt(id));
            
            if (!result) {
                return noDataResponse(res, 'Location not found');
            }
            return successResponse(res, result, 'Location deleted successfully');
        } catch (error) {
            next(error);
        }
    }

    async activateLocation(req, res, next) {
        try {
            const { id } = req.params;
            const location = await locationService.activateLocation(parseInt(id));
            
            if (!location) {
                return noDataResponse(res, 'Location not found');
            }
            return successResponse(res, location, 'Location activated successfully');
        } catch (error) {
            next(error);
        }
    }

    async deactivateLocation(req, res, next) {
        try {
            const { id } = req.params;
            const location = await locationService.deactivateLocation(parseInt(id));
            
            if (!location) {
                return noDataResponse(res, 'Location not found');
            }
            return successResponse(res, location, 'Location deactivated successfully');
        } catch (error) {
            next(error);
        }
    }

    async setAsHeadquarters(req, res, next) {
        try {
            const { id } = req.params;
            const location = await locationService.setAsHeadquarters(parseInt(id));
            
            if (!location) {
                return noDataResponse(res, 'Location not found');
            }
            return successResponse(res, location, 'Location set as headquarters successfully');
        } catch (error) {
            next(error);
        }
    }

    async generateBranchCode(req, res, next) {
        try {
            const { prefix = 'LOC' } = req.query;
            const code = await locationService.generateBranchCode(prefix);
            return successResponse(res, { branch_code: code }, 'Branch code generated successfully');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new LocationController();