const config = require('../config');
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HRM API - Enterprise Edition',
            version: config.APP_VERSION || '2.0.0',
            description: `# Human Resource Management System API Documentation

## Enterprise Features
- **Multi-tenancy**: Support for multiple organizations
- **Two-Factor Authentication**: TOTP and Backup codes
- **Role-Based Access Control**: Granular permissions
- **Audit Logging**: Complete activity tracking
- **Webhooks**: Event-driven integrations
- **Rate Limiting**: Per-user and endpoint limits
- **Circuit Breaker**: Resilience pattern for external services

## Response Format
All responses follow this structure:
\`\`\`json
{
  "success": true,
  "message": "Success message",
  "data": {},
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
\`\`\`

## Error Response Format
\`\`\`json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
\`\`\`

## Authentication
This API uses JWT Bearer token authentication.
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Use /auth/refresh to get new access token`,
            contact: {
                name: 'API Support',
                email: 'support@hrmsystem.com',
                url: 'https://hrmsystem.com/support'
            },
            termsOfService: 'https://hrmsystem.com/terms',
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api/v1',
                description: 'Development server',
            },
            {
                url: '{protocol}://{host}/api/v1',
                description: 'Production server',
                variables: {
                    protocol: {
                        enum: ['http', 'https'],
                        default: 'https'
                    },
                    host: {
                        default: 'api.hrmsystem.com'
                    }
                }
            },
        ],
        tags: [
            { name: 'Auth', description: 'Authentication & Authorization' },
            { name: 'Users', description: 'User Management' },
            { name: 'Departments', description: 'Department Management' },
            { name: 'Locations', description: 'Location Management' },
            { name: 'Designations', description: 'Designation Management' },
            { name: 'Education', description: 'Education Master' },
            { name: 'Courses', description: 'Course Master' },
            { name: 'Mappings', description: 'Education-Course Mappings' },
            { name: 'Health', description: 'Health & Monitoring' },
            { name: 'Metrics', description: 'Prometheus Metrics' },
            { name: 'Webhooks', description: 'Webhook Management' },
            { name: 'Bulk', description: 'Bulk Import/Export' },
            { name: 'FeatureFlags', description: 'Feature Flags' },
            { name: 'Admin', description: 'Administrative Operations' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token'
                },
                apiKeyHeader: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'API Key for service-to-service authentication'
                }
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        code: { type: 'string', example: 'ERROR_CODE' },
                        errors: { 
                            type: 'array', 
                            items: { 
                                type: 'object',
                                properties: {
                                    field: { type: 'string' },
                                    message: { type: 'string' }
                                }
                            } 
                        },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Success message' },
                        data: { type: 'object' },
                        meta: { type: 'object', nullable: true },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        username: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        mobile: { type: 'string' },
                        role_id: { type: 'integer' },
                        role_name: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive', 'blocked', 'deleted'] },
                        two_factor_enabled: { type: 'boolean' },
                        profile_photo: { type: 'string', nullable: true },
                        password_changed_at: { type: 'string', format: 'date-time', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        expiresIn: { type: 'integer', example: 900 },
                        user: { $ref: '#/components/schemas/User' }
                    },
                },
                TwoFactorSetup: {
                    type: 'object',
                    properties: {
                        secret: { type: 'string', description: 'Base32 encoded secret for TOTP' },
                        qrDataUrl: { type: 'string', description: 'URL for QR code generation' },
                        backupCodes: { 
                            type: 'array',
                            items: { type: 'string' },
                            description: 'One-time backup codes (save securely!)'
                        }
                    }
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Users retrieved successfully' },
                        data: { type: 'array', items: {} },
                        meta: {
                            type: 'object',
                            properties: {
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'integer', example: 100 },
                                        page: { type: 'integer', example: 1 },
                                        limit: { type: 'integer', example: 10 },
                                        totalPages: { type: 'integer', example: 10 },
                                        hasNextPage: { type: 'boolean', example: true },
                                        hasPrevPage: { type: 'boolean', example: false }
                                    }
                                }
                            }
                        },
                    },
                },
                Department: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        department_name: { type: 'string', example: 'Engineering' },
                        department_code: { type: 'string', example: 'ENG' },
                        parent_department_id: { type: 'integer', nullable: true },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        created_by_username: { type: 'string', nullable: true },
                        updated_by_username: { type: 'string', nullable: true },
                        parent_department_name: { type: 'string', nullable: true },
                    },
                },
                Location: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        location_name: { type: 'string' },
                        location_code: { type: 'string' },
                        parent_location_id: { type: 'integer', nullable: true },
                        address: { type: 'string', nullable: true },
                        city: { type: 'string' },
                        state: { type: 'string' },
                        country: { type: 'string' },
                        pincode: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        email: { type: 'string', nullable: true },
                        is_headquarters: { type: 'boolean' },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                Designation: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        designation_name: { type: 'string' },
                        designation_code: { type: 'string' },
                        department_id: { type: 'integer', nullable: true },
                        grade_level: { type: 'integer', nullable: true },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        department_name: { type: 'string', nullable: true },
                    },
                },
                HealthCheck: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
                        timestamp: { type: 'string', format: 'date-time' },
                        version: { type: 'string' },
                        environment: { type: 'string' },
                        uptime: { type: 'number' },
                        checks: {
                            type: 'object',
                            properties: {
                                database: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string' },
                                        isHealthy: { type: 'boolean' },
                                        activeConnections: { type: 'integer' },
                                        idleConnections: { type: 'integer' }
                                    }
                                },
                                redis: {
                                    type: 'object',
                                    properties: {
                                        status: { type: 'string' },
                                        connected: { type: 'boolean' }
                                    }
                                },
                                circuitBreakers: { type: 'object' },
                                queues: { type: 'object' }
                            }
                        }
                    }
                },
                CircuitBreakerStatus: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        state: { type: 'string', enum: ['CLOSED', 'OPEN', 'HALF_OPEN'] },
                        failures: { type: 'integer' },
                        successes: { type: 'integer' },
                        lastFailureTime: { type: 'string', format: 'date-time', nullable: true },
                        nextAttemptTime: { type: 'string', format: 'date-time', nullable: true },
                        stats: {
                            type: 'object',
                            properties: {
                                totalCalls: { type: 'integer' },
                                successfulCalls: { type: 'integer' },
                                failedCalls: { type: 'integer' },
                                rejectedCalls: { type: 'integer' },
                                averageResponseTime: { type: 'number' }
                            }
                        }
                    }
                },
                Webhook: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        url: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        events: { type: 'array', items: { type: 'string' } },
                        is_active: { type: 'boolean' },
                        retry_count: { type: 'integer' },
                        created_at: { type: 'string', format: 'date-time' },
                    }
                },
                WebhookDelivery: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        webhook_id: { type: 'integer' },
                        event_id: { type: 'string' },
                        status_code: { type: 'integer', nullable: true },
                        success: { type: 'boolean' },
                        response_body: { type: 'string', nullable: true },
                        error_message: { type: 'string', nullable: true },
                        attempt_number: { type: 'integer' },
                        delivered_at: { type: 'string', format: 'date-time', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                    }
                },
                FeatureFlag: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        description: { type: 'string', nullable: true },
                        is_enabled: { type: 'boolean' },
                        rollout_percentage: { type: 'integer' },
                        conditions: { type: 'object', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    }
                },
                BulkJob: {
                    type: 'object',
                    properties: {
                        jobId: { type: 'string' },
                        status: { type: 'string', enum: ['queued', 'processing', 'completed', 'failed'] },
                        message: { type: 'string' },
                        progress: { type: 'number', nullable: true },
                        total: { type: 'integer', nullable: true },
                        successful: { type: 'integer', nullable: true },
                        failed: { type: 'integer', nullable: true },
                        errors: { type: 'array', nullable: true }
                    }
                },
                AuditLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        user_id: { type: 'integer', nullable: true },
                        action: { type: 'string' },
                        entity_type: { type: 'string' },
                        entity_id: { type: 'integer', nullable: true },
                        old_value: { type: 'object', nullable: true },
                        new_value: { type: 'object', nullable: true },
                        ip_address: { type: 'string', nullable: true },
                        user_agent: { type: 'string', nullable: true },
                        request_id: { type: 'string', nullable: true },
                        description: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                    }
                },
                MetricsResponse: {
                    type: 'object',
                    properties: {
                        timestamp: { type: 'string', format: 'date-time' },
                        uptime: { type: 'number' },
                        memory: {
                            type: 'object',
                            properties: {
                                rss: { type: 'number' },
                                heapUsed: { type: 'number' },
                                heapTotal: { type: 'number' },
                                external: { type: 'number' }
                            }
                        },
                        activeUsers: { type: 'integer' },
                        http: {
                            type: 'object',
                            properties: {
                                totalRequests: { type: 'integer' },
                                averageDuration: { type: 'number' }
                            }
                        },
                        database: {
                            type: 'object',
                            properties: {
                                activeConnections: { type: 'integer' },
                                idleConnections: { type: 'integer' },
                                queriesExecuted: { type: 'integer' },
                                queriesFailed: { type: 'integer' },
                                averageQueryDuration: { type: 'number' }
                            }
                        },
                        cache: {
                            type: 'object',
                            properties: {
                                hits: { type: 'integer' },
                                misses: { type: 'integer' },
                                hitRate: { type: 'number' }
                            }
                        },
                        redis: {
                            type: 'object',
                            properties: {
                                connected: { type: 'boolean' }
                            }
                        }
                    }
                },
                Tenant: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        database_schema: { type: 'string', nullable: true },
                        domain: { type: 'string', nullable: true },
                        settings: { type: 'object', nullable: true },
                        is_active: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    }
                },
                IPBlock: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        ip_address: { type: 'string' },
                        reason: { type: 'string', nullable: true },
                        blocked_by: { type: 'integer', nullable: true },
                        expires_at: { type: 'string', format: 'date-time', nullable: true },
                        is_permanent: { type: 'boolean' },
                        created_at: { type: 'string', format: 'date-time' },
                        blocked_by_username: { type: 'string', nullable: true }
                    }
                }
            },
            responses: {
                Unauthorized: {
                    description: 'Authentication required or invalid token',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: {
                                success: false,
                                message: 'Invalid or expired access token',
                                code: 'ACCESS_TOKEN_ERROR'
                            }
                        }
                    }
                },
                Forbidden: {
                    description: 'Access denied - insufficient permissions',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: {
                                success: false,
                                message: 'You do not have permission to perform this action',
                                code: 'FORBIDDEN'
                            }
                        }
                    }
                },
                NotFound: {
                    description: 'Resource not found',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: {
                                success: false,
                                message: 'The requested resource was not found',
                                code: 'NOT_FOUND'
                            }
                        }
                    }
                },
                ValidationError: {
                    description: 'Validation failed',
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: {
                                success: false,
                                message: 'Validation failed',
                                code: 'VALIDATION_ERROR',
                                errors: [
                                    { field: 'email', message: 'Invalid email format' }
                                ]
                            }
                        }
                    }
                },
                RateLimited: {
                    description: 'Too many requests',
                    headers: {
                        'Retry-After': {
                            description: 'Seconds to wait before retrying',
                            schema: { type: 'integer' }
                        },
                        'X-RateLimit-Limit': {
                            description: 'Maximum requests allowed',
                            schema: { type: 'integer' }
                        },
                        'X-RateLimit-Remaining': {
                            description: 'Remaining requests in window',
                            schema: { type: 'integer' }
                        }
                    },
                    content: {
                        'application/json': {
                            schema: { $ref: '#/components/schemas/Error' },
                            example: {
                                success: false,
                                message: 'Too many requests. Please try again later',
                                code: 'RATE_LIMITED',
                                retryAfter: 60
                            }
                        }
                    }
                }
            }
        },
        security: []
    },
    apis: ['./src/routes/v1/*.js', './src/routes/*.js', './src/routes/authRoutes.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
