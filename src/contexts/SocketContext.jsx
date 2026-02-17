// ──────────────────────────────────────────────────────────────
// Socket Context — React Integration for Real-Time WebSocket
//
// Provides the SocketService to React components via context.
// Handles:
//   • Auto-connect on login / disconnect on logout
//   • Real-time SOS delivery to authority dashboards
//   • Missed SOS delivery on reconnection (offline support)
//   • Online user count tracking
//   • Connection state management
//
// Usage:
//   const { connectionState, onlineUsers, sendWSMessage } = useSocket();
// ──────────────────────────────────────────────────────────────

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getSocketService, CONNECTION_STATE } from '../services/socketService';
import { useAuth } from './AuthContext';
import { ROLES } from '../utils/constants';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const serviceRef = useRef(null);

    // ─── State ──────────────────────────────────────────
    const [connectionState, setConnectionState] = useState(CONNECTION_STATE.DISCONNECTED);
    const [onlineUsers, setOnlineUsers] = useState({ authority: 0, fisherman: 0 });
    const [latency, setLatency] = useState(null);
    const [realtimeAlerts, setRealtimeAlerts] = useState([]);
    const [lastRealtimeAlert, setLastRealtimeAlert] = useState(null);
    const [missedAlerts, setMissedAlerts] = useState([]);

    // ─── Connect/Disconnect on Auth Changes ─────────────
    useEffect(() => {
        const service = getSocketService();
        serviceRef.current = service;

        if (isAuthenticated && user) {
            // Connect with user identity
            service.connect({
                id: user.id,
                role: user.role,
                fullName: user.fullName,
                boatNumber: user.boatNumber || null,
                policeId: user.policeId || null,
            });

            // ── Subscribe to state changes ──
            const unsubState = service.onStateChange((state) => {
                setConnectionState(state);
            });

            // ── Subscribe to user counts ──
            const unsubUsers = service.onUserCountChange((data) => {
                setOnlineUsers(data);
            });

            // ── Subscribe to latency ──
            const unsubLatency = service.on('latency', (data) => {
                setLatency(data.ms);
            });

            // ── Authority: Subscribe to real-time SOS alerts ──
            let unsubSOS = null;
            let unsubMissed = null;
            let unsubUpdated = null;

            if (user.role === ROLES.AUTHORITY) {
                // New SOS alerts in real-time
                unsubSOS = service.onSOSReceived((data) => {
                    console.log('[SocketContext] 🚨 Real-time SOS received:', data.alert?.id);
                    setLastRealtimeAlert(data);
                    setRealtimeAlerts(prev => {
                        // Deduplicate by alert ID
                        const exists = prev.find(a => a.id === data.alert.id);
                        if (exists) return prev;
                        return [data.alert, ...prev];
                    });

                    // Also inject into the legacy alert system for backward compatibility
                    _injectIntoLegacyAlertSystem(data.alert);
                });

                // Missed SOS alerts (from offline period)
                unsubMissed = service.onSOSMissed((data) => {
                    console.log(`[SocketContext] 📦 ${data.count} missed alerts received`);
                    setMissedAlerts(data.alerts || []);

                    // Inject missed alerts into legacy system too
                    (data.alerts || []).forEach(alert => {
                        _injectIntoLegacyAlertSystem(alert);
                    });
                });

                // SOS status updates
                unsubUpdated = service.onSOSUpdated((data) => {
                    setRealtimeAlerts(prev =>
                        prev.map(a => a.id === data.alert.id ? { ...a, ...data.alert } : a)
                    );
                });
            }

            return () => {
                unsubState();
                unsubUsers();
                unsubLatency();
                if (unsubSOS) unsubSOS();
                if (unsubMissed) unsubMissed();
                if (unsubUpdated) unsubUpdated();
                service.disconnect();
            };
        } else {
            // Not authenticated — ensure disconnected
            service.disconnect();
            setConnectionState(CONNECTION_STATE.DISCONNECTED);
            setRealtimeAlerts([]);
            setMissedAlerts([]);
        }
    }, [isAuthenticated, user]);

    // ─── Actions ────────────────────────────────────────

    /**
     * Send SOS via WebSocket (fisherman only).
     * This is called by the SOSEngine in addition to the multi-channel delivery.
     */
    const sendSOSviaWS = useCallback(({ type = 'sos', location, clientSOSId, phone }) => {
        const service = serviceRef.current;
        if (service) {
            service.sendSOS({ type, location, clientSOSId, phone });
        }
    }, []);

    /**
     * Acknowledge SOS via WebSocket (authority only).
     */
    const acknowledgeSOSviaWS = useCallback((sosId) => {
        const service = serviceRef.current;
        if (service) {
            service.acknowledgeSOSRemote(sosId);
        }
    }, []);

    /**
     * Resolve SOS via WebSocket (authority only).
     */
    const resolveSOSviaWS = useCallback((sosId) => {
        const service = serviceRef.current;
        if (service) {
            service.resolveSOSRemote(sosId);
        }
    }, []);

    /**
     * Send location update via WebSocket (fisherman only).
     */
    const sendLocationUpdate = useCallback((location) => {
        const service = serviceRef.current;
        if (service) {
            service.sendLocationUpdate(location);
        }
    }, []);

    /**
     * Clear missed alerts after they've been reviewed.
     */
    const clearMissedAlerts = useCallback(() => {
        setMissedAlerts([]);
    }, []);

    // ─── Context Value ──────────────────────────────────

    const value = {
        // State
        connectionState,
        isWSConnected: connectionState === CONNECTION_STATE.CONNECTED,
        isWSReconnecting: connectionState === CONNECTION_STATE.RECONNECTING,
        onlineUsers,
        latency,
        realtimeAlerts,
        lastRealtimeAlert,
        missedAlerts,
        hasMissedAlerts: missedAlerts.length > 0,

        // Actions
        sendSOSviaWS,
        acknowledgeSOSviaWS,
        resolveSOSviaWS,
        sendLocationUpdate,
        clearMissedAlerts,
    };

    return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
    const ctx = useContext(SocketContext);
    if (!ctx) throw new Error('useSocket must be used within SocketProvider');
    return ctx;
}

