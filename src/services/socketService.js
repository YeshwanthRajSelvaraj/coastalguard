// ──────────────────────────────────────────────────────────────
// Socket Service — Real-Time WebSocket Client for CoastalGuard
//
// Provides a singleton Socket.IO connection that:
//   • Connects to the CoastalGuard server with user identity
//   • Fisherman: emits SOS events, receives acknowledgments
//   • Authority: receives real-time SOS broadcasts + missed alerts
//   • Auto-reconnects with exponential backoff
//   • Queues events while disconnected
//
// Usage:
//   import { getSocketService } from './socketService';
//   const socket = getSocketService();
//   socket.connect(user);
//   socket.onSOSReceived((alert) => { ... });
// ──────────────────────────────────────────────────────────────

const SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:3001';

// Connection states
export const CONNECTION_STATE = {
    DISCONNECTED: 'disconnected',
    CONNECTING: 'connecting',
    CONNECTED: 'connected',
    RECONNECTING: 'reconnecting',
    ERROR: 'error',
};

class SocketService {
    constructor() {
        this.socket = null;
        this.user = null;
        this.state = CONNECTION_STATE.DISCONNECTED;
        this._listeners = new Map();       // event → Set<callback>
        this._stateListeners = new Set();  // connection state change listeners
        this._pendingEvents = [];          // queued events while disconnected
        this._reconnectAttempts = 0;
        this._maxReconnectAttempts = 50;
        this._reconnectTimer = null;
        this._onlineUserCounts = { authority: 0, fisherman: 0 };
        this._latency = null;
        this._ioModule = null;              // lazy-loaded socket.io-client
    }

    // ─── Connection Management ─────────────────────────

    /**
     * Connect to the WebSocket server with user credentials.
     * @param {object} user - { id, role, fullName, boatNumber, policeId }
     */
    async connect(user) {
        if (!user || !user.id || !user.role) {
            console.error('[SocketService] Cannot connect: missing user data');
            return;
        }

        this.user = user;
        this._updateState(CONNECTION_STATE.CONNECTING);

        try {
            // Import socket.io-client from npm package
            if (!this._ioModule) {
                const { io } = await import('socket.io-client');
                this._ioModule = io;
            }

            const io = this._ioModule;

            // Disconnect previous socket if any
            if (this.socket) {
                this.socket.disconnect();
            }

            this.socket = io(SERVER_URL, {
                transports: ['websocket', 'polling'],
                reconnection: true,
                reconnectionAttempts: this._maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 10000,
                timeout: 10000,
                autoConnect: true,
            });

            this._setupEventHandlers();

        } catch (err) {
            console.error('[SocketService] Failed to initialize:', err);
            this._updateState(CONNECTION_STATE.ERROR);

            // Fallback: work without WebSocket (existing localStorage flow continues)
            console.warn('[SocketService] Falling back to localStorage-only mode');
        }
    }

