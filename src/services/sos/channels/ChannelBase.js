// ──────────────────────────────────────────────
// ChannelBase — Abstract Communication Channel
// All channels (Internet, Satellite, AIS) implement this interface.
// Satellite and AIS are abstracted via gateway interfaces,
// allowing seamless hardware integration in future deployments.
// ──────────────────────────────────────────────

export const CHANNEL_STATUS = {
    AVAILABLE: 'available',
    UNAVAILABLE: 'unavailable',
    DEGRADED: 'degraded',      // channel works but with high latency
    UNKNOWN: 'unknown',
};

export const DELIVERY_STATUS = {
    SUCCESS: 'delivered',
    FAILED: 'failed',
    TIMEOUT: 'timeout',
    PENDING: 'pending',
};

/**
 * Abstract base for all communication channels.
 * Subclasses must implement: isAvailable(), send(), getStatus()
 */
export class ChannelBase {
    /**
     * @param {string} name       - Channel identifier ('internet'|'satellite'|'ais')
     * @param {number} priority   - Lower = higher priority (1=first tried)
     * @param {object} config     - Channel-specific configuration
     */
    constructor(name, priority, config = {}) {
        if (new.target === ChannelBase) {
            throw new Error('ChannelBase is abstract — use a subclass');
        }
        this.name = name;
        this.priority = priority;
        this.config = config;
        this.lastStatus = CHANNEL_STATUS.UNKNOWN;
        this.lastChecked = null;
        this.sendCount = 0;
        this.failCount = 0;
    }

    /**
     * Check if this channel can currently send messages.
     * @returns {Promise<boolean>}
     */
    async isAvailable() {
        throw new Error('isAvailable() must be implemented by subclass');
    }

    /**
     * Send an SOS payload through this channel.
     * @param {object} sosPayload - The SOS data to send
     * @returns {Promise<{success: boolean, messageId: string|null, error: string|null, meta: object}>}
     */
    async send(sosPayload) {
        throw new Error('send() must be implemented by subclass');
    }

    /**
     * Check delivery status of a previously sent message.
     * @param {string} messageId - The message ID returned from send()
     * @returns {Promise<{delivered: boolean, timestamp: string|null}>}
     */
    async getStatus(messageId) {
        throw new Error('getStatus() must be implemented by subclass');
    }

    /**
     * Compress SOS payload to minimum bytes for low-bandwidth channels.
     * @param {object} payload - Full SOS payload
     * @returns {string} - Compressed string (< 160 chars for SMS)
     */
    compressPayload(payload) {
        // Minimal format: TYPE|ID|LAT|LNG|BOAT|TIME
        const type = payload.type === 'sos' ? 'SOS' : 'BDR';
        const lat = payload.location.lat.toFixed(4);
        const lng = payload.location.lng.toFixed(4);
        const time = Math.floor(new Date(payload.triggeredAt).getTime() / 1000);
        return `${type}|${payload.id}|${lat}|${lng}|${payload.boatNumber}|${time}|${payload.fishermanName}`;
    }

    /**
     * Record channel statistics
     */
    recordAttempt(success) {
        this.sendCount++;
        if (!success) this.failCount++;
        this.lastChecked = new Date().toISOString();
    }

    /**
     * Get channel health summary
     */
    getHealth() {
        return {
            name: this.name,
            priority: this.priority,
            status: this.lastStatus,
            lastChecked: this.lastChecked,
            totalSent: this.sendCount,
            totalFailed: this.failCount,
            successRate: this.sendCount > 0
                ? ((this.sendCount - this.failCount) / this.sendCount * 100).toFixed(1) + '%'
                : 'N/A',
        };
    }
}
