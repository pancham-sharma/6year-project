import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { sendEmailVerification, reload } from 'firebase/auth';
import { Mail, RefreshCw, Loader, LogOut, CheckCircle } from 'lucide-react';

export default function VerifyEmail() {
  const { dark } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Auto check verification status every 3 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      if (auth.currentUser) {
        await reload(auth.currentUser);
        if (auth.currentUser.emailVerified) {
          clearInterval(interval);
          navigate('/email-verified');
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [navigate]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setSuccess('Verification email sent! Check your inbox.');
        setResendTimer(60);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend email');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/auth');
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl transition-all ${dark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="text-center">
          <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-primary-500 animate-bounce" />
          </div>
          
          <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Check Your Email</h1>
          <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            We sent a verification link to:<br />
            <span className={`font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{auth.currentUser?.email}</span>
          </p>

          <div className={`p-4 rounded-2xl mb-8 flex items-start gap-3 text-left ${dark ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            <RefreshCw className="w-5 h-5 text-primary-500 mt-0.5 animate-spin-slow" />
            <p className={`text-xs ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
              Please verify your email to continue. We are automatically checking your status.
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {success}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <button 
              onClick={handleResend}
              disabled={loading || resendTimer > 0}
              className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                resendTimer > 0 
                  ? (dark ? 'bg-slate-700 text-slate-500' : 'bg-gray-200 text-gray-500') 
                  : (dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20')
              }`}
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Verification Email'}
            </button>

            <button 
              onClick={handleLogout}
              className={`w-full py-2 text-sm font-semibold flex items-center justify-center gap-2 ${dark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              <LogOut className="w-4 h-4" /> Sign out and try another email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
