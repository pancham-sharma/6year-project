import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { Lock, Eye, EyeOff, CheckCircle, Loader, Shield, AlertTriangle } from 'lucide-react';

export default function ResetPassword() {
  const { dark } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [verifying, setVerifying] = useState(true);
  const [invalidToken, setInvalidToken] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [strength, setStrength] = useState(0);

  useEffect(() => {
    if (!oobCode) {
      setInvalidToken(true);
      setVerifying(false);
      return;
    }

    // Verify the code with Firebase
    verifyPasswordResetCode(auth, oobCode)
      .then(() => {
        setVerifying(false);
      })
      .catch((err) => {
        console.error(err);
        setInvalidToken(true);
        setVerifying(false);
      });
  }, [oobCode]);

  const calculateStrength = (pass: string) => {
    let s = 0;
    if (pass.length >= 8) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    setStrength(s);
  };

  const getStrengthText = () => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Strong';
    return 'Very Strong';
  };

  const getStrengthColor = () => {
    if (strength <= 1) return 'bg-red-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (strength < 2) return setError('Please choose a stronger password');

    setLoading(true);
    setError('');
    try {
      if (oobCode) {
        await confirmPasswordReset(auth, oobCode, password);
        setSuccess(true);
        // Automatically redirect to login after 2 seconds
        setTimeout(() => navigate('/auth'), 2000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <Loader className="w-12 h-12 animate-spin text-primary-500 mx-auto mb-4" />
          <p className={dark ? 'text-slate-400' : 'text-slate-600'}>Verifying security token...</p>
        </div>
      </div>
    );
  }

  if (invalidToken) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
        <div className={`w-full max-w-md p-10 rounded-[2.5rem] text-center border ${dark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-xl'}`}>
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h1 className={`text-2xl font-black mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Invalid or Expired Link</h1>
          <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
            This password reset link is invalid or has expired. Links are only valid for 10 minutes and can only be used once.
          </p>
          <button onClick={() => navigate('/forgot-password')} className="w-full py-4 bg-primary-500 text-white rounded-2xl font-bold hover:bg-primary-600 transition-all">
            Request New Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-72 h-72 md:w-96 md:h-96 bg-primary-500/10 rounded-full blur-[80px] md:blur-[100px] pointer-events-none"></div>
      
      <div className={`w-full max-w-sm md:max-w-md p-6 md:p-10 rounded-[2rem] md:rounded-[2.5rem] border backdrop-blur-xl animate-scale-in relative z-10 ${
        dark 
          ? 'bg-slate-800/50 border-slate-700/50 shadow-2xl' 
          : 'bg-white/70 border-white/50 shadow-2xl'
      }`}>
        {success ? (
          <div className="text-center animate-scale-in">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 md:mb-8">
              <CheckCircle className="w-10 h-10 md:w-12 md:h-12 text-emerald-500" />
            </div>
            <h1 className={`text-2xl md:text-3xl font-black mb-3 md:mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>Password Reset!</h1>
            <p className={`text-xs md:text-sm mb-8 md:mb-10 ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
              Your password has been changed successfully. Redirecting to login in 2 seconds...
            </p>
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full animate-[progress_2s_linear]"></div>
            </div>
          </div>
        ) : (
          <>
            <h1 className={`text-xl md:text-2xl font-black mb-2 ${dark ? 'text-white' : 'text-slate-900'}`}>New Password</h1>
            <p className={`text-xs md:text-sm mb-6 md:mb-8 ${dark ? 'text-slate-400' : 'text-slate-500'}`}>
              Please choose a strong, secure password that you haven't used before.
            </p>

            {error && (
              <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-xs flex items-center gap-2">
                <Shield className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
              <div className="space-y-3 md:space-y-4">
                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="New Password" 
                    value={password}
                    onChange={e => { setPassword(e.target.value); calculateStrength(e.target.value); }}
                    className={`w-full pl-11 pr-11 py-3.5 rounded-xl border-2 transition-all outline-none text-sm md:text-base ${
                      dark ? 'bg-slate-900/50 border-slate-700/50 text-white focus:border-primary-500' : 'bg-slate-50/50 border-slate-100 focus:border-primary-500'
                    }`}
                    required
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                  </button>
                </div>

                {/* Strength Meter */}
                <div className="px-1 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest">
                    <span className={dark ? 'text-slate-500' : 'text-slate-400'}>Strength:</span>
                    <span className={strength <= 1 ? 'text-red-500' : strength === 2 ? 'text-yellow-500' : 'text-emerald-500'}>
                      {getStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= strength ? getStrengthColor() : (dark ? 'bg-slate-700' : 'bg-slate-200')}`}></div>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <Lock className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 md:w-5 h-5 ${dark ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="Confirm Password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border-2 transition-all outline-none text-sm md:text-base ${
                      dark ? 'bg-slate-900/50 border-slate-700/50 text-white focus:border-primary-500' : 'bg-slate-50/50 border-slate-100 focus:border-primary-500'
                    }`}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading || strength < 2}
                className={`w-full py-4 rounded-xl font-black text-base md:text-lg transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50 ${
                  dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>
      
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
