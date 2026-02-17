import { createContext, useContext, useState, useCallback } from 'react';
import translations from '../utils/translations';

const TranslationContext = createContext();

const LANGUAGES = [
    { code: 'en', label: 'English', flag: '🇬🇧' },
    { code: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
];

export function TranslationProvider({ children }) {
    const [lang, setLang] = useState(() => localStorage.getItem('cg_lang') || 'en');

    const switchLanguage = useCallback((code) => {
        setLang(code);
        localStorage.setItem('cg_lang', code);
    }, []);

    // t('key') → returns translated string, falls back to English, then key
    const t = useCallback((key, replacements) => {
        const entry = translations[key];
        let text = entry ? (entry[lang] || entry.en || key) : key;
        if (replacements) {
            Object.entries(replacements).forEach(([k, v]) => {
                text = text.replace(`{${k}}`, v);
            });
        }
        return text;
    }, [lang]);

    return (
        <TranslationContext.Provider value={{ lang, t, switchLanguage, languages: LANGUAGES }}>
            {children}
        </TranslationContext.Provider>
    );
}

export function useTranslation() {
    const ctx = useContext(TranslationContext);
    if (!ctx) throw new Error('useTranslation must be inside TranslationProvider');
    return ctx;
}
