const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'HRM API',
            version: '1.0.0',
            description: 'Human Resource Management System API',
        },
        servers: [
            {
                url: 'http://localhost:3000',
                description: 'Development server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT access token'
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: false },
                        message: { type: 'string', example: 'Error message' },
                        errors: { type: 'array', items: { type: 'string' } },
                    },
                },
                Success: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Success message' },
                        data: { type: 'object' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        first_name: { type: 'string' },
                        last_name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        status: { type: 'string', enum: ['active', 'inactive'] },
                        role_id: { type: 'integer' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' },
                    },
                },
                AuthTokens: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                    },
                },
                PaginatedResponse: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean', example: true },
                        message: { type: 'string', example: 'Users retrieved successfully' },
                        data: {
                            type: 'object',
                            properties: {
                                users: {
                                    type: 'array',
                                    items: { $ref: '#/components/schemas/User' }
                                },
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        total: { type: 'integer', example: 100 },
                                        page: { type: 'integer', example: 1 },
                                        limit: { type: 'integer', example: 10 },
                                        totalPages: { type: 'integer', example: 10 }
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
                        parent_department_id: { type: 'integer', nullable: true, example: null },
                        description: { type: 'string', nullable: true, example: 'Software Engineering and Development' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true, example: 1 },
                        updated_by: { type: 'integer', nullable: true, example: 1 },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        created_by_username: { type: 'string', nullable: true, example: 'superadmin' },
                        updated_by_username: { type: 'string', nullable: true, example: 'admin' },
                        parent_id: { type: 'integer', nullable: true, example: null },
                        parent_department_name: { type: 'string', nullable: true, example: null },
                        parent_department_code: { type: 'string', nullable: true, example: null },
                    },
                },
                DepartmentHierarchy: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        department_name: { type: 'string', example: 'Engineering' },
                        department_code: { type: 'string', example: 'ENG' },
                        parent_department_id: { type: 'integer', nullable: true, example: null },
                        description: { type: 'string', nullable: true, example: 'Software Engineering and Development' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        level: { type: 'integer', example: 1 },
                        path: { type: 'string', example: '1' },
                        children: { 
                            type: 'array',
                            items: { $ref: '#/components/schemas/DepartmentHierarchy' }
                        },
                    },
                },
                Education: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        education_name: { type: 'string', example: 'Bachelor of Engineering' },
                        education_code: { type: 'string', example: 'BE' },
                        level: { type: 'string', enum: ['School', 'UG', 'PG', 'Doctorate', 'Certification'], example: 'UG' },
                        description: { type: 'string', nullable: true, example: 'Undergraduate engineering degree program' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true, example: 1 },
                        updated_by: { type: 'integer', nullable: true, example: 1 },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        created_by_username: { type: 'string', nullable: true, example: 'superadmin' },
                        updated_by_username: { type: 'string', nullable: true, example: 'admin' },
                    },
                },
                Course: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        course_name: { type: 'string', example: 'Computer Science' },
                        course_code: { type: 'string', example: 'CSE' },
                        description: { type: 'string', nullable: true, example: 'Computer Science and Engineering' },
                        status: { type: 'string', enum: ['active', 'inactive'], example: 'active' },
                        created_by: { type: 'integer', nullable: true, example: 1 },
                        updated_by: { type: 'integer', nullable: true, example: 1 },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        updated_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        created_by_username: { type: 'string', nullable: true, example: 'superadmin' },
                        updated_by_username: { type: 'string', nullable: true, example: 'admin' },
                    },
                },
                EducationCourseMap: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        education_id: { type: 'integer', example: 1 },
                        course_id: { type: 'integer', example: 1 },
                        education_name: { type: 'string', example: 'Bachelor of Engineering' },
                        education_code: { type: 'string', example: 'BE' },
                        course_name: { type: 'string', example: 'Computer Science' },
                        course_code: { type: 'string', example: 'CSE' },
                        created_by: { type: 'integer', nullable: true, example: 1 },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                        created_by_username: { type: 'string', nullable: true, example: 'superadmin' },
                    },
                },
                EducationWithCourses: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        education_name: { type: 'string', example: 'Bachelor of Engineering' },
                        education_code: { type: 'string', example: 'BE' },
                        level: { type: 'string', example: 'UG' },
                    },
                },
                CourseInEducation: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        course_id: { type: 'integer', example: 1 },
                        course_name: { type: 'string', example: 'Computer Science' },
                        course_code: { type: 'string', example: 'CSE' },
                        course_description: { type: 'string', nullable: true, example: 'Computer Science and Engineering' },
                        course_status: { type: 'string', example: 'active' },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                    },
                },
                EducationInCourse: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        education_id: { type: 'integer', example: 1 },
                        education_name: { type: 'string', example: 'Bachelor of Engineering' },
                        education_code: { type: 'string', example: 'BE' },
                        level: { type: 'string', example: 'UG' },
                        education_description: { type: 'string', nullable: true, example: 'Undergraduate engineering program' },
                        education_status: { type: 'string', example: 'active' },
                        created_at: { type: 'string', format: 'date-time', example: '2026-03-29T10:00:00.000Z' },
                    },
                },
            },
        },
        security: []
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