// ─── Legacy Alert System Bridge ─────────────────────────
// Injects real-time SOS alerts into the localStorage-based
// alert system so existing PoliceDashboard components work.

function _injectIntoLegacyAlertSystem(alert) {
    try {
        const STORAGE_KEY = 'cg_alerts';
        const COUNTER_KEY = 'cg_alert_counter';

        const alerts = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

        // Check if this alert already exists (by fishermanId + timestamp proximity)
        const isDuplicate = alerts.some(a => {
            if (a.sosId === alert.id) return true;
            if (a.fishermanId === alert.fishermanId) {
                const timeDiff = Math.abs(
                    new Date(a.timestamp).getTime() - new Date(alert.triggeredAt).getTime()
                );
                return timeDiff < 5000; // Within 5 seconds = likely same alert
            }
            return false;
        });

        if (isDuplicate) {
            console.log('[SocketContext] Skipping duplicate alert injection:', alert.id);
            return;
        }

        const counter = parseInt(localStorage.getItem(COUNTER_KEY) || '0', 10) + 1;
        localStorage.setItem(COUNTER_KEY, String(counter));

        const legacyAlert = {
            id: `ALT-${String(counter).padStart(4, '0')}`,
            type: alert.type || 'sos',
            status: alert.status || 'pending',
            fishermanId: alert.fishermanId,
            fishermanName: alert.fishermanName,
            boatNumber: alert.boatNumber,
            location: {
                lat: alert.location?.lat || 0,
                lng: alert.location?.lng || 0,
            },
            timestamp: alert.triggeredAt || new Date().toISOString(),
            acknowledgedAt: alert.acknowledgedAt || null,
            resolvedAt: alert.resolvedAt || null,
            // Extended fields for real-time correlation
            sosId: alert.id,
            deliveryChannel: 'websocket',
            deliveryStatus: 'delivered',
            realtime: true,
        };

        alerts.unshift(legacyAlert);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
        window.dispatchEvent(new CustomEvent('cg_alerts_updated', { detail: alerts }));

        console.log(`[SocketContext] Injected real-time alert ${alert.id} into legacy system as ${legacyAlert.id}`);
    } catch (err) {
        console.error('[SocketContext] Failed to inject into legacy alert system:', err);
    }
}
