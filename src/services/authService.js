const authRepository = require('../repositories/authRepository');
const userRepository = require('../repositories/userRepository');
const jwtService = require('../config/jwt');
const { hashPassword, validatePasswordStrength, generateRandomPassword, comparePassword } = require('../utils/passwordUtils');
const { generateOTP } = require('../utils/tokenUtils');
const { sendEmail } = require('../config/mail');
const { getWelcomeEmailTemplate, getPasswordResetOTPEmail, getTwoFactorVerificationTemplate } = require('../utils/emailTemplates');
const { isPasswordExpired } = require('../utils/helpers');
const totpService = require('../services/totpService');
const config = require('../config');
const logger = require('../utils/logger');
const queueService = require('../services/queueService');
const { webhookService, EventType } = require('../services/webhookService');
const { getCircuitBreaker } = require('../services/circuitBreaker');

class AuthService {
    constructor() {
        this.emailCircuitBreaker = getCircuitBreaker('email', {
            timeout: 10000,
            errorThreshold: 5,
            resetTimeout: 60000
        });
    }

    async register(userData) {
        const { username, email, mobile, password, role_id } = userData;

        if (await userRepository.emailExists(email)) {
            throw new Error('Email already exists');
        }

        if (await userRepository.usernameExists(username)) {
            throw new Error('Username already exists');
        }

        if (await userRepository.mobileExists(mobile)) {
            throw new Error('Mobile number already exists');
        }

        const role = await userRepository.getRoleById(role_id);
        if (!role) {
            throw new Error('Invalid role');
        }

        const passwordValidation = validatePasswordStrength(password);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.errors.join(', '));
        }

        const passwordHash = await hashPassword(password);
        const userId = await userRepository.create({
            username,
            email,
            mobile,
            password: passwordHash,
            role_id,
            status: 'active'
        });

        await authRepository.addToPasswordHistory(userId, passwordHash);

        webhookService.trigger(EventType.USER_CREATED, {
            userId,
            username,
            email,
            roleId: role_id
        });

        return { userId, message: 'User registered successfully' };
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);
        
        if (!user) {
            throw new Error('Invalid credentials');
        }

        if (user.status === 'deleted') {
            throw new Error('Account has been deleted');
        }

        if (user.status === 'blocked') {
            throw new Error('Account is blocked. Please contact administrator');
        }

        const loginAttempts = await authRepository.getLoginAttempts(user.id);
        
        if (loginAttempts && loginAttempts.blocked_until) {
            const blockedUntil = new Date(loginAttempts.blocked_until);
            if (new Date() < blockedUntil) {
                const remainingMinutes = Math.ceil((blockedUntil - new Date()) / 60000);
                throw new Error(`Account is blocked. Try again in ${remainingMinutes} minutes`);
            }
        }

        const isValidPassword = await authRepository.verifyPassword(password, user.password);
        
        if (!isValidPassword) {
            await authRepository.incrementLoginAttempts(user.id);
            
            const attempts = await authRepository.getLoginAttempts(user.id);
            const failedAttempts = attempts ? attempts.attempts : 1;
            
            if (failedAttempts >= config.SECURITY.MAX_LOGIN_ATTEMPTS) {
                const blockedUntil = new Date();
                blockedUntil.setMinutes(blockedUntil.getMinutes() + config.SECURITY.BLOCK_DURATION_MINUTES);
                await authRepository.setBlockedUntil(user.id, blockedUntil);
                
                await userRepository.update(user.id, { status: 'blocked' });
                
                logger.logSecurity('Account blocked due to too many failed login attempts', {
                    userId: user.id,
                    email: user.email,
                    ip: 'unknown'
                });

                throw new Error(`Too many failed attempts. Account blocked for ${config.SECURITY.BLOCK_DURATION_MINUTES} minutes`);
            }
            
            throw new Error(`Invalid credentials. ${config.SECURITY.MAX_LOGIN_ATTEMPTS - failedAttempts} attempts remaining`);
        }

        if (user.status !== 'active') {
            await userRepository.update(user.id, { status: 'active' });
        }

        await authRepository.resetLoginAttempts(user.id);

        const totpSecret = await this.getUserTOTPSecret(user.id);
        if (totpSecret && totpSecret.is_enabled) {
            const otp = totpService.generateOTP(totpSecret.secret);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + config.SECURITY.OTP_EXPIRY_MINUTES);
            
            await authRepository.createPasswordResetToken(user.id, otp, expiresAt);
            
            await this.sendEmailAsync(
                user.email,
                'Two-Factor Authentication Code',
                getTwoFactorVerificationTemplate(user.username, otp)
            );
            
            return {
                requiresTwoFactor: true,
                requiresBackupCode: false,
                message: 'Two-factor authentication required'
            };
        }

        return this.generateTokens(user);
    }

    async verifyTwoFactor(email, otp) {
        const user = await authRepository.findUserByEmail(email);
        
        if (!user) {
            throw new Error('User not found');
        }

        const totpSecret = await this.getUserTOTPSecret(user.id);
        if (totpSecret && totpSecret.is_enabled) {
            const result = totpService.verifyOTP(totpSecret.secret, otp);
            if (!result.valid) {
                if (totpSecret.backup_codes && Array.isArray(totpSecret.backup_codes)) {
                    const backupResult = totpService.verifyBackupCode(totpSecret.backup_codes, otp);
                    if (backupResult.valid) {
                        await this.updateBackupCodes(user.id, totpSecret.backup_codes);
                        return this.generateTokens(user);
                    }
                }
                throw new Error('Invalid or expired OTP');
            }
        } else {
            const resetToken = await authRepository.verifyPasswordResetToken(otp);
            
            if (!resetToken || resetToken.user_id !== user.id) {
                throw new Error('Invalid or expired OTP');
            }

            await authRepository.markTokenAsUsed(resetToken.id);
        }

        return this.generateTokens(user);
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = jwtService.verifyRefreshToken(refreshToken);
            
            const storedToken = await authRepository.findRefreshToken(refreshToken);
            if (!storedToken) {
                throw new Error('Invalid refresh token');
            }

            const user = await authRepository.findUserById(decoded.id);
            if (!user) {
                throw new Error('User not found');
            }

            await authRepository.deleteRefreshToken(refreshToken);

            return this.generateTokens(user);
        } catch (error) {
            throw new Error('Invalid refresh token');
        }
    }

    async logout(userId, refreshToken = null) {
        if (refreshToken) {
            await authRepository.deleteRefreshToken(refreshToken);
        }
        
        await authRepository.deleteAllUserRefreshTokens(userId);
        
        webhookService.trigger(EventType.USER_LOGOUT, { userId });
        
        return { message: 'Logged out successfully' };
    }

    async generateTokens(user) {
        const accessToken = jwtService.generateAccessToken(user);
        const refreshToken = jwtService.generateRefreshToken(user);

        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

        await authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiresAt);

        const isExpired = isPasswordExpired(user.password_changed_at);

        webhookService.trigger(EventType.USER_LOGIN, {
            userId: user.id,
            username: user.username,
            email: user.email
        });

        return {
            accessToken,
            refreshToken,
            expiresIn: 900,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role_name,
                passwordExpired: isExpired
            }
        };
    }

    async forgotPassword(email) {
        const user = await authRepository.findUserByEmail(email);
        
        if (!user) {
            return { message: 'If an account exists with this email, an OTP has been sent' };
        }

        const otp = generateOTP(6);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + config.SECURITY.OTP_EXPIRY_PASSWORD_MINUTES);

        await authRepository.createPasswordResetToken(user.id, otp, expiresAt);

        await this.sendEmailAsync(
            user.email,
            'Password Reset OTP',
            getPasswordResetOTPEmail(user.username, otp)
        );

        return { message: 'OTP sent to your email' };
    }

    async verifyOtp(otp) {
        const resetToken = await authRepository.verifyPasswordResetToken(otp);
        
        if (!resetToken) {
            throw new Error('Invalid or expired OTP');
        }

        return { valid: true, userId: resetToken.user_id };
    }

    async resetPassword(userId, newPassword, otp) {
        const resetToken = await authRepository.verifyPasswordResetToken(otp);
        
        if (!resetToken || resetToken.user_id !== userId) {
            throw new Error('Invalid or expired OTP');
        }

        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.errors.join(', '));
        }

        const isReused = await authRepository.checkPasswordReuse(newPassword, userId);
        if (isReused) {
            throw new Error('Password was used recently. Please choose a different password');
        }

        const passwordHash = await hashPassword(newPassword);
        
        await authRepository.updatePassword(userId, newPassword);
        await authRepository.addToPasswordHistory(userId, passwordHash);
        await authRepository.markTokenAsUsed(resetToken.id);
        await authRepository.resetLoginAttempts(userId);

        webhookService.trigger(EventType.USER_PASSWORD_CHANGED, {
            userId,
            method: 'reset'
        });

        return { message: 'Password reset successfully' };
    }

    async changePassword(userId, currentPassword, newPassword) {
        const user = await authRepository.findUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await authRepository.verifyPassword(currentPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.isValid) {
            throw new Error(passwordValidation.errors.join(', '));
        }

        const isReused = await authRepository.checkPasswordReuse(newPassword, userId);
        if (isReused) {
            throw new Error('Password was used recently. Please choose a different password');
        }

        const passwordHash = await hashPassword(newPassword);
        
        await authRepository.updatePassword(userId, newPassword);
        await authRepository.addToPasswordHistory(userId, passwordHash);

        webhookService.trigger(EventType.USER_PASSWORD_CHANGED, {
            userId,
            method: 'change'
        });

        return { message: 'Password changed successfully' };
    }

    async setupTwoFactor(userId) {
        const user = await authRepository.findUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        const secret = totpService.generateSecret();
        const backupCodes = totpService.generateBackupCodes(10);
        
        await this.saveTOTPSecret(userId, secret, backupCodes);

        const qrDataUrl = totpService.generateQRCodeDataURL(secret, user.email);

        return { 
            secret,
            qrDataUrl,
            backupCodes,
            message: 'Two-factor authentication setup initiated. Save your backup codes securely.'
        };
    }

    async verifyAndEnableTwoFactor(userId, otp) {
        const totpSecret = await this.getUserTOTPSecret(userId);
        
        if (!totpSecret) {
            throw new Error('Please initiate 2FA setup first');
        }

        const result = totpService.verifyOTP(totpSecret.secret, otp);
        if (!result.valid) {
            throw new Error('Invalid verification code');
        }

        await this.enableTOTP(userId);

        webhookService.trigger(EventType.USER_STATUS_CHANGED, {
            userId,
            field: 'two_factor_enabled',
            newValue: true
        });

        return { message: 'Two-factor authentication enabled successfully' };
    }

    async disableTwoFactor(userId, password, otp) {
        const user = await authRepository.findUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await authRepository.verifyPassword(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid password');
        }

        const totpSecret = await this.getUserTOTPSecret(userId);
        if (totpSecret && totpSecret.is_enabled) {
            const result = totpService.verifyOTP(totpSecret.secret, otp);
            if (!result.valid) {
                throw new Error('Invalid verification code');
            }
        }

        await this.disableTOTP(userId);

        webhookService.trigger(EventType.USER_STATUS_CHANGED, {
            userId,
            field: 'two_factor_enabled',
            newValue: false
        });

        return { message: 'Two-factor authentication disabled successfully' };
    }

    async createUserWithGeneratedPassword(userData) {
        const { username, email, mobile, role_id } = userData;

        if (await userRepository.emailExists(email)) {
            throw new Error('Email already exists');
        }

        if (await userRepository.usernameExists(username)) {
            throw new Error('Username already exists');
        }

        if (await userRepository.mobileExists(mobile)) {
            throw new Error('Mobile number already exists');
        }

        const role = await userRepository.getRoleById(role_id);
        if (!role) {
            throw new Error('Invalid role');
        }

        const generatedPassword = generateRandomPassword(12);
        const passwordHash = await hashPassword(generatedPassword);

        const userId = await userRepository.create({
            username,
            email,
            mobile,
            password: passwordHash,
            role_id,
            status: 'active'
        });

        await authRepository.addToPasswordHistory(userId, passwordHash);

        await this.sendEmailAsync(
            email,
            'Welcome to HRM System',
            getWelcomeEmailTemplate(username, generatedPassword, config.FRONTEND_URL)
        );

        webhookService.trigger(EventType.USER_CREATED, {
            userId,
            username,
            email,
            roleId: role_id,
            method: 'admin_created'
        });

        return { userId, generatedPassword, message: 'User created and credentials sent via email' };
    }

    async getUserTOTPSecret(userId) {
        try {
            const [rows] = await pool.execute(
                'SELECT secret, is_enabled, backup_codes FROM user_totp_secrets WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length === 0) return null;
            
            return {
                secret: rows[0].secret,
                is_enabled: rows[0].is_enabled,
                backup_codes: rows[0].backup_codes ? JSON.parse(rows[0].backup_codes) : null
            };
        } catch (error) {
            logger.error('Error fetching TOTP secret', { userId, error: error.message });
            return null;
        }
    }

    async saveTOTPSecret(userId, secret, backupCodes) {
        const { pool } = require('../config/database');
        await pool.execute(
            `INSERT INTO user_totp_secrets (user_id, secret, backup_codes, is_enabled)
             VALUES (?, ?, ?, FALSE)
             ON DUPLICATE KEY UPDATE
             secret = VALUES(secret),
             backup_codes = VALUES(backup_codes),
             is_enabled = FALSE`,
            [userId, secret, JSON.stringify(backupCodes)]
        );
    }

    async enableTOTP(userId) {
        const { pool } = require('../config/database');
        await pool.execute(
            'UPDATE user_totp_secrets SET is_enabled = TRUE WHERE user_id = ?',
            [userId]
        );
    }

    async disableTOTP(userId) {
        const { pool } = require('../config/database');
        await pool.execute(
            'UPDATE user_totp_secrets SET is_enabled = FALSE WHERE user_id = ?',
            [userId]
        );
    }

    async updateBackupCodes(userId, backupCodes) {
        const { pool } = require('../config/database');
        await pool.execute(
            'UPDATE user_totp_secrets SET backup_codes = ? WHERE user_id = ?',
            [JSON.stringify(backupCodes), userId]
        );
    }

    async sendEmailAsync(to, subject, html) {
        try {
            await this.emailCircuitBreaker.execute(async () => {
                await queueService.add('email', {
                    to,
                    subject,
                    html
                }, {
                    attempts: 3,
                    backoffType: 'exponential',
                    backoffDelay: 2000
                });
            });
        } catch (error) {
            logger.warn('Email queued via fallback', { to, error: error.message });
            await sendEmail(to, subject, html);
        }
    }
}

const { pool } = require('../config/database');

module.exports = new AuthService();
