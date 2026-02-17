// ──────────────────────────────────────────────
// SOS Engine — Fault-Tolerant Multi-Channel Orchestrator
//
// This is the central coordinator for emergency SOS delivery.
// It manages channel priority, automatic failover, offline
// caching, and retry logic.
//
// Delivery Strategy:
//   1. Cache SOS locally (guaranteed persistence)
//   2. Detect available channels
//   3. Try channels in priority order: Internet → Satellite → AIS
//   4. If all fail → mark as cached, retry every 30 seconds
//   5. When any channel becomes available → auto-flush queue
//
// Integration:
//   Used by SOSContext (React) which exposes triggerSOS()
//   to the FishermanDashboard UI.
// ──────────────────────────────────────────────

import { InternetChannel } from './channels/InternetChannel';
import { SatelliteChannel } from './channels/SatelliteChannel';
import { AISChannel } from './channels/AISChannel';
import { getNetworkDetector } from './NetworkDetector';
import { getSOSCache, SOS_STATUS } from './SOSCache';

const RETRY_INTERVAL_MS = 30000;    // Retry every 30 seconds
const MAX_RETRIES = 20;             // Max retry attempts before marking failed
const CHANNEL_PROBE_INTERVAL = 10000; // Probe channels every 10 seconds

export class SOSEngine {
    constructor() {
        this.cache = getSOSCache();
        this.networkDetector = getNetworkDetector();

        // Initialize channels in priority order
        this.channels = [
            new InternetChannel(),
            new SatelliteChannel(),
            new AISChannel(),
        ].sort((a, b) => a.priority - b.priority);

        this._retryTimer = null;
        this._probeTimer = null;
        this._running = false;
        this._listeners = new Set();

        // Channel availability state
        this._channelAvailability = {};
        this.channels.forEach(ch => {
            this._channelAvailability[ch.name] = false;
        });
    }

    // ─── Lifecycle ──────────────────────────────────

    /**
     * Start the SOS engine. Begins:
     * - Periodic channel probing
     * - Queue retry timer
     * - Network change monitoring
     */
    start() {
        if (this._running) return;
        this._running = true;

        console.log('[SOSEngine] Starting fault-tolerant SOS system...');

        // Probe channels immediately
        this._probeChannels();

        // Periodic channel probing
        this._probeTimer = setInterval(() => this._probeChannels(), CHANNEL_PROBE_INTERVAL);

        // Retry timer for cached/queued SOS
        this._retryTimer = setInterval(() => this._processQueue(), RETRY_INTERVAL_MS);

        // Listen for connectivity changes → immediate queue flush
        this._networkUnsub = this.networkDetector.subscribe((state) => {
            if (state.isOnline || state.anyChannelAvailable) {
                console.log('[SOSEngine] Connectivity restored — flushing SOS queue...');
                this._processQueue();
            }
        });

        // Process any cached SOS from previous session
        const pending = this.cache.getPending();
        if (pending.length > 0) {
            console.log(`[SOSEngine] Found ${pending.length} cached SOS from previous session`);
            this._processQueue();
        }
    }

    /**
     * Stop the engine.
     */
    stop() {
        this._running = false;
        if (this._retryTimer) clearInterval(this._retryTimer);
        if (this._probeTimer) clearInterval(this._probeTimer);
        if (this._networkUnsub) this._networkUnsub();
        console.log('[SOSEngine] Stopped');
    }

    // ─── SOS Trigger (Main Entry Point) ─────────────

