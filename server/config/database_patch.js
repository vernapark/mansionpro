// ADD THIS METHOD TO database.js in the Database class (after updateSubmissionStatus method around line 170)

async markCommandExecuted(sessionId) {
    this.db.get('cardSubmissions')
        .find({ sessionId })
        .assign({ 
            commandExecuted: true,
            commandExecutedAt: new Date().toISOString(),
            updated_at: new Date().toISOString()
        })
        .write();
    
    console.log('[DATABASE] Command marked as executed for:', sessionId);
    return Promise.resolve();
}
