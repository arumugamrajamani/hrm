const authRepository = require('../repositories/authRepository');
const userRepository = require('../repositories/userRepository');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../config/jwt');
const { hashPassword, validatePasswordStrength, generateRandomPassword } = require('../utils/passwordUtils');
const { generateOTP } = require('../utils/tokenUtils');
const { sendEmail } = require('../config/mail');
const { getWelcomeEmailTemplate, getPasswordResetOTPEmail, getTwoFactorVerificationTemplate } = require('../utils/emailTemplates');
const { isPasswordExpired } = require('../utils/helpers');
const config = require('../config');

class AuthService {
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
                
                throw new Error(`Too many failed attempts. Account blocked for ${config.SECURITY.BLOCK_DURATION_MINUTES} minutes`);
            }
            
            throw new Error(`Invalid credentials. ${config.SECURITY.MAX_LOGIN_ATTEMPTS - failedAttempts} attempts remaining`);
        }

        if (user.status !== 'active') {
            await userRepository.update(user.id, { status: 'active' });
        }

        await authRepository.resetLoginAttempts(user.id);

        if (user.two_factor_enabled) {
            const otp = generateOTP(6);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + config.SECURITY.OTP_EXPIRY_MINUTES);
            
            await authRepository.createPasswordResetToken(user.id, otp, expiresAt);
            
            await sendEmail(
                user.email,
                'Two-Factor Authentication Code',
                getTwoFactorVerificationTemplate(user.username, otp)
            );
            
            return {
                requiresTwoFactor: true,
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

        const resetToken = await authRepository.verifyPasswordResetToken(otp);
        
        if (!resetToken || resetToken.user_id !== user.id) {
            throw new Error('Invalid or expired OTP');
        }

        await authRepository.markTokenAsUsed(resetToken.id);

        return this.generateTokens(user);
    }

    async refreshToken(refreshToken) {
        try {
            const decoded = verifyRefreshToken(refreshToken);
            
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
        
        return { message: 'Logged out successfully' };
    }

    async generateTokens(user) {
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        const refreshExpiresAt = new Date();
        refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

        await authRepository.saveRefreshToken(user.id, refreshToken, refreshExpiresAt);

        const isExpired = isPasswordExpired(user.password_changed_at);

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
            throw new Error('User not found');
        }

        const otp = generateOTP(6);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + config.SECURITY.OTP_EXPIRY_PASSWORD_MINUTES);

        await authRepository.createPasswordResetToken(user.id, otp, expiresAt);

        await sendEmail(
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

        return { message: 'Password changed successfully' };
    }

    async setupTwoFactor(userId) {
        const user = await authRepository.findUserById(userId);
        
        if (!user) {
            throw new Error('User not found');
        }

        const otp = generateOTP(6);
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + config.SECURITY.OTP_EXPIRY_MINUTES);

        await authRepository.createPasswordResetToken(user.id, otp, expiresAt);

        await sendEmail(
            user.email,
            'Two-Factor Authentication Setup',
            getTwoFactorVerificationTemplate(user.username, otp)
        );

        return { message: 'Verification code sent to your email' };
    }

    async verifyAndEnableTwoFactor(userId, otp) {
        const resetToken = await authRepository.verifyPasswordResetToken(otp);
        
        if (!resetToken || resetToken.user_id !== userId) {
            throw new Error('Invalid or expired OTP');
        }

        await userRepository.enableTwoFactor(userId);
        await authRepository.markTokenAsUsed(resetToken.id);

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

        const resetToken = await authRepository.verifyPasswordResetToken(otp);
        if (!resetToken || resetToken.user_id !== userId) {
            throw new Error('Invalid or expired OTP');
        }

        await userRepository.disableTwoFactor(userId);
        await authRepository.markTokenAsUsed(resetToken.id);

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

        await sendEmail(
            email,
            'Welcome to HRM System',
            getWelcomeEmailTemplate(username, generatedPassword, config.FRONTEND_URL)
        );

        return { userId, generatedPassword, message: 'User created and credentials sent via email' };
    }
}

module.exports = new AuthService();
