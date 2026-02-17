// ──────────────────────────────────────────────
// Weather Service — Sea Conditions for Fishermen
// Provides real-time weather data for the Palk Strait region.
//
// Uses Open-Meteo API (free, no API key needed).
// Falls back to mock data when offline.
// ──────────────────────────────────────────────

const WEATHER_CACHE_KEY = 'cg_weather_cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

// Beaufort Scale mapping for wind speed → sea state
const BEAUFORT_SCALE = [
    { max: 1, scale: 0, desc: 'Calm', sea: 'Mirror-like', icon: '🌊', danger: 'safe' },
    { max: 6, scale: 1, desc: 'Light Air', sea: 'Ripples', icon: '🌊', danger: 'safe' },
    { max: 12, scale: 2, desc: 'Light Breeze', sea: 'Small wavelets', icon: '🌊', danger: 'safe' },
    { max: 20, scale: 3, desc: 'Gentle Breeze', sea: 'Large wavelets', icon: '🌬️', danger: 'safe' },
    { max: 29, scale: 4, desc: 'Moderate Breeze', sea: '1–1.5m waves', icon: '🌬️', danger: 'caution' },
    { max: 39, scale: 5, desc: 'Fresh Breeze', sea: '2–2.5m waves', icon: '💨', danger: 'caution' },
    { max: 50, scale: 6, desc: 'Strong Breeze', sea: '3–4m waves', icon: '💨', danger: 'warning' },
    { max: 62, scale: 7, desc: 'Near Gale', sea: '4–5.5m waves', icon: '🌪️', danger: 'danger' },
    { max: 75, scale: 8, desc: 'Gale', sea: '5.5–7.5m waves', icon: '🌪️', danger: 'danger' },
    { max: 89, scale: 9, desc: 'Strong Gale', sea: '7–10m waves', icon: '⛈️', danger: 'danger' },
    { max: 999, scale: 10, desc: 'Storm', sea: '9–12.5m waves', icon: '🌀', danger: 'danger' },
];

/**
 * Get Beaufort scale info from wind speed (km/h).
 */
function getBeaufort(windSpeed) {
    return BEAUFORT_SCALE.find(b => windSpeed <= b.max) || BEAUFORT_SCALE[BEAUFORT_SCALE.length - 1];
}

/**
 * Determine tide phase from time of day (simplified estimation).
 */
function getTidePhase(hour) {
    // Simplified semi-diurnal tidal cycle (2 highs, 2 lows per day)
    const tideAngle = (hour / 12.42) * 2 * Math.PI;
    const tideValue = Math.sin(tideAngle);

    if (tideValue > 0.5) return { phase: 'High Tide', icon: '🌕', level: 'high' };
    if (tideValue > -0.5) return { phase: tideValue > 0 ? 'Falling Tide' : 'Rising Tide', icon: '🌗', level: 'mid' };
    return { phase: 'Low Tide', icon: '🌑', level: 'low' };
}

/**
 * Get UV index description.
 */
function getUVDescription(uv) {
    if (uv <= 2) return { label: 'Low', color: '#4CAF50' };
    if (uv <= 5) return { label: 'Moderate', color: '#FFC107' };
    if (uv <= 7) return { label: 'High', color: '#FF9800' };
    if (uv <= 10) return { label: 'Very High', color: '#F44336' };
    return { label: 'Extreme', color: '#9C27B0' };
}

/**
 * Fetch weather data from Open-Meteo API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<object>} Processed weather data
 */
