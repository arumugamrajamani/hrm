const nodemailer = require('nodemailer');
const config = require('./index');

const transporter = nodemailer.createTransport({
    host: config.SMTP.HOST,
    port: config.SMTP.PORT,
    secure: config.SMTP.SECURE,
    auth: {
        user: config.SMTP.USER,
        pass: config.SMTP.PASS
    }
});

const sendEmail = async (to, subject, html) => {
    try {
        const mailOptions = {
            from: `"${config.SMTP.FROM_NAME}" <${config.SMTP.FROM_EMAIL}>`,
            to,
            subject,
            html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`[${new Date().toISOString()}] Email sent to ${to}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error(`[${new Date().toISOString()}] Email sending failed:`, error.message);
        return { success: false, error: error.message };
    }
};

module.exports = { transporter, sendEmail };
