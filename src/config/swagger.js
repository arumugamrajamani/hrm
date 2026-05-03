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
                url: 'http://localhost:3000',
                description: 'Development server',
            },
            {
                url: '{protocol}://{host}',
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
            { name: 'Employees', description: 'Employee Management' },
            { name: 'Onboarding', description: 'Employee Onboarding Workflow' },
            { name: 'Attendance', description: 'Time & Attendance, Leave Management' },
            { name: 'Payroll', description: 'Payroll System - Salary, Payslips, Tax' },
            { name: 'Master Data', description: 'Companies, Business Units, Grades' },
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
                },
                Shift: {
                    type: 'object',
                    required: ['shift_name', 'start_time', 'end_time'],
                    properties: {
                        id: { type: 'integer' },
                        shift_name: { type: 'string', example: 'Morning Shift' },
                        shift_code: { type: 'string', example: 'MOR', description: 'Unique shift code' },
                        start_time: { type: 'string', format: 'time', example: '09:00:00' },
                        end_time: { type: 'string', format: 'time', example: '18:00:00' },
                        break_duration: { type: 'integer', example: 60 },
                        weekoff_days: { type: 'string', example: 'Saturday,Sunday' },
                        is_flexible: { type: 'boolean', example: false },
                        grace_period_minutes: { type: 'integer', example: 15 },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        usage_count: { type: 'integer', nullable: true }
                    }
                },
                HolidayCalendar: {
                    type: 'object',
                    required: ['holiday_name', 'holiday_date'],
                    properties: {
                        id: { type: 'integer' },
                        holiday_name: { type: 'string', example: 'New Year' },
                        holiday_date: { type: 'string', format: 'date', example: '2026-01-01' },
                        description: { type: 'string', nullable: true },
                        is_national: { type: 'boolean', example: true },
                        location_id: { type: 'integer', nullable: true },
                        location_name: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                AttendanceRecord: {
                    type: 'object',
                    required: ['employee_id', 'attendance_date'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        attendance_date: { type: 'string', format: 'date' },
                        shift_id: { type: 'integer', nullable: true },
                        shift_name: { type: 'string', nullable: true },
                        check_in: { type: 'string', format: 'date-time', nullable: true },
                        check_out: { type: 'string', format: 'date-time', nullable: true },
                        status: { type: 'string', enum: ['present', 'absent', 'half_day', 'late', 'on_leave'] },
                        is_late: { type: 'boolean' },
                        late_minutes: { type: 'integer' },
                        is_early_departure: { type: 'boolean' },
                        early_departure_minutes: { type: 'integer' },
                        regularization_reason: { type: 'string', nullable: true },
                        regularized_by: { type: 'integer', nullable: true },
                        regularized_by_username: { type: 'string', nullable: true },
                        regularized_at: { type: 'string', format: 'date-time', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                LeaveType: {
                    type: 'object',
                    required: ['leave_code', 'leave_name'],
                    properties: {
                        id: { type: 'integer' },
                        leave_code: { type: 'string', example: 'SL' },
                        leave_name: { type: 'string', example: 'Sick Leave' },
                        description: { type: 'string', nullable: true },
                        max_days_per_year: { type: 'integer', example: 12 },
                        carry_forward: { type: 'boolean', example: false },
                        encashable: { type: 'boolean', example: false },
                        requires_approval: { type: 'boolean', example: true },
                        min_days_notice: { type: 'integer', example: 1 },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                LeaveBalance: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        leave_type_id: { type: 'integer' },
                        leave_name: { type: 'string' },
                        leave_code: { type: 'string' },
                        year: { type: 'integer', example: 2026 },
                        opening_balance: { type: 'number', example: 12 },
                        accrued: { type: 'number', example: 0 },
                        used: { type: 'number', example: 3 },
                        closing_balance: { type: 'number', example: 9 },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                LeaveRequest: {
                    type: 'object',
                    required: ['employee_id', 'leave_type_id', 'start_date', 'end_date', 'total_days'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        leave_type_id: { type: 'integer' },
                        leave_name: { type: 'string' },
                        leave_code: { type: 'string' },
                        start_date: { type: 'string', format: 'date' },
                        end_date: { type: 'string', format: 'date' },
                        total_days: { type: 'number' },
                        reason: { type: 'string' },
                        status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
                        applied_by: { type: 'integer' },
                        applied_at: { type: 'string', format: 'date-time' },
                        approved_by: { type: 'integer', nullable: true },
                        approved_by_username: { type: 'string', nullable: true },
                        approved_at: { type: 'string', format: 'date-time', nullable: true },
                        rejection_reason: { type: 'string', nullable: true },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Timesheet: {
                    type: 'object',
                    required: ['employee_id', 'timesheet_date', 'hours_worked'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        timesheet_date: { type: 'string', format: 'date' },
                        project_code: { type: 'string', nullable: true },
                        task_description: { type: 'string' },
                        hours_worked: { type: 'number', example: 8 },
                        is_billable: { type: 'boolean', example: true },
                        status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'], example: 'draft' },
                        approved_by: { type: 'integer', nullable: true },
                        approved_by_username: { type: 'string', nullable: true },
                        approved_at: { type: 'string', format: 'date-time', nullable: true },
                        rejection_reason: { type: 'string', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                SalaryComponent: {
                    type: 'object',
                    required: ['component_code', 'component_name', 'component_type', 'calculation_type'],
                    properties: {
                        id: { type: 'integer' },
                        component_code: { type: 'string', example: 'BASIC' },
                        component_name: { type: 'string', example: 'Basic Salary' },
                        component_type: { type: 'string', enum: ['earning', 'deduction', 'statutory'], example: 'earning' },
                        calculation_type: { type: 'string', enum: ['fixed', 'percentage', 'formula'], example: 'fixed' },
                        is_taxable: { type: 'boolean', example: false },
                        is_statutory: { type: 'boolean', example: false },
                        display_order: { type: 'integer', example: 1 },
                        is_active: { type: 'boolean', example: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                SalaryStructure: {
                    type: 'object',
                    required: ['structure_name', 'effective_from'],
                    properties: {
                        id: { type: 'integer' },
                        structure_name: { type: 'string', example: 'Software Engineer L1' },
                        grade_id: { type: 'integer', nullable: true },
                        grade_name: { type: 'string', nullable: true },
                        designation_id: { type: 'integer', nullable: true },
                        designation_name: { type: 'string', nullable: true },
                        company_id: { type: 'integer', nullable: true },
                        company_name: { type: 'string', nullable: true },
                        business_unit_id: { type: 'integer', nullable: true },
                        business_unit_name: { type: 'string', nullable: true },
                        effective_from: { type: 'string', format: 'date' },
                        effective_to: { type: 'string', format: 'date', nullable: true },
                        is_active: { type: 'boolean', example: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                EmployeeSalary: {
                    type: 'object',
                    required: ['employee_id', 'basic_salary', 'net_salary', 'effective_from'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        structure_id: { type: 'integer', nullable: true },
                        basic_salary: { type: 'number', example: 30000 },
                        total_earnings: { type: 'number', example: 50000 },
                        total_deductions: { type: 'number', example: 5000 },
                        net_salary: { type: 'number', example: 45000 },
                        effective_from: { type: 'string', format: 'date' },
                        effective_to: { type: 'string', format: 'date', nullable: true },
                        is_current: { type: 'boolean', example: true },
                        revision_reason: { type: 'string', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                PayrollRun: {
                    type: 'object',
                    required: ['payroll_month', 'run_name'],
                    properties: {
                        id: { type: 'integer' },
                        payroll_month: { type: 'string', example: '2026-04' },
                        run_name: { type: 'string', example: 'April 2026 Payroll' },
                        run_type: { type: 'string', enum: ['monthly', 'bonus', 'arrear', 'adjustment'], example: 'monthly' },
                        company_id: { type: 'integer', nullable: true },
                        company_name: { type: 'string', nullable: true },
                        business_unit_id: { type: 'integer', nullable: true },
                        business_unit_name: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['draft', 'processing', 'completed', 'failed', 'cancelled'], example: 'draft' },
                        total_employees: { type: 'integer', nullable: true },
                        total_gross: { type: 'number', nullable: true },
                        total_deductions: { type: 'number', nullable: true },
                        total_net: { type: 'number', nullable: true },
                        remarks: { type: 'string', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Payslip: {
                    type: 'object',
                    required: ['payroll_run_id', 'employee_id', 'employee_code', 'employee_name', 'payroll_month', 'gross_earnings', 'net_pay'],
                    properties: {
                        id: { type: 'integer' },
                        payroll_run_id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        designation: { type: 'string', nullable: true },
                        department: { type: 'string', nullable: true },
                        pan_number: { type: 'string', nullable: true },
                        bank_account: { type: 'string', nullable: true },
                        bank_name: { type: 'string', nullable: true },
                        payroll_month: { type: 'string', example: '2026-04' },
                        working_days: { type: 'number', example: 22 },
                        present_days: { type: 'number', example: 22 },
                        lop_days: { type: 'number', example: 0 },
                        gross_earnings: { type: 'number', example: 50000 },
                        total_deductions: { type: 'number', example: 5000 },
                        net_pay: { type: 'number', example: 45000 },
                        arrears: { type: 'number', example: 0 },
                        adjustments: { type: 'number', example: 0 },
                        status: { type: 'string', enum: ['draft', 'generated', 'approved', 'paid'], example: 'draft' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                        updated_by: { type: 'integer', nullable: true }
                    }
                },
                TaxConfiguration: {
                    type: 'object',
                    required: ['tax_year', 'slab_min', 'slab_max', 'tax_rate'],
                    properties: {
                        id: { type: 'integer' },
                        tax_year: { type: 'string', example: '2026-2027' },
                        slab_min: { type: 'number', example: 250000 },
                        slab_max: { type: 'number', example: 500000 },
                        tax_rate: { type: 'number', example: 5 },
                        cess_rate: { type: 'number', example: 4 },
                        is_active: { type: 'boolean', example: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                BonusRecord: {
                    type: 'object',
                    required: ['employee_id', 'bonus_type', 'bonus_month', 'bonus_amount', 'net_amount'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        bonus_type: { type: 'string', example: 'Performance Bonus' },
                        bonus_month: { type: 'string', example: '2026-03' },
                        bonus_amount: { type: 'number', example: 10000 },
                        taxable_amount: { type: 'number', nullable: true },
                        tax_deducted: { type: 'number', example: 0 },
                        net_amount: { type: 'number', example: 10000 },
                        reason: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['pending', 'approved', 'paid', 'cancelled'], example: 'pending' },
                        approved_by: { type: 'integer', nullable: true },
                        paid_on: { type: 'string', format: 'date-time', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Company: {
                    type: 'object',
                    required: ['company_name', 'company_code'],
                    properties: {
                        id: { type: 'integer' },
                        company_name: { type: 'string', example: 'Acme Corp' },
                        company_code: { type: 'string', example: 'ACME' },
                        registration_number: { type: 'string', nullable: true },
                        tax_id: { type: 'string', nullable: true },
                        address: { type: 'string', nullable: true },
                        city: { type: 'string', nullable: true },
                        state: { type: 'string', nullable: true },
                        country: { type: 'string', example: 'India' },
                        pincode: { type: 'string', nullable: true },
                        phone: { type: 'string', nullable: true },
                        email: { type: 'string', format: 'email', nullable: true },
                        website: { type: 'string', format: 'uri', nullable: true },
                        is_headquarters: { type: 'boolean', example: true },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        unit_count: { type: 'integer', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                BusinessUnit: {
                    type: 'object',
                    required: ['unit_name', 'unit_code', 'company_id'],
                    properties: {
                        id: { type: 'integer' },
                        unit_name: { type: 'string', example: 'Engineering' },
                        unit_code: { type: 'string', example: 'ENG' },
                        company_id: { type: 'integer' },
                        company_name: { type: 'string' },
                        parent_unit_id: { type: 'integer', nullable: true },
                        description: { type: 'string', nullable: true },
                        head_of_unit: { type: 'integer', nullable: true },
                        head_name: { type: 'string', nullable: true },
                        cost_center: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        dept_count: { type: 'integer', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Grade: {
                    type: 'object',
                    required: ['grade_code', 'grade_name', 'level'],
                    properties: {
                        id: { type: 'integer' },
                        grade_code: { type: 'string', example: 'L1' },
                        grade_name: { type: 'string', example: 'Level 1' },
                        level: { type: 'integer', example: 1 },
                        min_salary: { type: 'number', nullable: true },
                        max_salary: { type: 'number', nullable: true },
                        band: { type: 'string', nullable: true },
                        description: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Onboarding: {
                    type: 'object',
                    required: ['employee_id', 'template_id', 'joining_date'],
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        employee_code: { type: 'string' },
                        employee_name: { type: 'string' },
                        template_id: { type: 'integer' },
                        template_name: { type: 'string' },
                        joining_date: { type: 'string', format: 'date' },
                        actual_joining_date: { type: 'string', format: 'date', nullable: true },
                        probation_end_date: { type: 'string', format: 'date', nullable: true },
                        confirmation_date: { type: 'string', format: 'date', nullable: true },
                        onboarding_completion_date: { type: 'string', format: 'date', nullable: true },
                        status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'delayed'], example: 'pending' },
                        remarks: { type: 'string', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        created_by_username: { type: 'string', nullable: true },
                        updated_by: { type: 'integer', nullable: true },
                        updated_by_username: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                ChecklistTemplate: {
                    type: 'object',
                    required: ['template_name'],
                    properties: {
                        id: { type: 'integer' },
                        template_name: { type: 'string', example: 'New Employee Onboarding' },
                        description: { type: 'string', nullable: true },
                        applicable_for: { type: 'string', nullable: true },
                        applicable_id: { type: 'integer', nullable: true },
                        is_active: { type: 'boolean', example: true },
                        item_count: { type: 'integer', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        created_by_username: { type: 'string', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                ChecklistItem: {
                    type: 'object',
                    required: ['template_id', 'item_name'],
                    properties: {
                        id: { type: 'integer' },
                        template_id: { type: 'integer' },
                        item_name: { type: 'string', example: 'Submit ID Proof' },
                        description: { type: 'string', nullable: true },
                        category: { type: 'string', enum: ['document', 'it_asset', 'id_card', 'induction', 'training', 'other'], example: 'document' },
                        is_mandatory: { type: 'boolean', example: true },
                        sort_order: { type: 'integer', example: 1 },
                        estimated_days: { type: 'integer', example: 1 },
                        created_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                ProbationTracking: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        employee_id: { type: 'integer' },
                        probation_start_date: { type: 'string', format: 'date' },
                        probation_end_date: { type: 'string', format: 'date' },
                        status: { type: 'string', enum: ['in_progress', 'confirmed', 'extended', 'terminated'], example: 'in_progress' },
                        performance_rating: { type: 'string', enum: ['excellent', 'good', 'average', 'poor'], nullable: true },
                        manager_feedback: { type: 'string', nullable: true },
                        hr_feedback: { type: 'string', nullable: true },
                        self_assessment: { type: 'string', nullable: true },
                        confirmation_date: { type: 'string', format: 'date', nullable: true },
                        confirmed_by: { type: 'integer', nullable: true },
                        created_by: { type: 'integer', nullable: true },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
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
        apis: ['src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
