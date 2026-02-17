import { useTranslation } from '../contexts/TranslationContext';

export default function LanguageSwitcher() {
    const { lang, switchLanguage, languages } = useTranslation();

    return (
        <div className="flex items-center gap-1.5">
            {languages.map((l) => (
                <button
                    key={l.code}
                    onClick={() => switchLanguage(l.code)}
                    className={`
            px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all duration-200 btn-press
            ${lang === l.code
                            ? 'bg-aqua text-white shadow-md shadow-aqua/30'
                            : 'bg-white/10 text-white/60 hover:bg-white/20 hover:text-white/90'
                        }
          `}
                    title={l.label}
                >
                    {l.flag} {l.label}
                </button>
            ))}
        </div>
    );
}
