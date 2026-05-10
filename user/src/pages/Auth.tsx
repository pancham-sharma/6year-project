import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader, Shield } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { auth, googleProvider } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  signInWithPopup,
  reload
} from 'firebase/auth';

const style = `
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-4px); }
  75% { transform: translateX(4px); }
}
.animate-shake {
  animation: shake 0.2s ease-in-out 0s 2;
}
@keyframes pulse-green {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); }
  70% { box-shadow: 0 0 0 10px rgba(34, 197, 94, 0); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
.animate-valid {
  animation: pulse-green 1s infinite;
}
`;

export default function Auth() {
  const { dark, t, setIsLoggedIn, setUser } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '', confirmPassword: '' });
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');

  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  const validateEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailStatus('idle');
      return false;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailStatus('invalid');
      return false;
    }
    setEmailStatus('valid');
    return true;
  };

  useEffect(() => {
    if (form.email) validateEmail(form.email);
  }, [form.email]);

  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  const calculateStrength = (pass: string) => {
    let s = 0;
    if (pass.length > 8) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
  };

  const syncWithBackend = async (user: any) => {
    const idToken = await user.getIdToken();
    const res = await fetchAPI('/api/users/auth/firebase/', {
      method: 'POST',
      body: JSON.stringify({ token: idToken }),
    });

    if (res.access) {
      localStorage.setItem('access_token', res.access);
      localStorage.setItem('refresh_token', res.refresh);
      setUser({
        id: res.user.id,
        name: res.user.first_name || res.user.username,
        email: res.user.email,
        phone: res.user.phone_number || '',
        city: res.user.city || '',
        role: res.user.role,
        image: res.user.profile_picture || ''
      });
      setIsLoggedIn(true);
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = form.email.trim().toLowerCase();

    if (!cleanEmail || !form.password) return setErrorMsg("Email and password are required");

    setLoading(true);
    setErrorMsg('');

    try {
      if (!isLogin) {
        if (form.password !== form.confirmPassword) throw new Error("Passwords do not match");
        
        const userCred = await createUserWithEmailAndPassword(auth, cleanEmail, form.password);
        await sendEmailVerification(userCred.user);
        
        fetchAPI('/api/users/register/', {
          method: 'POST',
          body: JSON.stringify({
            username: cleanEmail,
            email: cleanEmail,
            password: form.password,
            first_name: form.name,
            phone_number: form.phone,
            city: form.city
          })
        }).catch(console.error);

        setSuccessMsg("Verification email sent! Please verify to continue.");
        navigate('/verify-email');
      } else {
        const userCred = await signInWithEmailAndPassword(auth, cleanEmail, form.password);
        await reload(userCred.user);
        
        if (!userCred.user.emailVerified) {
          setErrorMsg("Please verify your email first. Check your inbox.");
          setLoading(false);
          navigate('/verify-email');
          return;
        }

        await syncWithBackend(userCred.user);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await syncWithBackend(result.user);
    } catch (err: any) {
      setErrorMsg("Google login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-12 flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gradient-to-br from-primary-50 via-white to-accent-50'}`}>
      <style>{style}</style>
      <div className={`w-full max-w-md rounded-3xl p-8 animate-scale-in ${dark ? 'bg-slate-800 shadow-2xl shadow-slate-900/50' : 'bg-white shadow-2xl shadow-gray-200/50'}`}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className={`text-2xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? t.auth.login : t.auth.signup}
          </h1>
        </div>
        
        {errorMsg && (
          <div className={`mb-6 p-4 rounded-2xl text-center animate-shake border ${
            dark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            <p className="text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" /> {errorMsg}
            </p>
          </div>
        )}

        {successMsg && (
          <div className={`mb-6 p-4 rounded-2xl text-center animate-scale-in border ${
            dark ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-green-50 border-green-100 text-green-600'
          }`}>
            <p className="text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2">
              <Heart className="w-3 h-3" /> {successMsg}
            </p>
          </div>
        )}

        <div className={`flex p-1 mb-6 rounded-xl ${dark ? 'bg-slate-700/50' : 'bg-gray-100'}`}>
          <button 
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${isLogin ? (dark ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (dark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
          >
            Log In
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${!isLogin ? (dark ? 'bg-slate-600 text-white shadow-sm' : 'bg-white text-gray-900 shadow-sm') : (dark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700')}`}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input 
                type="text" 
                placeholder={t.auth.name} 
                value={form.name} 
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
              />
            </div>
          )}
          <div className="relative group">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${
              emailStatus === 'valid' ? 'text-green-500' : 
              emailStatus === 'invalid' ? 'text-red-500' : 
              (dark ? 'text-gray-500' : 'text-gray-400')
            }`} />
            <input 
              type="email" 
              placeholder={t.auth.email} 
              value={form.email} 
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))} 
              required
              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-all outline-none ${
                emailStatus === 'valid' 
                  ? (dark ? 'border-green-500/50 bg-green-500/5 text-white shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'border-green-200 bg-green-50 focus:border-green-500') 
                  : emailStatus === 'invalid'
                    ? (dark ? 'border-red-500/50 bg-red-500/5 text-white shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-red-200 bg-red-50 focus:border-red-500')
                    : (dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white')
              }`} 
            />
          </div>
          {!isLogin && (
            <>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="tel" placeholder={`${t.auth.phone} (Optional)`} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
              </div>
              <div className="relative">
                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="text" placeholder={t.auth.city} value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
              </div>
            </>
          )}
          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input 
              type={showPass ? 'text' : 'password'} 
              placeholder={t.auth.password} 
              value={form.password} 
              onChange={e => { setForm(p => ({ ...p, password: e.target.value })); calculateStrength(e.target.value); }} 
              required
              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
            />
            <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isLogin && (
            <div className="flex justify-end px-1">
              <button 
                type="button" 
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-bold text-primary-500 hover:text-primary-600 transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {!isLogin && (
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type={showPass ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} 
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required
                className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10' : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40'
            }`}
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isLogin ? t.auth.loginBtn : t.auth.signupBtn)}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className={`w-full border-t ${dark ? 'border-slate-700' : 'border-gray-200'}`}></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className={`px-2 ${dark ? 'bg-slate-800 text-slate-400' : 'bg-white text-gray-500'}`}>Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className={`w-full py-3 px-4 rounded-xl border-2 flex items-center justify-center gap-3 font-medium transition-all transform active:scale-[0.98] ${
              dark ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google
          </button>
        </form>
      </div>
    </div>
  );
}
