// Fixed monitoring.js - restructured to prevent timing issues

const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

class SecurityMonitoring {
    constructor() {
        this.threatDatabase = new Map();
        this.activeThreats = new Set();
        this.securityEvents = [];
        this.alertThresholds = {
            failedLogins: 5,
            suspiciousRequests: 10,
            ddosRequests: 100,
            malwareIndicators: 1
        };
        this.monitoringEnabled = true;
        this.logFile = path.join(__dirname, '../logs/security.log');
    }

    async initializeMonitoring() {
        console.log('🔒 Initializing Advanced Security Monitoring...');
        try { await fs.mkdir(path.dirname(this.logFile), { recursive: true }); } catch {}
        await this.loadThreatIntelligence();
        this.startThreatDetection();
        this.startPerformanceMonitoring();
        this.startAutoResponse();
        console.log('✅ Security Monitoring System Active');
    }

    async loadThreatIntelligence() {
        const knownThreats = [/^192\.42\.116\./, /^199\.87\.154\./, /^176\.10\.104\./, /^185\.220\./, /^77\.247\.181\./, /^192\.99\./, /^103\./, /^45\./, /^194\./];
        knownThreats.forEach(pattern => {
            this.threatDatabase.set(pattern.source, { type: 'suspicious_ip_pattern', severity: 'medium', description: 'Potentially malicious IP pattern' });
        });
        const malwareIndicators = ['eval(', 'base64_decode', 'shell_exec', 'system(', 'exec(', 'passthru', 'file_get_contents', 'curl_exec'];
        malwareIndicators.forEach(indicator => {
            this.threatDatabase.set(indicator, { type: 'malware_indicator', severity: 'high', description: 'Potential malware/exploit attempt' });
        });
    }

    startThreatDetection() {
        setInterval(() => {
            if (!this.monitoringEnabled) return;
            this.analyzeSecurityEvents();
            this.detectAnomalies();
            this.checkThreatIntelligence();
        }, 10000);
    }

    analyzeSecurityEvents() {
        try {
            const recent = this.getRecentEvents(60 * 1000);
            let failedLogins = 0;
            let suspiciousRequests = 0;
            for (const e of recent) {
                const p = e?.path || '';
                if (p.includes('/api/admin/login') && e.statusCode === 401) {
                    failedLogins++;
                }
                if ((e.alerts?.length || 0) > 0 || (e.suspiciousScore || 0) > 3) {
                    suspiciousRequests++;
                }
            }
            if (failedLogins >= this.alertThresholds.failedLogins) {
                this.logSecurityIncident({
                    type: 'failed_logins_threshold',
                    count: failedLogins,
                    timeWindow: '1_min',
                    timestamp: new Date().toISOString()
                });
            }
            if (suspiciousRequests >= this.alertThresholds.suspiciousRequests) {
                this.logSecurityIncident({
                    type: 'suspicious_requests_threshold',
                    count: suspiciousRequests,
                    timeWindow: '1_min',
                    timestamp: new Date().toISOString()
                });
            }
        } catch (err) {
            console.error('analyzeSecurityEvents error:', err?.message || err);
        }
    }

    detectAnomalies() {
        const recentEvents = this.getRecentEvents(300000);
        const ipCounts = {};
        const pathCounts = {};
        recentEvents.forEach(event => {
            ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1;
            pathCounts[event.path] = (pathCounts[event.path] || 0) + 1;
        });
        Object.entries(ipCounts).forEach(([ip, count]) => {
            if (count > 50) {
                this.logSecurityIncident({
                    type: 'potential_ddos',
                    ip,
                    requestCount: count,
                    timeWindow: '5_minutes',
                    timestamp: new Date().toISOString()
                });
            }
        });
        Object.entries(pathCounts).forEach(([path, count]) => {
            if (count > 100) {
                this.logSecurityIncident({
                    type: 'path_flooding',
                    path,
                    requestCount: count,
                    timeWindow: '5_minutes',
                    timestamp: new Date().toISOString()
                });
            }
        });
    }

    checkThreatIntelligence() {
        // Placeholder for threat intelligence updates
    }

