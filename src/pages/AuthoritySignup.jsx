import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import InputField from '../components/InputField';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function AuthoritySignup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({ policeId: '', fullName: '', dob: '', idCardFile: null, email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});

    const update = (field) => (e) => {
        const val = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validate = () => {
        const errs = {};
        if (!form.policeId.trim()) errs.policeId = t('error.policeIdRequired');
        if (!form.fullName.trim()) errs.fullName = t('error.fullNameRequired');
        if (!form.dob) errs.dob = t('error.dobRequired');
        if (!form.email.trim()) errs.email = t('error.emailRequired');
        if (!form.password) errs.password = t('error.passwordRequired');
        if (form.password.length < 6) errs.password = t('error.passwordMin');
        if (form.password !== form.confirmPassword) errs.confirmPassword = t('error.passwordMismatch');
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setLoading(true); setError('');
        try {
            await signup({ policeId: form.policeId.toUpperCase(), fullName: form.fullName, dob: form.dob, idCardFile: form.idCardFile?.name || null, email: form.email, password: form.password }, ROLES.AUTHORITY);
            navigate('/authority');
        } catch (err) { setError(err.message); setLoading(false); }
    };

    const Icon = ({ children }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    );

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#061e33] via-ocean-dark to-ocean" />
            <div className="absolute top-[-15%] right-[-10%] w-[400px] h-[400px] rounded-full bg-aqua/[0.06] blur-[80px] animate-float" />
            <div className="absolute bottom-[-10%] left-[-8%] w-[350px] h-[350px] rounded-full bg-safe/[0.05] blur-[70px] animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-[460px] px-6 py-10">
                <div className="flex justify-end mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <LanguageSwitcher />
                </div>

                <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[13px] font-semibold mb-6 group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform"><polyline points="15 18 9 12 15 6" /></svg>
                    {t('btn.backToLogin')}
                </Link>

                <div className="text-center mb-8 animate-fade-in">
                    <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-ocean-light to-ocean flex items-center justify-center shadow-xl shadow-ocean/40">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                    </div>
                    <h1 className="text-[28px] font-extrabold text-white tracking-tight">{t('signup.authority.title')}</h1>
                    <p className="text-aqua/70 text-[14px] font-medium mt-2">{t('signup.authority.subtitle')}</p>
                </div>

                <div className="auth-card rounded-[24px] p-8 animate-scale-in" style={{ animationDelay: '0.15s' }}>
                    {error && (
                        <div className="bg-danger/8 border border-danger/20 text-danger text-[13px] font-semibold px-4 py-3.5 rounded-2xl mb-5 flex items-center gap-2.5 animate-fade-in">
                            <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="pb-2">
                            <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-[0.1em] flex items-center gap-2">
                                <span className="flex-1 h-px bg-border" /><span>{t('signup.authority.officialInfo')}</span><span className="flex-1 h-px bg-border" />
                            </p>
                        </div>
                        <InputField id="policeId" label={t('field.policeId')} value={form.policeId} onChange={update('policeId')} placeholder={t('field.policeIdPlaceholder')} required error={errors.policeId} icon={<Icon><rect x="2" y="3" width="20" height="18" rx="3" /><line x1="2" y1="9" x2="22" y2="9" /></Icon>} />
                        <InputField id="auth-name" label={t('field.fullName')} value={form.fullName} onChange={update('fullName')} placeholder={t('field.fullNamePlaceholder')} required error={errors.fullName} icon={<Icon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>} />
                        <InputField id="auth-dob" label={t('field.dob')} type="date" value={form.dob} onChange={update('dob')} required error={errors.dob} />
                        <InputField id="idCard" label={t('field.idCard')} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={update('idCardFile')} value={form.idCardFile?.name} placeholder={t('field.idCardPlaceholder')} />

                        <div className="pt-2 pb-2">
                            <p className="text-[10px] font-bold text-ocean/40 uppercase tracking-[0.1em] flex items-center gap-2">
                                <span className="flex-1 h-px bg-border" /><span>{t('signup.authority.accountCredentials')}</span><span className="flex-1 h-px bg-border" />
                            </p>
                        </div>
                        <InputField id="auth-email" label={t('field.email')} type="email" value={form.email} onChange={update('email')} placeholder={t('field.officialEmail')} required error={errors.email} icon={<Icon><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Icon>} />
                        <InputField id="auth-pass" label={t('field.password')} type="password" value={form.password} onChange={update('password')} placeholder={t('field.passwordPlaceholder')} required error={errors.password} icon={<Icon><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>} />
                        <InputField id="auth-confirm" label={t('field.confirmPassword')} type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder={t('field.confirmPasswordPlaceholder')} required error={errors.confirmPassword} icon={<Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>} />

                        <button type="submit" disabled={loading} className="w-full py-[15px] text-white font-bold text-[14px] rounded-2xl btn-gradient-ocean disabled:opacity-60 flex items-center justify-center gap-2.5 mt-3">
                            {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('btn.creating')}</> : t('signup.authority.createAccount')}
                        </button>
                    </form>
                </div>

                <p className="text-center text-[12px] text-white/30 mt-6 font-medium">
                    {t('btn.alreadyRegistered')} <Link to="/" className="text-aqua/70 hover:text-aqua font-bold transition-colors">{t('btn.signIn')}</Link>
                </p>
            </div>
        </div>
    );
}
