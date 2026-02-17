// ──────────────────────────────────────────────
// Network Detector — Connectivity Monitoring
// Detects available communication channels and
// monitors connectivity state changes in real-time.
// ──────────────────────────────────────────────

const CONNECTIVITY_CHECK_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_URL = 'https://httpbin.org/status/200';

export const CONNECTIVITY_STATE = {
    ONLINE: 'online',
    OFFLINE: 'offline',
    DEGRADED: 'degraded',   // some channels available but unreliable
};

export class NetworkDetector {
    constructor() {
        this._state = navigator.onLine ? CONNECTIVITY_STATE.ONLINE : CONNECTIVITY_STATE.OFFLINE;
        this._listeners = new Set();
        this._checkInterval = null;
        this._lastHeartbeat = null;
        this._latencyMs = null;

        // Channel availability cache
        this._channelStatus = {
            internet: false,
            satellite: false,
            ais: false,
        };

        this._init();
    }

    /**
     * Initialize browser event listeners for online/offline.
     */
    _init() {
        window.addEventListener('online', () => this._onConnectivityChange(true));
        window.addEventListener('offline', () => this._onConnectivityChange(false));

        // Periodic heartbeat check
        this._checkInterval = setInterval(() => this._heartbeatCheck(), CONNECTIVITY_CHECK_INTERVAL);

        // Initial check
        this._heartbeatCheck();
    }

    /**
     * Handle browser connectivity change events.
     */
    _onConnectivityChange(isOnline) {
        const newState = isOnline ? CONNECTIVITY_STATE.ONLINE : CONNECTIVITY_STATE.OFFLINE;
        if (newState !== this._state) {
            this._state = newState;
            this._channelStatus.internet = isOnline;
            this._notifyListeners();
        }

        // If we just came online, do a heartbeat to verify
        if (isOnline) {
            this._heartbeatCheck();
        }
    }

    /**
     * Active connectivity verification — attempt actual network request.
     * This catches cases where navigator.onLine reports true but
     * there's no actual internet (e.g., connected to WiFi without WAN).
     */
    async _heartbeatCheck() {
        const start = Date.now();

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 5000);

            await fetch(HEARTBEAT_URL, {
                method: 'HEAD',
                mode: 'no-cors',
                cache: 'no-store',
                signal: controller.signal,
            });

            clearTimeout(timeout);
            this._latencyMs = Date.now() - start;
            this._lastHeartbeat = new Date().toISOString();

            const prevState = this._state;
            this._state = this._latencyMs > 5000
                ? CONNECTIVITY_STATE.DEGRADED
                : CONNECTIVITY_STATE.ONLINE;
            this._channelStatus.internet = true;

            if (prevState !== this._state) {
                this._notifyListeners();
            }
        } catch {
            const prevState = this._state;
            this._latencyMs = null;

            if (!navigator.onLine) {
                this._state = CONNECTIVITY_STATE.OFFLINE;
                this._channelStatus.internet = false;
            } else {
                // navigator says online but fetch failed → degraded
                this._state = CONNECTIVITY_STATE.DEGRADED;
                this._channelStatus.internet = false;
            }

            if (prevState !== this._state) {
                this._notifyListeners();
            }
        }
    }

    /**
     * Update channel availability status.
     * Called by SOSEngine after probing each channel.
     */
    updateChannelStatus(channelName, isAvailable) {
        if (channelName in this._channelStatus) {
            this._channelStatus[channelName] = isAvailable;
        }
    }

    /**
     * Get current connectivity state.
     */
    getState() {
        return {
            state: this._state,
            isOnline: this._state !== CONNECTIVITY_STATE.OFFLINE,
            isFullyOnline: this._state === CONNECTIVITY_STATE.ONLINE,
            isDegraded: this._state === CONNECTIVITY_STATE.DEGRADED,
            latencyMs: this._latencyMs,
            lastHeartbeat: this._lastHeartbeat,
            channels: { ...this._channelStatus },
            anyChannelAvailable: Object.values(this._channelStatus).some(Boolean),
        };
    }

    /**
     * Get the best available channel name (in priority order).
     * @returns {string|null}
     */
    getBestChannel() {
        if (this._channelStatus.internet) return 'internet';
        if (this._channelStatus.satellite) return 'satellite';
        if (this._channelStatus.ais) return 'ais';
        return null;
    }

    /**
     * Subscribe to connectivity state changes.
     * @param {Function} callback - (state) => void
     * @returns {Function} unsubscribe
     */
    subscribe(callback) {
        this._listeners.add(callback);
        // Immediately call with current state
        callback(this.getState());
        return () => this._listeners.delete(callback);
    }

    /**
     * Notify all listeners of state change.
     */
    _notifyListeners() {
        const state = this.getState();
        this._listeners.forEach(cb => {
            try { cb(state); } catch (e) { console.error('[NetworkDetector] Listener error:', e); }
        });
    }

    /**
     * Force an immediate connectivity check.
     */
    async forceCheck() {
        await this._heartbeatCheck();
        return this.getState();
    }

    /**
     * Cleanup intervals and listeners.
     */
    destroy() {
        if (this._checkInterval) {
            clearInterval(this._checkInterval);
        }
        this._listeners.clear();
    }
}

// Singleton instance
let _instance = null;
export function getNetworkDetector() {
    if (!_instance) {
        _instance = new NetworkDetector();
    }
    return _instance;
}
