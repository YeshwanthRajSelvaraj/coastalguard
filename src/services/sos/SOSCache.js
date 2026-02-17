// ──────────────────────────────────────────────
// SOS Cache — Offline-First Storage
// Persists SOS messages to localStorage (IndexedDB-backed
// in production) for guaranteed delivery even when all
// communication channels are unavailable.
//
// Features:
// - FIFO queue for pending SOS messages
// - Full delivery history log
// - Auto-flush when connectivity is restored
// - Cross-tab synchronization via storage events
// ──────────────────────────────────────────────

const SOS_QUEUE_KEY = 'cg_sos_queue';
const SOS_HISTORY_KEY = 'cg_sos_history';
const SOS_COUNTER_KEY = 'cg_sos_counter';
const MAX_HISTORY = 100;  // Keep last 100 SOS records

export const SOS_STATUS = {
    QUEUED: 'queued',
    SENDING: 'sending',
    DELIVERED: 'delivered',
    CACHED: 'cached',       // All channels failed, waiting for retry
    FAILED: 'failed',       // Max retries exhausted
};

export class SOSCache {
    constructor() {
        this._listeners = new Set();

        // Listen for cross-tab changes
        window.addEventListener('storage', (e) => {
            if (e.key === SOS_QUEUE_KEY || e.key === SOS_HISTORY_KEY) {
                this._notifyListeners();
            }
        });
    }

    // ─── SOS ID Generation ──────────────────────────

    _generateId() {
        const counter = parseInt(localStorage.getItem(SOS_COUNTER_KEY) || '0', 10) + 1;
        localStorage.setItem(SOS_COUNTER_KEY, String(counter));
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        return `SOS-${date}-${String(counter).padStart(4, '0')}`;
    }

    // ─── Queue Operations (Pending SOS) ──────────────

    /**
     * Add a new SOS to the queue.
     * Called immediately when fisherman triggers SOS — before any channel attempt.
     */
    enqueue(sosData) {
        const queue = this._getQueue();
        const sos = {
            id: this._generateId(),
            ...sosData,
            status: SOS_STATUS.QUEUED,
            triggeredAt: new Date().toISOString(),
            cachedAt: new Date().toISOString(),
            delivery: {
                channel: null,
                attempts: 0,
                lastAttempt: null,
                history: [],
            },
            acknowledgedAt: null,
            resolvedAt: null,
        };

        queue.push(sos);
        this._saveQueue(queue);
        this._notifyListeners();
        return sos;
    }

    /**
     * Get the next pending SOS in FIFO order.
     */
    peek() {
        const queue = this._getQueue();
        return queue.find(s =>
            s.status === SOS_STATUS.QUEUED || s.status === SOS_STATUS.CACHED
        ) || null;
    }

    /**
     * Get all pending (undelivered) SOS messages.
     */
    getPending() {
        return this._getQueue().filter(s =>
            s.status === SOS_STATUS.QUEUED ||
            s.status === SOS_STATUS.CACHED ||
            s.status === SOS_STATUS.SENDING
        );
    }

    /**
     * Update the status of an SOS in the queue.
     */
    updateStatus(sosId, status, deliveryInfo = {}) {
        const queue = this._getQueue();
        const idx = queue.findIndex(s => s.id === sosId);
        if (idx === -1) return null;

        queue[idx].status = status;
        queue[idx].delivery = {
            ...queue[idx].delivery,
            ...deliveryInfo,
        };

        if (status === SOS_STATUS.DELIVERED) {
            queue[idx].deliveredAt = new Date().toISOString();
            // Move to history
            this._addToHistory(queue[idx]);
            queue.splice(idx, 1);
        } else if (status === SOS_STATUS.FAILED) {
            this._addToHistory(queue[idx]);
            queue.splice(idx, 1);
        }

        this._saveQueue(queue);
        this._notifyListeners();
        return queue[idx] || null;
    }

