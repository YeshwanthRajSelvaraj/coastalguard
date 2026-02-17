// ──────────────────────────────────────────────
// Location Service — Browser Geolocation API
// ──────────────────────────────────────────────
import { MARITIME_BOUNDARY, BORDER_WARNING_DISTANCE, BORDER_DANGER_DISTANCE, BOAT_STATUS } from '../utils/constants';

/**
 * Get current GPS position
 * @returns Promise<{lat, lng, accuracy, heading, speed}>
 */
export function getCurrentPosition() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                resolve({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    heading: pos.coords.heading,
                    speed: pos.coords.speed,
                    timestamp: pos.timestamp,
                });
            },
            (err) => {
                reject(new Error(getGeolocationErrorMessage(err)));
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 5000,
            }
        );
    });
}

/**
 * Watch position continuously
 * @param {Function} onUpdate - callback({lat, lng, accuracy, ...})
 * @param {Function} onError - callback(error)
 * @returns {Function} stopWatching
 */
export function watchPosition(onUpdate, onError) {
    if (!navigator.geolocation) {
        onError?.(new Error('Geolocation not supported'));
        return () => { };
    }

    const watchId = navigator.geolocation.watchPosition(
        (pos) => {
            onUpdate({
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                accuracy: pos.coords.accuracy,
                heading: pos.coords.heading,
                speed: pos.coords.speed,
                timestamp: pos.timestamp,
            });
        },
        (err) => {
            onError?.(new Error(getGeolocationErrorMessage(err)));
        },
        {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 3000,
        }
    );

    return () => navigator.geolocation.clearWatch(watchId);
}

/**
 * Calculate distance between two coordinates in meters (Haversine)
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Calculate minimum distance to the maritime boundary line
 */
export function distanceToBorder(position) {
    let minDist = Infinity;

    for (let i = 0; i < MARITIME_BOUNDARY.length - 1; i++) {
        const dist = distanceToSegment(
            position,
            MARITIME_BOUNDARY[i],
            MARITIME_BOUNDARY[i + 1]
        );
        if (dist < minDist) minDist = dist;
    }

    return minDist;
}

/**
 * Determine boat status based on distance to border
 */
export function getBoatStatus(position) {
    const dist = distanceToBorder(position);

    if (dist <= BORDER_DANGER_DISTANCE) {
        return { status: BOAT_STATUS.DANGER, distance: dist };
    }
    if (dist <= BORDER_WARNING_DISTANCE) {
        return { status: BOAT_STATUS.WARNING, distance: dist };
    }
    return { status: BOAT_STATUS.SAFE, distance: dist };
}

/**
 * Format distance for display
 */
export function formatDistance(meters) {
    if (meters >= 1000) {
        return `${(meters / 1000).toFixed(1)} km`;
    }
    return `${Math.round(meters)} m`;
}

/**
 * Format coordinates
 */
export function formatCoord(value, type) {
    const dir = type === 'lat' ? (value >= 0 ? 'N' : 'S') : value >= 0 ? 'E' : 'W';
    return `${Math.abs(value).toFixed(4)}° ${dir}`;
}

// ─── Helpers ─────────────────────────────────

function toRad(deg) {
    return (deg * Math.PI) / 180;
}

function distanceToSegment(point, segStart, segEnd) {
    const px = point.lng - segStart.lng;
    const py = point.lat - segStart.lat;
    const dx = segEnd.lng - segStart.lng;
    const dy = segEnd.lat - segStart.lat;

    let t = (px * dx + py * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));

    const nearestLng = segStart.lng + t * dx;
    const nearestLat = segStart.lat + t * dy;

    return calculateDistance(point.lat, point.lng, nearestLat, nearestLng);
}

function getGeolocationErrorMessage(error) {
    switch (error.code) {
        case error.PERMISSION_DENIED:
            return 'Location permission denied. Please enable GPS.';
        case error.POSITION_UNAVAILABLE:
            return 'Location information is unavailable.';
        case error.TIMEOUT:
            return 'Location request timed out.';
        default:
            return 'An unknown error occurred while getting location.';
    }
}
