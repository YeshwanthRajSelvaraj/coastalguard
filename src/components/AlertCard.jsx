import StatusBadge from './StatusBadge';
import { useTranslation } from '../contexts/TranslationContext';

export default function AlertCard({ alert, onAcknowledge, onResolve }) {
    const { t } = useTranslation();

    const typeConfig = {
        sos: { icon: '🚨', label: t('alert.sosAlert'), color: 'border-l-danger' },
        border: { icon: '⚠️', label: t('alert.borderViolation'), color: 'border-l-warning' },
    };

    const config = typeConfig[alert.type] || typeConfig.sos;

    const formatTime = (ts) => {
        try { return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }); }
        catch { return ts; }
    };
    const formatDate = (ts) => {
        try { return new Date(ts).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }); }
        catch { return ''; }
    };

    return (
        <div className={`bg-white rounded-2xl shadow-md border border-border/40 border-l-4 ${config.color} p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 animate-fade-in`}>
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 text-xl">{config.icon}</div>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm text-text-primary">{alert.boatNumber}</h3>
                            <StatusBadge status={alert.status} />
                        </div>
                        <p className="text-xs font-semibold text-text-secondary mt-0.5">{alert.fishermanName}</p>
                        <p className="text-[11px] font-medium text-ocean/60 mt-0.5">{config.label}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                            <span className="text-[11px] text-text-light flex items-center gap-1">
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                {formatTime(alert.timestamp)} · {formatDate(alert.timestamp)}
                            </span>
                            {alert.location && (
                                <span className="text-[11px] text-text-light flex items-center gap-1">
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                    {alert.location.lat.toFixed(3)}°, {alert.location.lng.toFixed(3)}°
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {(alert.status === 'pending' || alert.status === 'acknowledged') && (
                <div className="flex gap-2 mt-3 pt-3 border-t border-border/30">
                    {alert.status === 'pending' && onAcknowledge && (
                        <button onClick={() => onAcknowledge(alert.id)} className="flex-1 py-2 bg-ocean text-white text-xs font-bold rounded-xl hover:bg-ocean-light transition-colors btn-press">
                            ✓ {t('alert.acknowledge')}
                        </button>
                    )}
                    {onResolve && (
                        <button onClick={() => onResolve(alert.id)} className="flex-1 py-2 bg-safe text-white text-xs font-bold rounded-xl hover:bg-safe-light transition-colors btn-press">
                            ✓ {t('alert.resolve')}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
