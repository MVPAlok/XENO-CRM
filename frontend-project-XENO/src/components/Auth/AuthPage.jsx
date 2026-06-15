import React, { useState, useEffect } from 'react';
import { authAPI, setSessionTokens } from '../../utils/api';
import { useLocation, useNavigate } from 'react-router-dom';
import Logo from '../Logo';

export default function AuthPage({ initialView = 'login', onAuthSuccess, onBackToLanding }) {
  const location = useLocation();
  const navigate = useNavigate();
  // Use state from location if available, otherwise fallback to prop
  const [view, setView] = useState(location.state?.initialView || initialView);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error', message: '' }
  const [token, setToken] = useState(''); // Used for URL verification / reset password

  // Capture token from URL if present and update view if location state changes
  useEffect(() => {
    if (location.state?.initialView) {
      setView(location.state.initialView);
    }

    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    // Detect path-based routing triggers (legacy fallback, normally handled by App.jsx redirects now)
    const path = window.location.pathname;
    if (path === '/verify-email' || location.state?.initialView === 'verify-email') {
      setView('verify-email');
      if (urlToken) {
        setToken(urlToken);
        handleAutoVerifyEmail(urlToken);
      }
    } else if (path === '/reset-password' || location.state?.initialView === 'reset-password') {
      setView('reset-password');
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [location.state, location.pathname]);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleAutoVerifyEmail = async (verifyToken) => {
    setLoading(true);
    try {
      const res = await authAPI.verifyEmail(verifyToken);
      if (res.success) {
        triggerAlert('success', 'Email verified successfully! You can now log in.');
        setView('login');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Verification failed. Token may be expired.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (e) => {
    e.preventDefault();
    if (!token) return triggerAlert('error', 'Please enter a verification token.');
    await handleAutoVerifyEmail(token);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return triggerAlert('error', 'Please fill in all fields.');

    setLoading(true);
    try {
      const res = await authAPI.login({ email, password });
      if (res.success) {
        setSessionTokens(res.accessToken, res.refreshToken);
        triggerAlert('success', 'Welcome back!');
        // Small delay to show the nice login alert
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 800);
      }
    } catch (err) {
      console.error(err);
      triggerAlert('error', err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!email || !password || !firstName || !lastName) {
      return triggerAlert('error', 'Please fill in all required fields.');
    }

    setLoading(true);
    try {
      const res = await authAPI.signup({
        email,
        password,
        firstName,
        lastName,
        avatarUrl: avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${firstName}%20${lastName}`,
      });
      if (res.success) {
        setSessionTokens(res.accessToken, res.refreshToken);
        triggerAlert('success', 'Account created! Logging you in...');
        setTimeout(() => {
          onAuthSuccess(res.user);
        }, 800);
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Registration failed. Email might be in use.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) return triggerAlert('error', 'Please enter your email.');

    setLoading(true);
    try {
      const res = await authAPI.forgotPassword(email);
      if (res.success) {
        triggerAlert('success', res.message || 'Password reset link sent to your email.');
        setView('login');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to request reset link.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!token || !password) return triggerAlert('error', 'Please fill in all fields.');

    setLoading(true);
    try {
      const res = await authAPI.resetPassword(token, password);
      if (res.success) {
        triggerAlert('success', 'Password reset successful! You can now log in.');
        setView('login');
        // Clean URL params
        window.history.replaceState({}, document.title, '/');
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBypassDemo = async () => {
    setLoading(true);
    try {
      const res = await authAPI.login({ email: 'demo@xeno.ai', password: 'XenoDemo123!' });
      if (res.success && res.accessToken) {
        setSessionTokens(res.accessToken, res.refreshToken);
        triggerAlert('success', 'Welcome to Xeno AI Campaign Console!');
        onAuthSuccess(res.user);
      }
    } catch (err) {
      triggerAlert('error', err.message || 'Demo login failed. Is the backend running on port 5000?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] bg-grid-pattern relative flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 overflow-y-auto select-none">
      
      {/* Dynamic Alert Banner */}
      {alert && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-2.5 font-bold text-xs border animate-in slide-in-from-top duration-300 ${
          alert.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
            : 'bg-rose-50 border-rose-100 text-rose-700'
        }`}>
          <span className="material-symbols-outlined text-[18px]">
            {alert.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{alert.message}</span>
        </div>
      )}

      {/* Organic Blobs Background */}
      <div className="blob bg-indigo-400/20 w-[400px] h-[400px] rounded-full -top-12 -left-12 mix-blend-multiply pointer-events-none" />
      <div className="blob bg-pink-300/25 w-[500px] h-[500px] rounded-full -bottom-16 right-12 mix-blend-multiply pointer-events-none" style={{ animationDelay: '-5s' }} />

      {/* Back to landing */}
      <div className="absolute top-6 left-6 z-20">
        <button 
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:text-gray-900 bg-white/70 hover:bg-white backdrop-blur-md transition-all font-semibold text-xs shadow-sm hover:scale-[1.02]"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Home
        </button>
      </div>

      <div className="w-full max-w-md z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 border border-gray-200/50 rounded-2xl shadow-md backdrop-blur-md mb-4">
            <Logo className="h-10 w-10 drop-shadow-md" />
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Xeno AI Strategist</h2>
          <p className="mt-2 text-sm text-gray-600">
            {view === 'login' && 'Sign in to launch your AI campaigns'}
            {view === 'signup' && 'Create your free creator account'}
            {view === 'forgot-password' && 'Enter your email to reset password'}
            {view === 'reset-password' && 'Enter your new secure password'}
            {view === 'verify-email' && 'Verify your account registration'}
          </p>
        </div>

        {/* Premium Card Glass container */}
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] border border-white/50 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-80 h-80 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
          
          {/* 1. LOGIN VIEW */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@xeno.com"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                  <button 
                    type="button"
                    onClick={() => setView('forgot-password')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full creative-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. SIGNUP VIEW */}
          {view === 'signup' && (
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Dev"
                    className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="User"
                    className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@xeno.com"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="SecurePassword123!"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Avatar URL (Optional)</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.png"
                  className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full creative-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span>Create Account</span>
                    <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD VIEW */}
          {view === 'forgot-password' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <p className="text-xs text-gray-500 leading-relaxed">
                Provide your registration email address and we'll generate a recovery token to reset your password.
              </p>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email Address</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">mail</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="developer@xeno.com"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full creative-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span>Send Reset Request</span>
                    <span className="material-symbols-outlined text-[18px]">send</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 4. RESET PASSWORD VIEW */}
          {view === 'reset-password' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Verification Reset Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Enter the copied reset token hex"
                  className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">New Password</label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3.5 text-[20px] text-gray-400">lock</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full creative-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span>Submit New Password</span>
                    <span className="material-symbols-outlined text-[18px]">save</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* 5. VERIFY EMAIL VIEW */}
          {view === 'verify-email' && (
            <form onSubmit={handleManualVerify} className="space-y-5">
              <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                <p className="text-xs text-indigo-700 leading-relaxed font-semibold">
                  We've dispatched a registration handshake to your email.
                  If you do not have SMTP setup, retrieve the token from your Postgres `EmailVerificationToken` table (e.g. via Prisma Studio) and paste it below.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Verification Hex Token</label>
                <input
                  type="text"
                  required
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 5fb473..."
                  className="w-full px-4 py-3 text-sm bg-gray-50/50 border border-gray-200/80 rounded-xl focus:bg-white focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-100 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full creative-btn py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md hover:scale-[1.01] transition-all disabled:opacity-50"
              >
                {loading ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
                ) : (
                  <>
                    <span>Verify Account</span>
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* Footer View Toggle Links */}
          <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-3">
            {view === 'login' && (
              <p className="text-xs text-gray-500 font-semibold">
                Don't have an account?{' '}
                <button onClick={() => setView('signup')} className="text-indigo-650 font-bold hover:underline">
                  Sign Up
                </button>
              </p>
            )}
            {view === 'signup' && (
              <p className="text-xs text-gray-500 font-semibold">
                Already registered?{' '}
                <button onClick={() => setView('login')} className="text-indigo-650 font-bold hover:underline">
                  Log In
                </button>
              </p>
            )}
            {view !== 'login' && view !== 'signup' && (
              <button onClick={() => setView('login')} className="text-xs text-indigo-650 font-bold hover:underline">
                Back to Sign In
              </button>
            )}

            {/* Developer Offline Bypass Fallback - always visible inside the card */}
            <div className="w-full mt-2 pt-4 border-t border-dashed border-gray-200">
              <p className="text-[10px] text-gray-400 font-semibold text-center mb-2">No backend? Try demo mode</p>
              <button 
                id="bypass-demo-btn"
                onClick={handleBypassDemo}
                className="w-full text-xs text-indigo-600 font-bold px-4 py-2.5 border border-indigo-200 hover:border-indigo-400 bg-indigo-50/50 hover:bg-indigo-50 rounded-xl shadow-sm transition-all hover:scale-[1.01] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[14px]">play_circle</span>
                Bypass to Dashboard (Demo Login)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
