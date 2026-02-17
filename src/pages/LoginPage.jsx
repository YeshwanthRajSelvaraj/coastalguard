import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError('');
        try {
            const user = await login(email, password);
            navigate(user.role === 'authority' ? '/authority' : '/dashboard');
        } catch (err) { setError(err.message); setLoading(false); }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#040810] via-[#0a1628] to-[#0c1d2e]" />
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aqua/[0.04] blur-[120px] animate-float" />
            <div className="absolute bottom-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-safe/[0.03] blur-[100px] animate-float" style={{ animationDelay: '2s' }} />

            {/* Wave */}
            <div className="absolute bottom-0 left-0 right-0 h-[80px] overflow-hidden opacity-[0.06]">
                <svg viewBox="0 0 1440 120" fill="none" preserveAspectRatio="none" className="absolute bottom-0 w-[200%] h-full animate-wave">
                    <path d="M0,96 C320,32 480,112 720,72 C960,32 1120,96 1440,64 L1440,120 L0,120 Z" fill="#38bdf8" />
                    <path d="M1440,96 C1760,32 1920,112 2160,72 C2400,32 2560,96 2880,64 L2880,120 L1440,120 Z" fill="#38bdf8" />
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-[420px] px-6 py-10">
                {/* Language Switcher */}
                <div className="flex justify-end mb-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <LanguageSwitcher />
                </div>

                {/* Logo */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="w-[72px] h-[72px] mx-auto mb-6 rounded-[22px] bg-gradient-to-br from-aqua-dark/80 to-safe/60 flex items-center justify-center shadow-2xl shadow-aqua/15 animate-glow">
                        <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4L6 12V22C6 34 14.4 43.6 24 46C33.6 43.6 42 34 42 22V12L24 4Z" fill="rgba(255,255,255,0.1)" stroke="white" strokeWidth="2" strokeLinejoin="round" />
                            <path d="M14 26Q19 22, 24 26Q29 30, 34 26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-[32px] font-extrabold text-white tracking-tight leading-tight">{t('app.name')}</h1>
                    <p className="text-aqua/50 text-[14px] font-medium mt-2 leading-relaxed">{t('app.tagline')}</p>
                </div>

                {/* Login Card */}
                <div className="auth-card rounded-[24px] p-8 animate-scale-in" style={{ animationDelay: '0.15s' }}>
                    {error && (
                        <div className="bg-danger/[0.06] border border-danger/15 text-danger-light text-[13px] font-semibold px-4 py-3.5 rounded-2xl mb-6 flex items-center gap-2.5 animate-fade-in">
                            <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="email" className="block text-[11px] font-bold text-text-light uppercase tracking-[0.1em] pl-1">{t('field.email')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t('field.emailPlaceholder')} required className="cg-input has-icon" autoComplete="email" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="password" className="block text-[11px] font-bold text-text-light uppercase tracking-[0.1em] pl-1">{t('field.password')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder={t('field.passwordPlaceholder')} required className="cg-input has-icon has-icon-right" autoComplete="current-password" />
                                <button type="button" tabIndex={-1} onClick={() => setShowPassword(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary transition-colors p-1">
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={loading} className="w-full py-[15px] text-white font-bold text-[14px] rounded-2xl btn-gradient-aqua disabled:opacity-50 flex items-center justify-center gap-2.5 mt-2 transition-all duration-200">
                            {loading ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('btn.signingIn')}</>
                            ) : t('btn.signIn')}
                        </button>
                    </form>
                </div>

                {/* Register Links */}
                <div className="mt-8 space-y-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <p className="text-center text-[12px] text-white/30 font-medium">{t('login.register')}</p>
                    <div className="grid grid-cols-2 gap-3">
                        <Link to="/register/fisherman" className="flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-[16px] text-[13px] font-bold text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all btn-press">
                            <span className="text-[16px]">🚤</span>
                            {t('login.fisherman')}
                        </Link>
                        <Link to="/register/authority" className="flex items-center justify-center gap-2 py-3.5 bg-white/[0.03] border border-white/[0.06] rounded-[16px] text-[13px] font-bold text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all btn-press">
                            <span className="text-[16px]">🛡</span>
                            {t('login.authority')}
                        </Link>
                    </div>
                </div>

                {/* Demo Info */}
                <div className="mt-6 bg-white/[0.02] border border-white/[0.05] rounded-[18px] p-5 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                    <p className="text-[10px] font-bold text-text-light uppercase tracking-[0.15em] mb-3 text-center">{t('login.demoAccounts')}</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-xl">
                            <span className="text-[14px]">🚤</span>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-text-secondary">fisher@coastalguard.in</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-3 py-2.5 bg-white/[0.02] rounded-xl">
                            <span className="text-[14px]">🛡</span>
                            <div className="flex-1">
                                <p className="text-[11px] font-bold text-text-secondary">police@coastalguard.in</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-text-light text-center mt-1.5">{t('login.demoPasswordHint')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