    /**
     * Record a delivery attempt for an SOS.
     */
    recordAttempt(sosId, channelName, success, error = null, meta = {}) {
        const queue = this._getQueue();
        const idx = queue.findIndex(s => s.id === sosId);
        if (idx === -1) return;

        const attempt = {
            channel: channelName,
            status: success ? 'delivered' : 'failed',
            at: new Date().toISOString(),
            error,
            ...meta,
        };

        queue[idx].delivery.history.push(attempt);
        queue[idx].delivery.attempts++;
        queue[idx].delivery.lastAttempt = new Date().toISOString();

        if (success) {
            queue[idx].delivery.channel = channelName;
        }

        this._saveQueue(queue);
    }

    /**
     * Mark all QUEUED SOS as CACHED (no channels available).
     */
    markAllCached() {
        const queue = this._getQueue();
        let changed = false;
        queue.forEach(s => {
            if (s.status === SOS_STATUS.QUEUED) {
                s.status = SOS_STATUS.CACHED;
                changed = true;
            }
        });
        if (changed) {
            this._saveQueue(queue);
            this._notifyListeners();
        }
    }

    // ─── History Operations ─────────────────────────

    /**
     * Get delivery history (both successful and failed).
     */
    getHistory() {
        try {
            return JSON.parse(localStorage.getItem(SOS_HISTORY_KEY) || '[]');
        } catch {
            return [];
        }
    }

    /**
     * Get all SOS records (queue + history) for dashboard display.
     */
    getAll() {
        return [...this._getQueue(), ...this.getHistory()];
    }

    _addToHistory(sos) {
        const history = this.getHistory();
        history.unshift(sos);
        // Trim to max size
        if (history.length > MAX_HISTORY) {
            history.length = MAX_HISTORY;
        }
        localStorage.setItem(SOS_HISTORY_KEY, JSON.stringify(history));
    }

    // ─── Queue Size & Stats ─────────────────────────

    getQueueSize() {
        return this._getQueue().length;
    }

    getStats() {
        const queue = this._getQueue();
        const history = this.getHistory();
        return {
            pending: queue.filter(s => s.status === SOS_STATUS.QUEUED).length,
            sending: queue.filter(s => s.status === SOS_STATUS.SENDING).length,
            cached: queue.filter(s => s.status === SOS_STATUS.CACHED).length,
            delivered: history.filter(s => s.status === SOS_STATUS.DELIVERED).length,
            failed: history.filter(s => s.status === SOS_STATUS.FAILED).length,
            totalInQueue: queue.length,
            totalHistory: history.length,
        };
    }

    // ─── Subscription ───────────────────────────────

    /**
     * Subscribe to cache changes.
     * @param {Function} callback
     * @returns {Function} unsubscribe
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notifyListeners() {
        const data = {
            queue: this._getQueue(),
            stats: this.getStats(),
        };
        this._listeners.forEach(cb => {
            try { cb(data); } catch (e) { console.error('[SOSCache] Listener error:', e); }
        });

        // Also dispatch for the existing alert system integration
        window.dispatchEvent(new CustomEvent('cg_sos_updated', { detail: data }));
    }

    // ─── Internal Storage ───────────────────────────

    _getQueue() {
        try {
            return JSON.parse(localStorage.getItem(SOS_QUEUE_KEY) || '[]');
        } catch {
            return [];
        }
    }

    _saveQueue(queue) {
        localStorage.setItem(SOS_QUEUE_KEY, JSON.stringify(queue));
    }

    /**
     * Clear all data (for testing / reset).
     */
    clear() {
        localStorage.removeItem(SOS_QUEUE_KEY);
        localStorage.removeItem(SOS_HISTORY_KEY);
        localStorage.removeItem(SOS_COUNTER_KEY);
        this._notifyListeners();
    }
}

// Singleton
let _instance = null;
export function getSOSCache() {
    if (!_instance) {
        _instance = new SOSCache();
    }
    return _instance;
}
