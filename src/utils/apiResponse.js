class ApiResponse {
    static success(res, data, message = 'Success', statusCode = 200, meta = null) {
        const response = {
            success: true,
            message,
            data
        };

        if (meta !== null) {
            response.meta = meta;
        }

        return res.status(statusCode).json(response);
    }

    static created(res, data, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }

    static updated(res, data, message = 'Updated successfully') {
        return this.success(res, data, message, 200);
    }

    static deleted(res, message = 'Deleted successfully') {
        return this.success(res, null, message, 200);
    }

    static paginated(res, data, pagination, message = 'Success') {
        return this.success(res, data, message, 200, {
            pagination: {
                page: pagination.page,
                limit: pagination.limit,
                total: pagination.total,
                totalPages: pagination.totalPages
            }
        });
    }

    static error(res, message = 'Error', statusCode = 500, error = null) {
        const response = {
            success: false,
            message
        };

        if (error && process.env.NODE_ENV !== 'production') {
            response.error = {
                name: error.name,
                message: error.message,
                stack: error.stack
            };
        }

        return res.status(statusCode).json(response);
    }

    static validationError(res, errors) {
        return this.error(res, 'Validation failed', 422, errors);
    }

    static unauthorized(res, message = 'Unauthorized') {
        return this.error(res, message, 401);
    }

    static forbidden(res, message = 'Forbidden') {
        return this.error(res, message, 403);
    }

    static notFound(res, message = 'Not found') {
        return this.error(res, message, 404);
    }

    static conflict(res, message = 'Conflict') {
        return this.error(res, message, 409);
    }

    static tooManyRequests(res, message = 'Too many requests') {
        return this.error(res, message, 429);
    }

    static internalError(res, message = 'Internal server error') {
        return this.error(res, message, 500);
    }
}

module.exports = ApiResponse;
