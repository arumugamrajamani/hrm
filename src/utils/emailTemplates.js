const config = require('../config');

const getWelcomeEmailTemplate = (username, password, loginUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to HRM System</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4a90d9; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .credentials { background: #fff; padding: 15px; border: 1px solid #e0e0e0; border-radius: 5px; margin: 20px 0; }
        .credential-label { font-weight: bold; color: #666; }
        .credential-value { font-family: monospace; font-size: 16px; color: #333; background: #f0f0f0; padding: 5px 10px; border-radius: 3px; }
        .button { display: inline-block; background: #4a90d9; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to HRM System!</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your account has been created successfully. Here are your login credentials:</p>
            
            <div class="credentials">
                <p><span class="credential-label">Username:</span> <span class="credential-value">${username}</span></p>
                <p><span class="credential-label">Temporary Password:</span> <span class="credential-value">${password}</span></p>
            </div>
            
            <p><strong>Important Security Notice:</strong></p>
            <ul>
                <li>Please change your password immediately after logging in</li>
                <li>Your password will expire in ${config.SECURITY.PASSWORD_EXPIRY_DAYS} days</li>
                <li>Never share your password with anyone</li>
            </ul>
            
            <a href="${loginUrl}" class="button">Login Now</a>
            
            <div class="warning">
                <strong>⚠️ Security Reminder:</strong>
                <p>If you did not request this account, please contact your system administrator immediately.</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from HRM System. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRM System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

const getPasswordResetOTPEmail = (username, otp) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Reset Request</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #d9534f; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .otp-box { background: #fff; padding: 20px; text-align: center; border: 2px solid #d9534f; border-radius: 5px; margin: 20px 0; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: bold; color: #d9534f; letter-spacing: 5px; }
        .warning { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>We received a request to reset your password. Use the following OTP code to reset your password:</p>
            
            <div class="otp-box">
                <p class="otp-code">${otp}</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This OTP is valid for ${config.SECURITY.OTP_EXPIRY_PASSWORD_MINUTES} minutes only</li>
                <li>If you didn't request this, your account is secure</li>
                <li>Never share this code with anyone</li>
            </ul>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <p>If you did not make this request, please ignore this email. Your password will remain unchanged.</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from HRM System. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRM System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

const getPasswordExpiryReminderTemplate = (username, daysUntilExpiry, changePasswordUrl) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Password Expiry Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #f0ad4e; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .countdown { background: #fff; padding: 20px; text-align: center; border: 2px solid #f0ad4e; border-radius: 5px; margin: 20px 0; }
        .days-count { font-size: 48px; font-weight: bold; color: #f0ad4e; }
        .button { display: inline-block; background: #f0ad4e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
        .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Password Expiry Reminder</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your password will expire in <strong>${daysUntilExpiry} days</strong>. Please change it soon to avoid being locked out of your account.</p>
            
            <div class="countdown">
                <p class="days-count">${daysUntilExpiry}</p>
                <p>days remaining</p>
            </div>
            
            <a href="${changePasswordUrl}" class="button">Change Password Now</a>
            
            <div class="warning">
                <strong>💡 Password Requirements:</strong>
                <ul>
                    <li>Minimum ${config.SECURITY.PASSWORD_MIN_LENGTH} characters</li>
                    <li>At least 1 uppercase and 1 lowercase letter</li>
                    <li>At least 1 number</li>
                    <li>At least 1 special character</li>
                    <li>Must be different from your last ${config.SECURITY.PASSWORD_HISTORY_COUNT} passwords</li>
                </ul>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from HRM System. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRM System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

const getTwoFactorVerificationTemplate = (username, otp) => {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Two-Factor Authentication Code</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; }
        .otp-box { background: #fff; padding: 20px; text-align: center; border: 2px solid #28a745; border-radius: 5px; margin: 20px 0; }
        .otp-code { font-family: monospace; font-size: 32px; font-weight: bold; color: #28a745; letter-spacing: 5px; }
        .warning { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-top: 20px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Two-Factor Authentication</h1>
        </div>
        <div class="content">
            <p>Hello <strong>${username}</strong>,</p>
            <p>Your two-factor authentication code is:</p>
            
            <div class="otp-box">
                <p class="otp-code">${otp}</p>
            </div>
            
            <p><strong>Important:</strong></p>
            <ul>
                <li>This code is valid for ${config.SECURITY.OTP_EXPIRY_MINUTES} minutes only</li>
                <li>Enter this code on the login page to complete authentication</li>
                <li>Never share this code with anyone</li>
            </ul>
            
            <div class="warning">
                <strong>🔒 Security Notice:</strong>
                <p>If you did not attempt to log in, your account may be compromised. Please contact your system administrator immediately.</p>
            </div>
        </div>
        <div class="footer">
            <p>This is an automated message from HRM System. Please do not reply to this email.</p>
            <p>&copy; ${new Date().getFullYear()} HRM System. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `;
};

module.exports = {
    getWelcomeEmailTemplate,
    getPasswordResetOTPEmail,
    getPasswordExpiryReminderTemplate,
    getTwoFactorVerificationTemplate
};