    /**
     * Trigger a new SOS alert.
     * This is the primary method called by the UI.
     *
     * Flow:
     * 1. Create SOS payload with GPS + identity
     * 2. Cache immediately (offline-first guarantee)
     * 3. Attempt delivery through channel priority chain
     * 4. Update UI with delivery status
     *
     * @param {object} params
     * @param {string} params.type - 'sos' or 'border'
     * @param {string} params.fishermanId
     * @param {string} params.fishermanName
     * @param {string} params.boatNumber
     * @param {object} params.location - { lat, lng, accuracy, heading, speed }
     * @returns {object} The queued SOS record
     */
    async triggerSOS({ type = 'sos', fishermanId, fishermanName, boatNumber, location }) {
        console.log(`[SOSEngine] 🚨 SOS triggered: ${type.toUpperCase()} by ${boatNumber}`);

        // Step 1: Cache immediately (guaranteed persistence)
        const sos = this.cache.enqueue({
            type,
            fishermanId,
            fishermanName,
            boatNumber,
            location: {
                lat: location.lat,
                lng: location.lng,
                accuracy: location.accuracy || null,
                heading: location.heading || null,
                speed: location.speed || null,
            },
        });

        console.log(`[SOSEngine] Cached SOS ${sos.id} to local storage`);

        // Also send to legacy alert system for backward compatibility
        this._sendToLegacyAlertSystem(sos);

        // Notify listeners
        this._notifyListeners('sos_queued', sos);

        // Step 2: Attempt immediate delivery
        await this._deliverSOS(sos);

        return sos;
    }

    // ─── Channel Delivery Logic ─────────────────────

    /**
     * Attempt to deliver a single SOS through the channel priority chain.
     * Internet (1) → Satellite (2) → AIS (3) → Cache for retry
     */
    async _deliverSOS(sos) {
        // Mark as sending
        this.cache.updateStatus(sos.id, SOS_STATUS.SENDING);
        this._notifyListeners('sos_sending', sos);

        for (const channel of this.channels) {
            console.log(`[SOSEngine] Trying channel: ${channel.name} (priority ${channel.priority})...`);

            try {
                // Check channel availability
                const available = await channel.isAvailable();
                this._channelAvailability[channel.name] = available;
                this.networkDetector.updateChannelStatus(channel.name, available);

                if (!available) {
                    console.log(`[SOSEngine] Channel ${channel.name} unavailable, skipping...`);
                    this.cache.recordAttempt(sos.id, channel.name, false, 'Channel unavailable');
                    continue;
                }

                // Attempt send
                const result = await channel.send(sos);

                // Record attempt
                this.cache.recordAttempt(sos.id, channel.name, result.success, result.error, result.meta);

                if (result.success) {
                    console.log(`[SOSEngine] ✅ SOS ${sos.id} delivered via ${channel.name}!`);

                    // Mark as delivered
                    this.cache.updateStatus(sos.id, SOS_STATUS.DELIVERED, {
                        channel: channel.name,
                        messageId: result.messageId,
                    });

                    this._notifyListeners('sos_delivered', {
                        ...sos,
                        status: SOS_STATUS.DELIVERED,
                        delivery: {
                            channel: channel.name,
                            messageId: result.messageId,
                            meta: result.meta,
                        },
                    });

                    return true;
                }

                console.log(`[SOSEngine] Channel ${channel.name} failed: ${result.error}`);
            } catch (err) {
                console.error(`[SOSEngine] Channel ${channel.name} threw error:`, err);
                this.cache.recordAttempt(sos.id, channel.name, false, err.message);
            }
        }

        // All channels failed
        console.log(`[SOSEngine] ⚠ All channels failed for SOS ${sos.id} — caching for retry`);
        this.cache.updateStatus(sos.id, SOS_STATUS.CACHED);
        this._notifyListeners('sos_cached', sos);

        return false;
    }

    // ─── Queue Processing (Auto-Retry) ──────────────