    /**
     * Disconnect from the server.
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.user = null;
        this._updateState(CONNECTION_STATE.DISCONNECTED);
        this._reconnectAttempts = 0;
        if (this._reconnectTimer) {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }
    }

    // ─── Socket Event Handlers ─────────────────────────

    _setupEventHandlers() {
        const socket = this.socket;
        if (!socket) return;

        // ── Connection Events ────────────────────────
        socket.on('connect', () => {
            console.log(`[SocketService] ✅ Connected to server (id: ${socket.id})`);
            this._reconnectAttempts = 0;
            this._updateState(CONNECTION_STATE.CONNECTED);

            // Register user with server
            socket.emit('auth:register', {
                userId: this.user.id,
                role: this.user.role,
                fullName: this.user.fullName,
                boatNumber: this.user.boatNumber || null,
                policeId: this.user.policeId || null,
            });

            // Flush pending events
            this._flushPendingEvents();

            // Start latency monitoring
            this._startLatencyMonitor();
        });

        socket.on('connect_error', (err) => {
            console.warn(`[SocketService] Connection error: ${err.message}`);
            this._updateState(CONNECTION_STATE.ERROR);
        });

        socket.on('disconnect', (reason) => {
            console.log(`[SocketService] Disconnected: ${reason}`);
            this._updateState(CONNECTION_STATE.DISCONNECTED);
            this._stopLatencyMonitor();
        });

        socket.on('reconnect_attempt', (attempt) => {
            this._reconnectAttempts = attempt;
            this._updateState(CONNECTION_STATE.RECONNECTING);
            console.log(`[SocketService] Reconnecting... attempt ${attempt}`);
        });

        socket.on('reconnect', () => {
            console.log('[SocketService] ✅ Reconnected!');
            this._reconnectAttempts = 0;
            this._updateState(CONNECTION_STATE.CONNECTED);

            // Re-register after reconnect
            socket.emit('auth:register', {
                userId: this.user.id,
                role: this.user.role,
                fullName: this.user.fullName,
                boatNumber: this.user.boatNumber || null,
                policeId: this.user.policeId || null,
            });
        });

        // ── Auth Events ──────────────────────────────
        socket.on('auth:confirmed', (data) => {
            console.log(`[SocketService] Auth confirmed — role: ${data.role}, authorities online: ${data.authorityOnline}`);
            this._onlineUserCounts = {
                authority: data.authorityOnline,
                fisherman: data.fishermanOnline,
            };
            this._emit('auth:confirmed', data);
        });

        socket.on('auth:error', (data) => {
            console.error('[SocketService] Auth error:', data.message);
            this._emit('auth:error', data);
        });

        // ── SOS Events ───────────────────────────────

        // New SOS alert (received by authority)
        socket.on('sos:new', (data) => {
            console.log(`[SocketService] 🚨 New SOS received:`, data.alert?.id);
            this._emit('sos:new', data);
        });

        // Missed SOS alerts (delivered on reconnection)
        socket.on('sos:missed', (data) => {
            console.log(`[SocketService] 📦 ${data.count} missed alerts delivered`);
            this._emit('sos:missed', data);
        });

        // SOS acknowledgment (received by fisherman)
        socket.on('sos:acknowledged', (data) => {
            console.log(`[SocketService] ✅ SOS ${data.sosId} acknowledged by server`);
            this._emit('sos:acknowledged', data);
        });

        // SOS status update (broadcast to all)
        socket.on('sos:updated', (data) => {
            console.log(`[SocketService] SOS ${data.alert?.id} updated: ${data.alert?.status}`);
            this._emit('sos:updated', data);
        });

        // SOS error
        socket.on('sos:error', (data) => {
            console.error('[SocketService] SOS error:', data.message);
            this._emit('sos:error', data);
        });

        // ── User Count Updates ───────────────────────
        socket.on('users:count', (data) => {
            this._onlineUserCounts = data;
            this._emit('users:count', data);
        });

        // ── Location Updates (for authority) ─────────
        socket.on('location:updated', (data) => {
            this._emit('location:updated', data);
        });

        // ── Latency ──────────────────────────────────
        socket.on('pong:check', (data) => {
            this._latency = Date.now() - this._pingStart;
            this._emit('latency', { ms: this._latency, serverTime: data.serverTime });
        });
    }

    // ─── SOS Actions ───────────────────────────────────

    /**
     * Send SOS alert (fisherman only).
     * Queues if disconnected — delivered on reconnect.
     */
    sendSOS({ type = 'sos', location, clientSOSId, phone }) {
        const event = 'sos:send';
        const data = { type, location, clientSOSId, phone };

        if (this.isConnected()) {
            this.socket.emit(event, data);
        } else {
            console.warn('[SocketService] Not connected — queuing SOS for later delivery');
            this._pendingEvents.push({ event, data });
        }
    }

