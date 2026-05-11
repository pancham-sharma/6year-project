import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { sendPasswordResetEmail, reload, sendEmailVerification } from 'firebase/auth';
import { Mail, ArrowLeft, CheckCircle, RefreshCw, Loader, ExternalLink } from 'lucide-react';

export default function CheckEmail() {
  const { dark } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'your email';
  const type = location.state?.type || 'verification';
  
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [success, setSuccess] = useState('');

  // Auto check verification status if it's a registration verification
  useEffect(() => {
    if (type === 'verification') {
      const interval = setInterval(async () => {
        if (auth.currentUser) {
          try {
            await reload(auth.currentUser);
            if (auth.currentUser.emailVerified) {
              clearInterval(interval);
              navigate('/email-verified');
            }
          } catch (e) {
            console.error("Status check failed", e);
          }
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [navigate, type]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleResend = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    setSuccess('');
    try {
      if (type === 'password_reset') {
        await sendPasswordResetEmail(auth, email);
      } else {
        if (auth.currentUser) await sendEmailVerification(auth.currentUser);
      }
      setSuccess('Link resent! Please check again.');
      setResendTimer(60);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Background Blurs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[15%] left-[5%] w-48 h-48 md:w-72 md:h-72 bg-emerald-500/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-[15%] right-[5%] w-48 h-48 md:w-72 md:h-72 bg-blue-500/20 rounded-full blur-[80px] md:blur-[100px] animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className={`w-full max-w-sm md:max-w-md p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] border backdrop-blur-2xl text-center transition-all animate-scale-in relative z-10 ${
        dark 
          ? 'bg-slate-800/60 border-slate-700/50 shadow-2xl shadow-black/50' 
          : 'bg-white/80 border-white/50 shadow-2xl shadow-slate-200/50'
      }`}>
        <div className="relative w-20 h-20 md:w-28 md:h-28 mx-auto mb-6 md:mb-8">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping"></div>
          <div className="relative w-full h-full bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
            <Mail className="w-8 h-8 md:w-12 md:h-12 text-emerald-500 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 md:w-9 md:h-9 bg-white dark:bg-slate-900 rounded-full shadow-lg flex items-center justify-center border border-emerald-100 dark:border-slate-700">
            <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
          </div>
        </div>

        <h1 className={`text-xl md:text-2xl font-black mb-3 tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
          Check Your Email
        </h1>
        
        <p className={`text-sm md:text-base font-bold mb-1 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>
          {type === 'password_reset' ? 'We sent a reset link to:' : 'We sent a verification link to:'}
        </p>
        <p className="text-emerald-500 font-bold text-base md:text-lg mb-4 truncate px-2">
          {email}
        </p>

        <p className={`text-xs md:text-sm leading-relaxed mb-8 md:mb-10 px-2 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
          Follow the instructions in the email to securely {type === 'password_reset' ? 'reset your password' : 'verify your account'}. Don't see it? Check your spam folder.
        </p>

        {success && (
          <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-xl text-xs font-bold animate-scale-in">
            {success}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => window.open('https://mail.google.com', '_blank')}
              className={`py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${
                dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              Open Mail <ExternalLink className="w-3.5 h-3.5" />
            </button>

            <button 
              onClick={handleResend}
              disabled={loading || resendTimer > 0}
              className={`py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 border-2 ${
                dark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-700/50' 
                  : 'border-slate-100 text-slate-600 hover:bg-slate-50'
              } disabled:opacity-50`}
            >
              {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              {resendTimer > 0 ? `${resendTimer}s` : 'Resend'}
            </button>
          </div>

          <button 
            onClick={() => navigate(-1)}
            className={`w-full py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 border-2 ${
              dark 
                ? 'border-slate-700/50 text-slate-400 hover:text-white' 
                : 'border-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            Try another email
          </button>

          <button 
            onClick={() => navigate('/auth')}
            className={`flex items-center justify-center gap-1.5 w-full text-xs font-bold transition-colors py-2 ${
              dark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" /> 
            <span className="mt-[1px]">Back to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}
