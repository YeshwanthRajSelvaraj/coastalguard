// ──────────────────────────────────────────────
// Auth Service — localStorage-based (swap with real API)
// ──────────────────────────────────────────────
import { STORAGE_KEYS, ROLES } from '../utils/constants';

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    } catch {
        return [];
    }
}

function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Seed default demo users on first load
export function seedDemoUsers() {
    const users = getUsers();
    if (users.length > 0) return;

    const demoUsers = [
        {
            id: 'demo-fisher-1',
            role: ROLES.FISHERMAN,
            email: 'fisher@coastalguard.in',
            password: 'fisher123',
            fullName: 'Rajan Krishnan',
            boatNumber: 'KL-TVM-4521',
            licenseNumber: 'FL-2024-0891',
            phone: '+91 98765 43210',
            address: 'Vizhinjam Fishing Harbour, Thiruvananthapuram, Kerala 695521',
            dob: '1985-06-15',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'demo-fisher-2',
            role: ROLES.FISHERMAN,
            email: 'mathew@coastalguard.in',
            password: 'fisher123',
            fullName: 'Mathew Thomas',
            boatNumber: 'KL-EKM-7892',
            licenseNumber: 'FL-2024-1245',
            phone: '+91 87654 32109',
            address: 'Fort Kochi, Ernakulam, Kerala 682001',
            dob: '1990-03-22',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'demo-auth-1',
            role: ROLES.AUTHORITY,
            email: 'officer@coastalguard.in',
            password: 'officer123',
            fullName: 'Inspector Suresh Kumar',
            policeId: 'ICG-KL-2024-0034',
            dob: '1978-11-08',
            createdAt: new Date().toISOString(),
        },
    ];

    saveUsers(demoUsers);
}

export function login(email, password) {
    const users = getUsers();
    const user = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );

    if (!user) {
        throw new Error('Invalid email or password');
    }

    const sessionUser = { ...user };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
}

export function signup(userData, role) {
    const users = getUsers();

    // Check duplicate email
    if (users.find((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('An account with this email already exists');
    }

    // Check duplicate boat number for fisherman
    if (role === ROLES.FISHERMAN && users.find((u) => u.boatNumber === userData.boatNumber)) {
        throw new Error('This boat number is already registered');
    }

    // Check duplicate police ID for authority
    if (role === ROLES.AUTHORITY && users.find((u) => u.policeId === userData.policeId)) {
        throw new Error('This Police ID is already registered');
    }

    const newUser = {
        id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        role,
        ...userData,
        createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    saveUsers(users);

    const sessionUser = { ...newUser };
    delete sessionUser.password;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return sessionUser;
}

export function logout() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

export function getCurrentUser() {
    try {
        const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
}

export function getAllFishermen() {
    return getUsers().filter((u) => u.role === ROLES.FISHERMAN).map((u) => {
        const copy = { ...u };
        delete copy.password;
        return copy;
    });
}
