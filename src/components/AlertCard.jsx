import { useCallback } from 'react';
import { useTranslation } from '../contexts/TranslationContext';
import { useSocket } from '../contexts/SocketContext';
import StatusBadge from './StatusBadge';

export default function AlertCard({ alert, onAcknowledge, onResolve }) {
    const { t } = useTranslation();
    const { acknowledgeSOSviaWS, resolveSOSviaWS, isWSConnected } = useSocket();
    const isSOS = alert.type === 'sos';
    const borderColor = isSOS ? 'border-l-danger' : 'border-l-warning';

    // Handle acknowledge — propagate to both localStorage + WebSocket
    const handleAcknowledge = useCallback((id) => {
        onAcknowledge(id);
        // Also send via WebSocket for cross-device sync
        if (isWSConnected && alert.sosId) {
            acknowledgeSOSviaWS(alert.sosId);
        }
    }, [onAcknowledge, acknowledgeSOSviaWS, isWSConnected, alert.sosId]);

    // Handle resolve — propagate to both localStorage + WebSocket
    const handleResolve = useCallback((id) => {
        onResolve(id);
        // Also send via WebSocket for cross-device sync
        if (isWSConnected && alert.sosId) {
            resolveSOSviaWS(alert.sosId);
        }
    }, [onResolve, resolveSOSviaWS, isWSConnected, alert.sosId]);

    return (
        <div className={`bg-white/[0.03] backdrop-blur-xl border border-white/[0.06] ${borderColor} border-l-[4px] rounded-[18px] shadow-[0_2px_20px_rgba(0,0,0,0.2)] p-5 transition-all duration-200 hover:bg-white/[0.05] hover:shadow-[0_4px_30px_rgba(0,0,0,0.3)]`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-[14px] flex items-center justify-center text-[18px] ${isSOS ? 'bg-danger/[0.08]' : 'bg-warning/[0.08]'}`}>
                        {isSOS ? '🚨' : '⚠️'}
                    </div>
                    <div>
                        <p className="text-[15px] font-extrabold text-text-primary leading-tight tracking-tight">{alert.boatNumber || t('alert.unknown')}</p>
                        <p className="text-[12px] text-text-secondary font-medium mt-0.5">{alert.fishermanName || t('alert.unknownFisherman')}</p>
                    </div>
                </div>
                <StatusBadge status={alert.status} />
            </div>

            <div className="flex items-center gap-4 text-[11px] text-text-light font-medium mb-4 pl-[52px]">
                <span className="flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    {new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {alert.location && (
                    <span className="font-mono text-[10px]">{alert.location.lat?.toFixed(3)}°, {alert.location.lng?.toFixed(3)}°</span>
                )}
                {/* Realtime delivery indicator */}
                {alert.realtime && (
                    <span className="inline-flex items-center gap-1 text-[9px] text-safe font-bold">
                        <span className="w-[5px] h-[5px] rounded-full bg-safe animate-pulse" />
                        Live
                    </span>
                )}
            </div>

            {(alert.status === 'pending' || alert.status === 'acknowledged') && (
                <div className="flex gap-2.5 pl-[52px]">
                    {alert.status === 'pending' && (
                        <button onClick={() => handleAcknowledge(alert.id)} className="px-5 py-2.5 bg-aqua-dark text-white text-[11px] font-bold rounded-[12px] btn-press hover:bg-aqua transition-colors">
                            {t('alert.acknowledge')}
                        </button>
                    )}
                    <button onClick={() => handleResolve(alert.id)} className="px-5 py-2.5 bg-safe/[0.08] border border-safe/15 text-safe text-[11px] font-bold rounded-[12px] btn-press hover:bg-safe/[0.15] transition-colors">
                        {t('alert.resolve')}
                    </button>
                </div>
            )}
        </div>
    );
}
