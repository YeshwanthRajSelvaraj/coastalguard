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
        <nav className="sticky top-0 z-50 bg-ocean shadow-lg shadow-ocean/20">
            <div className="max-w-2xl mx-auto flex items-center justify-between h-[60px] px-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-aqua to-safe flex items-center justify-center shadow-md shadow-aqua/20">
                        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
                            <path d="M24 4L6 12V22C6 34 14.4 43.6 24 46C33.6 43.6 42 34 42 22V12L24 4Z" fill="rgba(255,255,255,0.2)" stroke="white" strokeWidth="3" strokeLinejoin="round" />
                            <path d="M14 26Q19 22, 24 26Q29 30, 34 26" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
                        </svg>
                    </div>
                    <div>
                        <h1 className="text-[16px] font-extrabold text-white leading-tight tracking-tight">{title || t('app.name')}</h1>
                        <p className="text-[10px] font-semibold text-aqua/60 uppercase tracking-widest leading-none">
                            {user?.role === ROLES.AUTHORITY ? t('nav.authorityPanel') : t('nav.safetyDashboard')}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    {showAlertBadge && pendingCount > 0 && (
                        <div className="relative animate-scale-in">
                            <div className="bg-danger text-white text-[11px] font-extrabold min-w-[28px] h-7 flex items-center justify-center px-2 rounded-full shadow-lg shadow-danger/40">{pendingCount}</div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-danger animate-ping" />
                        </div>
                    )}
                    <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] flex items-center justify-center text-white/70 hover:text-white transition-all btn-press" title={t('nav.signOut')}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
    );
}