export async function fetchWeather(lat = 10.05, lng = 79.70) {
    // Check cache first
    const cached = getCachedWeather();
    if (cached) return cached;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?` +
            `latitude=${lat}&longitude=${lng}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,` +
            `precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,` +
            `surface_pressure,uv_index,visibility` +
            `&hourly=temperature_2m,wind_speed_10m,weather_code,wave_height` +
            `&forecast_days=1` +
            `&timezone=Asia/Kolkata`;

        const response = await fetch(url, {
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        const weather = processWeatherData(data);
        cacheWeather(weather);
        return weather;
    } catch (err) {
        console.warn('[Weather] API failed, using mock data:', err.message);

        // Try cached data (even expired)
        const expired = getCachedWeather(true);
        if (expired) return { ...expired, stale: true };

        return getMockWeather();
    }
}

/**
 * Process raw API data into app-friendly format.
 */
function processWeatherData(data) {
    const current = data.current || {};
    const hourly = data.hourly || {};
    const now = new Date();
    const hour = now.getHours();

    const windSpeed = current.wind_speed_10m || 0;
    const beaufort = getBeaufort(windSpeed);
    const tide = getTidePhase(hour);
    const uvInfo = getUVDescription(current.uv_index || 0);

    // Get wave height from hourly data if available
    const currentHourIndex = hourly.time?.findIndex(t =>
        new Date(t).getHours() === hour
    ) ?? -1;
    const waveHeight = currentHourIndex >= 0 ? hourly.wave_height?.[currentHourIndex] : null;

    // Build forecast summary (next 12 hours)
    const forecast = [];
    if (hourly.time) {
        for (let i = currentHourIndex >= 0 ? currentHourIndex : 0; i < Math.min((currentHourIndex >= 0 ? currentHourIndex : 0) + 12, hourly.time.length); i++) {
            forecast.push({
                time: hourly.time[i],
                hour: new Date(hourly.time[i]).getHours(),
                temp: hourly.temperature_2m?.[i],
                wind: hourly.wind_speed_10m?.[i],
                weatherCode: hourly.weather_code?.[i],
                waveHeight: hourly.wave_height?.[i],
            });
        }
    }

    // Determine fishing advisory
    const advisory = getFishingAdvisory(beaufort, current.weather_code, waveHeight, current.visibility);

    return {
        current: {
            temperature: Math.round(current.temperature_2m || 30),
            feelsLike: Math.round(current.apparent_temperature || 32),
            humidity: Math.round(current.relative_humidity_2m || 75),
            windSpeed: Math.round(windSpeed),
            windGusts: Math.round(current.wind_gusts_10m || 0),
            windDirection: current.wind_direction_10m || 0,
            windDirectionLabel: getWindDirectionLabel(current.wind_direction_10m),
            pressure: Math.round(current.surface_pressure || 1013),
            uvIndex: current.uv_index || 0,
            uvLabel: uvInfo.label,
            uvColor: uvInfo.color,
            visibility: current.visibility ? (current.visibility / 1000).toFixed(1) : null,
            weatherCode: current.weather_code || 0,
            weatherIcon: getWeatherIcon(current.weather_code),
            weatherDesc: getWeatherDescription(current.weather_code),
            precipitation: current.precipitation || 0,
        },
        sea: {
            beaufort,
            waveHeight: waveHeight != null ? waveHeight.toFixed(1) : null,
            tide,
            seaState: beaufort.sea,
            dangerLevel: beaufort.danger,
        },
        advisory,
        forecast,
        fetchedAt: new Date().toISOString(),
        stale: false,
    };
}

/**
 * Fishing advisory based on conditions.
 */
function getFishingAdvisory(beaufort, weatherCode, waveHeight, visibility) {
    // Storm/gale conditions
    if (beaufort.scale >= 7) {
        return {
            level: 'danger',
            icon: '🚫',
            title: 'DO NOT GO TO SEA',
            message: 'Extremely dangerous conditions. All boats should return to port immediately.',
            color: '#E63946',
        };
    }

    if (beaufort.scale >= 6) {
        return {
            level: 'warning',
            icon: '⚠️',
            title: 'Unsafe Conditions',
            message: 'Strong winds and high waves. Small boats should avoid open waters.',
            color: '#F4A261',
        };
    }

    // Heavy rain / thunderstorm
    if (weatherCode >= 95) {
        return {
            level: 'warning',
            icon: '⛈️',
            title: 'Thunderstorm Warning',
            message: 'Active thunderstorms in the area. Seek shelter immediately.',
            color: '#F4A261',
        };
    }

    if (beaufort.scale >= 5) {
        return {
            level: 'caution',
            icon: '⚡',
            title: 'Moderate Risk',
            message: 'Fresh breeze with 2–3m waves. Exercise caution, especially in small boats.',
            color: '#E9C46A',
        };
    }

    // Low visibility
    if (visibility && visibility < 2000) {
        return {
            level: 'caution',
            icon: '🌫️',
            title: 'Low Visibility',
            message: 'Fog or haze reducing visibility. Use radar and lights.',
            color: '#E9C46A',
        };
    }

    return {
        level: 'safe',
        icon: '✅',
        title: 'Safe to Fish',
        message: 'Weather conditions are favorable for fishing. Stay aware of changing conditions.',
        color: '#2A9D8F',
    };
}

function getWindDirectionLabel(degrees) {
    if (degrees == null) return 'N/A';
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
}

function getWeatherIcon(code) {
    if (code === 0) return '☀️';
    if (code <= 3) return '⛅';
    if (code <= 49) return '🌫️';
    if (code <= 59) return '🌧️';
    if (code <= 69) return '🌨️';
    if (code <= 79) return '❄️';
    if (code <= 82) return '🌧️';
    if (code <= 86) return '🌨️';
    if (code <= 99) return '⛈️';
    return '🌤️';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snowfall', 73: 'Moderate snowfall', 75: 'Heavy snowfall',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail',
    };
    return descriptions[code] || 'Clear';
}

// ─── Caching ─────────────────────────────────
function cacheWeather(data) {
    try {
        localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify({
            data,
            cachedAt: Date.now(),
        }));
    } catch {
        // Storage full — ignore
    }
}

function getCachedWeather(ignoreExpiry = false) {
    try {
        const raw = localStorage.getItem(WEATHER_CACHE_KEY);
        if (!raw) return null;

        const { data, cachedAt } = JSON.parse(raw);
        if (!ignoreExpiry && Date.now() - cachedAt > CACHE_TTL_MS) return null;

        return data;
    } catch {
        return null;
    }
}

// ─── Mock Data (Offline Fallback) ────────────
function getMockWeather() {
    const hour = new Date().getHours();
    const beaufort = getBeaufort(15);
    const tide = getTidePhase(hour);

    return {
        current: {
            temperature: 29,
            feelsLike: 33,
            humidity: 78,
            windSpeed: 15,
            windGusts: 22,
            windDirection: 220,
            windDirectionLabel: 'SW',
            pressure: 1012,
            uvIndex: 6,
            uvLabel: 'High',
            uvColor: '#FF9800',
            visibility: '10.0',
            weatherCode: 2,
            weatherIcon: '⛅',
            weatherDesc: 'Partly cloudy',
            precipitation: 0,
        },
        sea: {
            beaufort,
            waveHeight: '0.8',
            tide,
            seaState: beaufort.sea,
            dangerLevel: beaufort.danger,
        },
        advisory: {
            level: 'safe',
            icon: '✅',
            title: 'Safe to Fish',
            message: 'Conditions look favorable. Data may be outdated — check local conditions.',
            color: '#2A9D8F',
        },
        forecast: [],
        fetchedAt: new Date().toISOString(),
        stale: true,
    };
}