    analyzeRequest(req, res, next) {
        const startTime = Date.now();
        const clientIP = this.getClientIP(req);
        const userAgent = req.headers['user-agent'] || '';
        const requestSignature = this.generateRequestSignature(req);
        const securityEvent = {
            id: crypto.randomBytes(16).toString('hex'),
            timestamp: new Date().toISOString(),
            ip: clientIP,
            userAgent,
            method: req.method,
            path: req.path,
            headers: { ...req.headers },
            signature: requestSignature,
            suspiciousScore: 0
        };
        this.performThreatAnalysis(securityEvent);
        this.storeSecurityEvent(securityEvent);
        req.securityEvent = securityEvent;
        next();
        res.on('finish', () => {
            securityEvent.responseTime = Date.now() - startTime;
            securityEvent.statusCode = res.statusCode;
            this.analyzeResponse(securityEvent, res);
        });
    }

    performThreatAnalysis(event) {
        let suspiciousScore = 0;
        const alerts = [];
        for (const [pattern, threat] of this.threatDatabase) {
            if (typeof pattern === 'string') {
                if (event.ip.includes(pattern)) {
                    suspiciousScore += this.getSeverityScore(threat.severity);
                    alerts.push(`IP matches threat pattern: ${threat.description}`);
                }
            } else if (pattern instanceof RegExp) {
                if (pattern.test(event.ip)) {
                    suspiciousScore += this.getSeverityScore(threat.severity);
                    alerts.push(`IP matches suspicious pattern: ${threat.description}`);
                }
            }
        }
        const requestBody = JSON.stringify({ path: event.path, userAgent: event.userAgent, headers: event.headers });
        for (const [indicator, threat] of this.threatDatabase) {
            if (threat.type === 'malware_indicator' && requestBody.includes(indicator)) {
                suspiciousScore += this.getSeverityScore(threat.severity);
                alerts.push(`Malware indicator detected: ${indicator}`);
            }
        }
        if (this.isSuspiciousUserAgent(event.userAgent)) {
            suspiciousScore += 3;
            alerts.push('Suspicious user agent detected');
        }
        if (this.isRapidRequest(event.ip)) {
            suspiciousScore += 5;
            alerts.push('Rapid requests detected - potential DDoS');
        }
        if (event.path.includes('../') || event.path.includes('..\\')) {
            suspiciousScore += 8;
            alerts.push('Directory traversal attempt detected');
        }
        if (this.containsSQLInjection(requestBody)) {
            suspiciousScore += 10;
            alerts.push('SQL injection attempt detected');
        }
        event.suspiciousScore = suspiciousScore;
        event.alerts = alerts;
        if (suspiciousScore >= 10) {
            this.handleHighRiskThreat(event);
        }
    }

    handleHighRiskThreat(event) {
        const threatId = `THREAT_${Date.now()}_${event.id.substring(0, 8)}`;
        console.log(`🚨 HIGH RISK THREAT DETECTED: ${threatId}`);
        console.log(`   IP: ${event.ip}`);
        console.log(`   Score: ${event.suspiciousScore}`);
        console.log(`   Alerts: ${event.alerts.join(', ')}`);
        this.activeThreats.add(event.ip);
        this.logSecurityIncident({
            threatId,
            type: 'high_risk_threat',
            ip: event.ip,
            score: event.suspiciousScore,
            alerts: event.alerts,
            timestamp: event.timestamp,
            action: 'auto_blocked'
        });
        setTimeout(() => {
            this.activeThreats.delete(event.ip);
            console.log(`🔓 Auto-unblocked IP: ${event.ip}`);
        }, 3600000);
    }

    getSecurityMetrics() {
        const recentEvents = this.securityEvents.filter(event => Date.now() - new Date(event.timestamp).getTime() < 3600000);
        return {
            totalEvents: this.securityEvents.length,
            recentEvents: recentEvents.length,
            activeThreats: this.activeThreats.size,
            averageSuspiciousScore: this.calculateAverageSuspiciousScore(recentEvents),
            topThreats: this.getTopThreats(recentEvents),
            threatsByType: this.getThreatsByType(recentEvents),
            blockedIPs: Array.from(this.activeThreats),
            systemHealth: this.getSystemHealth()
        };
    }

    getClientIP(req) {
        return req.headers['x-forwarded-for']?.split(',')[0] || req.headers['x-real-ip'] || req.connection?.remoteAddress || req.socket?.remoteAddress || '127.0.0.1';
    }

    generateRequestSignature(req) {
        const data = `${req.method}:${req.path}:${req.headers['user-agent']}`;
        return crypto.createHash('md5').update(data).digest('hex');
    }

    isSuspiciousUserAgent(userAgent) {
        const suspicious = ['sqlmap', 'nmap', 'nikto', 'dirb', 'gobuster', 'wget', 'curl', 'python-requests', 'scanner'];
        return suspicious.some(p => (userAgent || '').toLowerCase().includes(p));
    }

