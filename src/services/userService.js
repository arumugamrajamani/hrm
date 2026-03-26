const userRepository = require('../repositories/userRepository');
const authRepository = require('../repositories/authRepository');
const { hashPassword, generateRandomPassword } = require('../utils/passwordUtils');
const { sendEmail } = require('../config/mail');
const { getWelcomeEmailTemplate } = require('../utils/emailTemplates');
const config = require('../config');

class UserService {
    async getAllUsers(params) {
        return await userRepository.findAll(params);
    }

    async getUserById(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async createUser(userData) {
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

        const passwordHash = await hashPassword(password);
        
        const userId = await userRepository.create({
            username,
            email,
            mobile,
            password: passwordHash,
            role_id
        });

        return { userId, message: 'User created successfully' };
    }

    async createUserWithEmail(userData) {
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

        return { userId, message: 'User created and credentials sent via email' };
    }

    async updateUser(id, userData) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        if (userData.email && userData.email !== user.email) {
            if (await userRepository.emailExists(userData.email, id)) {
                throw new Error('Email already exists');
            }
        }

        if (userData.username && userData.username !== user.username) {
            if (await userRepository.usernameExists(userData.username, id)) {
                throw new Error('Username already exists');
            }
        }

        if (userData.mobile && userData.mobile !== user.mobile) {
            if (await userRepository.mobileExists(userData.mobile, id)) {
                throw new Error('Mobile number already exists');
            }
        }

        if (userData.role_id) {
            const role = await userRepository.getRoleById(userData.role_id);
            if (!role) {
                throw new Error('Invalid role');
            }
        }

        const updated = await userRepository.update(id, userData);
        if (!updated) {
            throw new Error('Failed to update user');
        }

        return { message: 'User updated successfully' };
    }

    async deleteUser(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const deleted = await userRepository.delete(id);
        if (!deleted) {
            throw new Error('Failed to delete user');
        }

        return { message: 'User deleted successfully' };
    }

    async activateUser(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const activated = await userRepository.activate(id);
        if (!activated) {
            throw new Error('Failed to activate user');
        }

        return { message: 'User activated successfully' };
    }

    async deactivateUser(id) {
        const user = await userRepository.findById(id);
        if (!user) {
            throw new Error('User not found');
        }

        const deactivated = await userRepository.deactivate(id);
        if (!deactivated) {
            throw new Error('Failed to deactivate user');
        }

        return { message: 'User deactivated successfully' };
    }

    async getAllRoles() {
        return await userRepository.getAllRoles();
    }
}

module.exports = new UserService();
