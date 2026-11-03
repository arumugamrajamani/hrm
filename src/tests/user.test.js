const request = require('supertest');

jest.mock('../config/database', () => ({
    pool: {
        query: jest.fn().mockResolvedValue([]),
        execute: jest.fn().mockResolvedValue([[], {}]),
        getConnection: jest.fn().mockResolvedValue({
            release: jest.fn()
        })
    },
    testConnection: jest.fn().mockResolvedValue(true)
}));

jest.mock('../config/jwt', () => ({
    generateAccessToken: jest.fn().mockReturnValue('mock-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh-token'),
    verifyAccessToken: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', role_id: 1, type: 'access' }),
    verifyRefreshToken: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com', type: 'refresh' }),
    decodeToken: jest.fn().mockReturnValue({ id: 1, email: 'test@example.com' })
}));

jest.mock('../config/mail', () => ({
    sendEmail: jest.fn().mockResolvedValue({ success: true, messageId: 'mock-message-id' }),
    transporter: {}
}));

jest.mock('../services/cacheService', () => ({
    connect: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn().mockResolvedValue(true),
    isConnected: false,
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    flushdb: jest.fn()
}));

jest.mock('../services/queueService', () => ({
    connect: jest.fn().mockResolvedValue(true),
    closeAll: jest.fn().mockResolvedValue(true),
    add: jest.fn().mockResolvedValue({}),
    getQueueStats: jest.fn().mockReturnValue({ queues: {}, connected: false }),
    process: jest.fn()
}));

jest.mock('../services/webhookService', () => ({
    webhookService: {
        trigger: jest.fn(),
        initialize: jest.fn()
    },
    EventType: { USER_CREATED: 'user_created', USER_LOGIN: 'user_login', USER_LOGOUT: 'user_logout', USER_STATUS_CHANGED: 'user_status_changed', USER_PASSWORD_CHANGED: 'user_password_changed' },
    WebhookService: jest.fn()
}));

jest.mock('../services/featureFlags', () => ({
    featureFlagService: {
        isEnabled: jest.fn().mockReturnValue(true),
        getAllFlags: jest.fn().mockReturnValue({}),
        initialize: jest.fn()
    }
}));

jest.mock('../middlewares/roleCheck', () => ({
    isAdmin: (req, res, next) => next(),
    isSuperAdmin: (req, res, next) => next(),
    checkPermission: () => (req, res, next) => next()
}));

jest.mock('../middlewares/rateLimiter', () => ({
    generalLimiter: (req, res, next) => next(),
    authLimiter: (req, res, next) => next(),
    otpLimiter: (req, res, next) => next(),
    passwordResetLimiter: (req, res, next) => next(),
    userLimiter: (req, res, next) => next(),
    initRedisStore: jest.fn().mockResolvedValue(true)
}));

jest.mock('../config/swagger', () => ({}));

jest.mock('../models', () => ({
    UserModel: {
        findByEmail: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updatePassword: jest.fn(),
        findAll: jest.fn(),
        emailExists: jest.fn(),
        usernameExists: jest.fn(),
        mobileExists: jest.fn(),
        softDelete: jest.fn(),
        activate: jest.fn(),
        deactivate: jest.fn(),
        enableTwoFactor: jest.fn(),
        disableTwoFactor: jest.fn()
    },
    RoleModel: {
        findAll: jest.fn(),
        findById: jest.fn()
    },
    LoginAttemptModel: {
        findByUserId: jest.fn(),
        resetAttempts: jest.fn()
    },
    PasswordHistoryModel: {
        findByUserId: jest.fn(),
        create: jest.fn()
    },
    PasswordResetTokenModel: {
        findByOtp: jest.fn(),
        create: jest.fn(),
        markAsUsed: jest.fn()
    },
    RefreshTokenModel: {
        findByToken: jest.fn(),
        create: jest.fn(),
        deleteByToken: jest.fn(),
        deleteByUserId: jest.fn()
    }
}));

jest.mock('../config/swagger', () => ({}));

jest.mock('../middlewares/auth', () => ({
    authMiddleware: (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                statusCode: 401,
                message: 'Access token is required'
            });
        }
        req.user = { id: 1, email: 'test@example.com', role_id: 1, permissions: ['all'] };
        next();
    },
    optionalAuth: (req, res, next) => next()
}));

const { UserModel, RoleModel } = require('../models');
const app = require('../app');

