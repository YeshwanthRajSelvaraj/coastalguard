import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function LoginPage() {
    const navigate = useNavigate();
    const { user, login } = useAuth();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (user) {
        return <Navigate to={user.role === ROLES.FISHERMAN ? '/dashboard' : '/authority'} replace />;
    }

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const u = await login(email, password);
            navigate(u.role === ROLES.FISHERMAN ? '/dashboard' : '/authority');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            {/* ── Background ── */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#061e33] via-ocean-dark to-ocean" />
            <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-aqua/[0.07] blur-[100px] animate-float" />
            <div className="absolute bottom-[-15%] left-[-10%] w-[400px] h-[400px] rounded-full bg-safe/[0.06] blur-[80px] animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] rounded-full bg-ocean-light/[0.05] blur-[60px] animate-float" style={{ animationDelay: '4s' }} />

            {/* Wave */}
            <div className="absolute bottom-0 left-0 right-0 overflow-hidden pointer-events-none">
                <svg className="w-[200%] animate-wave" viewBox="0 0 2880 320" preserveAspectRatio="none" style={{ height: '180px' }}>
                    <path fill="rgba(28, 167, 166, 0.04)" d="M0,192L60,197.3C120,203,240,213,360,229.3C480,245,600,267,720,250.7C840,235,960,181,1080,181.3C1200,181,1320,235,1440,234.7C1560,235,1680,181,1800,154.7L1920,128L1920,320L0,320Z" />
                </svg>
            </div>
            <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />

            {/* ── Content ── */}
            <div className="relative z-10 w-full max-w-[420px] px-6 py-10">

                {/* Language Switcher — top right */}
                <div className="flex justify-end mb-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <LanguageSwitcher />
                </div>

                {/* Logo */}
                <div className="text-center mb-10 animate-fade-in">
                    <div className="w-[88px] h-[88px] mx-auto mb-6 rounded-[28px] bg-gradient-to-br from-aqua to-safe flex items-center justify-center animate-glow">
                        <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4L6 12V22C6 34 14.4 43.6 24 46C33.6 43.6 42 34 42 22V12L24 4Z" fill="rgba(255,255,255,0.18)" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M14 24Q18 20, 22 24Q26 28, 30 24Q34 20, 38 24" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                            <path d="M14 30Q18 26, 22 30Q26 34, 30 30Q34 26, 38 30" stroke="rgba(255,255,255,0.5)" strokeWidth="2" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                    <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-none">{t('app.name')}</h1>
                    <p className="text-aqua text-[15px] font-semibold mt-2 tracking-wide opacity-80">{t('app.tagline')}</p>
                </div>

                {/* ── Login Card ── */}
                <div className="auth-card rounded-[24px] p-8 animate-scale-in" style={{ animationDelay: '0.15s' }}>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-danger/8 border border-danger/20 text-danger text-[13px] font-semibold px-4 py-3.5 rounded-2xl flex items-center gap-2.5 animate-fade-in">
                                <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                                </div>
                                {error}
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="login-email" className="block text-[11px] font-bold text-text-secondary uppercase tracking-[0.08em] pl-1">{t('login.emailLabel')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                </div>
                                <input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('login.emailPlaceholder')} required className="cg-input has-icon" />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label htmlFor="login-pass" className="block text-[11px] font-bold text-text-secondary uppercase tracking-[0.08em] pl-1">{t('login.passwordLabel')}</label>
                            <div className="relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                </div>
                                <input id="login-pass" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')} required className="cg-input has-icon has-icon-right" />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary transition-colors p-1" tabIndex={-1}>
                                    {showPassword ? (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                                    ) : (
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button type="submit" disabled={loading} className="w-full py-[15px] text-white text-[15px] font-bold rounded-2xl btn-gradient-ocean disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mt-2">
                            {loading ? (
                                <><div className="w-5 h-5 border-[2.5px] border-white/20 border-t-white rounded-full animate-spin" /><span>{t('login.signingIn')}</span></>
                            ) : (
                                <span>{t('login.signIn')}</span>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                        <span className="text-[11px] text-text-light font-semibold uppercase tracking-wider">{t('login.newHere')}</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                    </div>

                    {/* Registration */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => navigate('/register/fisherman')} className="group py-4 border-2 border-border rounded-2xl hover:border-aqua/30 hover:bg-aqua/[0.03] transition-all duration-300 btn-press flex flex-col items-center gap-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">🛥</span>
                            <span className="text-[11px] font-bold text-text-secondary group-hover:text-ocean transition-colors">{t('login.registerFisherman')}</span>
                        </button>
                        <button onClick={() => navigate('/register/authority')} className="group py-4 border-2 border-border rounded-2xl hover:border-ocean/30 hover:bg-ocean/[0.03] transition-all duration-300 btn-press flex flex-col items-center gap-2">
                            <span className="text-2xl group-hover:scale-110 transition-transform duration-300">👮</span>
                            <span className="text-[11px] font-bold text-text-secondary group-hover:text-ocean transition-colors">{t('login.registerAuthority')}</span>
                        </button>
                    </div>
                </div>

                {/* Demo */}
                <div className="mt-6 bg-white/[0.07] border border-white/[0.1] rounded-2xl px-6 py-5 animate-fade-in" style={{ animationDelay: '0.35s' }}>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.1em] mb-3">{t('login.demoAccounts')}</p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[12px]">
                            <span className="text-base">🛥</span>
                            <code className="font-mono text-white/70 bg-white/[0.06] px-2.5 py-1 rounded-lg">fisher@coastalguard.in</code>
                            <code className="font-mono text-white/50 bg-white/[0.04] px-2 py-1 rounded-lg text-[11px]">fisher123</code>
                        </div>
                        <div className="flex items-center gap-3 text-[12px]">
                            <span className="text-base">👮</span>
                            <code className="font-mono text-white/70 bg-white/[0.06] px-2.5 py-1 rounded-lg">officer@coastalguard.in</code>
                            <code className="font-mono text-white/50 bg-white/[0.04] px-2 py-1 rounded-lg text-[11px]">officer123</code>
                        </div>
                    </div>
                </div>

                <p className="text-center text-[11px] text-white/25 mt-6 font-medium animate-fade-in" style={{ animationDelay: '0.45s' }}>
                    {t('app.copyright')}
                </p>
            </div>
        </div>
    );
}
