import { useTranslation } from '../contexts/TranslationContext';

const STATUS_CONFIG = {
    safe: { key: 'status.safe', bg: 'bg-safe/10', text: 'text-safe', border: 'border-safe/25', dot: 'bg-safe' },
    warning: { key: 'status.nearBorder', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    danger: { key: 'status.danger', bg: 'bg-danger/8', text: 'text-danger', border: 'border-danger/25', dot: 'bg-danger' },
    pending: { key: 'status.pending', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' },
    acknowledged: { key: 'status.acknowledged', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' },
    resolved: { key: 'status.resolved', bg: 'bg-safe/10', text: 'text-safe', border: 'border-safe/25', dot: 'bg-safe' },
};

export default function StatusBadge({ status, large = false }) {
    const { t } = useTranslation();
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.safe;

    return (
        <div className={`inline-flex items-center gap-2 border rounded-full font-bold ${config.bg} ${config.text} ${config.border} ${large ? 'px-4 py-2 text-[12px]' : 'px-2.5 py-1 text-[10px]'} transition-all duration-200`}>
            <span className={`relative flex items-center justify-center ${large ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}>
                <span className={`absolute inset-0 rounded-full ${config.dot} ${status === 'danger' || status === 'pending' ? 'animate-ping opacity-50' : ''}`} />
                <span className={`relative rounded-full w-full h-full ${config.dot}`} />
            </span>
            <span className="tracking-wider">{t(config.key)}</span>
        </div>
    );
}