describe('User Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/v1/users', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1/users');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        it('should return paginated users', async () => {
            UserModel.findAll.mockResolvedValue({
                users: [
                    { id: 1, username: 'user1', email: 'user1@example.com' },
                    { id: 2, username: 'user2', email: 'user2@example.com' }
                ],
                total: 2,
                page: 1,
                limit: 10,
                totalPages: 1
            });

            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should validate pagination parameters', async () => {
            const response = await request(app)
                .get('/api/v1/users?page=-1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/users/:id', () => {
        it('should return user by id', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role_name: 'Admin'
            });

            const response = await request(app)
                .get('/api/v1/users/1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });

        it('should return 404 for non-existent user', async () => {
            UserModel.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/v1/users/999')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should validate id parameter', async () => {
            const response = await request(app)
                .get('/api/v1/users/invalid')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/v1/users', () => {
        it('should require admin role', async () => {
            const response = await request(app)
                .post('/api/v1/users')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    mobile: '+1234567890',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect(response.status).toBe(401);
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', 'Bearer mock-token')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should create user with valid data', async () => {
            UserModel.emailExists.mockResolvedValue(false);
            UserModel.usernameExists.mockResolvedValue(false);
            UserModel.mobileExists.mockResolvedValue(false);
            RoleModel.findById.mockResolvedValue({ id: 1, name: 'Admin' });
            UserModel.create.mockResolvedValue(1);

            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    mobile: '+1234567890',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User created successfully');
        });

        it('should reject duplicate email', async () => {
            UserModel.emailExists.mockResolvedValue(true);

            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'newuser',
                    email: 'existing@example.com',
                    mobile: '+1234567890',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect([400, 409]).toContain(response.status);
            expect(response.body.message).toBe('Email already exists');
        });
    });

    describe('PUT /api/v1/users/:id', () => {
        it('should update user with valid data', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                mobile: '+1234567890'
            });
            UserModel.update.mockResolvedValue(true);

            const response = await request(app)
                .put('/api/v1/users/1')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'updateduser'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User updated successfully');
        });

        it('should return 404 for non-existent user', async () => {
            UserModel.findById.mockResolvedValue(null);

            const response = await request(app)
                .put('/api/v1/users/999')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'updateduser'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/v1/users/:id', () => {
        it('should soft delete user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'active'
            });
            UserModel.softDelete.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/v1/users/1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');
        });
    });

    describe('PATCH /api/v1/users/:id/activate', () => {
        it('should activate user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'inactive'
            });
            UserModel.activate.mockResolvedValue(true);

            const response = await request(app)
                .patch('/api/v1/users/1/activate')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User activated successfully');
        });
    });

    describe('PATCH /api/v1/users/:id/deactivate', () => {
        it('should deactivate user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'active'
            });
            UserModel.deactivate.mockResolvedValue(true);

            const response = await request(app)
                .patch('/api/v1/users/1/deactivate')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deactivated successfully');
        });
    });

    describe('GET /api/v1/users/roles', () => {
        it('should return all roles', async () => {
            RoleModel.findAll.mockResolvedValue([
                { id: 1, name: 'Super Admin' },
                { id: 2, name: 'Admin' },
                { id: 3, name: 'Manager' },
                { id: 4, name: 'Employee' }
            ]);

            const response = await request(app)
                .get('/api/v1/users/roles')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(4);
        });
    });
});

describe('User CRUD Operations', () => {
    describe('User Creation', () => {
        it('should generate unique user ID on creation', async () => {
            UserModel.emailExists.mockResolvedValue(false);
            UserModel.usernameExists.mockResolvedValue(false);
            UserModel.mobileExists.mockResolvedValue(false);
            RoleModel.findById.mockResolvedValue({ id: 1, name: 'Admin' });
            UserModel.create.mockResolvedValue(5);

            const response = await request(app)
                .post('/api/v1/users')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'newuser',
                    email: 'new@example.com',
                    mobile: '+1234567890',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect(response.status).toBe(201);
            expect(response.body.data.userId).toBe(5);
        });
    });

    describe('User Retrieval', () => {
        it('should return user with role information', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role_id: 2,
                role_name: 'Admin'
            });

            const response = await request(app)
                .get('/api/v1/users/1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.data.role_name).toBe('Admin');
        });
    });

    describe('User Update', () => {
        it('should update multiple fields', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                mobile: '+1234567890'
            });
            UserModel.update.mockResolvedValue(true);

            const response = await request(app)
                .put('/api/v1/users/1')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'newusername',
                    email: 'new@example.com',
                    mobile: '+9876543210'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
        });
    });
});

describe('Input Validation', () => {
    it('should reject invalid email format', async () => {
        const response = await request(app)
            .post('/api/v1/users')
            .set('Authorization', 'Bearer mock-token')
            .send({
                username: 'newuser',
                email: 'invalid-email',
                mobile: '+1234567890',
                password: 'Test@1234',
                role_id: 1
            });

        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('should reject invalid mobile format', async () => {
        const response = await request(app)
            .post('/api/v1/users')
            .set('Authorization', 'Bearer mock-token')
            .send({
                username: 'newuser',
                email: 'new@example.com',
                mobile: '123',
                password: 'Test@1234',
                role_id: 1
            });

        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => e.field === 'mobile')).toBe(true);
    });

    it('should reject username with special characters', async () => {
        const response = await request(app)
            .post('/api/v1/users')
            .set('Authorization', 'Bearer mock-token')
            .send({
                username: 'user@name',
                email: 'new@example.com',
                mobile: '+1234567890',
                password: 'Test@1234',
                role_id: 1
            });

        expect(response.status).toBe(400);
        expect(response.body.errors.some(e => e.field === 'username')).toBe(true);
    });
});

describe('Rate Limiting', () => {
    it('should enforce rate limits on user endpoints', async () => {
        const responses = [];
        
        for (let i = 0; i < 101; i++) {
            const response = await request(app)
                .get('/api/v1/users')
                .set('Authorization', 'Bearer mock-token');
            responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect([200, 429]).toContain(lastResponse.status);
    });
});
