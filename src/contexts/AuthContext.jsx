import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as authService from '../services/authService';
import { ROLES } from '../utils/constants';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Initialize: seed demo users + restore session
    useEffect(() => {
        authService.seedDemoUsers();
        const saved = authService.getCurrentUser();
        if (saved) setUser(saved);
        setLoading(false);
    }, []);

    const login = useCallback(async (email, password) => {
        const u = authService.login(email, password);
        setUser(u);
        return u;
    }, []);

    const signup = useCallback(async (userData, role) => {
        const u = authService.signup(userData, role);
        setUser(u);
        return u;
    }, []);

    const logout = useCallback(() => {
        authService.logout();
        setUser(null);
    }, []);

    const value = {
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
        isFisherman: user?.role === ROLES.FISHERMAN,
        isAuthority: user?.role === ROLES.AUTHORITY,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
