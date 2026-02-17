export default function AlertBanner({ type = 'warning', message, onDismiss }) {
    if (!message) return null;

    const config = {
        warning: {
            bg: 'bg-gradient-to-r from-amber-500 to-amber-400',
            text: 'text-amber-950',
        },
        danger: {
            bg: 'bg-gradient-to-r from-danger to-danger-light',
            text: 'text-white',
        },
        info: {
            bg: 'bg-gradient-to-r from-ocean to-ocean-light',
            text: 'text-white',
        },
    };

    const c = config[type] || config.warning;

    return (
        <div className={`${c.bg} ${c.text} px-5 py-3.5 flex items-center justify-between gap-3 animate-slide-down shadow-lg`}>
            <p className="text-[13px] font-bold flex-1 leading-snug">{message}</p>
            {onDismiss && (
                <button
                    onClick={onDismiss}
                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center flex-shrink-0 transition-colors btn-press"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
            )}
        </div>
    );
}
