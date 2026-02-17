import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Marker, Popup, Tooltip, Circle, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
    MARITIME_BOUNDARY,
    INDIAN_FISHING_ZONE,
    SRILANKAN_FISHING_ZONE,
    FISH_ZONES,
    DEFAULT_MAP_CENTER,
    DEFAULT_MAP_ZOOM,
} from '../utils/constants';

// ─── Fix default Leaflet marker icons ────────────────────────
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ─── Color Definitions ──────────────────────────────────────
const ZONE_COLORS = {
    india: {
        fill: '#1E88E5',
        stroke: '#0D47A1',
        fillOpacity: 0.12,
        strokeOpacity: 0.6,
    },
    srilanka: {
        fill: '#FF7043',
        stroke: '#BF360C',
        fillOpacity: 0.12,
        strokeOpacity: 0.6,
    },
};

const DENSITY_COLORS = {
    high: { fill: '#00C853', stroke: '#1B5E20', glow: 'rgba(0, 200, 83, 0.3)' },
    medium: { fill: '#FFD600', stroke: '#F57F17', glow: 'rgba(255, 214, 0, 0.3)' },
    low: { fill: '#FF9100', stroke: '#E65100', glow: 'rgba(255, 145, 0, 0.25)' },
};

const DENSITY_ICONS = {
    high: '🐟🐟🐟',
    medium: '🐟🐟',
    low: '🐟',
};

// ─── Convert coords for Leaflet [lat, lng] format ───────────
const toLatLng = (coords) => coords.map(c => [c.lat, c.lng]);
const polyToLatLng = (coords) => coords.map(c => [c[0], c[1]]);

