// ──────────────────────────────────────────────
// CoastalGuard Constants — Chennai–Sri Lanka Region
// ──────────────────────────────────────────────

export const ROLES = {
    FISHERMAN: 'fisherman',
    AUTHORITY: 'authority',
};

export const ALERT_TYPES = {
    SOS: 'sos',
    BORDER: 'border',
};

export const ALERT_STATUS = {
    PENDING: 'pending',
    ACKNOWLEDGED: 'acknowledged',
    RESOLVED: 'resolved',
};

export const BOAT_STATUS = {
    SAFE: 'safe',
    WARNING: 'warning',
    DANGER: 'danger',
};

// ─── International Maritime Boundary Line (IMBL) ────────────
// Approximate India–Sri Lanka maritime boundary in the Palk Strait / Gulf of Mannar region
export const MARITIME_BOUNDARY = [
    { lat: 13.20, lng: 80.30 },  // North — off Chennai coast
    { lat: 12.50, lng: 80.20 },
    { lat: 11.80, lng: 80.10 },
    { lat: 11.20, lng: 79.95 },
    { lat: 10.60, lng: 79.90 },
    { lat: 10.10, lng: 79.85 },  // Palk Strait midpoint
    { lat: 9.80, lng: 79.80 },
    { lat: 9.50, lng: 79.60 },
    { lat: 9.30, lng: 79.40 },   // Near Rameswaram / Dhanushkodi
    { lat: 9.10, lng: 79.20 },
    { lat: 8.90, lng: 79.00 },
    { lat: 8.70, lng: 78.80 },
    { lat: 8.40, lng: 78.50 },   // Gulf of Mannar south
    { lat: 8.10, lng: 78.20 },
    { lat: 7.80, lng: 78.00 },   // Southern extent
];

// ─── Indian Fishing Zone (EEZ polygon — Indian side) ────────
// Polygon covering the Indian fishing waters from Chennai coast down to Kanyakumari
export const INDIAN_FISHING_ZONE = [
    // Coastline points (north to south along Indian coast)
    { lat: 13.40, lng: 80.28 },  // North of Chennai
    { lat: 13.10, lng: 80.22 },  // Chennai coast
    { lat: 12.60, lng: 80.08 },
    { lat: 12.00, lng: 79.85 },
    { lat: 11.40, lng: 79.80 },
    { lat: 10.80, lng: 79.78 },
    { lat: 10.30, lng: 79.75 },
    { lat: 9.95, lng: 79.50 },   // Rameswaram area
    { lat: 9.50, lng: 79.15 },
    { lat: 9.20, lng: 78.90 },
    { lat: 8.80, lng: 78.40 },
    { lat: 8.20, lng: 77.80 },   // Near Kanyakumari
    // Extend outward toward IMBL
    { lat: 8.10, lng: 78.20 },
    { lat: 8.40, lng: 78.50 },
    { lat: 8.70, lng: 78.80 },
    { lat: 8.90, lng: 79.00 },
    { lat: 9.10, lng: 79.20 },
    { lat: 9.30, lng: 79.40 },
    { lat: 9.50, lng: 79.60 },
    { lat: 9.80, lng: 79.80 },
    { lat: 10.10, lng: 79.85 },
    { lat: 10.60, lng: 79.90 },
    { lat: 11.20, lng: 79.95 },
    { lat: 11.80, lng: 80.10 },
    { lat: 12.50, lng: 80.20 },
    { lat: 13.20, lng: 80.30 },
    { lat: 13.40, lng: 80.28 },  // Close polygon
];

// ─── Sri Lankan Fishing Zone (EEZ polygon — Sri Lankan side) ────────
export const SRILANKAN_FISHING_ZONE = [
    // IMBL boundary (Indian side of line)
    { lat: 13.20, lng: 80.30 },
    { lat: 12.50, lng: 80.20 },
    { lat: 11.80, lng: 80.10 },
    { lat: 11.20, lng: 79.95 },
    { lat: 10.60, lng: 79.90 },
    { lat: 10.10, lng: 79.85 },
    { lat: 9.80, lng: 79.80 },
    { lat: 9.50, lng: 79.60 },
    { lat: 9.30, lng: 79.40 },
    { lat: 9.10, lng: 79.20 },
    { lat: 8.90, lng: 79.00 },
    { lat: 8.70, lng: 78.80 },
    { lat: 8.40, lng: 78.50 },
    { lat: 8.10, lng: 78.20 },
    { lat: 7.80, lng: 78.00 },
    // Sri Lankan coastline
    { lat: 7.50, lng: 78.50 },
    { lat: 7.20, lng: 79.20 },
    { lat: 7.00, lng: 79.70 },   // Southern Sri Lanka
    { lat: 7.30, lng: 80.00 },
    { lat: 7.80, lng: 80.20 },
    { lat: 8.30, lng: 80.30 },
    { lat: 8.80, lng: 80.30 },
    { lat: 9.30, lng: 80.20 },
    { lat: 9.70, lng: 80.10 },   // Jaffna coast
    { lat: 10.10, lng: 80.10 },
    { lat: 10.80, lng: 80.20 },
    { lat: 11.50, lng: 80.30 },
    { lat: 12.20, lng: 80.40 },
    { lat: 13.00, lng: 80.50 },
    { lat: 13.20, lng: 80.30 },  // Close polygon
];

