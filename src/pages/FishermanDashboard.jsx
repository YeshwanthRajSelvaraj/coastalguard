import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useSOS } from '../contexts/SOSContext';
import { useSocket } from '../contexts/SocketContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import AlertBanner from '../components/AlertBanner';
import ActionButton from '../components/ActionButton';
import SOSStatusPanel from '../components/SOSStatusPanel';
import WeatherWidget from '../components/WeatherWidget';
import RealtimeIndicator from '../components/RealtimeIndicator';
import { watchPosition, getBoatStatus, formatDistance, formatCoord } from '../services/locationService';

export default function FishermanDashboard() {
    const { user } = useAuth();
    const { sendBorder } = useAlerts();
    const { triggerSOS, triggerBorderAlert, connectivity, lastSOS, hasPendingSOS, channelAvailability } = useSOS();
    const { isWSConnected, onlineUsers, sendLocationUpdate } = useSocket();
    const { t } = useTranslation();

    const [location, setLocation] = useState(null);
    const [locError, setLocError] = useState('');
    const [boatStatus, setBoatStatus] = useState({ status: 'safe', distance: 0 });
    const [showFishZones, setShowFishZones] = useState(false);
    const [showSosConfirm, setShowSosConfirm] = useState(false);
    const [sosSent, setSosSent] = useState(false);
    const [sosDeliveryState, setSOSDeliveryState] = useState(null); // 'sending' | 'delivered' | 'cached'
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [shareMsg, setShareMsg] = useState('');
    const [showSOSPanel, setShowSOSPanel] = useState(false);
    const [showWeather, setShowWeather] = useState(false);
    const borderAlertSentRef = useRef(false);
    const prevStatusRef = useRef('safe');

    useEffect(() => {
        const stop = watchPosition(
            (pos) => { setLocation(pos); setLocError(''); setBoatStatus(getBoatStatus(pos)); },
            (err) => { setLocError(err.message); setLocation({ lat: 10.05, lng: 79.70, accuracy: 50 }); setBoatStatus({ status: 'safe', distance: 25000 }); }
        );
        return stop;
    }, []);

    // Broadcast location to server for authority live tracking
    useEffect(() => {
        if (!location || !isWSConnected) return;
        const interval = setInterval(() => {
            sendLocationUpdate(location);
        }, 10000); // Every 10 seconds
        // Send immediately on connect
        sendLocationUpdate(location);
        return () => clearInterval(interval);
    }, [location, isWSConnected, sendLocationUpdate]);

    // Border alert — uses both legacy + SOS engine
    useEffect(() => {
        if (boatStatus.status === 'danger' && prevStatusRef.current !== 'danger' && !borderAlertSentRef.current) {
            borderAlertSentRef.current = true;
            sendBorder({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
            triggerBorderAlert({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
            setAlertDismissed(false);
        }
        if (boatStatus.status === 'safe') borderAlertSentRef.current = false;
        prevStatusRef.current = boatStatus.status;
    }, [boatStatus.status, location, user, sendBorder, triggerBorderAlert]);

    // Track SOS delivery state from context
    useEffect(() => {
        if (lastSOS) {
            if (lastSOS.event === 'sos_delivered') {
                setSOSDeliveryState('delivered');
                setTimeout(() => { setSOSDeliveryState(null); setShowSOSPanel(false); }, 8000);
            } else if (lastSOS.event === 'sos_cached') {
                setSOSDeliveryState('cached');
            } else if (lastSOS.event === 'sos_queued') {
                setSOSDeliveryState('sending');
            }
        }
    }, [lastSOS]);

    // SOS handler — now goes through multi-channel engine
    const handleSOS = useCallback(async () => {
        if (!location) return;
        setShowSosConfirm(false);
        setSosSent(true);
        setShowSOSPanel(true);
        setSOSDeliveryState('sending');

        await triggerSOS({
            type: 'sos',
            fishermanId: user.id,
            fishermanName: user.fullName,
            boatNumber: user.boatNumber,
            location,
        });

        setTimeout(() => setSosSent(false), 8000);
    }, [location, user, triggerSOS]);

    const handleShareLocation = useCallback(() => {
        if (!location) return;
        setShareMsg(t('dashboard.locationShared'));
        setTimeout(() => setShareMsg(''), 3000);
    }, [location, t]);

    return (
        <div className="min-h-dvh bg-bg flex flex-col">
            <Navbar />

            {/* SOS Delivery Banner */}
            {sosSent && sosDeliveryState === 'delivered' && (
                <AlertBanner type="danger" message={`✅ ${t('dashboard.sosSent')} — Delivered via ${lastSOS?.sos?.delivery?.channel || 'network'}`} />
            )}
            {sosSent && sosDeliveryState === 'cached' && (
                <AlertBanner type="warning" message={`📦 SOS saved offline — Will auto-send when signal is available`} />
            )}
            {sosSent && sosDeliveryState === 'sending' && (
                <AlertBanner type="danger" message={`⏳ Sending SOS through available channels...`} />
            )}

            {!sosSent && !alertDismissed && boatStatus.status === 'warning' && (
                <AlertBanner type="warning" message={t('dashboard.nearBorder')} onDismiss={() => setAlertDismissed(true)} />
            )}
            {!sosSent && !alertDismissed && boatStatus.status === 'danger' && (
                <AlertBanner type="danger" message={t('dashboard.borderCrossed')} onDismiss={() => setAlertDismissed(true)} />
            )}

            {shareMsg && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-aqua-dark text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-aqua/20 text-[13px] font-bold animate-slide-down">{shareMsg}</div>
            )}

            <div className="flex-1 w-full max-w-2xl mx-auto">
                {/* Status Card + Channel Status */}
                <div className="px-5 pt-5 pb-3">
                    <div className="bg-white/[0.03] backdrop-blur-xl rounded-[22px] shadow-[0_4px_30px_rgba(0,0,0,0.3)] border border-white/[0.06] p-6 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1.5">
                                <p className="text-[10px] font-bold text-text-light uppercase tracking-[0.15em]">{t('dashboard.boatReg')}</p>
                                <p className="text-[24px] font-extrabold text-text-primary leading-tight tracking-tight">{user?.boatNumber || 'N/A'}</p>
                                <p className="text-[13px] text-text-secondary font-medium">{user?.fullName}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2.5">
                                <StatusBadge status={boatStatus.status} large />
                                <SOSStatusPanel compact />
                                <RealtimeIndicator compact />
                            </div>
                        </div>
                    </div>
                </div>

                {locError && (
                    <div className="px-5 pb-2 animate-fade-in">
                        <div className="bg-warning/[0.06] border border-warning/15 rounded-2xl px-4 py-3 text-[12px] font-semibold text-warning flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            {locError} · {t('dashboard.usingDemoLocation')}
                        </div>
                    </div>
                )}

                <div className="px-5 pt-1 pb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <MapView userLocation={location} showBoundary showFishZones={showFishZones} height="h-[280px] sm:h-[360px]" />
                </div>

                <div className="px-5 pb-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile label={t('dashboard.latitude')} value={location ? formatCoord(location.lat, 'lat') : '—'} color="text-aqua" />
                        <StatTile label={t('dashboard.longitude')} value={location ? formatCoord(location.lng, 'lng') : '—'} color="text-aqua" />
                        <StatTile label={t('dashboard.toBorder')} value={formatDistance(boatStatus.distance)} color={boatStatus.status === 'safe' ? 'text-safe' : boatStatus.status === 'warning' ? 'text-warning' : 'text-danger-light'} />
                    </div>
                </div>

                {location?.accuracy && (
                    <div className="px-5 pb-3 flex justify-center">
                        <div className="inline-flex items-center gap-2 bg-safe/[0.06] border border-safe/10 px-4 py-2 rounded-full">
                            <span className="w-[6px] h-[6px] rounded-full bg-safe animate-pulse" />
                            <span className="text-[11px] font-semibold text-safe">{t('dashboard.gpsActive')} · ±{Math.round(location.accuracy)}m</span>
                        </div>
                    </div>
                )}

                {/* Weather & Sea Conditions */}
                <div className="px-5 pb-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <button
                        onClick={() => setShowWeather(!showWeather)}
                        className="w-full flex items-center justify-between py-3.5 px-5 bg-white/[0.03] backdrop-blur-xl rounded-[18px] shadow-[0_2px_20px_rgba(0,0,0,0.2)] border border-white/[0.06] hover:bg-white/[0.05] transition-all duration-200 btn-press"
                        id="weather-toggle-btn"
                    >
                        <div className="flex items-center gap-2.5">
                            <span className="text-[16px]">🌤️</span>
                            <span className="text-[12px] font-bold text-text-primary">Sea Conditions</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <WeatherWidget location={location} compact />
                            <span className="text-[8px] text-text-light">{showWeather ? '▲' : '▼'}</span>
                        </div>
                    </button>

                    {showWeather && (
                        <div className="mt-3 animate-scale-in">
                            <WeatherWidget location={location} />
                        </div>
                    )}
                </div>

                {/* SOS Delivery Status Panel (expanded) */}
                {showSOSPanel && (
                    <div className="px-5 pb-3 animate-scale-in">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-[13px] font-extrabold text-text-primary">📡 SOS Delivery Status</h3>
                            <button
                                onClick={() => setShowSOSPanel(false)}
                                className="w-7 h-7 rounded-lg bg-white/[0.05] flex items-center justify-center text-text-light hover:bg-white/[0.1] transition-all btn-press text-[12px]"
                            >✕</button>
                        </div>
                        <SOSStatusPanel />
                    </div>
                )}

                {/* Pending SOS indicator */}
                {hasPendingSOS && !showSOSPanel && (
                    <div className="px-5 pb-3 animate-fade-in">
                        <button
                            onClick={() => setShowSOSPanel(true)}
                            className="w-full py-3 bg-warning/[0.06] border border-warning/15 rounded-2xl text-[12px] font-bold text-warning flex items-center justify-center gap-2 btn-press hover:bg-warning/[0.1] transition-colors"
                        >
                            <span>📦</span>
                            <span>SOS queued offline — Tap to view delivery status</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-[#0a0e17]/80 backdrop-blur-2xl border-t border-white/[0.06] shadow-[0_-4px_30px_rgba(0,0,0,0.4)] px-5 py-5 safe-area-bottom">
                <div className="max-w-2xl mx-auto space-y-3">
                    {showSosConfirm ? (
                        <div className="bg-danger/[0.06] border border-danger/15 rounded-[22px] p-6 animate-scale-in">
                            <p className="text-[16px] font-extrabold text-danger-light text-center mb-1">{t('dashboard.confirmSOS')}</p>
                            <p className="text-[12px] text-text-secondary text-center mb-2">{t('dashboard.sosMessage')}</p>
                            {/* Channel availability preview */}
                            <div className="flex justify-center gap-3 mb-4">
                                {Object.entries({ internet: '🌐', satellite: '🛰️', ais: '📡' }).map(([key, icon]) => (
                                    <div key={key} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold border ${channelAvailability[key] ? 'bg-safe/[0.06] text-safe border-safe/15' : 'bg-danger/[0.04] text-danger-light/50 border-danger/10'}`}>
                                        <span>{icon}</span>
                                        <span className={`w-[5px] h-[5px] rounded-full ${channelAvailability[key] ? 'bg-safe' : 'bg-danger/50'}`} />
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowSosConfirm(false)} className="py-3.5 bg-white/[0.05] border border-white/[0.08] text-text-primary font-bold text-[14px] rounded-2xl hover:bg-white/[0.08] transition-colors btn-press">{t('dashboard.cancel')}</button>
                                <button onClick={handleSOS} className="py-3.5 text-white font-bold text-[14px] rounded-2xl btn-gradient-danger">{t('dashboard.sendSOS')}</button>
                            </div>
                        </div>
                    ) : (
                        <ActionButton label={t('dashboard.sosEmergency')} icon="🚨" variant="danger" fullWidth size="xl" onClick={() => setShowSosConfirm(true)} />
                    )}
                    <div className="grid grid-cols-2 gap-3">
                        <ActionButton label={t('dashboard.shareLocation')} icon="📍" variant="ocean" fullWidth size="md" onClick={handleShareLocation} />
                        <ActionButton label={showFishZones ? t('dashboard.hideZones') : t('dashboard.fishZones')} icon="🐟" variant="aqua" fullWidth size="md" onClick={() => setShowFishZones(!showFishZones)} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatTile({ label, value, color }) {
    return (
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-[18px] shadow-[0_2px_20px_rgba(0,0,0,0.2)] border border-white/[0.06] p-4 text-center hover:bg-white/[0.05] transition-all duration-200">
            <p className={`text-[15px] font-extrabold ${color} leading-tight`}>{value}</p>
            <p className="text-[9px] font-bold text-text-light mt-1.5 uppercase tracking-[0.12em]">{label}</p>
        </div>
    );
}
