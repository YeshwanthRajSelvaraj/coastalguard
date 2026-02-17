// ──────────────────────────────────────────────
// Notification Service — Browser Notifications
// Sends real-time browser notifications for SOS
// alerts to authority dashboards.
//
// Features:
// - Permission request flows
// - Local notification simulation (no backend needed)
// - Vibration patterns for urgency levels
// - Sound alerts via AudioContext
// ──────────────────────────────────────────────

const NOTIFICATION_COOLDOWN_MS = 3000; // Min 3s between notifications
let _lastNotificationTime = 0;

/**
 * Check notification permission status.
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export function getPermissionStatus() {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission;
}

/**
 * Request notification permission from user.
 * @returns {Promise<boolean>} Whether permission was granted
 */
export async function requestPermission() {
    if (!('Notification' in window)) {
        console.warn('[Notify] Browser does not support notifications');
        return false;
    }

    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;

    try {
        const result = await Notification.requestPermission();
        return result === 'granted';
    } catch {
        return false;
    }
}

/**
 * Register the service worker for push notifications.
 */
export async function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.warn('[Notify] Service Worker not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
        console.log('[Notify] Service Worker registered:', registration.scope);
        return registration;
    } catch (err) {
        console.error('[Notify] SW registration failed:', err);
        return null;
    }
}

/**
 * Send a local SOS notification (used when SOS arrives on authority dashboard).
 *
 * @param {object} params
 * @param {'sos'|'border'} params.type - Alert type
 * @param {string} params.boatNumber - Vessel registration
 * @param {string} params.fishermanName - Fisherman's name
 * @param {object} params.location - { lat, lng }
 * @param {string} params.alertId - Alert ID for click routing
 */
export function sendSOSNotification({ type, boatNumber, fishermanName, location, alertId }) {
    // Cooldown to prevent notification spam
    const now = Date.now();
    if (now - _lastNotificationTime < NOTIFICATION_COOLDOWN_MS) return;
    _lastNotificationTime = now;

    // Vibrate device (if supported)
    if ('vibrate' in navigator) {
        navigator.vibrate(type === 'sos'
            ? [500, 200, 500, 200, 500]   // Urgent pattern
            : [300, 100, 300]              // Warning pattern
        );
    }

    // Play alert tone
    playAlertTone(type);

    // Send browser notification
    if (getPermissionStatus() !== 'granted') return;

    const title = type === 'sos'
        ? `🚨 SOS EMERGENCY — ${boatNumber}`
        : `⚠️ Border Alert — ${boatNumber}`;

    const body = type === 'sos'
        ? `${fishermanName} has triggered an emergency distress signal!\nLocation: ${location?.lat?.toFixed(4)}°N, ${location?.lng?.toFixed(4)}°E`
        : `${fishermanName}'s vessel is near the maritime boundary.\nLocation: ${location?.lat?.toFixed(4)}°N, ${location?.lng?.toFixed(4)}°E`;

    try {
        const notification = new Notification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-96.png',
            tag: `alert-${alertId || Date.now()}`,
            renotify: true,
            requireInteraction: type === 'sos',
            vibrate: type === 'sos' ? [500, 200, 500, 200, 500] : [300, 100, 300],
        });

        notification.onclick = () => {
            window.focus();
            notification.close();
        };
    } catch (err) {
        console.error('[Notify] Failed to send notification:', err);
    }
}

/**
 * Play an audio alert tone using Web Audio API.
 * @param {'sos'|'border'} type
 */
function playAlertTone(type) {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'sos') {
            // Urgent two-tone alarm
            playTone(ctx, 880, 0, 0.15);
            playTone(ctx, 660, 0.2, 0.15);
            playTone(ctx, 880, 0.4, 0.15);
            playTone(ctx, 660, 0.6, 0.15);
            playTone(ctx, 880, 0.8, 0.2);
        } else {
            // Warning single beep
            playTone(ctx, 520, 0, 0.2);
            playTone(ctx, 520, 0.3, 0.1);
        }

        // Close context after tones finish
        setTimeout(() => ctx.close(), 2000);
    } catch {
        // Audio not available — silently ignore
    }
}

function playTone(ctx, frequency, startTime, duration) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime + startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + startTime + duration);

    oscillator.start(ctx.currentTime + startTime);
    oscillator.stop(ctx.currentTime + startTime + duration);
}

/**
 * Send a delivery confirmation notification.
 */
export function sendDeliveryNotification(channel, boatNumber) {
    if (getPermissionStatus() !== 'granted') return;

    const channelLabels = {
        internet: '🌐 Internet',
        satellite: '🛰️ Satellite',
        ais: '📡 AIS',
    };

    try {
        new Notification(`✅ SOS Delivered — ${boatNumber}`, {
            body: `Alert delivered successfully via ${channelLabels[channel] || channel}`,
            icon: '/icons/icon-192.png',
            tag: `delivery-${Date.now()}`,
            silent: true,
        });
    } catch {
        // Silently ignore
    }
}
