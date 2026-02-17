// ──────────────────────────────────────────────
// SOS Context — React Integration for Fault-Tolerant SOS
//
// Provides the SOSEngine to React components via context.
// Manages channel status, delivery state, queue updates,
// and connectivity monitoring for the UI layer.
// ──────────────────────────────────────────────
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSOSEngine, startSOSEngine } from '../services/sos/SOSEngine';
import { getNetworkDetector } from '../services/sos/NetworkDetector';
import { getSOSCache } from '../services/sos/SOSCache';

const SOSContext = createContext(null);

export function SOSProvider({ children }) {
    const engineRef = useRef(null);

    // ─── State ──────────────────────────────────────
    const [engineStatus, setEngineStatus] = useState(null);
    const [connectivity, setConnectivity] = useState({
        state: 'unknown',
        isOnline: false,
        channels: {},
    });
    const [lastSOS, setLastSOS] = useState(null);
    const [lastEvent, setLastEvent] = useState(null);
    const [queueStats, setQueueStats] = useState({
        pending: 0, sending: 0, cached: 0, delivered: 0, failed: 0,
    });
    const [deliveryLog, setDeliveryLog] = useState([]);

    // ─── Initialize Engine ──────────────────────────
    useEffect(() => {
        const engine = startSOSEngine();
        engineRef.current = engine;

        // Subscribe to engine events
        const unsubEngine = engine.subscribe((event, data) => {
            setLastEvent({ event, data, at: new Date().toISOString() });

            // Update delivery log
            setDeliveryLog(prev => {
                const entry = { event, data, at: new Date().toISOString() };
                return [entry, ...prev].slice(0, 50); // Keep last 50
            });

            // Update engine status on every event
            setEngineStatus(engine.getStatus());

            // Track last SOS
            if (event === 'sos_queued' || event === 'sos_delivered' || event === 'sos_cached') {
                setLastSOS({ event, sos: data });
            }
        });

        // Subscribe to network changes
        const detector = getNetworkDetector();
        const unsubNetwork = detector.subscribe((state) => {
            setConnectivity(state);
        });

        // Subscribe to cache changes
        const cache = getSOSCache();
        const unsubCache = cache.subscribe(({ stats }) => {
            setQueueStats(stats);
        });

        // Initial status
        setEngineStatus(engine.getStatus());

        return () => {
            unsubEngine();
            unsubNetwork();
            unsubCache();
            engine.stop();
        };
    }, []);

    // ─── Actions ────────────────────────────────────

    /**
     * Trigger SOS — main action for fishermen.
     */
    const triggerSOS = useCallback(async ({ type = 'sos', fishermanId, fishermanName, boatNumber, location }) => {
        const engine = engineRef.current;
        if (!engine) {
            console.error('[SOSContext] Engine not initialized');
            return null;
        }
        return engine.triggerSOS({ type, fishermanId, fishermanName, boatNumber, location });
    }, []);

    /**
     * Trigger border violation alert.
     */
    const triggerBorderAlert = useCallback(async ({ fishermanId, fishermanName, boatNumber, location }) => {
        return triggerSOS({ type: 'border', fishermanId, fishermanName, boatNumber, location });
    }, [triggerSOS]);

    /**
     * Get full engine status (for authority dashboard).
     */
    const getFullStatus = useCallback(() => {
        return engineRef.current?.getStatus() || null;
    }, []);

    /**
     * Get delivery details for a specific SOS.
     */
    const getSOSDetails = useCallback((sosId) => {
        return engineRef.current?.getSOSDetails(sosId) || null;
    }, []);

    /**
     * Force connectivity check.
     */
    const forceConnectivityCheck = useCallback(async () => {
        const detector = getNetworkDetector();
        return detector.forceCheck();
    }, []);

    // ─── Context Value ──────────────────────────────

    const value = {
        // Actions
        triggerSOS,
        triggerBorderAlert,
        getFullStatus,
        getSOSDetails,
        forceConnectivityCheck,

        // State
        engineStatus,
        connectivity,
        lastSOS,
        lastEvent,
        queueStats,
        deliveryLog,

        // Derived
        isOnline: connectivity.isOnline,
        hasPendingSOS: queueStats.pending > 0 || queueStats.cached > 0,
        pendingCount: queueStats.pending + queueStats.cached + queueStats.sending,
        channelAvailability: engineStatus?.channelAvailability || {},
    };

    return <SOSContext.Provider value={value}>{children}</SOSContext.Provider>;
}

export function useSOS() {
    const ctx = useContext(SOSContext);
    if (!ctx) throw new Error('useSOS must be used within SOSProvider');
    return ctx;
}
