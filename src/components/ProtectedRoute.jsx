import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRole }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-dvh bg-bg flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-ocean/20 border-t-ocean rounded-full animate-spin mx-auto" />
                    <p className="text-sm font-medium text-text-secondary mt-4">Loading…</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" replace />;
    }

    if (allowedRole && user.role !== allowedRole) {
        // Redirect to the correct dashboard
        return <Navigate to={user.role === 'fisherman' ? '/dashboard' : '/authority'} replace />;
    }

    return children;
}
