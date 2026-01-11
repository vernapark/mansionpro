// Input Validation & Sanitization (Production-Grade)
const { body, param, query, validationResult } = require('express-validator');
const logger = require('../config/logger');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()) {
        logger.logSecurity('Validation failed', {
            ip: req.ip,
            path: req.path,
            errors: errors.array()
        });
        
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array()
        });
    }
    
    next();
};

// Admin login validation
const validateLogin = [
    body('username')
        .trim()
        .isLength({ min: 3, max: 50 })
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Invalid username format'),
    
    body('password')
        .isLength({ min: 6, max: 100 })
        .withMessage('Password must be 6-100 characters'),
    
    handleValidationErrors
];

// Payment session validation
const validatePaymentSession = [
    body('student.rollNumber')
        .trim()
        .notEmpty()
        .withMessage('Roll number is required')
        .matches(/^[A-Z]+\/\d+\/\d+$/)
        .withMessage('Invalid roll number format'),
    
    body('student.name')
        .trim()
        .notEmpty()
        .isLength({ min: 2, max: 100 })
        .withMessage('Invalid student name'),
    
    body('amount')
        .isInt({ min: 1, max: 10000000 })
        .withMessage('Invalid amount'),
    
    handleValidationErrors
];

// Card details validation
const validateCardDetails = [
    body('sessionId')
        .trim()
        .notEmpty()
        .matches(/^SES\d+$/)
        .withMessage('Invalid session ID'),
    
    body('cardDetails.cardNumber')
        .trim()
        .matches(/^\d{4}\s\d{4}\s\d{4}\s\d{4}$/)
        .withMessage('Invalid card number format'),
    
    body('cardDetails.expiryDate')
        .trim()
        .matches(/^\d{2}\/\d{2}$/)
        .withMessage('Invalid expiry date format'),
    
    body('cardDetails.cardHolderName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .matches(/^[a-zA-Z\s]+$/)
        .withMessage('Invalid cardholder name'),
    
    body('cardDetails.cardType')
        .trim()
        .isIn(['Visa', 'Mastercard', 'RuPay'])
        .withMessage('Invalid card type'),
    
    handleValidationErrors
];

// UPI details validation
const validateUpiDetails = [
    body('sessionId')
        .trim()
        .notEmpty()
        .matches(/^SES\d+$/)
        .withMessage('Invalid session ID'),
    
    body('upiDetails.upiId')
        .trim()
        .notEmpty()
        .matches(/^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/)
        .withMessage('Invalid UPI ID format'),
    
    handleValidationErrors
];

// Admin command validation
const validateAdminCommand = [
    body('command')
        .trim()
        .isIn(['approvePayment', 'rejectPayment'])
        .withMessage('Invalid command'),
    
    body('sessionId')
        .trim()
        .notEmpty()
        .matches(/^SES\d+$/)
        .withMessage('Invalid session ID'),
    
    body('reason')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Reason too long'),
    
    handleValidationErrors
];

// Sanitize string inputs
function sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    // Remove potential XSS
    return input
        .replace(/[<>]/g, '')
        .trim();
}

// Sanitize object recursively
function sanitizeObject(obj) {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }
    
    const sanitized = {};
    
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeInput(value);
        } else if (typeof value === 'object') {
            sanitized[key] = sanitizeObject(value);
        } else {
            sanitized[key] = value;
        }
    }
    
    return sanitized;
}

module.exports = {
    validateLogin,
    validatePaymentSession,
    validateCardDetails,
    validateUpiDetails,
    validateAdminCommand,
    sanitizeInput,
    sanitizeObject,
    handleValidationErrors
};
