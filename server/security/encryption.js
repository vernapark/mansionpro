// Advanced Encryption & Data Protection Module
// Protects all sensitive data with military-grade encryption

const crypto = require('crypto');

class AdvancedEncryption {
    constructor() {
        this.algorithm = 'aes-256-gcm';
        this.keyLength = 32;
        this.ivLength = 16;
        this.saltLength = 64;
        this.tagLength = 16;
        this.iterations = 100000;
        
        // Generate or use existing encryption key
        this.masterKey = this.deriveKey(process.env.ENCRYPTION_KEY || this.generateSecureKey());
    }

    // 1. SECURE KEY GENERATION
    generateSecureKey(length = 64) {
        return crypto.randomBytes(length).toString('hex');
    }

    deriveKey(password) {
        const salt = crypto.createHash('sha256').update('SMS_VARANASI_SALT_2024').digest();
        return crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha512');
    }

    // 2. DATA ENCRYPTION (AES-256-GCM)
    encrypt(text) {
        if (!text) return null;
        
        try {
            const iv = crypto.randomBytes(this.ivLength);
            const cipher = crypto.createCipher(this.algorithm, this.masterKey, iv);
            
            let encrypted = cipher.update(text, 'utf8', 'hex');
            encrypted += cipher.final('hex');
            
            const authTag = cipher.getAuthTag();
            
            // Combine IV + AuthTag + Encrypted Data
            return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }

    // 3. DATA DECRYPTION
    decrypt(encryptedData) {
        if (!encryptedData) return null;
        
        try {
            const parts = encryptedData.split(':');
            if (parts.length !== 3) return null;
            
            const iv = Buffer.from(parts[0], 'hex');
            const authTag = Buffer.from(parts[1], 'hex');
            const encrypted = parts[2];
            
            const decipher = crypto.createDecipher(this.algorithm, this.masterKey, iv);
            decipher.setAuthTag(authTag);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // 4. SECURE PASSWORD HASHING
    hashPassword(password) {
        const salt = crypto.randomBytes(this.saltLength);
        const hash = crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha512');
        return salt.toString('hex') + ':' + hash.toString('hex');
    }

    verifyPassword(password, hashedPassword) {
        try {
            const parts = hashedPassword.split(':');
            const salt = Buffer.from(parts[0], 'hex');
            const hash = Buffer.from(parts[1], 'hex');
            const verifyHash = crypto.pbkdf2Sync(password, salt, this.iterations, this.keyLength, 'sha512');
            return crypto.timingSafeEqual(hash, verifyHash);
        } catch (error) {
            return false;
        }
    }

    // 5. SECURE SESSION TOKENS
    generateSecureToken(length = 32) {
        return crypto.randomBytes(length).toString('base64url');
    }

    // 6. DATA ANONYMIZATION
    anonymizeData(data) {
        const anonymized = { ...data };
        
        // Anonymize sensitive fields
        if (anonymized.cardNumber) {
            anonymized.cardNumber = this.maskCardNumber(anonymized.cardNumber);
        }
        if (anonymized.cvv) {
            anonymized.cvv = '***';
        }
        if (anonymized.upiId) {
            anonymized.upiId = this.maskUPIId(anonymized.upiId);
        }
        if (anonymized.phone) {
            anonymized.phone = this.maskPhone(anonymized.phone);
        }
        
        return anonymized;
    }

    // 7. SECURE DATA TRANSMISSION
    encryptForTransmission(data) {
        const jsonString = JSON.stringify(data);
        const compressed = this.compress(jsonString);
        const encrypted = this.encrypt(compressed);
        
        return {
            payload: encrypted,
            checksum: this.generateChecksum(encrypted),
            timestamp: Date.now()
        };
    }

    decryptFromTransmission(transmissionData) {
        try {
            // Verify checksum
            if (this.generateChecksum(transmissionData.payload) !== transmissionData.checksum) {
                throw new Error('Data integrity check failed');
            }
            
            const decrypted = this.decrypt(transmissionData.payload);
            const decompressed = this.decompress(decrypted);
            return JSON.parse(decompressed);
        } catch (error) {
            console.error('Transmission decryption error:', error);
            return null;
        }
    }

    // Helper Methods
    maskCardNumber(cardNumber) {
        if (!cardNumber || cardNumber.length < 4) return '****';
        return '**** **** **** ' + cardNumber.slice(-4);
    }

    maskUPIId(upiId) {
        if (!upiId) return '****@****';
        const parts = upiId.split('@');
        if (parts.length !== 2) return '****@****';
        return parts[0].substring(0, 2) + '****@' + parts[1];
    }

    maskPhone(phone) {
        if (!phone || phone.length < 4) return '****';
        return '****-****-' + phone.slice(-4);
    }

    generateChecksum(data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    compress(data) {
        // Simple compression - in production, use proper compression library
        return Buffer.from(data, 'utf8').toString('base64');
    }

    decompress(data) {
        return Buffer.from(data, 'base64').toString('utf8');
    }

    // 8. SECURE RANDOM GENERATION
    generateSecureOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            const randomIndex = crypto.randomInt(0, digits.length);
            otp += digits[randomIndex];
        }
        
        return otp;
    }

    // 9. FILE ENCRYPTION
    encryptFile(filePath, outputPath) {
        try {
            const fs = require('fs');
            const fileData = fs.readFileSync(filePath, 'utf8');
            const encrypted = this.encrypt(fileData);
            fs.writeFileSync(outputPath, encrypted);
            return true;
        } catch (error) {
            console.error('File encryption error:', error);
            return false;
        }
    }

    decryptFile(encryptedPath, outputPath) {
        try {
            const fs = require('fs');
            const encryptedData = fs.readFileSync(encryptedPath, 'utf8');
            const decrypted = this.decrypt(encryptedData);
            fs.writeFileSync(outputPath, decrypted);
            return true;
        } catch (error) {
            console.error('File decryption error:', error);
            return false;
        }
    }

    // 10. SECURE MEMORY CLEANUP
    secureCleanup(sensitiveData) {
        if (typeof sensitiveData === 'string') {
            // Overwrite string data
            for (let i = 0; i < sensitiveData.length; i++) {
                sensitiveData = sensitiveData.substring(0, i) + '\0' + sensitiveData.substring(i + 1);
            }
        } else if (Buffer.isBuffer(sensitiveData)) {
            sensitiveData.fill(0);
        } else if (typeof sensitiveData === 'object') {
            for (const key in sensitiveData) {
                if (typeof sensitiveData[key] === 'string') {
                    sensitiveData[key] = '\0'.repeat(sensitiveData[key].length);
                }
            }
        }
    }
}

module.exports = new AdvancedEncryption();