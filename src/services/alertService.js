// ──────────────────────────────────────────────
// Alert Service — localStorage + storage events (swap with WebSocket/Firebase)
// ──────────────────────────────────────────────
import { STORAGE_KEYS, ALERT_TYPES, ALERT_STATUS } from '../utils/constants';

function getAlerts() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.ALERTS) || '[]');
    } catch {
        return [];
    }
}

function saveAlerts(alerts) {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(alerts));
    // Dispatch custom event for same-tab reactivity
    window.dispatchEvent(new CustomEvent('cg_alerts_updated', { detail: alerts }));
}

function getNextId() {
    const counter = parseInt(localStorage.getItem(STORAGE_KEYS.ALERT_COUNTER) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEYS.ALERT_COUNTER, String(counter));
    return `ALT-${String(counter).padStart(4, '0')}`;
}

/**
 * Create a new SOS alert
 */
export function sendSOSAlert({ fishermanId, fishermanName, boatNumber, location }) {
    const alerts = getAlerts();
    const alert = {
        id: getNextId(),
        type: ALERT_TYPES.SOS,
        status: ALERT_STATUS.PENDING,
        fishermanId,
        fishermanName,
        boatNumber,
        location: {
            lat: location.lat,
            lng: location.lng,
        },
        timestamp: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
    };
    alerts.unshift(alert);
    saveAlerts(alerts);
    return alert;
}

/**
 * Create a border violation alert
 */
export function sendBorderAlert({ fishermanId, fishermanName, boatNumber, location }) {
    const alerts = getAlerts();

    // Prevent duplicate border alerts within 5 minutes for same fisherman
    const recentBorder = alerts.find(
        (a) =>
            a.fishermanId === fishermanId &&
            a.type === ALERT_TYPES.BORDER &&
            a.status !== ALERT_STATUS.RESOLVED &&
            Date.now() - new Date(a.timestamp).getTime() < 5 * 60 * 1000
    );
    if (recentBorder) return recentBorder;

    const alert = {
        id: getNextId(),
        type: ALERT_TYPES.BORDER,
        status: ALERT_STATUS.PENDING,
        fishermanId,
        fishermanName,
        boatNumber,
        location: {
            lat: location.lat,
            lng: location.lng,
        },
        timestamp: new Date().toISOString(),
        acknowledgedAt: null,
        resolvedAt: null,
    };
    alerts.unshift(alert);
    saveAlerts(alerts);
    return alert;
}

/**
 * Acknowledge an alert
 */
export function acknowledgeAlert(alertId) {
    const alerts = getAlerts();
    const idx = alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return null;
    alerts[idx].status = ALERT_STATUS.ACKNOWLEDGED;
    alerts[idx].acknowledgedAt = new Date().toISOString();
    saveAlerts(alerts);
    return alerts[idx];
}

/**
 * Resolve an alert
 */
export function resolveAlert(alertId) {
    const alerts = getAlerts();
    const idx = alerts.findIndex((a) => a.id === alertId);
    if (idx === -1) return null;
    alerts[idx].status = ALERT_STATUS.RESOLVED;
    alerts[idx].resolvedAt = new Date().toISOString();
    saveAlerts(alerts);
    return alerts[idx];
}

/**
 * Get all alerts
 */
export function fetchAlerts() {
    return getAlerts();
}

/**
 * Get active (non-resolved) alert count
 */
export function getActiveAlertCount() {
    return getAlerts().filter((a) => a.status !== ALERT_STATUS.RESOLVED).length;
}

/**
 * Subscribe to alert updates (same-tab + cross-tab)
 * Returns unsubscribe function
 */
export function subscribeToAlerts(callback) {
    // Same-tab updates via custom event
    const handleCustom = (e) => callback(e.detail);
    window.addEventListener('cg_alerts_updated', handleCustom);

    // Cross-tab updates via storage event
    const handleStorage = (e) => {
        if (e.key === STORAGE_KEYS.ALERTS) {
            try {
                callback(JSON.parse(e.newValue || '[]'));
            } catch { /* ignore */ }
        }
    };
    window.addEventListener('storage', handleStorage);

    // Polling fallback (every 2s) for WebView compatibility
    const interval = setInterval(() => callback(getAlerts()), 2000);

    return () => {
        window.removeEventListener('cg_alerts_updated', handleCustom);
        window.removeEventListener('storage', handleStorage);
        clearInterval(interval);
    };
}

/**
 * Acknowledge all pending alerts
 */
export function acknowledgeAllPending() {
    const alerts = getAlerts();
    const now = new Date().toISOString();
    alerts.forEach((a) => {
        if (a.status === ALERT_STATUS.PENDING) {
            a.status = ALERT_STATUS.ACKNOWLEDGED;
            a.acknowledgedAt = now;
        }
    });
    saveAlerts(alerts);
    return alerts;
}

/**
 * Resolve all alerts
 */
export function resolveAllAlerts() {
    const alerts = getAlerts();
    const now = new Date().toISOString();
    alerts.forEach((a) => {
        if (a.status !== ALERT_STATUS.RESOLVED) {
            a.status = ALERT_STATUS.RESOLVED;
            a.resolvedAt = now;
        }
    });
    saveAlerts(alerts);
    return alerts;
}
