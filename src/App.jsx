import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AlertProvider } from './contexts/AlertContext';
import { TranslationProvider } from './contexts/TranslationContext';
import { SOSProvider } from './contexts/SOSContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import RealtimeSOSBanner from './components/RealtimeSOSBanner';
import LoginPage from './pages/LoginPage';
import FishermanSignup from './pages/FishermanSignup';
import AuthoritySignup from './pages/AuthoritySignup';
import FishermanDashboard from './pages/FishermanDashboard';
import PoliceDashboard from './pages/PoliceDashboard';
import { ROLES } from './utils/constants';

export default function App() {
  return (
    <BrowserRouter>
      <TranslationProvider>
        <AuthProvider>
          <SocketProvider>
            <AlertProvider>
              <SOSProvider>
                <RealtimeSOSBanner />
                <Routes>
                  <Route path="/" element={<LoginPage />} />
                  <Route path="/register/fisherman" element={<FishermanSignup />} />
                  <Route path="/register/authority" element={<AuthoritySignup />} />
                  <Route path="/dashboard" element={<ProtectedRoute allowedRole={ROLES.FISHERMAN}><FishermanDashboard /></ProtectedRoute>} />
                  <Route path="/authority" element={<ProtectedRoute allowedRole={ROLES.AUTHORITY}><PoliceDashboard /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </SOSProvider>
            </AlertProvider>
          </SocketProvider>
        </AuthProvider>
      </TranslationProvider>
    </BrowserRouter>
  );
}
