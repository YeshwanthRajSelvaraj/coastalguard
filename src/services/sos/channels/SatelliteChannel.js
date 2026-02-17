// ──────────────────────────────────────────────
// Satellite Channel — SMS Gateway (Priority 2)
// Store-and-forward via satellite SMS (Iridium/INMARSAT).
//
// MOCK IMPLEMENTATION:
// This simulates a satellite SMS gateway interface.
// In production, replace the send() method with actual
// hardware SDK calls (e.g., Iridium SBD, INMARSAT-C,
// or RockBLOCK API).
//
// Gateway Interface Contract:
//   POST /satellite/sms
//   Body: { to: "ground_station_number", message: "compressed_sos" }
//   Response: { messageId, status, queuedAt }
// ──────────────────────────────────────────────
import { ChannelBase, CHANNEL_STATUS } from './ChannelBase';

// Simulated satellite gateway configuration
const DEFAULT_SATELLITE_CONFIG = {
    gatewayUrl: '/satellite/gateway',
    groundStationNumber: '+918001234567',  // Coast Guard ground station
    maxMessageLength: 160,                  // SMS character limit
    transmitDelayMs: 3000,                  // Typical satellite latency
    availability: 0.7,                      // 70% uptime simulation
};

export class SatelliteChannel extends ChannelBase {
    constructor(config = {}) {
        super('satellite', 2, {
            ...DEFAULT_SATELLITE_CONFIG,
            ...config,
        });
        this._messageQueue = new Map();
        this._signalStrength = 0;
    }

    /**
     * Check satellite link availability.
     * In production: Query satellite modem AT commands or SDK.
     * Mock: Simulates intermittent satellite visibility windows.
     */
    async isAvailable() {
        // ─── MOCK IMPLEMENTATION ───────────────────────────
        // In production, replace with:
        //   const modem = await SatModem.getStatus();
        //   return modem.signalBars >= 2 && modem.registered;

        // Simulate satellite signal cycling (GPS satellites pass overhead)
        const now = Date.now();
        const cycleMinutes = (now / 60000) % 10; // 10-minute signal cycle
        const hasSignal = cycleMinutes < 7; // Signal available 70% of time

        // Simulate signal strength (0–5 bars)
        this._signalStrength = hasSignal ? Math.floor(Math.random() * 3) + 2 : 0;

        if (hasSignal && this._signalStrength >= 2) {
            this.lastStatus = CHANNEL_STATUS.AVAILABLE;
        } else if (hasSignal) {
            this.lastStatus = CHANNEL_STATUS.DEGRADED;
        } else {
            this.lastStatus = CHANNEL_STATUS.UNAVAILABLE;
        }

        this.lastChecked = new Date().toISOString();
        return this.lastStatus !== CHANNEL_STATUS.UNAVAILABLE;
    }

    /**
     * Send SOS via satellite SMS.
     * Uses compressed payload format to fit within 160-char SMS limit.
     *
     * Mock: Simulates satellite uplink delay and store-and-forward behavior.
     *
     * PRODUCTION INTEGRATION POINT:
     *   Replace with RockBLOCK/Iridium SBD API:
     *     const result = await rockblock.sendMessage(compressed);
     *   Or INMARSAT-C:
     *     const result = await inmarsat.sendDistress(payload);
     */
    async send(sosPayload) {
        const startTime = Date.now();
        this.recordAttempt(false);

        try {
            // Compress payload for satellite SMS (< 160 chars)
            const compressed = this.compressPayload(sosPayload);

            if (compressed.length > this.config.maxMessageLength) {
                throw new Error(`Payload exceeds ${this.config.maxMessageLength} char SMS limit`);
            }

            // Check availability
            const available = await this.isAvailable();
            if (!available) {
                throw new Error('No satellite signal — modem reports 0 bars');
            }

            // ─── MOCK: Simulate satellite transmission ─────
            // Satellite uplink has higher latency (2–8 seconds)
            const satLatency = this.config.transmitDelayMs + Math.random() * 5000;
            await new Promise(resolve => setTimeout(resolve, Math.min(satLatency, 4000)));

            // Simulate success based on signal strength
            const successRate = this._signalStrength >= 3 ? 0.85 : 0.5;
            const success = Math.random() < successRate;

            if (!success) {
                throw new Error('Satellite uplink failed — signal degraded during transmission');
            }

            const messageId = `SAT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
            const deliveredAt = new Date().toISOString();

            // Store in forward queue (satellite is store-and-forward)
            this._messageQueue.set(messageId, {
                payload: compressed,
                status: 'forwarded',
                queuedAt: new Date(startTime).toISOString(),
                deliveredAt,
                groundStation: this.config.groundStationNumber,
                signalBars: this._signalStrength,
            });

            this.failCount--;

            return {
                success: true,
                messageId,
                error: null,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    deliveredAt,
                    signalBars: this._signalStrength,
                    compressedLength: compressed.length,
                    groundStation: this.config.groundStationNumber,
                    mode: 'store-and-forward',
                },
            };
        } catch (err) {
            return {
                success: false,
                messageId: null,
                error: err.message,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    failedAt: new Date().toISOString(),
                    signalBars: this._signalStrength,
                },
            };
        }
    }

    /**
     * Check delivery status.
     * Satellite SMS is store-and-forward: message may be "queued" at ground station.
     */
    async getStatus(messageId) {
        const record = this._messageQueue.get(messageId);
        if (!record) return { delivered: false, timestamp: null };
        return {
            delivered: record.status === 'forwarded',
            timestamp: record.deliveredAt,
            groundStation: record.groundStation,
        };
    }

    /**
     * Get satellite-specific diagnostics.
     */
    getDiagnostics() {
        return {
            ...this.getHealth(),
            signalBars: this._signalStrength,
            queuedMessages: this._messageQueue.size,
            groundStation: this.config.groundStationNumber,
            maxSmsLength: this.config.maxMessageLength,
        };
    }
}
