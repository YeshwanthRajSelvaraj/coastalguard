import { useTranslation } from '../contexts/TranslationContext';

const TYPES = {
    warning: { bg: 'from-warning/[0.08] to-warning/[0.04]', border: 'border-warning/15', text: 'text-warning', icon: '⚠️' },
    danger: { bg: 'from-danger/[0.08] to-danger/[0.04]', border: 'border-danger/15', text: 'text-danger-light', icon: '🚨' },
    info: { bg: 'from-aqua/[0.08] to-aqua/[0.04]', border: 'border-aqua/15', text: 'text-aqua', icon: 'ℹ️' },
};

export default function AlertBanner({ type = 'info', message, onDismiss }) {
    const config = TYPES[type] || TYPES.info;

    return (
        <div className={`bg-gradient-to-r ${config.bg} border-b ${config.border} animate-slide-down shadow-[0_4px_20px_rgba(0,0,0,0.2)]`}>
            <div className="max-w-2xl mx-auto flex items-center gap-3 px-5 py-3.5">
                <span className="text-[17px]">{config.icon}</span>
                <p className={`flex-1 text-[13px] font-bold ${config.text} leading-snug`}>{message}</p>
                {onDismiss && (
                    <button onClick={onDismiss} className="w-8 h-8 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center text-text-light hover:text-text-secondary transition-all btn-press">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                    </button>
                )}
            </div>
        </div>
    );
}