    /**
     * Process the SOS queue — retry cached/queued items.
     * Called periodically and on connectivity restoration.
     */
    async _processQueue() {
        const pending = this.cache.getPending();
        if (pending.length === 0) return;

        console.log(`[SOSEngine] Processing queue: ${pending.length} pending SOS`);

        for (const sos of pending) {
            // Check max retries
            if (sos.delivery.attempts >= MAX_RETRIES) {
                console.log(`[SOSEngine] SOS ${sos.id} exceeded max retries (${MAX_RETRIES})`);
                this.cache.updateStatus(sos.id, SOS_STATUS.FAILED);
                this._notifyListeners('sos_failed', sos);
                continue;
            }

            const delivered = await this._deliverSOS(sos);
            if (delivered) {
                console.log(`[SOSEngine] Queued SOS ${sos.id} successfully delivered on retry`);
            }
        }
    }

    // ─── Channel Probing ────────────────────────────

    /**
     * Probe all channels to update availability status.
     * This runs periodically so we know channel state before SOS is triggered.
     */
    async _probeChannels() {
        const results = {};

        for (const channel of this.channels) {
            try {
                const available = await channel.isAvailable();
                this._channelAvailability[channel.name] = available;
                this.networkDetector.updateChannelStatus(channel.name, available);
                results[channel.name] = available;
            } catch {
                this._channelAvailability[channel.name] = false;
                results[channel.name] = false;
            }
        }

        this._notifyListeners('channels_probed', results);
    }

    // ─── Legacy Alert System Bridge ─────────────────

    /**
     * Forward SOS to the existing localStorage-based alert system
     * so the PoliceDashboard receives it via the existing AlertContext.
     */
    _sendToLegacyAlertSystem(sos) {
        try {
            const STORAGE_KEY = 'cg_alerts';
            const COUNTER_KEY = 'cg_alert_counter';

            const alerts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
            localStorage.setItem(COUNTER_KEY, String(counter));

            const legacyAlert = {
                id: `ALT-${String(counter).padStart(4, '0')}`,
                type: sos.type,
                status: 'pending',
                fishermanId: sos.fishermanId,
                fishermanName: sos.fishermanName,
                boatNumber: sos.boatNumber,
                location: { lat: sos.location.lat, lng: sos.location.lng },
                timestamp: sos.triggeredAt,
                acknowledgedAt: null,
                resolvedAt: null,
                // Extended fields for channel monitoring
                sosId: sos.id,
                deliveryChannel: null,
                deliveryStatus: 'pending',
            };

            alerts.unshift(legacyAlert);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
            window.dispatchEvent(new CustomEvent('cg_alerts_updated', { detail: alerts }));
        } catch (err) {
            console.error('[SOSEngine] Failed to bridge to legacy alert system:', err);
        }
    }

    // ─── Status & Health ────────────────────────────

    /**
     * Get full engine status for dashboard display.
     */
    getStatus() {
        const cacheStats = this.cache.getStats();
        const networkState = this.networkDetector.getState();

        return {
            running: this._running,
            network: networkState,
            channels: this.channels.map(ch => ({
                ...ch.getHealth(),
                available: this._channelAvailability[ch.name],
            })),
            queue: cacheStats,
            channelAvailability: { ...this._channelAvailability },
        };
    }

    /**
     * Get delivery details for a specific SOS.
     */
    getSOSDetails(sosId) {
        const allSOS = this.cache.getAll();
        return allSOS.find(s => s.id === sosId) || null;
    }

    // ─── Event Subscription ─────────────────────────

    /**
     * Subscribe to engine events.
     * Events: sos_queued, sos_sending, sos_delivered, sos_cached,
     *         sos_failed, channels_probed
     */
    subscribe(callback) {
        this._listeners.add(callback);
        return () => this._listeners.delete(callback);
    }

    _notifyListeners(event, data) {
        this._listeners.forEach(cb => {
            try { cb(event, data); } catch (e) {
                console.error('[SOSEngine] Listener error:', e);
            }
        });
    }
}

// ─── Singleton Instance ─────────────────────────────
let _engineInstance = null;

export function getSOSEngine() {
    if (!_engineInstance) {
        _engineInstance = new SOSEngine();
    }
    return _engineInstance;
}

export function startSOSEngine() {
    const engine = getSOSEngine();
    engine.start();
    return engine;
}
