const crypto = require('crypto');
const config = require('../config');

class TOTPService {
    constructor() {
        this.digits = config.SECURITY.TOTP_DIGITS || 6;
        this.period = 30;
        this.algorithm = config.SECURITY.TOTP_ALGORITHM || 'SHA1';
        this.issuer = config.SECURITY.TOTP_ISSUER || 'HRM System';
        this.window = config.SECURITY.TOTP_WINDOW || 1;
    }

    generateSecret() {
        const bytes = crypto.randomBytes(20);
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        let output = '';

        for (const byte of bytes) {
            value = (value << 8) | byte;
            bits += 8;

            while (bits >= 5) {
                output += alphabet[(value >>> (bits - 5)) & 31];
                bits -= 5;
            }
        }

        if (bits > 0) {
            output += alphabet[(value << (5 - bits)) & 31];
        }

        return output;
    }

    generateOTP(secret, time = Date.now()) {
        const timeCounter = Math.floor(time / 1000 / this.period);
        return this.calculateHOTP(secret, timeCounter);
    }

    calculateHOTP(secret, counter) {
        const buffer = Buffer.alloc(8);
        let value = counter;
        
        for (let i = 7; i >= 0; i--) {
            buffer[i] = value & 0xff;
            value = Math.floor(value / 256);
        }

        const hmac = crypto.createHmac(this.algorithm, this.base32ToBuffer(secret));
        hmac.update(buffer);
        const hmacHash = hmac.digest();

        const offset = hmacHash[hmacHash.length - 1] & 0xf;
        const binary = 
            ((hmacHash[offset] & 0x7f) << 24) |
            ((hmacHash[offset + 1] & 0xff) << 16) |
            ((hmacHash[offset + 2] & 0xff) << 8) |
            (hmacHash[offset + 3] & 0xff);

        const otp = binary % Math.pow(10, this.digits);
        return otp.toString().padStart(this.digits, '0');
    }

    verifyOTP(secret, token, time = Date.now()) {
        const timeCounter = Math.floor(time / 1000 / this.period);
        
        for (let i = -this.window; i <= this.window; i++) {
            const expectedOTP = this.calculateHOTP(secret, timeCounter + i);
            if (this.constantTimeCompare(token, expectedOTP)) {
                return { valid: true, delta: i };
            }
        }
        
        return { valid: false, delta: null };
    }

    constantTimeCompare(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a.charCodeAt(i) ^ b.charCodeAt(i);
        }
        return result === 0;
    }

    base32ToBuffer(base32) {
        const base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = 0;
        let value = 0;
        const bytes = [];

        for (const char of base32.replace(/=+$/, '').toUpperCase()) {
            const val = base32Chars.indexOf(char);
            if (val === -1) continue;

            value = (value << 5) | val;
            bits += 5;

            if (bits >= 8) {
                bytes.push((value >>> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }

        return Buffer.from(bytes);
    }

    generateURI(secret, accountName) {
        const encodedIssuer = encodeURIComponent(this.issuer);
        const encodedAccount = encodeURIComponent(accountName);
        
        return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=${this.algorithm}&digits=${this.digits}&period=${this.period}`;
    }

    generateQRCodeDataURL(secret, accountName) {
        const otpauth = this.generateURI(secret, accountName);
        const qrData = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauth)}`;
        return qrData;
    }

    generateBackupCodes(count = 10) {
        const codes = [];
        for (let i = 0; i < count; i++) {
            const code = crypto.randomBytes(8).toString('hex').toUpperCase().match(/.{4}/g).join('-');
            codes.push(code);
        }
        return codes;
    }

    verifyBackupCode(storedCodes, providedCode) {
        const normalizedCode = providedCode.toUpperCase().replace(/-/g, '');
        const normalizedStoredCodes = storedCodes.map(code => code.replace(/-/g, '').toUpperCase());
        
        const index = normalizedStoredCodes.indexOf(normalizedCode);
        if (index !== -1) {
            storedCodes.splice(index, 1);
            return { valid: true, remainingCodes: storedCodes.length };
        }
        
        return { valid: false, remainingCodes: storedCodes.length };
    }
}

module.exports = new TOTPService();
