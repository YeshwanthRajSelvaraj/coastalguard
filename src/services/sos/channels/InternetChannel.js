// ──────────────────────────────────────────────
// Internet Channel — REST API (Priority 1)
// Uses mobile data / WiFi to deliver SOS via HTTPS.
// This is the primary, fastest delivery channel.
// ──────────────────────────────────────────────
import { ChannelBase, CHANNEL_STATUS, DELIVERY_STATUS } from './ChannelBase';

// Simulated REST API endpoint (replace with real backend in production)
const DEFAULT_API_URL = '/api/sos';
const TIMEOUT_MS = 8000;

export class InternetChannel extends ChannelBase {
    constructor(config = {}) {
        super('internet', 1, {
            apiUrl: config.apiUrl || DEFAULT_API_URL,
            timeout: config.timeout || TIMEOUT_MS,
            ...config,
        });
        this._deliveryStore = new Map(); // messageId → delivery info
    }

    /**
     * Check internet connectivity by testing navigator.onLine
     * and attempting a lightweight fetch to verify actual reachability.
     */
    async isAvailable() {
        if (!navigator.onLine) {
            this.lastStatus = CHANNEL_STATUS.UNAVAILABLE;
            this.lastChecked = new Date().toISOString();
            return false;
        }

        try {
            // Lightweight connectivity check — HEAD request with short timeout
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 3000);

            const response = await fetch('https://httpbin.org/status/200', {
                method: 'HEAD',
                mode: 'no-cors',
                signal: controller.signal,
            });
            clearTimeout(timer);

            this.lastStatus = CHANNEL_STATUS.AVAILABLE;
            this.lastChecked = new Date().toISOString();
            return true;
        } catch {
            // Fetch failed, but navigator says online → degraded (maybe captive portal)
            this.lastStatus = CHANNEL_STATUS.DEGRADED;
            this.lastChecked = new Date().toISOString();
            // Still return true so we attempt the send (may succeed on local network)
            return navigator.onLine;
        }
    }

    /**
     * Send SOS via REST API POST request.
     * In mock mode: simulates a successful API call with realistic latency.
     */
    async send(sosPayload) {
        const startTime = Date.now();
        this.recordAttempt(false); // pessimistic — update on success

        try {
            // ─── MOCK IMPLEMENTATION ───────────────────────────
            // In production, replace this block with:
            //   const res = await fetch(this.config.apiUrl, {
            //       method: 'POST',
            //       headers: { 'Content-Type': 'application/json' },
            //       body: JSON.stringify(sosPayload),
            //       signal: AbortSignal.timeout(this.config.timeout),
            //   });
            //   const data = await res.json();

            // Simulate network conditions
            const isOnline = navigator.onLine;
            if (!isOnline) {
                throw new Error('No internet connection');
            }

            // Simulate realistic API latency (200ms–1200ms)
            const latency = 200 + Math.random() * 1000;
            await new Promise(resolve => setTimeout(resolve, latency));

            // Simulate 90% success rate when online
            const success = Math.random() < 0.9;
            if (!success) {
                throw new Error('Server returned 503 — Service Unavailable');
            }

            const messageId = `NET-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
            const deliveredAt = new Date().toISOString();

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

            return {
                success: true,
                messageId,
                error: null,
                meta: {
                    channel: this.name,
                    latencyMs: Date.now() - startTime,
                    deliveredAt,
                    endpoint: this.config.apiUrl,
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
                },
            };
        }
    }

    /**
     * Check delivery status of a previously sent message.
     */
    async getStatus(messageId) {
        const record = this._deliveryStore.get(messageId);
        if (!record) {
            return { delivered: false, timestamp: null };
        }
        return { delivered: record.delivered, timestamp: record.timestamp };
    }
}
