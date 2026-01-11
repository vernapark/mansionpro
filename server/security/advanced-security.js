// Advanced Security Module - Disabled (No-Op Middlewares)
// This build intentionally disables DDoS protection, social engineering detection,
// intrusion detection, location masking, and IP cloaking to avoid blocking local traffic.
// Keep Helmet and other standard Express protections.

const crypto = require('crypto');

class AdvancedSecurity {
    constructor() {
        // Keeping structure for compatibility
        this.blockedIPs = new Set();
        this.suspiciousActivities = new Map();
        this.attackAttempts = new Map();
        this.locationMasks = new Set();
    }

    // 1. SERVER FINGERPRINT OBFUSCATION (optional harmless headers)
    obfuscateServerFingerprint(app) {
        // Keep minimal header hardening, but do not fake stack to avoid confusion
        app.disable('x-powered-by');
    }

    // 2. ANTI-DDOS PROTECTION (Disabled)
    createDDoSProtection() {
        const pass = (req, res, next) => next();
        return {
            aggressive: pass,
            standard: pass,
            reputation: pass
        };
    }

    // 3. LOCATION & GEO MASKING (Disabled)
    setupLocationProtection(app) {
        app.use((req, res, next) => next());
    }

    // 4. SOCIAL ENGINEERING PROTECTION (Disabled)
    createSocialEngineeringProtection() {
        const pass = (req, res, next) => next();
        return {
            reconnaissance: pass,
            botDetection: pass,
            humanValidation: pass
        };
    }

    // 5. ADVANCED INTRUSION DETECTION (Disabled)
    setupIntrusionDetection(app) {
        app.use((req, res, next) => next());
    }

    // 6. REAL-TIME THREAT MONITORING (Disabled)
    setupThreatMonitoring(io) {
        // no-op
    }

    // 7. IP CLOAKING & ANONYMIZATION (Disabled)
    setupIPCloaking(app) {
        app.use((req, res, next) => next());
    }

    // Helper Methods (kept for compatibility if referenced)
    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] ||
               req.headers['x-real-ip'] ||
               req.connection?.remoteAddress ||
               req.socket?.remoteAddress ||
               '0.0.0.0';
    }

    getClientFingerprint(req) {
        const ip = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || '';
        const acceptLang = req.headers['accept-language'] || '';
        return crypto.createHash('md5').update(ip + userAgent + acceptLang).digest('hex');
    }

    trackSuspiciousActivity(ip, req) {
        // disabled
    }

    logSecurityIncident(type, req) {
        // disabled
    }
}

module.exports = new AdvancedSecurity();
