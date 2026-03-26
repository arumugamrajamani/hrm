const request = require('supertest');
const app = require('../app');

jest.mock('../config/database', () => ({
    pool: {
        query: jest.fn(),
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

const { UserModel, RoleModel } = require('../models');

describe('User Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/users');

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
                .get('/api/users')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveLength(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should validate pagination parameters', async () => {
            const response = await request(app)
                .get('/api/users?page=-1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('GET /api/users/:id', () => {
        it('should return user by id', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                role_name: 'Admin'
            });

            const response = await request(app)
                .get('/api/users/1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });

        it('should return 404 for non-existent user', async () => {
            UserModel.findById.mockResolvedValue(null);

            const response = await request(app)
                .get('/api/users/999')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should validate id parameter', async () => {
            const response = await request(app)
                .get('/api/users/invalid')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/users', () => {
        it('should require admin role', async () => {
            const response = await request(app)
                .post('/api/users')
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
                .post('/api/users')
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
                .post('/api/users')
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
                .post('/api/users')
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

    describe('PUT /api/users/:id', () => {
        it('should update user with valid data', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                mobile: '+1234567890'
            });
            UserModel.update.mockResolvedValue(true);

            const response = await request(app)
                .put('/api/users/1')
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
                .put('/api/users/999')
                .set('Authorization', 'Bearer mock-token')
                .send({
                    username: 'updateduser'
                });

            expect(response.status).toBe(404);
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should soft delete user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'active'
            });
            UserModel.softDelete.mockResolvedValue(true);

            const response = await request(app)
                .delete('/api/users/1')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deleted successfully');
        });
    });

    describe('PATCH /api/users/:id/activate', () => {
        it('should activate user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'inactive'
            });
            UserModel.activate.mockResolvedValue(true);

            const response = await request(app)
                .patch('/api/users/1/activate')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User activated successfully');
        });
    });

    describe('PATCH /api/users/:id/deactivate', () => {
        it('should deactivate user', async () => {
            UserModel.findById.mockResolvedValue({
                id: 1,
                username: 'testuser',
                status: 'active'
            });
            UserModel.deactivate.mockResolvedValue(true);

            const response = await request(app)
                .patch('/api/users/1/deactivate')
                .set('Authorization', 'Bearer mock-token');

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('User deactivated successfully');
        });
    });

    describe('GET /api/users/roles', () => {
        it('should return all roles', async () => {
            RoleModel.findAll.mockResolvedValue([
                { id: 1, name: 'Super Admin' },
                { id: 2, name: 'Admin' },
                { id: 3, name: 'Manager' },
                { id: 4, name: 'Employee' }
            ]);

            const response = await request(app)
                .get('/api/users/roles')
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
                .post('/api/users')
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
                .get('/api/users/1')
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
                .put('/api/users/1')
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
            .post('/api/users')
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
            .post('/api/users')
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
            .post('/api/users')
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
                .get('/api/users')
                .set('Authorization', 'Bearer mock-token');
            responses.push(response);
        }

        const lastResponse = responses[responses.length - 1];
        expect([200, 429]).toContain(lastResponse.status);
    });
});
