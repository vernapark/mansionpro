// Live Visitor Display Component for Admin Panel
// ============================================
// LIVE VISITOR TRACKING DISPLAY
// ============================================
// FIXED VERSION - Proper null checking and race condition handling

// Live visitors storage
let liveVisitors = [];
let isInitialized = false;
let initializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 30; // 30 seconds maximum wait

// Create live visitor display container
function createLiveVisitorDisplay() {
    // Check if already exists
    if (document.getElementById('liveVisitorTracker')) {
        console.log('Visitor display already exists, skipping creation');
        return document.getElementById('liveVisitorTracker');
    }
    
    // Create container in top-right corner
    const visitorContainer = document.createElement('div');
    visitorContainer.id = 'liveVisitorTracker';
    visitorContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 350px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        pointer-events: none;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        color: #FF0000;
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 8px;
        background: transparent;
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
    `;
    header.innerHTML = '🔴 Live Billdesk Visitors';
    
    // Create visitor list container
    const visitorList = document.createElement('div');
    visitorList.id = 'visitorList';
    visitorList.style.cssText = `
        background: transparent;
        max-height: 300px;
        overflow-y: auto;
    `;
    
    visitorContainer.appendChild(header);
    visitorContainer.appendChild(visitorList);
    
    // Add to page
    document.body.appendChild(visitorContainer);
    
    console.log('✅ Visitor display container created');
    return visitorContainer;
}

// Format timestamp for display
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}

// Create visitor entry element
function createVisitorEntry(visitor) {
    const entry = document.createElement('div');
    entry.id = `visitor-${visitor.visitorId}`;
    entry.style.cssText = `
        color: #FF0000;
        font-size: 12px;
        line-height: 1.4;
        margin-bottom: 6px;
        background: transparent;
        padding: 4px 0;
        border-bottom: 1px solid rgba(255,0,0,0.2);
        text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        opacity: ${visitor.hidden ? '0.6' : '1'};
    `;
    
    entry.innerHTML = `
        <div style="font-weight: bold;">IP: ${visitor.ip}</div>
        <div>ISP: ${visitor.isp}</div>
        <div>Time: ${formatTimestamp(visitor.timestamp)}</div>
    `;
    
    return entry;
}

// Update visitor display
function updateVisitorDisplay() {
    const visitorList = document.getElementById('visitorList');
    if (!visitorList) {
        console.warn('Visitor list element not found');
        return;
    }
    
    // Clear existing entries
    visitorList.innerHTML = '';
    
    // Add current visitors
    if (liveVisitors.length === 0) {
        const noVisitors = document.createElement('div');
        noVisitors.style.cssText = `
            color: #FF0000;
            font-size: 12px;
            font-style: italic;
            background: transparent;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
        `;
        noVisitors.textContent = 'No active visitors';
        visitorList.appendChild(noVisitors);
    } else {
        liveVisitors.forEach(visitor => {
            const entry = createVisitorEntry(visitor);
            visitorList.appendChild(entry);
        });
    }
}

// Handle visitor updates from server
function handleVisitorUpdate(data) {
    console.log('👁️ Visitor update received:', data);
    
    switch (data.type) {
        case 'enter':
        case 'exit':
        case 'disconnect':
            // Full update
            liveVisitors = data.visitors || [];
            updateVisitorDisplay();
            break;
            
        case 'hidden':
        case 'visible':
            // Update specific visitor
            const visitorIndex = liveVisitors.findIndex(v => v.visitorId === data.visitorId);
            if (visitorIndex !== -1 && data.visitors) {
                const updatedVisitor = data.visitors.find(v => v.visitorId === data.visitorId);
                if (updatedVisitor) {
                    liveVisitors[visitorIndex] = updatedVisitor;
                    updateVisitorDisplay();
                }
            }
            break;
    }
}

// Initialize live visitor tracking in admin panel
function initializeLiveVisitorTracking() {
    // Prevent double initialization
    if (isInitialized) {
        console.log('Visitor tracking already initialized, skipping');
        return;
    }
    
    console.log('🔄 Attempting to initialize live visitor tracking...');
    
    // Enhanced socket check - verify socket exists, is not null, and has required methods
    if (!window.socket) {
        console.warn('⚠️ window.socket is not defined yet');
        return false;
    }
    
    if (window.socket === null) {
        console.warn('⚠️ window.socket is null');
        return false;
    }
    
    if (typeof window.socket.on !== 'function') {
        console.warn('⚠️ window.socket.on is not a function');
        return false;
    }
    
    if (typeof window.socket.emit !== 'function') {
        console.warn('⚠️ window.socket.emit is not a function');
        return false;
    }
    
    // Check if socket is connected
    if (!window.socket.connected) {
        console.warn('⚠️ Socket exists but is not connected yet');
        return false;
    }
    
    try {
        // Create display container
        createLiveVisitorDisplay();
        
        // Set up WebSocket listener for visitor updates
        window.socket.on('billdesk_visitor_update', handleVisitorUpdate);
        console.log('✅ Socket listener registered for billdesk_visitor_update');
        
        // Request current visitor list on connect
        window.socket.emit('get_billdesk_visitors');
        console.log('✅ Requested initial visitor list');
        
        isInitialized = true;
        console.log('✅ Live visitor tracking fully initialized');
        return true;
        
    } catch (error) {
        console.error('❌ Error initializing visitor tracking:', error);
        return false;
    }
}

// Auto-initialize when DOM is ready AND socket is available
function waitForSocketAndInitialize() {
    initializationAttempts++;
    
    console.log(`🔍 Checking for socket (attempt ${initializationAttempts}/${MAX_INIT_ATTEMPTS})...`);
    
    // Try to initialize
    const success = initializeLiveVisitorTracking();
    
    if (success) {
        console.log('✅ Visitor tracking initialization successful!');
        return;
    }
    
    // Check if we've exceeded max attempts
    if (initializationAttempts >= MAX_INIT_ATTEMPTS) {
        console.warn('⚠️ Max initialization attempts reached. Visitor tracking disabled.');
        console.warn('This is not critical - admin panel will still work without visitor tracking.');
        return;
    }
    
    // Retry after 1 second if socket not ready yet
    console.log('⏳ Socket not ready, retrying in 1 second...');
    setTimeout(waitForSocketAndInitialize, 1000);
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📄 DOM loaded, starting visitor tracking initialization...');
        waitForSocketAndInitialize();
    });
} else {
    console.log('📄 DOM already loaded, starting visitor tracking initialization...');
    waitForSocketAndInitialize();
}

// Also listen for a custom socket ready event (if admin.js dispatches it)
window.addEventListener('socketReady', () => {
    console.log('🔌 Socket ready event received');
    if (!isInitialized) {
        initializeLiveVisitorTracking();
    }
});