    isRapidRequest(ip) {
        const recentRequests = this.securityEvents.filter(event => event.ip === ip && Date.now() - new Date(event.timestamp).getTime() < 60000);
        return recentRequests.length > 10;
    }

    containsSQLInjection(text) {
        const sqlPatterns = [
            /(\b(select|insert|update|delete|drop|create|alter|exec|execute|union)\b)/i,
            /(\b(or|and)\b.*[=<>].*(\b(select|insert|update|delete|drop|create|alter|exec|execute|union)\b))/i,
            /(\'|\"|`).*(or|and).*(\=|<|>)/i
        ];
        return sqlPatterns.some(p => p.test(text));
    }

    getSeverityScore(severity) {
        const scores = { low: 1, medium: 3, high: 8, critical: 15 };
        return scores[severity] || 1;
    }

    storeSecurityEvent(event) {
        this.securityEvents.push(event);
        if (this.securityEvents.length > 10000) {
            this.securityEvents = this.securityEvents.slice(-5000);
        }
    }

    async logSecurityIncident(incident) {
        const logEntry = `${new Date().toISOString()} [SECURITY] ${JSON.stringify(incident)}\n`;
        try {
            await fs.appendFile(this.logFile, logEntry);
        } catch (error) {
            console.error('Failed to write security log:', error);
        }
    }

    getRecentEvents(timeWindow) {
        const cutoff = Date.now() - timeWindow;
        return this.securityEvents.filter(event => new Date(event.timestamp).getTime() > cutoff);
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            const memUsage = process.memoryUsage();
            if (memUsage.heapUsed > 500 * 1024 * 1024) {
                this.logSecurityIncident({
                    type: 'high_memory_usage',
                    memoryUsage: memUsage,
                    timestamp: new Date().toISOString()
                });
            }
        }, 30000);
    }

    startAutoResponse() {
        setInterval(() => {
            const oneHourAgo = Date.now() - 3600000;
            this.securityEvents = this.securityEvents.filter(event => new Date(event.timestamp).getTime() > oneHourAgo);
        }, 3600000);
    }

    isBlocked(ip) {
        const localSet = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
        const normalized = (ip || '').replace('::ffff:', '');
        if (localSet.has(ip) || localSet.has(normalized)) return false;
        return this.activeThreats.has(ip) || this.activeThreats.has(normalized);
    }

    blockIP(ip, reason = 'Manual block') {
        this.activeThreats.add(ip);
        this.logSecurityIncident({
            type: 'manual_ip_block',
            ip,
            reason,
            timestamp: new Date().toISOString()
        });
    }

    unblockIP(ip) {
        this.activeThreats.delete(ip);
        this.logSecurityIncident({
            type: 'manual_ip_unblock',
            ip,
            timestamp: new Date().toISOString()
        });
    }

    getSystemHealth() {
        return {
            status: 'operational',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            activeConnections: this.securityEvents.length
        };
    }

    calculateAverageSuspiciousScore(events) {
        if (events.length === 0) return 0;
        const sum = events.reduce((acc, e) => acc + (e.suspiciousScore || 0), 0);
        return (sum / events.length).toFixed(2);
    }

    getTopThreats(events) {
        const threats = {};
        events.forEach(e => {
            if (e.suspiciousScore > 5) threats[e.ip] = (threats[e.ip] || 0) + 1;
        });
        return Object.entries(threats).sort(([, a], [, b]) => b - a).slice(0, 10).map(([ip, count]) => ({ ip, count }));
    }

    getThreatsByType(events) {
        const types = {};
        events.forEach(e => {
            (e.alerts || []).forEach(alert => {
                types[alert] = (types[alert] || 0) + 1;
            });
        });
        return types;
    }

    analyzeResponse(event, res) {
        const contentType = res.getHeader('content-type') || '';
        if (contentType.includes('application/json') && res.statusCode === 500) {
            this.logSecurityIncident({
                type: 'potential_info_disclosure',
                ip: event.ip,
                path: event.path,
                statusCode: res.statusCode,
                timestamp: new Date().toISOString()
            });
        }
    }
}

// Create singleton instance
const monitoringInstance = new SecurityMonitoring();

// Initialize after export to ensure all methods are defined
setImmediate(() => {
    monitoringInstance.initializeMonitoring().catch(err => {
        console.error('Failed to initialize security monitoring:', err);
    });
});

module.exports = monitoringInstance;
