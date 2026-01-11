// JWT Authentication Middleware (Production-Grade)
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const database = require('../config/database');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';
const SESSION_TIMEOUT_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS) || 24;
const MAX_FAILED_ATTEMPTS = parseInt(process.env.MAX_FAILED_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION_MINUTES = parseInt(process.env.LOCKOUT_DURATION_MINUTES) || 30;

// Generate JWT token
function generateToken(user) {
    return jwt.sign(
        {
            id: user.id,
            username: user.username,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: `${SESSION_TIMEOUT_HOURS}h` }
    );
}

// Verify JWT token
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Authenticate admin login
async function authenticateAdmin(username, password) {
    try {
        // Get user from database
        const user = await database.getAdminUser(username);
        
        if (!user) {
            logger.logSecurity('Login attempt - user not found', { username });
            return { success: false, error: 'Invalid credentials' };
        }
        
        // Check if account is locked
        if (user.locked_until) {
            const lockedUntil = new Date(user.locked_until);
            if (lockedUntil > new Date()) {
                const minutesLeft = Math.ceil((lockedUntil - new Date()) / 60000);
                logger.logSecurity('Login attempt - account locked', { username, minutesLeft });
                return {
                    success: false,
                    error: `Account locked. Try again in ${minutesLeft} minutes.`
                };
            } else {
                // Lock expired, reset
                await database.updateFailedLoginAttempts(username, 0, null);
            }
        }
        
        // Check if account is active
        if (!user.is_active) {
            logger.logSecurity('Login attempt - account disabled', { username });
            return { success: false, error: 'Account is disabled' };
        }
        
        // Verify password
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (!isValid) {
            // Increment failed attempts
            const failedAttempts = user.failed_login_attempts + 1;
            
            if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
                // Lock account
                const lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60000);
                await database.updateFailedLoginAttempts(username, failedAttempts, lockedUntil.toISOString());
                
                logger.logSecurity('Account locked due to failed attempts', {
                    username,
                    attempts: failedAttempts
                });
                
                return {
                    success: false,
                    error: `Account locked for ${LOCKOUT_DURATION_MINUTES} minutes due to multiple failed attempts.`
                };
            } else {
                await database.updateFailedLoginAttempts(username, failedAttempts);
                
                logger.logSecurity('Failed login attempt', {
                    username,
                    attempts: failedAttempts,
                    remaining: MAX_FAILED_ATTEMPTS - failedAttempts
                });
                
                return {
                    success: false,
                    error: `Invalid credentials. ${MAX_FAILED_ATTEMPTS - failedAttempts} attempts remaining.`
                };
            }
        }
        
        // Success - update last login and reset failed attempts
        await database.updateLastLogin(username);
        
        // Generate token
        const token = generateToken(user);
        
        logger.info('Admin login successful', { username });
        
        return {
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        };
        
    } catch (error) {
        logger.error('Authentication error:', error);
        return { success: false, error: 'Authentication failed' };
    }
}

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    req.user = decoded;
    next();
}

// Create default admin user if not exists
async function ensureDefaultAdmin() {
    try {
        const adminExists = await database.getAdminUser(process.env.ADMIN_USERNAME || 'admin');
        
        if (!adminExists) {
            const passwordHash = process.env.ADMIN_PASSWORD_HASH || 
                                await bcrypt.hash('admin123', 10);
            
            await database.createAdminUser(
                process.env.ADMIN_USERNAME || 'admin',
                passwordHash
            );
            
            logger.warn('Default admin user created. CHANGE PASSWORD IN PRODUCTION!');
        }
    } catch (error) {
        logger.error('Error creating default admin:', error);
    }
}

module.exports = {
    generateToken,
    verifyToken,
    authenticateAdmin,
    authenticateToken,
    ensureDefaultAdmin
};