// ─── Fisherman Location Marker (Custom HTML) ────────────────
function createFishermanIcon() {
    return L.divIcon({
        className: 'fisherman-marker',
        html: `
            <div class="fisherman-marker-outer">
                <div class="fisherman-marker-pulse"></div>
                <div class="fisherman-marker-inner">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#0B3C5D"/>
                        <circle cx="12" cy="9" r="3" fill="#fff"/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 48],
        popupAnchor: [0, -48],
    });
}

// ─── Map auto-center on user location ───────────────────────
function MapAutoCenter({ position, shouldCenter }) {
    const map = useMap();
    const hasCentered = useRef(false);

    useEffect(() => {
        if (position && shouldCenter && !hasCentered.current) {
            map.setView([position.lat, position.lng], 9, { animate: true });
            hasCentered.current = true;
        }
    }, [position, shouldCenter, map]);

    return null;
}

// ─── Distance-based zone highlighting ───────────────────────
function useNearbyZones(userLocation) {
    return useMemo(() => {
        if (!userLocation) return { nearbyZones: [], distanceToIMBL: null };

        const zones = FISH_ZONES.map(zone => {
            const dist = getDistanceKm(
                userLocation.lat, userLocation.lng,
                zone.center.lat, zone.center.lng
            );
            return { ...zone, distanceKm: dist, isNearby: dist < 50 };
        });

        // Approximate distance to IMBL
        let minDist = Infinity;
        const boundary = MARITIME_BOUNDARY;
        for (let i = 0; i < boundary.length - 1; i++) {
            const d = pointToSegmentDistance(
                userLocation.lat, userLocation.lng,
                boundary[i].lat, boundary[i].lng,
                boundary[i + 1].lat, boundary[i + 1].lng
            );
            if (d < minDist) minDist = d;
        }

        return { nearbyZones: zones, distanceToIMBL: minDist };
    }, [userLocation]);
}

function getDistanceKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function pointToSegmentDistance(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    let t = ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return getDistanceKm(px, py, ax + t * dx, ay + t * dy);
}

// ─── Main MapView Component ─────────────────────────────────
export default function MapView({
    userLocation,
    alertMarkers = [],
    showBoundary = true,
    showFishZones = false,
    height = 'h-72',
    onMarkerClick,
    className = '',
}) {
    const [legendOpen, setLegendOpen] = useState(true);
    const [selectedZone, setSelectedZone] = useState(null);
    const { nearbyZones, distanceToIMBL } = useNearbyZones(userLocation);

    const center = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [DEFAULT_MAP_CENTER.lat, DEFAULT_MAP_CENTER.lng];

    const fishermanIcon = useMemo(() => createFishermanIcon(), []);

    return (
        <div className={`${height} ${className} rounded-2xl overflow-hidden shadow-lg border border-border/50 relative leaflet-map-container`} id="fish-zone-map">
            <MapContainer
                center={center}
                zoom={DEFAULT_MAP_ZOOM}
                scrollWheelZoom={true}
                zoomControl={true}
                dragging={true}
                touchZoom={true}
                doubleClickZoom={true}
                style={{ width: '100%', height: '100%' }}
                attributionControl={false}
            >
                {/* Ocean-themed tile layer */}
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    maxZoom={19}
                />

                {/* Auto-center on user location */}
                <MapAutoCenter position={userLocation} shouldCenter={!!userLocation} />

                {/* ─── Indian Fishing Zone Polygon ───── */}
                <Polygon
                    positions={toLatLng(INDIAN_FISHING_ZONE)}
                    pathOptions={{
                        fillColor: ZONE_COLORS.india.fill,
                        fillOpacity: ZONE_COLORS.india.fillOpacity,
                        color: ZONE_COLORS.india.stroke,
                        weight: 2.5,
                        opacity: ZONE_COLORS.india.strokeOpacity,
                        dashArray: '6 4',
                    }}
                    eventHandlers={{
                        click: () => setSelectedZone('india'),
                    }}
                >
                    <Tooltip
                        direction="center"
                        permanent={false}
                        sticky={true}
                        className="zone-tooltip zone-tooltip-india"
                    >
                        <div className="zone-tip-content">
                            <span className="zone-tip-flag">🇮🇳</span>
                            <strong>Indian Fishing Zone</strong>
                            <p>Safe waters for Indian fishermen</p>
                        </div>
                    </Tooltip>
                </Polygon>

                {/* ─── Sri Lankan Fishing Zone Polygon ───── */}
                <Polygon
                    positions={toLatLng(SRILANKAN_FISHING_ZONE)}
                    pathOptions={{
                        fillColor: ZONE_COLORS.srilanka.fill,
                        fillOpacity: ZONE_COLORS.srilanka.fillOpacity,
                        color: ZONE_COLORS.srilanka.stroke,
                        weight: 2.5,
                        opacity: ZONE_COLORS.srilanka.strokeOpacity,
                        dashArray: '6 4',
                    }}
                    eventHandlers={{
                        click: () => setSelectedZone('srilanka'),
                    }}
                >
                    <Tooltip
                        direction="center"
                        permanent={false}
                        sticky={true}
                        className="zone-tooltip zone-tooltip-srilanka"
                    >
                        <div className="zone-tip-content">
                            <span className="zone-tip-flag">🇱🇰</span>
                            <strong>Sri Lankan Fishing Zone</strong>
                            <p>⚠️ Do NOT cross into this zone</p>
                        </div>
                    </Tooltip>
                </Polygon>

                {/* ─── Maritime Boundary (IMBL) ───── */}
                {showBoundary && (
                    <Polyline
                        positions={toLatLng(MARITIME_BOUNDARY)}
                        pathOptions={{
                            color: '#E63946',
                            weight: 3.5,
                            opacity: 0.9,
                            dashArray: '12 8',
                            lineCap: 'round',
                            lineJoin: 'round',
                        }}
                    >
                        <Tooltip
                            direction="center"
                            permanent={false}
                            sticky={true}
                            className="zone-tooltip zone-tooltip-border"
                        >
                            <div className="zone-tip-content">
                                <span className="zone-tip-flag">🚫</span>
                                <strong>International Maritime Boundary</strong>
                                <p>Do NOT cross this line. Arrests may occur beyond this boundary.</p>
                            </div>
                        </Tooltip>
                    </Polyline>
                )}

                {/* ─── Fish Density Zones ───── */}
                {showFishZones && nearbyZones.map((zone, i) => (
                    <FishDensityZone key={`fish-${i}`} zone={zone} />
                ))}

                {/* ─── Fisherman Location Marker ───── */}
                {userLocation && (
                    <>
                        {/* Accuracy circle */}
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={userLocation.accuracy || 100}
                            pathOptions={{
                                fillColor: '#0B3C5D',
                                fillOpacity: 0.07,
                                color: '#0B3C5D',
                                weight: 1,
                                opacity: 0.3,
                            }}
                        />
                        {/* Marker */}
                        <Marker
                            position={[userLocation.lat, userLocation.lng]}
                            icon={fishermanIcon}
                            zIndexOffset={1000}
                        >
                            <Popup className="fisherman-popup" maxWidth={260}>
                                <div className="fp-content">
                                    <div className="fp-header">
                                        <span className="fp-icon">🚤</span>
                                        <span className="fp-title">Your Location</span>
                                    </div>
                                    <div className="fp-coords">
                                        <span>{userLocation.lat.toFixed(4)}°N</span>
                                        <span>{userLocation.lng.toFixed(4)}°E</span>
                                    </div>
                                    {distanceToIMBL != null && (
                                        <div className={`fp-border-dist ${distanceToIMBL < 5 ? 'fp-danger' : distanceToIMBL < 15 ? 'fp-warning' : 'fp-safe'}`}>
                                            <span className="fp-dist-icon">
                                                {distanceToIMBL < 5 ? '🚨' : distanceToIMBL < 15 ? '⚠️' : '✅'}
                                            </span>
                                            <span>
                                                {distanceToIMBL < 5
                                                    ? `⚠ VERY CLOSE TO BORDER: ${distanceToIMBL.toFixed(1)} km`
                                                    : distanceToIMBL < 15
                                                        ? `Near border: ${distanceToIMBL.toFixed(1)} km`
                                                        : `Safe: ${distanceToIMBL.toFixed(1)} km from border`
                                                }
                                            </span>
                                        </div>
                                    )}
                                    {userLocation.accuracy && (
                                        <div className="fp-accuracy">
                                            GPS accuracy: ±{Math.round(userLocation.accuracy)}m
                                        </div>
                                    )}
                                </div>
                            </Popup>
                        </Marker>
                    </>
                )}

                {/* ─── Alert Markers ───── */}
                {alertMarkers.map((marker) => (
                    <CircleMarker
                        key={marker.id}
                        center={[marker.location.lat, marker.location.lng]}
                        radius={10}
                        pathOptions={{
                            fillColor: marker.type === 'sos' ? '#E63946' : '#F4A261',
                            fillOpacity: 0.9,
                            color: '#fff',
                            weight: 3,
                        }}
                        eventHandlers={{
                            click: () => onMarkerClick?.(marker),
                        }}
                    >
                        <Popup className="alert-marker-popup">
                            <div className="amp-content">
                                <div className={`amp-badge ${marker.type === 'sos' ? 'amp-sos' : 'amp-border'}`}>
                                    {marker.type === 'sos' ? '🚨 SOS' : '⚠️ Border Alert'}
                                </div>
                                <p className="amp-boat">{marker.boatNumber}</p>
                                <p className="amp-name">{marker.fishermanName}</p>
                                <p className="amp-time">{new Date(marker.timestamp).toLocaleTimeString()}</p>
                            </div>
                        </Popup>
                    </CircleMarker>
                ))}
            </MapContainer>

            {/* ─── Live Badge ───── */}
            <div className="absolute top-3 right-3 z-[1000] glass-card rounded-lg px-2.5 py-1.5 text-[10px] font-semibold text-ocean/70 flex items-center gap-1.5 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-safe animate-pulse" />
                Live Map
            </div>

            {/* ─── Interactive Legend ───── */}
            <div className={`absolute bottom-3 left-3 z-[1000] map-legend ${legendOpen ? 'map-legend-open' : 'map-legend-closed'}`}>
                <button
                    className="map-legend-toggle"
                    onClick={() => setLegendOpen(!legendOpen)}
                    aria-label="Toggle map legend"
                >
                    <span className="map-legend-toggle-icon">{legendOpen ? '▼' : '▲'}</span>
                    <span className="map-legend-toggle-text">Legend</span>
                </button>

                {legendOpen && (
                    <div className="map-legend-body">
                        <div className="legend-item">
                            <span className="legend-swatch" style={{ background: '#1E88E5', opacity: 0.5 }} />
                            <span>🇮🇳 Indian Fishing Zone (Safe)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-swatch" style={{ background: '#FF7043', opacity: 0.5 }} />
                            <span>🇱🇰 Sri Lankan Zone (Avoid)</span>
                        </div>
                        <div className="legend-item">
                            <span className="legend-line" style={{ borderColor: '#E63946' }} />
                            <span>🚫 Maritime Boundary</span>
                        </div>
                        {showFishZones && (
                            <>
                                <div className="legend-divider" />
                                <div className="legend-section-title">Fish Density</div>
                                <div className="legend-item">
                                    <span className="legend-swatch legend-swatch-round" style={{ background: '#00C853' }} />
                                    <span>🐟🐟🐟 High Density</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-swatch legend-swatch-round" style={{ background: '#FFD600' }} />
                                    <span>🐟🐟 Medium Density</span>
                                </div>
                                <div className="legend-item">
                                    <span className="legend-swatch legend-swatch-round" style={{ background: '#FF9100' }} />
                                    <span>🐟 Low Density</span>
                                </div>
                            </>
                        )}
                        <div className="legend-divider" />
                        <div className="legend-item">
                            <span className="legend-marker-you" />
                            <span>📍 Your Location</span>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Border Distance Overlay ───── */}
            {userLocation && distanceToIMBL != null && (
                <div className={`absolute top-3 left-3 z-[1000] border-dist-badge ${distanceToIMBL < 5 ? 'bdb-danger' : distanceToIMBL < 15 ? 'bdb-warning' : 'bdb-safe'
                    }`}>
                    <span className="bdb-icon">
                        {distanceToIMBL < 5 ? '🚨' : distanceToIMBL < 15 ? '⚠️' : '🛡️'}
                    </span>
                    <div className="bdb-text">
                        <span className="bdb-label">To Border</span>
                        <span className="bdb-value">{distanceToIMBL.toFixed(1)} km</span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Fish Density Zone Sub-component ────────────────────────
function FishDensityZone({ zone }) {
    const colors = DENSITY_COLORS[zone.intensity];
    const icons = DENSITY_ICONS[zone.intensity];

    return (
        <>
            {/* Polygon zone */}
            <Polygon
                positions={polyToLatLng(zone.polygon)}
                pathOptions={{
                    fillColor: colors.fill,
                    fillOpacity: 0.2,
                    color: colors.stroke,
                    weight: 2,
                    opacity: 0.7,
                    dashArray: '4 3',
                }}
            >
                <Tooltip
                    direction="top"
                    permanent={false}
                    sticky={true}
                    className="zone-tooltip zone-tooltip-fish"
                >
                    <div className="fish-tip-content">
                        <div className="fish-tip-header">
                            <span className="fish-tip-density">{icons}</span>
                            <strong>{zone.name}</strong>
                        </div>
                        <div className="fish-tip-meta">
                            <span className={`fish-tip-badge fish-tip-${zone.intensity}`}>
                                {zone.intensity.toUpperCase()} DENSITY
                            </span>
                            {zone.side === 'india'
                                ? <span className="fish-tip-side fish-tip-safe">🇮🇳 Indian Waters</span>
                                : <span className="fish-tip-side fish-tip-caution">🇱🇰 Sri Lankan Waters</span>
                            }
                        </div>
                        {zone.species && (
                            <div className="fish-tip-species">
                                <span>Species:&nbsp;</span>
                                <strong>{zone.species.join(', ')}</strong>
                            </div>
                        )}
                        {zone.distanceKm != null && (
                            <div className="fish-tip-distance">
                                📏 {zone.distanceKm.toFixed(1)} km from you
                            </div>
                        )}
                    </div>
                </Tooltip>
            </Polygon>

            {/* Center icon indicator */}
            <CircleMarker
                center={[zone.center.lat, zone.center.lng]}
                radius={zone.intensity === 'high' ? 8 : zone.intensity === 'medium' ? 6 : 5}
                pathOptions={{
                    fillColor: colors.fill,
                    fillOpacity: 0.8,
                    color: '#fff',
                    weight: 2,
                }}
            >
                <Tooltip direction="top" permanent className="fish-center-label">
                    {icons}
                </Tooltip>
            </CircleMarker>
        </>
    );
}