    /**
     * Acknowledge SOS (authority only).
     */
    acknowledgeSOSRemote(sosId) {
        if (this.isConnected()) {
            this.socket.emit('sos:acknowledge', { sosId });
        }
    }

    /**
     * Resolve SOS (authority only).
     */
    resolveSOSRemote(sosId) {
        if (this.isConnected()) {
            this.socket.emit('sos:resolve', { sosId });
        }
    }

    /**
     * Send location update (fisherman only).
     */
    sendLocationUpdate(location) {
        if (this.isConnected()) {
            this.socket.volatile.emit('location:update', { location });
        }
    }

    // ─── Event Subscription ────────────────────────────

    /**
     * Subscribe to a specific event.
     * @returns {function} Unsubscribe function
     */
    on(event, callback) {
        if (!this._listeners.has(event)) {
            this._listeners.set(event, new Set());
        }
        this._listeners.get(event).add(callback);
        return () => this._listeners.get(event)?.delete(callback);
    }

    /**
     * Subscribe to connection state changes.
     * @returns {function} Unsubscribe function
     */
    onStateChange(callback) {
        this._stateListeners.add(callback);
        // Immediately emit current state
        callback(this.state);
        return () => this._stateListeners.delete(callback);
    }

    // ─── Convenience Subscription Helpers ──────────────

    /** Subscribe to new SOS alerts (authority). */
    onSOSReceived(callback) { return this.on('sos:new', callback); }

    /** Subscribe to missed SOS alerts (authority, on reconnect). */
    onSOSMissed(callback) { return this.on('sos:missed', callback); }

    /** Subscribe to SOS acknowledgments (fisherman). */
    onSOSAcknowledged(callback) { return this.on('sos:acknowledged', callback); }

    /** Subscribe to SOS status updates (all). */
    onSOSUpdated(callback) { return this.on('sos:updated', callback); }

    /** Subscribe to user count changes. */
    onUserCountChange(callback) { return this.on('users:count', callback); }

    /** Subscribe to live location updates (authority). */
    onLocationUpdate(callback) { return this.on('location:updated', callback); }

    // ─── Status Getters ────────────────────────────────

    isConnected() {
        return this.socket?.connected === true;
    }

    getState() {
        return this.state;
    }

    getOnlineUsers() {
        return { ...this._onlineUserCounts };
    }

    getLatency() {
        return this._latency;
    }

    // ─── Internal Helpers ──────────────────────────────

    _emit(event, data) {
        const listeners = this._listeners.get(event);
        if (listeners) {
            listeners.forEach(cb => {
                try { cb(data); } catch (e) {
                    console.error(`[SocketService] Listener error for ${event}:`, e);
                }
            });
        }
    }

    _updateState(newState) {
        if (this.state === newState) return;
        const prev = this.state;
        this.state = newState;
        this._stateListeners.forEach(cb => {
            try { cb(newState, prev); } catch (e) {
                console.error('[SocketService] State listener error:', e);
            }
        });
    }

    _flushPendingEvents() {
        if (this._pendingEvents.length === 0) return;
        console.log(`[SocketService] Flushing ${this._pendingEvents.length} pending events...`);
        const events = [...this._pendingEvents];
        this._pendingEvents = [];
        for (const { event, data } of events) {
            this.socket.emit(event, data);
        }
    }

    _startLatencyMonitor() {
        this._stopLatencyMonitor();
        this._latencyInterval = setInterval(() => {
            if (this.isConnected()) {
                this._pingStart = Date.now();
                this.socket.emit('ping:check');
            }
        }, 15000); // Check every 15s
    }

    _stopLatencyMonitor() {
        if (this._latencyInterval) {
            clearInterval(this._latencyInterval);
            this._latencyInterval = null;
        }
    }
}

// ─── Singleton ───────────────────────────────────────────

let _instance = null;

export function getSocketService() {
    if (!_instance) {
        _instance = new SocketService();
    }
    return _instance;
}

export default SocketService;
