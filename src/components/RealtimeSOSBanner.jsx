// ──────────────────────────────────────────────────────────────
// RealtimeSOSBanner — Fullscreen SOS Alert Notification
//
// A dramatic, animated overlay that appears when a new SOS
// is received via WebSocket. Includes:
//   • Full-screen pulse animation
//   • Audio alert (Web Audio API)
//   • Fisherman identity + GPS coordinates
//   • Auto-dismiss after 15 seconds (or manual dismiss)
//   • Missed alerts summary on reconnection
// ──────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../contexts/SocketContext';

export default function RealtimeSOSBanner() {
    const { lastRealtimeAlert, missedAlerts, clearMissedAlerts, isWSConnected } = useSocket();
    const [activeAlert, setActiveAlert] = useState(null);
    const [showMissedBanner, setShowMissedBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const dismissTimerRef = useRef(null);
    const audioCtxRef = useRef(null);
    const prevAlertRef = useRef(null);

    // ─── Play Emergency Sound ────────────────────────
    const playAlertSound = useCallback(() => {
        try {
            if (!audioCtxRef.current) {
                audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const ctx = audioCtxRef.current;

            // Emergency tone sequence: three ascending beeps
            const frequencies = [880, 1100, 1320];
            frequencies.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.2);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + (i + 1) * 0.2);
                osc.start(ctx.currentTime + i * 0.2);
                osc.stop(ctx.currentTime + (i + 1) * 0.2);
            });

            // Vibrate if supported
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 400]);
            }
        } catch {
            // Silently fail — audio not critical
        }
    }, []);

    // ─── New SOS Alert Handler ───────────────────────
    useEffect(() => {
        if (!lastRealtimeAlert || lastRealtimeAlert === prevAlertRef.current) return;
        prevAlertRef.current = lastRealtimeAlert;

        setActiveAlert(lastRealtimeAlert);
        setDismissed(false);
        playAlertSound();

        // Auto-dismiss after 15 seconds
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
            setDismissed(true);
            setTimeout(() => setActiveAlert(null), 500);
        }, 15000);

        return () => {
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        };
    }, [lastRealtimeAlert, playAlertSound]);

    // ─── Missed Alerts Handler ───────────────────────
    useEffect(() => {
        if (missedAlerts.length > 0) {
            setShowMissedBanner(true);
            playAlertSound();
        }
    }, [missedAlerts, playAlertSound]);

    const dismissActive = () => {
        setDismissed(true);
        setTimeout(() => setActiveAlert(null), 500);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };

    const dismissMissed = () => {
        setShowMissedBanner(false);
        clearMissedAlerts();
    };

    return (
        <>
            {/* ── Active SOS Alert Overlay ── */}
            {activeAlert && !dismissed && (
                <div
                    className="fixed inset-0 z-[9999] flex items-start justify-center pt-4 px-4 pointer-events-none"
                    style={{ animation: 'fadeIn 0.3s ease-out' }}
                >
                    <div
                        className="pointer-events-auto w-full max-w-lg animate-scale-in"
                        style={{
                            background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(185, 28, 28, 0.1) 100%)',
                            backdropFilter: 'blur(20px)',
                            WebkitBackdropFilter: 'blur(20px)',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: '24px',
                            padding: '24px',
                            boxShadow: '0 8px 32px rgba(220, 38, 38, 0.25), 0 0 80px rgba(220, 38, 38, 0.08)',
                        }}
                    >
                        {/* Pulse ring */}
                        <div className="absolute -top-2 -right-2 w-5 h-5">
                            <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
                            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl" role="img" aria-label="emergency">🚨</span>
                                <div>
                                    <p className="text-[16px] font-black text-red-300 tracking-tight">
                                        {activeAlert.urgency === 'critical' ? 'EMERGENCY SOS' : 'BORDER ALERT'}
                                    </p>
                                    <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider">
                                        Real-time • {new Date(activeAlert.timestamp).toLocaleTimeString('en-IN')}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismissActive}
                                className="w-8 h-8 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/60 hover:bg-white/[0.1] hover:text-white transition-all"
                                aria-label="Dismiss alert"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Alert Details */}
                        {activeAlert.alert && (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/[0.04] rounded-xl p-3">
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Fisherman</p>
                                        <p className="text-[14px] font-extrabold text-white truncate">
                                            {activeAlert.alert.fishermanName || 'Unknown'}
                                        </p>
                                    </div>
                                    <div className="bg-white/[0.04] rounded-xl p-3">
                                        <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-1">Boat</p>
                                        <p className="text-[14px] font-extrabold text-white truncate">
                                            {activeAlert.alert.boatNumber || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {activeAlert.alert.location && (
                                    <div className="bg-white/[0.04] rounded-xl p-3 flex items-center gap-3">
                                        <span className="text-lg">📍</span>
                                        <div>
                                            <p className="text-[9px] font-bold text-white/40 uppercase tracking-wider mb-0.5">GPS Location</p>
                                            <p className="text-[12px] font-bold text-white font-mono">
                                                {activeAlert.alert.location.lat?.toFixed(4)}°N, {activeAlert.alert.location.lng?.toFixed(4)}°E
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-[10px] font-semibold text-red-300/60">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                    Delivered via WebSocket in real-time
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── Missed Alerts Banner ── */}
            {showMissedBanner && missedAlerts.length > 0 && (
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[9998] w-full max-w-lg px-4 animate-slide-down">
                    <div
                        style={{
                            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
                            backdropFilter: 'blur(16px)',
                            WebkitBackdropFilter: 'blur(16px)',
                            border: '1px solid rgba(251, 191, 36, 0.25)',
                            borderRadius: '20px',
                            padding: '16px 20px',
                            boxShadow: '0 8px 32px rgba(251, 191, 36, 0.15)',
                        }}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <span className="text-xl">📦</span>
                                <div>
                                    <p className="text-[13px] font-extrabold text-amber-300">
                                        {missedAlerts.length} Missed Alert{missedAlerts.length === 1 ? '' : 's'}
                                    </p>
                                    <p className="text-[10px] text-amber-400/60 font-semibold">
                                        Received while you were offline
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={dismissMissed}
                                className="px-4 py-2 rounded-xl bg-amber-500/10 text-amber-300 text-[11px] font-bold hover:bg-amber-500/20 transition-colors"
                            >
                                Dismiss
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
