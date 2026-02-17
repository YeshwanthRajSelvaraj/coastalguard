// ──────────────────────────────────────────────
// Internet Channel — REST API (Priority 1)
// Uses mobile data / WiFi to deliver SOS via HTTPS.
// This is the primary, fastest delivery channel.
//
// Connects to the CoastalGuard backend server for
// real SOS delivery and cross-device broadcasting.
// ──────────────────────────────────────────────
import { ChannelBase, CHANNEL_STATUS, DELIVERY_STATUS } from './ChannelBase';

const SERVER_URL = import.meta.env.VITE_WS_SERVER_URL || 'http://localhost:3001';
const API_URL = `${SERVER_URL}/api/sos`;
const HEALTH_URL = `${SERVER_URL}/api/health`;
const TIMEOUT_MS = 8000;

export class InternetChannel extends ChannelBase {
    constructor(config = {}) {
        super('internet', 1, {
            apiUrl: config.apiUrl || API_URL,
            healthUrl: config.healthUrl || HEALTH_URL,
            timeout: config.timeout || TIMEOUT_MS,
            ...config,
        });
        this._deliveryStore = new Map(); // messageId → delivery info
    }

    /**
     * Check internet connectivity by testing navigator.onLine
     * and pinging the backend server health endpoint.
     */
    async isAvailable() {
        if (!navigator.onLine) {
            this.lastStatus = CHANNEL_STATUS.UNAVAILABLE;
            this.lastChecked = new Date().toISOString();
            return false;
        }

        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);

            const response = await fetch(this.config.healthUrl, {
                method: 'GET',
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (response.ok) {
                this.lastStatus = CHANNEL_STATUS.AVAILABLE;
                this.lastChecked = new Date().toISOString();
                return true;
            }

            this.lastStatus = CHANNEL_STATUS.DEGRADED;
            this.lastChecked = new Date().toISOString();
            return true; // Server reachable but may be unhealthy
        } catch {
            // Server unreachable but navigator says online — try anyway
            this.lastStatus = CHANNEL_STATUS.DEGRADED;
            this.lastChecked = new Date().toISOString();
            return navigator.onLine;
        }
    }

    /**
     * Send SOS via REST API POST to the CoastalGuard backend.
     * The server will broadcast this to all connected authority clients.
     */
    async send(sosPayload) {
        const startTime = Date.now();
        this.recordAttempt(false); // pessimistic — update on success

        try {
            if (!navigator.onLine) {
                throw new Error('No internet connection');
            }

            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), this.config.timeout);

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: sosPayload.type || 'sos',
                    fishermanId: sosPayload.fishermanId,
                    fishermanName: sosPayload.fishermanName,
                    boatNumber: sosPayload.boatNumber,
                    phone: sosPayload.phone || null,
                    location: sosPayload.location,
                    clientSOSId: sosPayload.id,
                }),
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (!response.ok) {
                const errBody = await response.text().catch(() => '');
                throw new Error(`Server error ${response.status}: ${errBody || response.statusText}`);
            }

            const data = await response.json();
            const messageId = data.sosId || `NET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const deliveredAt = data.receivedAt || new Date().toISOString();

            // Store delivery confirmation
            this._deliveryStore.set(messageId, {
                delivered: true,
                timestamp: deliveredAt,
                latencyMs: Date.now() - startTime,
            });

            // Fix success count
            this.failCount--;
            this.recordAttempt(true);
            this.failCount--; // undo double-count

            console.log(`[InternetChannel] ✅ SOS delivered to server: ${messageId} (${Date.now() - startTime}ms)`);

            return {
                success: true,
                messageId,
                error: null,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    deliveredAt,
                    endpoint: this.config.apiUrl,
                    serverSosId: data.sosId,
                },
            };
        } catch (err) {
            console.warn(`[InternetChannel] ❌ Delivery failed: ${err.message}`);
            return {
                success: false,
                messageId: null,
                error: err.message,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    failedAt: new Date().toISOString(),
                },
            };
        }
    }

    /**
     * Check delivery status of a previously sent message.
     */
    async getStatus(messageId) {
        const record = this._deliveryStore.get(messageId);
        if (record) {
            return { delivered: record.delivered, timestamp: record.timestamp };
        }

        // Try fetching from server
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);
            const response = await fetch(`${SERVER_URL}/api/sos/${messageId}`, {
                signal: controller.signal,
            });
            clearTimeout(timer);

            if (response.ok) {
                const data = await response.json();
                return { delivered: data.status !== 'failed', timestamp: data.receivedAt };
            }
        } catch {
            // Ignore — best effort
        }

        return { delivered: false, timestamp: null };
    }
}
