/**
 * CoastalGuard — Built-in Translation System
 * Supports: English (en), Tamil (ta)
 * Add more languages by adding new keys to the object.
 */

const translations = {
    // ─── App / Global ───────────────────────
    'app.name': { en: 'CoastalGuard', ta: 'கோஸ்டல்கார்ட்' },
    'app.tagline': { en: 'Smart Coastal Safety Network', ta: 'ஸ்மார்ட் கடலோர பாதுகாப்பு வலையமைப்பு' },
    'app.copyright': { en: '© 2026 CoastalGuard · v2.0 · Secure Connection 🔒', ta: '© 2026 கோஸ்டல்கார்ட் · v2.0 · பாதுகாப்பான இணைப்பு 🔒' },

    // ─── Navbar ─────────────────────────────
    'nav.authorityPanel': { en: 'Authority Panel', ta: 'அதிகாரி பேனல்' },
    'nav.safetyDashboard': { en: 'Safety Dashboard', ta: 'பாதுகாப்பு டாஷ்போர்டு' },
    'nav.signOut': { en: 'Sign out', ta: 'வெளியேறு' },

    // ─── Login Page ─────────────────────────
    'login.emailLabel': { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
    'login.emailPlaceholder': { en: 'Enter your email', ta: 'உங்கள் மின்னஞ்சலை உள்ளிடவும்' },
    'login.passwordLabel': { en: 'Password', ta: 'கடவுச்சொல்' },
    'login.passwordPlaceholder': { en: 'Enter your password', ta: 'உங்கள் கடவுச்சொல்லை உள்ளிடவும்' },
    'login.signIn': { en: 'Sign In', ta: 'உள்நுழை' },
    'login.signingIn': { en: 'Signing In…', ta: 'உள்நுழைகிறது…' },
    'login.newHere': { en: 'New here?', ta: 'புதியவரா?' },
    'login.registerFisherman': { en: 'Register as Fisherman', ta: 'மீனவராக பதிவு செய்க' },
    'login.registerAuthority': { en: 'Register as Authority', ta: 'அதிகாரியாக பதிவு செய்க' },
    'login.demoAccounts': { en: 'Demo Accounts', ta: 'டெமோ கணக்குகள்' },

    // ─── Fisherman Signup ───────────────────
    'signup.fisherman.title': { en: 'Fisherman Registration', ta: 'மீனவர் பதிவு' },
    'signup.fisherman.subtitle': { en: 'Create your CoastalGuard account', ta: 'உங்கள் கோஸ்டல்கார்ட் கணக்கை உருவாக்குங்கள்' },
    'signup.step.personalInfo': { en: 'Personal Info', ta: 'தனிப்பட்ட தகவல்' },
    'signup.step.boatDetails': { en: 'Boat Details', ta: 'படகு விவரங்கள்' },
    'signup.step.credentials': { en: 'Credentials', ta: 'சான்றுகள்' },

    // ─── Authority Signup ───────────────────
    'signup.authority.title': { en: 'Authority Registration', ta: 'அதிகாரி பதிவு' },
    'signup.authority.subtitle': { en: 'Coastal Security Officer Enrollment', ta: 'கடலோர பாதுகாப்பு அதிகாரி சேர்க்கை' },
    'signup.authority.officialInfo': { en: 'Official Information', ta: 'அதிகாரப்பூர்வ தகவல்' },
    'signup.authority.accountCredentials': { en: 'Account Credentials', ta: 'கணக்கு சான்றுகள்' },
    'signup.authority.createAccount': { en: '🛡 Create Authority Account', ta: '🛡 அதிகாரி கணக்கை உருவாக்கு' },

    // ─── Common Form Fields ─────────────────
    'field.fullName': { en: 'Full Name', ta: 'முழு பெயர்' },
    'field.fullNamePlaceholder': { en: 'Enter your full name', ta: 'உங்கள் முழு பெயரை உள்ளிடவும்' },
    'field.dob': { en: 'Date of Birth', ta: 'பிறந்த தேதி' },
    'field.phone': { en: 'Phone Number', ta: 'தொலைபேசி எண்' },
    'field.phonePlaceholder': { en: '+91 98765 43210', ta: '+91 98765 43210' },
    'field.address': { en: 'Address', ta: 'முகவரி' },
    'field.addressPlaceholder': { en: 'Full residential address', ta: 'முழு குடியிருப்பு முகவரி' },
    'field.boatNumber': { en: 'Boat Registration Number', ta: 'படகு பதிவு எண்' },
    'field.boatNumberPlaceholder': { en: 'e.g. KL-TVM-4521', ta: 'எ.கா. KL-TVM-4521' },
    'field.licenseNumber': { en: 'Fishing License Number', ta: 'மீன்பிடி உரிம எண்' },
    'field.licensePlaceholder': { en: 'e.g. FL-2024-0891', ta: 'எ.கா. FL-2024-0891' },
    'field.boatLicense': { en: 'Upload Boat License (PDF / Image)', ta: 'படகு உரிமத்தை பதிவேற்றுக (PDF / படம்)' },
    'field.boatLicensePlaceholder': { en: 'Select boat license document', ta: 'படகு உரிம ஆவணத்தை தேர்வு செய்க' },
    'field.email': { en: 'Email Address', ta: 'மின்னஞ்சல் முகவரி' },
    'field.emailPlaceholder': { en: 'your.email@example.com', ta: 'your.email@example.com' },
    'field.password': { en: 'Password', ta: 'கடவுச்சொல்' },
    'field.passwordPlaceholder': { en: 'Minimum 6 characters', ta: 'குறைந்தது 6 எழுத்துக்கள்' },
    'field.confirmPassword': { en: 'Confirm Password', ta: 'கடவுச்சொல்லை உறுதிப்படுத்துக' },
    'field.confirmPasswordPlaceholder': { en: 'Re-enter your password', ta: 'கடவுச்சொல்லை மீண்டும் உள்ளிடவும்' },
    'field.policeId': { en: 'Police Unique ID', ta: 'காவல்துறை தனித்துவ அடையாள எண்' },
    'field.policeIdPlaceholder': { en: 'e.g. ICG-KL-2024-0034', ta: 'எ.கா. ICG-KL-2024-0034' },
    'field.idCard': { en: 'Upload Police ID Card (Image / PDF)', ta: 'காவல்துறை அடையாள அட்டையை பதிவேற்றுக (படம் / PDF)' },
    'field.idCardPlaceholder': { en: 'Select ID card document', ta: 'அடையாள அட்டை ஆவணத்தை தேர்வு செய்க' },
    'field.officialEmail': { en: 'official.email@gov.in', ta: 'official.email@gov.in' },

    // ─── Buttons ────────────────────────────
    'btn.continue': { en: 'Continue →', ta: 'தொடர் →' },
    'btn.back': { en: '← Back', ta: '← பின்செல்' },
    'btn.backToLogin': { en: 'Back to Login', ta: 'உள்நுழைவுக்கு திரும்பு' },
    'btn.createAccount': { en: '✓ Create Account', ta: '✓ கணக்கை உருவாக்கு' },
    'btn.creating': { en: 'Creating…', ta: 'உருவாக்குகிறது…' },
    'btn.alreadyRegistered': { en: 'Already registered?', ta: 'ஏற்கனவே பதிவு செய்துள்ளீர்களா?' },
    'btn.signIn': { en: 'Sign In', ta: 'உள்நுழை' },

    // ─── Validation Errors ──────────────────
    'error.fullNameRequired': { en: 'Full name is required', ta: 'முழு பெயர் தேவை' },
    'error.dobRequired': { en: 'Date of birth is required', ta: 'பிறந்த தேதி தேவை' },
    'error.phoneRequired': { en: 'Phone number is required', ta: 'தொலைபேசி எண் தேவை' },
    'error.addressRequired': { en: 'Address is required', ta: 'முகவரி தேவை' },
    'error.boatNumberRequired': { en: 'Boat number is required', ta: 'படகு எண் தேவை' },
    'error.licenseRequired': { en: 'License number is required', ta: 'உரிம எண் தேவை' },
    'error.emailRequired': { en: 'Email is required', ta: 'மின்னஞ்சல் தேவை' },
    'error.passwordRequired': { en: 'Password is required', ta: 'கடவுச்சொல் தேவை' },
    'error.passwordMin': { en: 'Minimum 6 characters required', ta: 'குறைந்தது 6 எழுத்துக்கள் தேவை' },
    'error.passwordMismatch': { en: 'Passwords do not match', ta: 'கடவுச்சொற்கள் பொருந்தவில்லை' },
    'error.policeIdRequired': { en: 'Police ID is required', ta: 'காவல்துறை அடையாள எண் தேவை' },

    // ─── Fisherman Dashboard ────────────────
    'dashboard.boatReg': { en: 'Boat Registration', ta: 'படகு பதிவு' },
    'dashboard.latitude': { en: 'Latitude', ta: 'அட்சரேகை' },
    'dashboard.longitude': { en: 'Longitude', ta: 'தீர்க்கரேகை' },
    'dashboard.toBorder': { en: 'To Border', ta: 'எல்லைக்கு' },
    'dashboard.gpsActive': { en: 'GPS Active', ta: 'GPS செயலில்' },
    'dashboard.usingDemoLocation': { en: 'Using demo location.', ta: 'டெமோ இடத்தைப் பயன்படுத்துகிறது.' },
    'dashboard.sosEmergency': { en: 'SOS Emergency', ta: 'SOS அவசரநிலை' },
    'dashboard.confirmSOS': { en: '🚨 Confirm SOS Emergency', ta: '🚨 SOS அவசரநிலையை உறுதிப்படுத்துக' },
    'dashboard.sosMessage': { en: 'All coastal authorities will receive your distress signal', ta: 'அனைத்து கடலோர அதிகாரிகளும் உங்கள் ஆபத்து சமிக்ஞையைப் பெறுவார்கள்' },
    'dashboard.sendSOS': { en: 'Send SOS', ta: 'SOS அனுப்பு' },
    'dashboard.cancel': { en: 'Cancel', ta: 'ரத்து செய்' },
    'dashboard.shareLocation': { en: 'Share Location', ta: 'இடத்தைப் பகிர்' },
    'dashboard.fishZones': { en: 'Fish Zones', ta: 'மீன்பிடி மண்டலங்கள்' },
    'dashboard.hideZones': { en: 'Hide Zones', ta: 'மண்டலங்களை மறை' },
    'dashboard.locationShared': { en: '📍 Location shared with authorities', ta: '📍 இடம் அதிகாரிகளுடன் பகிரப்பட்டது' },
    'dashboard.sosSent': { en: '🚨 SOS sent! Help is on the way. Stay calm.', ta: '🚨 SOS அனுப்பப்பட்டது! உதவி வருகிறது. அமைதியாக இருங்கள்.' },
    'dashboard.nearBorder': { en: '⚠ Approaching restricted waters. Reduce speed.', ta: '⚠ தடைசெய்யப்பட்ட கடற்பகுதியை நெருங்குகிறீர்கள். வேகத்தைக் குறையுங்கள்.' },
    'dashboard.borderCrossed': { en: '🚨 Maritime border crossed! Authorities notified.', ta: '🚨 கடல் எல்லை மீறப்பட்டது! அதிகாரிகளுக்கு தெரிவிக்கப்பட்டது.' },

    // ─── Police Dashboard ───────────────────
    'police.active': { en: 'Active', ta: 'செயலில்' },
    'police.sos': { en: 'SOS', ta: 'SOS' },
    'police.border': { en: 'Border', ta: 'எல்லை' },
    'police.resolved': { en: 'Resolved', ta: 'தீர்க்கப்பட்டது' },
    'police.liveAlerts': { en: 'Live Alerts', ta: 'நேரடி எச்சரிக்கைகள்' },
    'police.all': { en: 'All', ta: 'அனைத்தும்' },
    'police.pending': { en: 'Pending', ta: 'நிலுவையில்' },
    'police.mapMonitoring': { en: 'Map Monitoring', ta: 'வரைபட கண்காணிப்பு' },
    'police.live': { en: 'Live', ta: 'நேரடி' },
    'police.ackAll': { en: 'ACK All', ta: 'அனைத்தையும் ஒப்புக்கொள்' },
    'police.resolveAll': { en: 'Resolve All', ta: 'அனைத்தையும் தீர்' },
    'police.noActiveAlerts': { en: 'No active alerts', ta: 'செயலில் எச்சரிக்கைகள் இல்லை' },
    'police.noResolvedAlerts': { en: 'No resolved alerts', ta: 'தீர்க்கப்பட்ட எச்சரிக்கைகள் இல்லை' },
    'police.allClear': { en: 'All clear — no alerts reported yet.', ta: 'அனைத்தும் சரி — இதுவரை எச்சரிக்கைகள் இல்லை.' },
    'police.noFilterAlerts': { en: 'No "{filter}" alerts at this time.', ta: 'இந்த நேரத்தில் "{filter}" எச்சரிக்கைகள் இல்லை.' },
    'police.result': { en: 'result', ta: 'முடிவு' },
    'police.results': { en: 'results', ta: 'முடிவுகள்' },

    // ─── Status Badges ──────────────────────
    'status.safe': { en: 'SAFE', ta: 'பாதுகாப்பு' },
    'status.nearBorder': { en: 'NEAR BORDER', ta: 'எல்லை அருகில்' },
    'status.danger': { en: 'DANGER', ta: 'ஆபத்து' },
    'status.pending': { en: 'PENDING', ta: 'நிலுவை' },
    'status.acknowledged': { en: "ACK'D", ta: 'ஒப்புக்கொள்ளப்பட்டது' },
    'status.resolved': { en: 'RESOLVED', ta: 'தீர்க்கப்பட்டது' },

    // ─── Alert Card ─────────────────────────
    'alert.sosAlert': { en: '🚨 SOS Emergency', ta: '🚨 SOS அவசரநிலை' },
    'alert.borderViolation': { en: '⚠ Border Violation', ta: '⚠ எல்லை மீறல்' },
    'alert.acknowledge': { en: 'Acknowledge', ta: 'ஒப்புக்கொள்' },
    'alert.resolve': { en: 'Resolve', ta: 'தீர்' },
    'alert.boat': { en: 'Boat', ta: 'படகு' },

    // ─── Language ───────────────────────────
    'lang.english': { en: 'English', ta: 'English' },
    'lang.tamil': { en: 'தமிழ்', ta: 'தமிழ்' },
};

export default translations;
