export default function InputField({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    icon,
    error,
    rows,
    accept,
    disabled = false,
}) {
    const isTextarea = type === 'textarea';
    const isFile = type === 'file';

    return (
        <div className="space-y-2">
            {label && (
                <label
                    htmlFor={id}
                    className="block text-[11px] font-bold text-text-secondary uppercase tracking-[0.08em] pl-1"
                >
                    {label}
                    {required && <span className="text-danger ml-0.5">*</span>}
                </label>
            )}

            <div className="relative">
                {icon && !isFile && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none z-10">
                        {icon}
                    </div>
                )}

                {isTextarea ? (
                    <textarea
                        id={id}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        rows={rows || 3}
                        disabled={disabled}
                        className={`cg-input resize-none ${error ? 'error' : ''}`}
                    />
                ) : isFile ? (
                    <div className="relative group">
                        <input
                            id={id}
                            type="file"
                            onChange={onChange}
                            accept={accept}
                            required={required}
                            disabled={disabled}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className={`cg-input flex items-center justify-center gap-3 border-dashed border-2 !border-border cursor-pointer group-hover:!border-aqua/40 group-hover:bg-aqua/5 transition-all text-center ${error ? 'error' : ''}`}>
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-light group-hover:text-aqua transition-colors">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="17 8 12 3 7 8" />
                                <line x1="12" y1="3" x2="12" y2="15" />
                            </svg>
                            <span className="text-sm font-medium text-text-light group-hover:text-text-secondary transition-colors">
                                {value ? (typeof value === 'string' ? value : 'File selected ✓') : placeholder || 'Choose file to upload'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <input
                        id={id}
                        type={type}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        required={required}
                        disabled={disabled}
                        className={`cg-input ${icon ? 'has-icon' : ''} ${error ? 'error' : ''}`}
                    />
                )}
            </div>

            {error && (
                <p className="flex items-center gap-1.5 text-xs font-semibold text-danger pl-1 animate-fade-in">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    {error}
                </p>
            )}
        </div>
    );
}
