export default function ActionButton({
    label,
    icon,
    onClick,
    variant = 'ocean',
    fullWidth = false,
    size = 'lg',
}) {
    const variants = {
        ocean: 'btn-gradient-ocean text-white',
        aqua: 'btn-gradient-aqua text-white',
        danger: 'btn-gradient-danger text-white',
        outline: 'bg-white border-2 border-border text-text-primary hover:bg-gray-50',
    };

    const sizes = {
        md: 'py-3.5 text-[13px] gap-2',
        lg: 'py-4 text-[14px] gap-2.5',
        xl: 'py-[18px] text-[16px] gap-3',
    };

    return (
        <button
            onClick={onClick}
            className={`
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : 'px-6'}
        inline-flex items-center justify-center
        font-bold rounded-2xl
        btn-press
        transition-all duration-200
      `}
        >
            <span className="text-[18px]">{icon}</span>
            <span>{label}</span>
        </button>
    );
}
