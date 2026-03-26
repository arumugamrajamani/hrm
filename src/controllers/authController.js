const authService = require('../services/authService');
const { successResponse, errorResponse } = require('../utils/helpers');

class AuthController {
    async register(req, res, next) {
        try {
            const { username, email, mobile, password, role_id } = req.body;
            
            const result = await authService.register({
                username,
                email,
                mobile,
                password,
                role_id
            });

            return successResponse(res, result, 'User registered successfully', 201);
        } catch (error) {
            next(error);
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            const result = await authService.login(email, password);

            return successResponse(res, result, 'Login successful');
        } catch (error) {
            next(error);
        }
    }

    async verifyTwoFactor(req, res, next) {
        try {
            const { email, otp } = req.body;
            
            const result = await authService.verifyTwoFactor(email, otp);

            return successResponse(res, result, 'Two-factor authentication verified');
        } catch (error) {
            next(error);
        }
    }

    async refreshToken(req, res, next) {
        try {
            const { refreshToken } = req.body;
            
            if (!refreshToken) {
                return errorResponse(res, 'Refresh token is required', 400);
            }

            const result = await authService.refreshToken(refreshToken);

            return successResponse(res, result, 'Token refreshed successfully');
        } catch (error) {
            next(error);
        }
    }

    async logout(req, res, next) {
        try {
            const userId = req.user.id;
            const { refreshToken } = req.body;
            
            const result = await authService.logout(userId, refreshToken);

            return successResponse(res, result, 'Logged out successfully');
        } catch (error) {
            next(error);
        }
    }

    async forgotPassword(req, res, next) {
        try {
            const { email } = req.body;
            
            const result = await authService.forgotPassword(email);

            return successResponse(res, result, 'OTP sent to your email');
        } catch (error) {
            next(error);
        }
    }

    async verifyOtp(req, res, next) {
        try {
            const { otp } = req.body;
            
            const result = await authService.verifyOtp(otp);

            return successResponse(res, result, 'OTP verified successfully');
        } catch (error) {
            next(error);
        }
    }

    async resetPassword(req, res, next) {
        try {
            const { userId, newPassword, otp } = req.body;
            
            const result = await authService.resetPassword(userId, newPassword, otp);

            return successResponse(res, result, 'Password reset successfully');
        } catch (error) {
            next(error);
        }
    }

    async changePassword(req, res, next) {
        try {
            const userId = req.user.id;
            const { currentPassword, newPassword } = req.body;
            
            const result = await authService.changePassword(userId, currentPassword, newPassword);

            return successResponse(res, result, 'Password changed successfully');
        } catch (error) {
            next(error);
        }
    }

    async setupTwoFactor(req, res, next) {
        try {
            const userId = req.user.id;
            
            const result = await authService.setupTwoFactor(userId);

            return successResponse(res, result, 'Verification code sent to your email');
        } catch (error) {
            next(error);
        }
    }

    async verifyTwoFactorSetup(req, res, next) {
        try {
            const userId = req.user.id;
            const { otp } = req.body;
            
            const result = await authService.verifyAndEnableTwoFactor(userId, otp);

            return successResponse(res, result, 'Two-factor authentication enabled');
        } catch (error) {
            next(error);
        }
    }

    async disableTwoFactor(req, res, next) {
        try {
            const userId = req.user.id;
            const { password, otp } = req.body;
            
            const result = await authService.disableTwoFactor(userId, password, otp);

            return successResponse(res, result, 'Two-factor authentication disabled');
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new AuthController();
