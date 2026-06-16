import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import LandingPage from './LandingPage';
import AuthPage from './components/Auth/AuthPage';
import DashboardMain from './dashboard/DashboardMain';
import { authAPI, getSessionTokens, clearSessionTokens } from './utils/api';

// Proper Protected Route Wrapper
const ProtectedRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

export default function App() {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Clean initialization
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      const { accessToken } = getSessionTokens();
      
      // If we already have a user in state (e.g. from bypass), don't wipe it
      if (user) {
        setIsInitializing(false);
        return;
      }

      if (accessToken) {
        try {
          if (accessToken === 'demo_access_token') {
            setUser({
              id: 'demo-user-id',
              email: 'demo@xeno.ai',
              firstName: 'Demo',
              lastName: 'User',
              role: 'ADMIN',
              avatarUrl: 'https://api.dicebear.com/7.x/initials/svg?seed=Demo%20User'
            });
          } else {
            const data = await authAPI.getMe();
            if (data.success && data.user && mounted) {
              setUser(data.user);
            }
          }
        } catch (err) {
          console.warn("Session expired or API error.");
          clearSessionTokens();
        }
      }
      
      if (mounted) {
        setIsInitializing(false);
      }
    };

    initAuth();

    return () => { mounted = false; };
  }, []);

  // Listen for session expiration events from API interceptor
  useEffect(() => {
    const handleAuthExpired = () => {
      setUser(null);
      clearSessionTokens();
      navigate('/auth', { state: { initialView: 'login' } });
    };
    window.addEventListener('xeno_auth_expired', handleAuthExpired);
    return () => window.removeEventListener('xeno_auth_expired', handleAuthExpired);
  }, [navigate]);

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    navigate('/dashboard');
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
    } catch (err) {
      console.error("API logout error, clearing local token session", err);
    } finally {
      setUser(null);
      clearSessionTokens();
      navigate('/');
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Routes>
        <Route 
          path="/" 
          element={
            <LandingPage 
              onLaunch={() => {
                if (user) {
                  navigate('/dashboard');
                } else {
                  navigate('/auth');
                }
              }} 
            />
          } 
        />
        
        <Route 
          path="/auth" 
          element={
            user ? <Navigate to="/dashboard" replace /> : (
              <AuthPage 
                initialView="login"
                onAuthSuccess={handleAuthSuccess}
                onBackToLanding={() => navigate('/')}
              />
            )
          } 
        />

        {/* Redirect old routes */}
        <Route path="/verify-email" element={<Navigate to="/auth" replace />} />
        <Route path="/reset-password" element={<Navigate to="/auth" replace state={{ initialView: 'reset-password' }} />} />

        {/* Protected Dashboard Route */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute user={user}>
              <DashboardMain 
                user={user}
                onBack={handleLogout} 
              />
            </ProtectedRoute>
          } 
        />

        {/* Catch-all fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

