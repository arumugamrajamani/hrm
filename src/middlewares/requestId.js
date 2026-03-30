const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const requestId = (req, res, next) => {
    const requestId = req.headers['x-request-id'] || uuidv4();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    
    logger.info('Incoming request', {
        requestId,
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers['user-agent']
    });

    next();
};

module.exports = requestId;
