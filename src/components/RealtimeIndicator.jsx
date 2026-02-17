// ──────────────────────────────────────────────────────────────
// RealtimeIndicator — Visual WebSocket Connection Status
//
// Shows real-time connection state, online authority/fisherman
// counts, and latency in a compact, animated indicator.
// Used in both Fisherman and Authority dashboards.
// ──────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import { CONNECTION_STATE } from '../services/socketService';

const STATE_CONFIG = {
    [CONNECTION_STATE.CONNECTED]: {
        color: '#34d399',
        bgColor: 'rgba(52, 211, 153, 0.06)',
        borderColor: 'rgba(52, 211, 153, 0.15)',
        label: 'Live',
        icon: '🟢',
        pulse: true,
    },
    [CONNECTION_STATE.CONNECTING]: {
        color: '#fbbf24',
        bgColor: 'rgba(251, 191, 36, 0.06)',
        borderColor: 'rgba(251, 191, 36, 0.15)',
        label: 'Connecting',
        icon: '🟡',
        pulse: true,
    },
    [CONNECTION_STATE.RECONNECTING]: {
        color: '#fb923c',
        bgColor: 'rgba(251, 146, 60, 0.06)',
        borderColor: 'rgba(251, 146, 60, 0.15)',
        label: 'Reconnecting',
        icon: '🟠',
        pulse: true,
    },
    [CONNECTION_STATE.DISCONNECTED]: {
        color: '#94a3b8',
        bgColor: 'rgba(148, 163, 184, 0.04)',
        borderColor: 'rgba(148, 163, 184, 0.1)',
        label: 'Offline',
        icon: '⚪',
        pulse: false,
    },
    [CONNECTION_STATE.ERROR]: {
        color: '#f43f5e',
        bgColor: 'rgba(244, 63, 94, 0.06)',
        borderColor: 'rgba(244, 63, 94, 0.15)',
        label: 'Error',
        icon: '🔴',
        pulse: false,
    },
};

export default function RealtimeIndicator({ compact = false, showUsers = true, showLatency = false }) {
    const { connectionState, onlineUsers, latency } = useSocket();
    const [flashClass, setFlashClass] = useState('');

    const config = STATE_CONFIG[connectionState] || STATE_CONFIG[CONNECTION_STATE.DISCONNECTED];

    // Flash animation on state change
    useEffect(() => {
        setFlashClass('animate-scale-in');
        const timeout = setTimeout(() => setFlashClass(''), 500);
        return () => clearTimeout(timeout);
    }, [connectionState]);

    if (compact) {
        return (
            <div
                className={`inline-flex items-center gap-1.5 ${flashClass}`}
                title={`WebSocket: ${config.label}`}
            >
                <span
                    className={config.pulse ? 'animate-pulse' : ''}
                    style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: config.color,
                        display: 'inline-block',
                    }}
                />
                <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: config.color,
                    letterSpacing: '0.02em',
                }}>
                    {config.label}
                </span>
            </div>
        );
    }

    return (
        <div
            className={`flex items-center gap-2.5 px-3.5 py-2 rounded-2xl transition-all duration-300 ${flashClass}`}
            style={{
                background: config.bgColor,
                border: `1px solid ${config.borderColor}`,
            }}
        >
            {/* Status dot */}
            <span
                className={config.pulse ? 'animate-pulse' : ''}
                style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    backgroundColor: config.color,
                    display: 'inline-block',
                    boxShadow: config.pulse ? `0 0 8px ${config.color}` : 'none',
                }}
            />

            {/* Label */}
            <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: config.color,
                letterSpacing: '0.02em',
            }}>
                {config.label}
            </span>

            {/* Online users */}
            {showUsers && connectionState === CONNECTION_STATE.CONNECTED && (
                <div className="flex items-center gap-2" style={{
                    borderLeft: '1px solid rgba(255,255,255,0.06)',
                    paddingLeft: '8px',
                    marginLeft: '2px',
                }}>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>
                        🛡 {onlineUsers.authority}
                    </span>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 600 }}>
                        🚢 {onlineUsers.fisherman}
                    </span>
                </div>
            )}

            {/* Latency */}
            {showLatency && latency != null && connectionState === CONNECTION_STATE.CONNECTED && (
                <span style={{
                    fontSize: '9px',
                    color: latency < 100 ? '#34d399' : latency < 300 ? '#fbbf24' : '#f43f5e',
                    fontWeight: 600,
                    fontVariantNumeric: 'tabular-nums',
                }}>
                    {latency}ms
                </span>
            )}
        </div>
    );
}
