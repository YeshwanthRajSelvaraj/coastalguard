// ──────────────────────────────────────────────
// Weather Widget — Sea Conditions for Fishermen
// Beautiful, compact weather display showing:
// • Current temperature & conditions
// • Wind speed with Beaufort scale
// • Wave height & sea state
// • Tide phase
// • Fishing advisory (Safe/Caution/Warning/Danger)
// ──────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { fetchWeather } from '../services/weatherService';
import { useTranslation } from '../contexts/TranslationContext';

export default function WeatherWidget({ location, compact = false }) {
    const { t } = useTranslation();
    const [weather, setWeather] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);

    const loadWeather = useCallback(async () => {
        setLoading(true);
        const data = await fetchWeather(location?.lat, location?.lng);
        setWeather(data);
        setLoading(false);
    }, [location?.lat, location?.lng]);

    useEffect(() => {
        loadWeather();
        // Refresh every 15 minutes
        const interval = setInterval(loadWeather, 15 * 60 * 1000);
        return () => clearInterval(interval);
    }, [loadWeather]);

    if (loading && !weather) {
        return (
            <div className="weather-widget weather-loading" id="weather-widget">
                <div className="ww-shimmer" />
                <span className="ww-loading-text">Loading weather...</span>
            </div>
        );
    }

    if (!weather) return null;

    const { current, sea, advisory } = weather;

    // ─── Compact Mode (inline in status bar) ─────
    if (compact) {
        return (
            <div
                className={`weather-compact wc-${advisory.level}`}
                id="weather-compact"
                onClick={() => setExpanded(!expanded)}
                title="Sea conditions — tap for details"
            >
                <span className="wc-icon">{current.weatherIcon}</span>
                <span className="wc-temp">{current.temperature}°</span>
                <span className="wc-wind">💨 {current.windSpeed} km/h</span>
                <span className={`wc-advisory wc-adv-${advisory.level}`}>
                    {advisory.icon}
                </span>
            </div>
        );
    }

    // ─── Full Widget ─────────────────────────────
    return (
        <div className="weather-widget" id="weather-widget">
            {/* Advisory Banner */}
            <div className={`ww-advisory ww-adv-${advisory.level}`}>
                <span className="ww-adv-icon">{advisory.icon}</span>
                <div className="ww-adv-text">
                    <span className="ww-adv-title">{advisory.title}</span>
                    <span className="ww-adv-msg">{advisory.message}</span>
                </div>
            </div>

            {/* Main Weather Row */}
            <div className="ww-main">
                <div className="ww-temp-section">
                    <span className="ww-weather-icon">{current.weatherIcon}</span>
                    <div className="ww-temp-info">
                        <span className="ww-temp">{current.temperature}°C</span>
                        <span className="ww-desc">{current.weatherDesc}</span>
                    </div>
                </div>

                <div className="ww-sea-section">
                    <div className="ww-sea-stat">
                        <span className="ww-sea-icon">{sea.beaufort.icon}</span>
                        <span className="ww-sea-label">Sea: Beaufort {sea.beaufort.scale}</span>
                        <span className="ww-sea-value">{sea.seaState}</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="ww-stats">
                <div className="ww-stat">
                    <span className="ww-stat-icon">💨</span>
                    <span className="ww-stat-value">{current.windSpeed}</span>
                    <span className="ww-stat-unit">km/h {current.windDirectionLabel}</span>
                    <span className="ww-stat-label">Wind</span>
                </div>

                {sea.waveHeight && (
                    <div className="ww-stat">
                        <span className="ww-stat-icon">🌊</span>
                        <span className="ww-stat-value">{sea.waveHeight}</span>
                        <span className="ww-stat-unit">m</span>
                        <span className="ww-stat-label">Waves</span>
                    </div>
                )}

                <div className="ww-stat">
                    <span className="ww-stat-icon">{sea.tide.icon}</span>
                    <span className="ww-stat-value ww-stat-value-sm">{sea.tide.phase}</span>
                    <span className="ww-stat-unit"></span>
                    <span className="ww-stat-label">Tide</span>
                </div>

                <div className="ww-stat">
                    <span className="ww-stat-icon">☀️</span>
                    <span className="ww-stat-value" style={{ color: current.uvColor }}>{current.uvIndex}</span>
                    <span className="ww-stat-unit">{current.uvLabel}</span>
                    <span className="ww-stat-label">UV Index</span>
                </div>
            </div>

            {/* Expanded Details */}
            {expanded && (
                <div className="ww-details animate-scale-in">
                    <div className="ww-detail-row">
                        <span className="ww-detail-label">Feels Like</span>
                        <span className="ww-detail-value">{current.feelsLike}°C</span>
                    </div>
                    <div className="ww-detail-row">
                        <span className="ww-detail-label">Humidity</span>
                        <span className="ww-detail-value">{current.humidity}%</span>
                    </div>
                    <div className="ww-detail-row">
                        <span className="ww-detail-label">Pressure</span>
                        <span className="ww-detail-value">{current.pressure} hPa</span>
                    </div>
                    <div className="ww-detail-row">
                        <span className="ww-detail-label">Wind Gusts</span>
                        <span className="ww-detail-value">{current.windGusts} km/h</span>
                    </div>
                    {current.visibility && (
                        <div className="ww-detail-row">
                            <span className="ww-detail-label">Visibility</span>
                            <span className="ww-detail-value">{current.visibility} km</span>
                        </div>
                    )}

                    {/* Hourly Forecast */}
                    {weather.forecast.length > 0 && (
                        <div className="ww-forecast">
                            <span className="ww-forecast-title">Next Hours</span>
                            <div className="ww-forecast-scroll">
                                {weather.forecast.slice(0, 8).map((f, i) => (
                                    <div key={i} className="ww-forecast-item">
                                        <span className="ww-fc-hour">
                                            {f.hour.toString().padStart(2, '0')}:00
                                        </span>
                                        <span className="ww-fc-icon">
                                            {getWeatherIconSmall(f.weatherCode)}
                                        </span>
                                        <span className="ww-fc-temp">{Math.round(f.temp || 0)}°</span>
                                        <span className="ww-fc-wind">{Math.round(f.wind || 0)} km/h</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Toggle / Stale Indicator */}
            <div className="ww-footer">
                <button
                    className="ww-toggle btn-press"
                    onClick={() => setExpanded(!expanded)}
                    id="weather-toggle"
                >
                    {expanded ? '▲ Less' : '▼ More Details'}
                </button>

                <div className="ww-meta">
                    {weather.stale && (
                        <span className="ww-stale">⚠ Cached data</span>
                    )}
                    <button onClick={loadWeather} className="ww-refresh btn-press" title="Refresh weather" id="weather-refresh">
                        ↻
                    </button>
                </div>
            </div>
        </div>
    );
}

function getWeatherIconSmall(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 69) return '🌧️';
    if (code <= 82) return '🌧️';
    return '⛈️';
}
