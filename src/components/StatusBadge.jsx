import { useTranslation } from '../contexts/TranslationContext';

const STATUS_CONFIG = {
    safe: { key: 'status.safe', bg: 'bg-safe/[0.08]', text: 'text-safe', border: 'border-safe/20', dot: 'bg-safe' },
    warning: { key: 'status.nearBorder', bg: 'bg-warning/[0.08]', text: 'text-warning', border: 'border-warning/20', dot: 'bg-warning' },
    danger: { key: 'status.danger', bg: 'bg-danger/[0.08]', text: 'text-danger-light', border: 'border-danger/20', dot: 'bg-danger' },
    pending: { key: 'status.pending', bg: 'bg-warning/[0.08]', text: 'text-warning', border: 'border-warning/20', dot: 'bg-warning' },
    acknowledged: { key: 'status.acknowledged', bg: 'bg-aqua/[0.08]', text: 'text-aqua', border: 'border-aqua/20', dot: 'bg-aqua' },
    resolved: { key: 'status.resolved', bg: 'bg-safe/[0.08]', text: 'text-safe', border: 'border-safe/20', dot: 'bg-safe' },
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
