// ──────────────────────────────────────────────
// SOS Status Panel — Multi-Channel Delivery Visualization
//
// Shows real-time SOS delivery status:
// • Channel availability indicators (Internet/Satellite/AIS)
// • Delivery progress through channel priority chain
// • Offline cache status with queue count
// • Retry countdown timer
// • Delivery confirmation with channel badge
// ──────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useSOS } from '../contexts/SOSContext';

const CHANNEL_INFO = {
    internet: { icon: '🌐', label: 'Internet', short: 'NET', color: '#1E88E5', bg: 'rgba(30,136,229,0.08)' },
    satellite: { icon: '🛰️', label: 'Satellite', short: 'SAT', color: '#7B1FA2', bg: 'rgba(123,31,162,0.08)' },
    ais: { icon: '📡', label: 'AIS/VHF', short: 'AIS', color: '#E65100', bg: 'rgba(230,81,0,0.08)' },
};

export default function SOSStatusPanel({ compact = false }) {
    const {
        connectivity,
        channelAvailability,
        lastSOS,
        lastEvent,
        queueStats,
        hasPendingSOS,
        pendingCount,
    } = useSOS();

    const [retryCountdown, setRetryCountdown] = useState(null);
    const countdownRef = useRef(null);

    // Retry countdown timer when SOS is cached
    useEffect(() => {
        if (hasPendingSOS && lastEvent?.event === 'sos_cached') {
            let remaining = 30;
            setRetryCountdown(remaining);
            countdownRef.current = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(countdownRef.current);
                    setRetryCountdown(null);
                } else {
                    setRetryCountdown(remaining);
                }
            }, 1000);
        }

        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [hasPendingSOS, lastEvent]);

    // ─── Compact Mode (inline in dashboard) ─────────
    if (compact) {
        return (
            <div className="sos-status-compact" id="sos-status-compact">
                <div className="ssc-channels">
                    {Object.entries(CHANNEL_INFO).map(([key, ch]) => (
                        <div
                            key={key}
                            className={`ssc-channel ${channelAvailability[key] ? 'ssc-available' : 'ssc-unavailable'}`}
                            title={`${ch.label}: ${channelAvailability[key] ? 'Available' : 'Unavailable'}`}
                        >
                            <span className="ssc-icon">{ch.icon}</span>
                            <span className="ssc-dot" style={{
                                background: channelAvailability[key] ? '#00C853' : '#F44336',
                            }} />
                        </div>
                    ))}
                </div>

                {!connectivity.isOnline && (
                    <span className="ssc-offline-badge">OFFLINE</span>
                )}

                {hasPendingSOS && (
                    <span className="ssc-pending-badge">{pendingCount} queued</span>
                )}
            </div>
        );
    }

    // ─── Full Panel Mode ────────────────────────────
    return (
        <div className="sos-status-panel" id="sos-status-panel">
            {/* Connectivity Header */}
            <div className="ssp-header">
                <div className="ssp-connectivity">
                    <span className={`ssp-conn-dot ${connectivity.isOnline ? 'ssp-online' : 'ssp-offline'}`} />
                    <span className="ssp-conn-label">
                        {connectivity.state === 'online' ? 'Connected' :
                            connectivity.state === 'degraded' ? 'Weak Signal' : 'Offline'}
                    </span>
                    {connectivity.latencyMs && (
                        <span className="ssp-latency">{connectivity.latencyMs}ms</span>
                    )}
                </div>
                {hasPendingSOS && (
                    <div className="ssp-queue-badge">
                        <span className="ssp-queue-icon">📦</span>
                        <span>{pendingCount} in queue</span>
                    </div>
                )}
            </div>

            {/* Channel Status Grid */}
            <div className="ssp-channels">
                {Object.entries(CHANNEL_INFO).map(([key, ch]) => {
                    const available = channelAvailability[key];
                    const isDeliveryChannel = lastSOS?.sos?.delivery?.channel === key;

                    return (
                        <div
                            key={key}
                            className={`ssp-channel ${available ? 'ssp-ch-available' : 'ssp-ch-unavailable'} ${isDeliveryChannel ? 'ssp-ch-delivered' : ''}`}
                        >
                            <div className="ssp-ch-top">
                                <span className="ssp-ch-icon">{ch.icon}</span>
                                <span className="ssp-ch-status-dot" style={{
                                    background: isDeliveryChannel ? '#00C853' :
                                        available ? '#4CAF50' : '#F44336',
                                    boxShadow: isDeliveryChannel ? '0 0 8px rgba(0,200,83,0.5)' : 'none',
                                }} />
                            </div>
                            <span className="ssp-ch-name">{ch.label}</span>
                            <span className="ssp-ch-state">
                                {isDeliveryChannel ? '✓ Delivered' :
                                    available ? 'Ready' : 'Unavailable'}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Active SOS Delivery Status */}
            {lastSOS && (
                <div className={`ssp-delivery ${lastSOS.event === 'sos_delivered' ? 'ssp-del-success' :
                        lastSOS.event === 'sos_cached' ? 'ssp-del-cached' :
                            'ssp-del-pending'
                    }`}>
                    <div className="ssp-del-header">
                        {lastSOS.event === 'sos_delivered' && (
                            <>
                                <span className="ssp-del-icon">✅</span>
                                <span className="ssp-del-title">SOS Delivered</span>
                                <span className="ssp-del-channel" style={{
                                    background: CHANNEL_INFO[lastSOS.sos?.delivery?.channel]?.bg,
                                    color: CHANNEL_INFO[lastSOS.sos?.delivery?.channel]?.color,
                                }}>
                                    via {CHANNEL_INFO[lastSOS.sos?.delivery?.channel]?.label || 'Unknown'}
                                </span>
                            </>
                        )}
                        {lastSOS.event === 'sos_cached' && (
                            <>
                                <span className="ssp-del-icon">📦</span>
                                <span className="ssp-del-title">Saved Offline</span>
                                <span className="ssp-del-retry">
                                    {retryCountdown != null ? `Retry in ${retryCountdown}s` : 'Retrying...'}
                                </span>
                            </>
                        )}
                        {lastSOS.event === 'sos_queued' && (
                            <>
                                <span className="ssp-del-icon">⏳</span>
                                <span className="ssp-del-title">Sending...</span>
                            </>
                        )}
                    </div>

                    {/* Delivery progress indicator */}
                    {lastSOS.event !== 'sos_delivered' && (
                        <div className="ssp-progress">
                            {Object.entries(CHANNEL_INFO).map(([key, ch], i) => {
                                const attempt = lastSOS.sos?.delivery?.history?.find(h => h.channel === key);
                                const tried = !!attempt;
                                const succeeded = attempt?.status === 'delivered';
                                const failed = attempt?.status === 'failed';

                                return (
                                    <div key={key} className="ssp-prog-step">
                                        <div className={`ssp-prog-dot ${succeeded ? 'ssp-prog-success' :
                                                failed ? 'ssp-prog-fail' :
                                                    tried ? 'ssp-prog-trying' : 'ssp-prog-waiting'
                                            }`}>
                                            {succeeded ? '✓' : failed ? '✗' : (i + 1)}
                                        </div>
                                        <span className="ssp-prog-label">{ch.short}</span>
                                        {i < 2 && <div className={`ssp-prog-line ${tried ? 'ssp-prog-line-done' : ''}`} />}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Offline Cache Info */}
            {(queueStats.cached > 0 || queueStats.pending > 0) && (
                <div className="ssp-cache-info">
                    <span className="ssp-cache-icon">💾</span>
                    <div className="ssp-cache-text">
                        <span className="ssp-cache-title">
                            {queueStats.cached + queueStats.pending} SOS saved locally
                        </span>
                        <span className="ssp-cache-sub">
                            Will auto-send when signal is available
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
