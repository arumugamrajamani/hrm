const config = require('../config');
const { errorResponse } = require('../utils/helpers');

const validateApiKey = async (req, res, next) => {
    try {
        const apiKey = req.headers['x-api-key'];
        
        if (!apiKey) {
            return errorResponse(res, 'API key is required', 401);
        }
        
        const validApiKey = config.API_KEY;
        
        if (!validApiKey) {
            console.error('API_KEY not configured in environment variables');
            return errorResponse(res, 'API key authentication not configured', 500);
        }
        
        if (apiKey !== validApiKey) {
            return errorResponse(res, 'Invalid API key', 401);
        }
        
        next();
    } catch (error) {
        next(error);
    }
};

module.exports = { validateApiKey };
