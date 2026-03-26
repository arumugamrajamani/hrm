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
        findAll: jest.fn()
    },
    RoleModel: {
        findAll: jest.fn(),
        findById: jest.fn()
    },
    LoginAttemptModel: {
        findByUserId: jest.fn(),
        createOrUpdate: jest.fn(),
        incrementAttempts: jest.fn(),
        resetAttempts: jest.fn(),
        setBlockedUntil: jest.fn()
    },
    PasswordHistoryModel: {
        findByUserId: jest.fn(),
        create: jest.fn()
    },
    PasswordResetTokenModel: {
        findByOtp: jest.fn(),
        create: jest.fn(),
        markAsUsed: jest.fn(),
        deleteByUserId: jest.fn()
    },
    RefreshTokenModel: {
        findByToken: jest.fn(),
        create: jest.fn(),
        deleteByToken: jest.fn(),
        deleteByUserId: jest.fn(),
        deleteExpired: jest.fn()
    }
}));

const { pool } = require('../config/database');
const { UserModel, LoginAttemptModel, PasswordHistoryModel, PasswordResetTokenModel, RefreshTokenModel } = require('../models');
const bcrypt = require('bcrypt');

describe('Auth Endpoints', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/register', () => {
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'invalid-email',
                    mobile: '+1234567890',
                    password: 'Test@123',
                    role_id: 1
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should validate password strength', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    mobile: '+1234567890',
                    password: 'weak',
                    role_id: 1
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should validate username format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'test user',
                    email: 'test@example.com',
                    mobile: '+1234567890',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should validate mobile number format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    username: 'testuser',
                    email: 'test@example.com',
                    mobile: '123',
                    password: 'Test@1234',
                    role_id: 1
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should validate email format', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'invalid-email',
                    password: 'password'
                });

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should return error for non-existent user', async () => {
            UserModel.findByEmail.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test@1234'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(['Invalid credentials', 'User not found']).toContain(response.body.message);
        });

        it('should return error for invalid password', async () => {
            const hashedPassword = await bcrypt.hash('correct-password', 10);
            UserModel.findByEmail.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
                status: 'active',
                role_id: 1
            });
            LoginAttemptModel.findByUserId.mockResolvedValue(null);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'wrong-password'
                });

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
        });

        it('should login successfully with valid credentials', async () => {
            const hashedPassword = await bcrypt.hash('correct-password', 10);
            UserModel.findByEmail.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                password: hashedPassword,
                status: 'active',
                role_id: 1,
                role_name: 'Admin',
                password_changed_at: new Date()
            });
            LoginAttemptModel.findByUserId.mockResolvedValue(null);
            RefreshTokenModel.create.mockResolvedValue(1);

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'correct-password'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.accessToken).toBeDefined();
            expect(response.body.data.refreshToken).toBeDefined();
        });
    });

    describe('POST /api/auth/forgot-password', () => {
        it('should validate required email', async () => {
            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
        });

        it('should send OTP for valid email', async () => {
            UserModel.findByEmail.mockResolvedValue({
                id: 1,
                username: 'testuser',
                email: 'test@example.com',
                status: 'active'
            });
            PasswordResetTokenModel.deleteByUserId.mockResolvedValue();
            PasswordResetTokenModel.create.mockResolvedValue(1);

            const response = await request(app)
                .post('/api/auth/forgot-password')
                .send({
                    email: 'test@example.com'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('OTP sent to your email');
        });
    });

    describe('POST /api/auth/refresh', () => {
        it('should require refresh token', async () => {
            const response = await request(app)
                .post('/api/auth/refresh')
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.message).toBe('Refresh token is required');
        });
    });

    describe('POST /api/auth/logout', () => {
        it('should require authentication', async () => {
            const response = await request(app)
                .post('/api/auth/logout')
                .send({});

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });
});

describe('Password Validation', () => {
    const { validatePasswordStrength } = require('../utils/passwordUtils');

    it('should reject password shorter than 8 characters', () => {
        const result = validatePasswordStrength('Ab1!abc');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should reject password without uppercase', () => {
        const result = validatePasswordStrength('abc123!@');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
        const result = validatePasswordStrength('ABC123!@');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without numbers', () => {
        const result = validatePasswordStrength('Abcdef!@');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special characters', () => {
        const result = validatePasswordStrength('Abcdefgh123');
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Password must contain at least one special character');
    });

    it('should accept valid password', () => {
        const result = validatePasswordStrength('Abcdefgh123!');
        expect(result.isValid).toBe(true);
        expect(result.errors.length).toBe(0);
    });
});

describe('Health Check', () => {
    it('should return health status', async () => {
        const response = await request(app)
            .get('/health');

        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toBe('HRM API is running');
    });
});

describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
        const response = await request(app)
            .get('/api/unknown');

        expect(response.status).toBe(404);
        expect(response.body.success).toBe(false);
    });
});