// ─── Fish Density Zones ─────────────────────────────────────
// Realistic fishing hotspots in the Palk Strait / Gulf of Mannar region
export const FISH_ZONES = [
    // Indian Side — High density areas
    {
        name: 'Palk Bay Rich Zone',
        center: { lat: 10.05, lng: 79.60 },
        radius: 15000,
        intensity: 'high',
        species: ['Prawns', 'Crabs', 'Sardines'],
        side: 'india',
        polygon: [
            [10.20, 79.45], [10.20, 79.75], [9.90, 79.75], [9.90, 79.45]
        ],
    },
    {
        name: 'Rameswaram Fishing Ground',
        center: { lat: 9.40, lng: 79.20 },
        radius: 12000,
        intensity: 'high',
        species: ['Tuna', 'Mackerel', 'Shrimp'],
        side: 'india',
        polygon: [
            [9.55, 79.05], [9.55, 79.35], [9.25, 79.35], [9.25, 79.05]
        ],
    },
    {
        name: 'Gulf of Mannar Marine',
        center: { lat: 8.95, lng: 78.60 },
        radius: 18000,
        intensity: 'medium',
        species: ['Sea Cucumber', 'Chanks', 'Grouper'],
        side: 'india',
        polygon: [
            [9.15, 78.40], [9.15, 78.80], [8.75, 78.80], [8.75, 78.40]
        ],
    },
    {
        name: 'Nagapattinam Coast',
        center: { lat: 10.80, lng: 79.85 },
        radius: 10000,
        intensity: 'medium',
        species: ['Anchovies', 'Sardines', 'Pomfret'],
        side: 'india',
        polygon: [
            [10.95, 79.72], [10.95, 79.98], [10.65, 79.98], [10.65, 79.72]
        ],
    },
    {
        name: 'Cuddalore Zone',
        center: { lat: 11.70, lng: 79.90 },
        radius: 8000,
        intensity: 'low',
        species: ['Sardines', 'Mackerel'],
        side: 'india',
        polygon: [
            [11.82, 79.78], [11.82, 80.02], [11.58, 80.02], [11.58, 79.78]
        ],
    },
    // Sri Lankan Side — fishing areas
    {
        name: 'Jaffna Lagoon Waters',
        center: { lat: 9.65, lng: 80.05 },
        radius: 12000,
        intensity: 'high',
        species: ['Prawns', 'Crab', 'Mullet'],
        side: 'srilanka',
        polygon: [
            [9.80, 79.90], [9.80, 80.20], [9.50, 80.20], [9.50, 79.90]
        ],
    },
    {
        name: 'Mannar Island Zone',
        center: { lat: 9.00, lng: 79.85 },
        radius: 10000,
        intensity: 'medium',
        species: ['Lobster', 'Grouper', 'Snapper'],
        side: 'srilanka',
        polygon: [
            [9.15, 79.70], [9.15, 80.00], [8.85, 80.00], [8.85, 79.70]
        ],
    },
    {
        name: 'Trincomalee Waters',
        center: { lat: 8.60, lng: 80.10 },
        radius: 14000,
        intensity: 'low',
        species: ['Tuna', 'Sailfish'],
        side: 'srilanka',
        polygon: [
            [8.78, 79.95], [8.78, 80.25], [8.42, 80.25], [8.42, 79.95]
        ],
    },
];

// ─── Border Warning Thresholds (meters) ─────
export const BORDER_WARNING_DISTANCE = 5000;   // 5 km — warning zone
export const BORDER_DANGER_DISTANCE = 1000;    // 1 km — danger zone

// ─── Map Defaults (centered on Palk Strait between Chennai & Sri Lanka) ─────
export const DEFAULT_MAP_CENTER = { lat: 10.00, lng: 79.85 };
export const DEFAULT_MAP_ZOOM = 8;

// ─── Storage Keys ───────────────────────────
export const STORAGE_KEYS = {
    USERS: 'cg_users',
    CURRENT_USER: 'cg_current_user',
    ALERTS: 'cg_alerts',
    ALERT_COUNTER: 'cg_alert_counter',
};

// Legacy — kept for backwards compatibility
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
