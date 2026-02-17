import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useTranslation } from '../contexts/TranslationContext';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import MapView from '../components/MapView';
import AlertBanner from '../components/AlertBanner';
import ActionButton from '../components/ActionButton';
import { watchPosition, getBoatStatus, formatDistance, formatCoord } from '../services/locationService';

export default function FishermanDashboard() {
    const { user } = useAuth();
    const { sendSOS, sendBorder } = useAlerts();
    const { t } = useTranslation();

    const [location, setLocation] = useState(null);
    const [locError, setLocError] = useState('');
    const [boatStatus, setBoatStatus] = useState({ status: 'safe', distance: 0 });
    const [showFishZones, setShowFishZones] = useState(false);
    const [showSosConfirm, setShowSosConfirm] = useState(false);
    const [sosSent, setSosSent] = useState(false);
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [shareMsg, setShareMsg] = useState('');
    const borderAlertSentRef = useRef(false);
    const prevStatusRef = useRef('safe');

    useEffect(() => {
        const stop = watchPosition(
            (pos) => { setLocation(pos); setLocError(''); setBoatStatus(getBoatStatus(pos)); },
            (err) => { setLocError(err.message); setLocation({ lat: 10.05, lng: 79.70, accuracy: 50 }); setBoatStatus({ status: 'safe', distance: 25000 }); }
        );
        return stop;
    }, []);

    useEffect(() => {
        if (boatStatus.status === 'danger' && prevStatusRef.current !== 'danger' && !borderAlertSentRef.current) {
            borderAlertSentRef.current = true;
            sendBorder({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
            setAlertDismissed(false);
        }
        if (boatStatus.status === 'safe') borderAlertSentRef.current = false;
        prevStatusRef.current = boatStatus.status;
    }, [boatStatus.status, location, user, sendBorder]);

    const handleSOS = useCallback(() => {
        if (!location) return;
        sendSOS({ fishermanId: user.id, fishermanName: user.fullName, boatNumber: user.boatNumber, location });
        setSosSent(true); setShowSosConfirm(false);
        setTimeout(() => setSosSent(false), 5000);
    }, [location, user, sendSOS]);

    const handleShareLocation = useCallback(() => {
        if (!location) return;
        setShareMsg(t('dashboard.locationShared'));
        setTimeout(() => setShareMsg(''), 3000);
    }, [location, t]);

    return (
        <div className="min-h-dvh bg-bg flex flex-col">
            <Navbar />

            {sosSent && <AlertBanner type="danger" message={t('dashboard.sosSent')} />}
            {!sosSent && !alertDismissed && boatStatus.status === 'warning' && (
                <AlertBanner type="warning" message={t('dashboard.nearBorder')} onDismiss={() => setAlertDismissed(true)} />
            )}
            {!sosSent && !alertDismissed && boatStatus.status === 'danger' && (
                <AlertBanner type="danger" message={t('dashboard.borderCrossed')} onDismiss={() => setAlertDismissed(true)} />
            )}

            {shareMsg && (
                <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-ocean text-white px-6 py-3.5 rounded-2xl shadow-2xl shadow-ocean/40 text-[13px] font-bold animate-slide-down">{shareMsg}</div>
            )}

            <div className="flex-1 w-full max-w-2xl mx-auto">
                {/* Status Card */}
                <div className="px-4 pt-4 pb-3">
                    <div className="bg-white rounded-[20px] shadow-lg shadow-black/[0.04] border border-border/50 p-5 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold text-text-light uppercase tracking-[0.1em]">{t('dashboard.boatReg')}</p>
                                <p className="text-[22px] font-extrabold text-text-primary leading-tight tracking-tight">{user?.boatNumber || 'N/A'}</p>
                                <p className="text-[13px] text-text-secondary font-medium">{user?.fullName}</p>
                            </div>
                            <StatusBadge status={boatStatus.status} large />
                        </div>
                    </div>
                </div>

                {locError && (
                    <div className="px-4 pb-2 animate-fade-in">
                        <div className="bg-warning/8 border border-warning/20 rounded-2xl px-4 py-3 text-[12px] font-semibold text-amber-800 flex items-center gap-2">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                            {locError} · {t('dashboard.usingDemoLocation')}
                        </div>
                    </div>
                )}

                <div className="px-4 pt-1 pb-3 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <MapView userLocation={location} showBoundary showFishZones={showFishZones} height="h-[280px] sm:h-[360px]" />
                </div>

                <div className="px-4 pb-3 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                    <div className="grid grid-cols-3 gap-3">
                        <StatTile label={t('dashboard.latitude')} value={location ? formatCoord(location.lat, 'lat') : '—'} color="text-ocean" />
                        <StatTile label={t('dashboard.longitude')} value={location ? formatCoord(location.lng, 'lng') : '—'} color="text-ocean" />
                        <StatTile label={t('dashboard.toBorder')} value={formatDistance(boatStatus.distance)} color={boatStatus.status === 'safe' ? 'text-safe' : boatStatus.status === 'warning' ? 'text-amber-600' : 'text-danger'} />
                    </div>
                </div>

                {location?.accuracy && (
                    <div className="px-4 pb-3 flex justify-center">
                        <div className="inline-flex items-center gap-2 bg-safe/8 px-3.5 py-1.5 rounded-full">
                            <span className="w-[6px] h-[6px] rounded-full bg-safe animate-pulse" />
                            <span className="text-[11px] font-semibold text-safe">{t('dashboard.gpsActive')} · ±{Math.round(location.accuracy)}m</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Bottom Actions */}
            <div className="sticky bottom-0 bg-white border-t border-border/50 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-4 py-5 safe-area-bottom">
                <div className="max-w-2xl mx-auto space-y-3">
                    {showSosConfirm ? (
                        <div className="bg-danger/[0.06] border-2 border-danger/25 rounded-[20px] p-5 animate-scale-in">
                            <p className="text-[15px] font-extrabold text-danger text-center mb-1">{t('dashboard.confirmSOS')}</p>
                            <p className="text-[12px] text-text-secondary text-center mb-4">{t('dashboard.sosMessage')}</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button onClick={() => setShowSosConfirm(false)} className="py-3.5 bg-gray-100 text-text-primary font-bold text-[14px] rounded-2xl hover:bg-gray-200 transition-colors btn-press">{t('dashboard.cancel')}</button>
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
        <div className="bg-white rounded-[16px] shadow-sm border border-border/40 p-3.5 text-center hover:shadow-md transition-shadow">
            <p className={`text-[15px] font-extrabold ${color} leading-tight`}>{value}</p>
            <p className="text-[10px] font-bold text-text-light mt-1.5 uppercase tracking-wider">{label}</p>
        </div>
    );
}
