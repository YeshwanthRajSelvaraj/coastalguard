import { useTranslation } from '../contexts/TranslationContext';

const VARIANTS = {
    ocean: 'btn-gradient-ocean',
    aqua: 'btn-gradient-aqua',
    danger: 'btn-gradient-danger',
    outline: 'bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08]',
};

const SIZES = {
    md: 'py-3 text-[13px] rounded-[14px]',
    lg: 'py-4 text-[14px] rounded-[16px]',
    xl: 'py-5 text-[16px] rounded-[20px]',
};

export default function ActionButton({ label, icon, variant = 'ocean', size = 'md', onClick, fullWidth, disabled, className = '' }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
                ${VARIANTS[variant]} ${SIZES[size]}
                ${fullWidth ? 'w-full' : ''}
                flex items-center justify-center gap-2.5 px-6
                text-white font-bold tracking-tight
                transition-all duration-200 btn-press
                disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none
                ${className}
            `}
        >
            {icon && <span className="text-[1.1em]">{icon}</span>}
            {label}
        </button>
    );
}
