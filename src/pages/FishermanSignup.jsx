import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from '../contexts/TranslationContext';
import { ROLES } from '../utils/constants';
import InputField from '../components/InputField';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function FishermanSignup() {
    const navigate = useNavigate();
    const { signup } = useAuth();
    const { t } = useTranslation();
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        fullName: '', dob: '', phone: '', address: '',
        boatNumber: '', licenseNumber: '', boatLicenseFile: null,
        email: '', password: '', confirmPassword: '',
    });
    const [errors, setErrors] = useState({});

    const STEPS = [t('signup.step.personalInfo'), t('signup.step.boatDetails'), t('signup.step.credentials')];

    const update = (field) => (e) => {
        const val = e.target.type === 'file' ? e.target.files[0] : e.target.value;
        setForm((f) => ({ ...f, [field]: val }));
        setErrors((er) => ({ ...er, [field]: '' }));
    };

    const validateStep = () => {
        const errs = {};
        if (step === 0) {
            if (!form.fullName.trim()) errs.fullName = t('error.fullNameRequired');
            if (!form.dob) errs.dob = t('error.dobRequired');
            if (!form.phone.trim()) errs.phone = t('error.phoneRequired');
            if (!form.address.trim()) errs.address = t('error.addressRequired');
        } else if (step === 1) {
            if (!form.boatNumber.trim()) errs.boatNumber = t('error.boatNumberRequired');
            if (!form.licenseNumber.trim()) errs.licenseNumber = t('error.licenseRequired');
        } else if (step === 2) {
            if (!form.email.trim()) errs.email = t('error.emailRequired');
            if (!form.password) errs.password = t('error.passwordRequired');
            if (form.password.length < 6) errs.password = t('error.passwordMin');
            if (form.password !== form.confirmPassword) errs.confirmPassword = t('error.passwordMismatch');
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const nextStep = () => { if (validateStep()) setStep((s) => Math.min(s + 1, 2)); };
    const prevStep = () => setStep((s) => Math.max(s - 1, 0));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateStep()) return;
        setLoading(true); setError('');
        try {
            await signup({ fullName: form.fullName, dob: form.dob, phone: form.phone, address: form.address, boatNumber: form.boatNumber.toUpperCase(), licenseNumber: form.licenseNumber.toUpperCase(), boatLicenseFile: form.boatLicenseFile?.name || null, email: form.email, password: form.password }, ROLES.FISHERMAN);
            navigate('/dashboard');
        } catch (err) { setError(err.message); setLoading(false); }
    };

    const Icon = ({ children }) => (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{children}</svg>
    );

    return (
        <div className="min-h-dvh flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#061e33] via-ocean-dark to-ocean" />
            <div className="absolute top-[-15%] left-[-8%] w-[400px] h-[400px] rounded-full bg-aqua/[0.06] blur-[80px] animate-float" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] rounded-full bg-safe/[0.05] blur-[70px] animate-float" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-[460px] px-6 py-10">
                {/* Language Switcher */}
                <div className="flex justify-end mb-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <LanguageSwitcher />
                </div>

                <Link to="/" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors text-[13px] font-semibold mb-6 group">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="group-hover:-translate-x-1 transition-transform"><polyline points="15 18 9 12 15 6" /></svg>
                    {t('btn.backToLogin')}
                </Link>

                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-[28px] font-extrabold text-white tracking-tight">{t('signup.fisherman.title')}</h1>
                    <p className="text-aqua/70 text-[14px] font-medium mt-2">{t('signup.fisherman.subtitle')}</p>
                </div>

                {/* Progress Stepper */}
                <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.08s' }}>
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-[18px] left-[36px] right-[36px] h-[3px] bg-white/10 rounded-full" />
                        <div className="absolute top-[18px] left-[36px] h-[3px] bg-gradient-to-r from-aqua to-safe rounded-full transition-all duration-500 ease-out" style={{ width: `calc(${(step / 2) * 100}% - ${step < 2 ? '36px' : '0px'})` }} />
                        {STEPS.map((s, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center gap-2 min-w-[80px]">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold transition-all duration-400 ease-out ${i < step ? 'bg-gradient-to-br from-aqua to-safe text-white shadow-lg shadow-aqua/30' : i === step ? 'bg-gradient-to-br from-aqua to-safe text-white shadow-lg shadow-aqua/30 scale-110' : 'bg-white/10 text-white/35 border-2 border-white/10'}`}>
                                    {i < step ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> : i + 1}
                                </div>
                                <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors duration-300 ${i <= step ? 'text-white/80' : 'text-white/25'}`}>{s}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form Card */}
                <div className="auth-card rounded-[24px] p-8 animate-scale-in" style={{ animationDelay: '0.15s' }}>
                    {error && (
                        <div className="bg-danger/8 border border-danger/20 text-danger text-[13px] font-semibold px-4 py-3.5 rounded-2xl mb-5 flex items-center gap-2.5 animate-fade-in">
                            <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center flex-shrink-0">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                            </div>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {step === 0 && (
                            <div className="space-y-5 animate-fade-in" key="step-0">
                                <InputField id="fullName" label={t('field.fullName')} value={form.fullName} onChange={update('fullName')} placeholder={t('field.fullNamePlaceholder')} required error={errors.fullName} icon={<Icon><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></Icon>} />
                                <InputField id="dob" label={t('field.dob')} type="date" value={form.dob} onChange={update('dob')} required error={errors.dob} />
                                <InputField id="phone" label={t('field.phone')} type="tel" value={form.phone} onChange={update('phone')} placeholder={t('field.phonePlaceholder')} required error={errors.phone} icon={<Icon><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></Icon>} />
                                <InputField id="address" label={t('field.address')} type="textarea" value={form.address} onChange={update('address')} placeholder={t('field.addressPlaceholder')} required error={errors.address} rows={3} />
                            </div>
                        )}
                        {step === 1 && (
                            <div className="space-y-5 animate-fade-in" key="step-1">
                                <InputField id="boatNumber" label={t('field.boatNumber')} value={form.boatNumber} onChange={update('boatNumber')} placeholder={t('field.boatNumberPlaceholder')} required error={errors.boatNumber} icon={<Icon><path d="M4 19h16" /><path d="M4 19l2-9h12l2 9" /><path d="M8 10V6a4 4 0 0 1 8 0v4" /></Icon>} />
                                <InputField id="licenseNumber" label={t('field.licenseNumber')} value={form.licenseNumber} onChange={update('licenseNumber')} placeholder={t('field.licensePlaceholder')} required error={errors.licenseNumber} icon={<Icon><rect x="2" y="3" width="20" height="18" rx="3" /><line x1="2" y1="9" x2="22" y2="9" /></Icon>} />
                                <InputField id="boatLicense" label={t('field.boatLicense')} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={update('boatLicenseFile')} value={form.boatLicenseFile?.name} placeholder={t('field.boatLicensePlaceholder')} />
                            </div>
                        )}
                        {step === 2 && (
                            <div className="space-y-5 animate-fade-in" key="step-2">
                                <InputField id="signup-email" label={t('field.email')} type="email" value={form.email} onChange={update('email')} placeholder={t('field.emailPlaceholder')} required error={errors.email} icon={<Icon><rect x="2" y="4" width="20" height="16" rx="3" /><path d="M22 7l-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></Icon>} />
                                <InputField id="signup-pass" label={t('field.password')} type="password" value={form.password} onChange={update('password')} placeholder={t('field.passwordPlaceholder')} required error={errors.password} icon={<Icon><rect x="3" y="11" width="18" height="11" rx="3" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Icon>} />
                                <InputField id="signup-confirm" label={t('field.confirmPassword')} type="password" value={form.confirmPassword} onChange={update('confirmPassword')} placeholder={t('field.confirmPasswordPlaceholder')} required error={errors.confirmPassword} icon={<Icon><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></Icon>} />
                            </div>
                        )}

                        <div className="flex gap-3 mt-8">
                            {step > 0 && <button type="button" onClick={prevStep} className="flex-1 py-[14px] border-2 border-border text-text-primary font-bold text-[14px] rounded-2xl hover:bg-gray-50 transition-all btn-press">{t('btn.back')}</button>}
                            {step < 2 ? (
                                <button type="button" onClick={nextStep} className="flex-1 py-[14px] text-white font-bold text-[14px] rounded-2xl btn-gradient-ocean">{t('btn.continue')}</button>
                            ) : (
                                <button type="submit" disabled={loading} className="flex-1 py-[14px] text-white font-bold text-[14px] rounded-2xl btn-gradient-aqua disabled:opacity-60 flex items-center justify-center gap-2">
                                    {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('btn.creating')}</> : t('btn.createAccount')}
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                <p className="text-center text-[12px] text-white/30 mt-6 font-medium">
                    {t('btn.alreadyRegistered')} <Link to="/" className="text-aqua/70 hover:text-aqua font-bold transition-colors">{t('btn.signIn')}</Link>
                </p>
            </div>
        </div>
    );
}
