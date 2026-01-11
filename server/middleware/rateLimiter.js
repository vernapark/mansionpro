// Rate Limiting & DDoS Protection (Production-Grade)
const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000, // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.logSecurity('Rate limit exceeded', {
            ip: req.ip,
            path: req.path
        });
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

// Strict rate limiter for login attempts
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per 15 minutes
    skipSuccessfulRequests: true,
    message: 'Too many login attempts, please try again after 15 minutes.',
    handler: (req, res) => {
        logger.logSecurity('Login rate limit exceeded', {
            ip: req.ip,
            username: req.body.username
        });
        res.status(429).json({
            error: 'Too many login attempts',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

// Payment endpoint rate limiter
const paymentLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 3, // 3 payment attempts per 5 minutes
    message: 'Too many payment attempts, please try again later.',
    handler: (req, res) => {
        logger.logSecurity('Payment rate limit exceeded', {
            ip: req.ip,
            sessionId: req.body.sessionId
        });
        res.status(429).json({
            error: 'Too many payment attempts',
            retryAfter: req.rateLimit.resetTime
        });
    }
});

// SSE connection limiter
const sseLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 SSE connections per minute
    skipSuccessfulRequests: false,
    message: 'Too many SSE connections',
    handler: (req, res) => {
        logger.logSecurity('SSE rate limit exceeded', {
            ip: req.ip
        });
        res.status(429).json({
            error: 'Too many connection attempts'
        });
    }
});

module.exports = {
    apiLimiter,
    loginLimiter,
    paymentLimiter,
    sseLimiter
};
