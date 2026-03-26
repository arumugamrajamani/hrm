const { UserModel, RefreshTokenModel, PasswordHistoryModel, PasswordResetTokenModel, LoginAttemptModel } = require('../models');
const { comparePassword, hashPassword } = require('../utils/passwordUtils');
const config = require('../config');

class AuthRepository {
    async findUserByEmail(email) {
        return await UserModel.findByEmail(email);
    }

    async findUserById(id) {
        return await UserModel.findById(id);
    }

    async verifyPassword(password, hash) {
        return await comparePassword(password, hash);
    }

    async updatePassword(userId, newPassword) {
        const passwordHash = await hashPassword(newPassword);
        return await UserModel.updatePassword(userId, passwordHash);
    }

    async getPasswordHistory(userId) {
        return await PasswordHistoryModel.findByUserId(userId, config.SECURITY.PASSWORD_HISTORY_COUNT);
    }

    async addToPasswordHistory(userId, passwordHash) {
        await PasswordHistoryModel.create(userId, passwordHash);
    }

    async createPasswordResetToken(userId, otp, expiresAt) {
        await PasswordResetTokenModel.deleteByUserId(userId);
        return await PasswordResetTokenModel.create(userId, { otp, expiresAt });
    }

    async verifyPasswordResetToken(otp) {
        return await PasswordResetTokenModel.findByOtp(otp);
    }

    async markTokenAsUsed(tokenId) {
        await PasswordResetTokenModel.markAsUsed(tokenId);
    }

    async getLoginAttempts(userId) {
        return await LoginAttemptModel.findByUserId(userId);
    }

    async incrementLoginAttempts(userId) {
        await LoginAttemptModel.incrementAttempts(userId);
    }

    async resetLoginAttempts(userId) {
        await LoginAttemptModel.resetAttempts(userId);
    }

    async setBlockedUntil(userId, blockedUntil) {
        await LoginAttemptModel.setBlockedUntil(userId, blockedUntil);
    }

    async saveRefreshToken(userId, token, expiresAt) {
        return await RefreshTokenModel.create(userId, token, expiresAt);
    }

    async findRefreshToken(token) {
        return await RefreshTokenModel.findByToken(token);
    }

    async deleteRefreshToken(token) {
        return await RefreshTokenModel.deleteByToken(token);
    }

    async deleteAllUserRefreshTokens(userId) {
        await RefreshTokenModel.deleteByUserId(userId);
    }

    async checkPasswordReuse(password, userId) {
        const history = await this.getPasswordHistory(userId);
        for (const record of history) {
            const isReused = await comparePassword(password, record.password_hash);
            if (isReused) {
                return true;
            }
        }
        return false;
    }
}

module.exports = new AuthRepository();
