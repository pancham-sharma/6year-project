import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { fetchAPI } from '../utils/api';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, Loader, Shield } from 'lucide-react';

export default function ForgotPassword() {
  const { dark } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) return setError('Please enter your email');

    setLoading(true);
    setError('');
    try {
      // 1. Check if user exists in our backend
      const status = await fetchAPI(`/api/users/auth/check-email-status/${cleanEmail}`);

      if (!status.exists) {
        setError('No account found with this email.');
        return;
      }

      // 2. Send the reset email via Firebase
      // Note: In production, configure your Action URL in Firebase Console
      // to point to http://yourdomain.com/#/reset-password
      await sendPasswordResetEmail(auth, cleanEmail);

      // Redirect to the beautiful waiting page
      navigate('/check-email', { state: { email: cleanEmail, type: 'password_reset' } });
    } catch (err: any) {
      console.error('Password Reset Error:', err);
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.');
      } else {
        setError(err.message || 'Failed to send reset link.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[80px] md:blur-[120px] animate-pulse pointer-events-none"></div>

      <div className={`w-full max-w-sm md:max-w-md p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 backdrop-blur-xl animate-scale-in relative z-10 ${
        dark 
          ? 'bg-slate-800/50 border-slate-700/50 shadow-2xl' 
          : 'bg-white/70 border-white/50 shadow-2xl shadow-slate-200/50'
      }`}>
        <button 
          onClick={() => navigate('/auth')} 
          className={`flex items-center gap-2 text-xs md:text-sm font-bold mb-6 md:mb-10 transition-all hover:gap-3 ${dark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </button>

      <div className="mb-6 md:mb-8">
        <h1 className={`text-xl md:text-2xl font-black mb-2 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          Forgot Password?
        </h1>
        <p className={`text-xs md:text-sm leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Enter your email address and we'll send you a secure link to reset it.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2 animate-shake">
          <Shield className="w-4 h-4 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        <div className="space-y-1.5">
          <label className={`text-[10px] font-black uppercase tracking-widest ml-1 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            Email Address
          </label>
          <div className="relative group">
            <Mail className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 transition-colors ${dark ? 'text-slate-500 group-focus-within:text-primary-400' : 'text-slate-400 group-focus-within:text-primary-500'}`} />
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none text-sm md:text-base font-medium ${dark
                  ? 'bg-slate-900/50 border-slate-700/50 text-white focus:border-primary-500'
                  : 'bg-slate-50/50 border-slate-100 focus:border-primary-500'
                }`}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-4 rounded-xl font-black text-base md:text-lg transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95 disabled:opacity-50 group ${dark
              ? 'bg-white text-slate-900 hover:bg-slate-100'
              : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
        >
          {loading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            'Send Reset Link'
          )}
          </button>
        </form>

        <p className={`mt-10 text-center text-[10px] font-black uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
          Securely managed by SevaMarg Auth
        </p>
      </div>
    </div>
  );
}
