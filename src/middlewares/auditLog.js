const { AuditService, AUDIT_ACTIONS, ENTITY_TYPES } = require('../services/auditService');

const auditLog = (action, entityType) => {
    return async (req, res, next) => {
        const originalJson = res.json;
        
        res.json = function(body) {
            const response = body;
            
            if (res.statusCode >= 200 && res.statusCode < 300) {
                setImmediate(async () => {
                    try {
                        const userId = req.user?.id || null;
                        const entityId = req.params.id ? parseInt(req.params.id) : null;
                        
                        let description = `${action} ${entityType}`;
                        if (req.params.id) {
                            description += ` - ID: ${req.params.id}`;
                        }
                        
                        let oldValue = null;
                        let newValue = null;
                        
                        if (req.method === 'PUT' || req.method === 'POST') {
                            newValue = req.body;
                        }
                        
                        if (req.method === 'DELETE') {
                            description = `Deleted ${entityType} - ID: ${req.params.id}`;
                        }
                        
                        await AuditService.log({
                            userId,
                            action: `${entityType.toLowerCase()}.${action.toLowerCase()}`,
                            entityType: entityType.toLowerCase(),
                            entityId,
                            oldValue,
                            newValue,
                            req,
                            description
                        });
                    } catch (error) {
                        console.error('Audit log middleware error:', error);
                    }
                });
            }
            
            return originalJson.call(this, body);
        };
        
        next();
    };
};

module.exports = { auditLog };
