import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar({ title, showAlertBadge }) {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { pendingCount } = useAlerts();
    const { t } = useTranslation();

    const handleLogout = () => { logout(); navigate('/'); };

    return (
        <nav className="sticky top-0 z-50 bg-[#0a0e17]/80 backdrop-blur-2xl border-b border-white/[0.06] shadow-[0_1px_30px_rgba(0,0,0,0.4)]">
            <div className="max-w-2xl mx-auto flex items-center justify-between h-[64px] px-5">
                <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-aqua-dark to-safe flex items-center justify-center shadow-lg shadow-aqua/15">
                        <svg width="19" height="19" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4L6 12V22C6 34 14.4 43.6 24 46C33.6 43.6 42 34 42 22V12L24 4Z" fill="rgba(255,255,255,0.15)" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                            <path d="M14 26Q19 22, 24 26Q29 30, 34 26" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-white leading-tight tracking-tight">{title || t('app.name')}</h1>
                        <p className="text-[10px] font-semibold text-aqua/50 uppercase tracking-[0.15em] leading-none mt-0.5">
                            {user?.role === ROLES.AUTHORITY ? t('nav.authorityPanel') : t('nav.safetyDashboard')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2.5">
                    <LanguageSwitcher />
                    {showAlertBadge && pendingCount > 0 && (
                        <div className="relative animate-scale-in">
                            <div className="bg-danger text-white text-[11px] font-extrabold min-w-[28px] h-7 flex items-center justify-center px-2 rounded-full shadow-lg shadow-danger/30">{pendingCount}</div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger animate-ping" />
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-10 h-10 rounded-[14px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center text-white/50 hover:text-white transition-all duration-200 btn-press" title={t('nav.signOut')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}
