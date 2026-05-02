import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader } from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function Auth() {
  const { dark, t, setIsLoggedIn, setUser } = useApp();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '', confirmPassword: '' });
  const [passStrength, setPassStrength] = useState(0);

  // Auto-clear messages after 2 seconds
  useEffect(() => {
    if (errorMsg || successMsg) {
      const timer = setTimeout(() => {
        setErrorMsg('');
        setSuccessMsg('');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg, successMsg]);

  const calculateStrength = (pass: string) => {
    let s = 0;
    if (pass.length > 8) s += 1;
    if (/[A-Z]/.test(pass)) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;
    setPassStrength(s);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side Validation
    if (!form.email.trim() || !form.password.trim()) {
      setErrorMsg("Please fill all fields");
      return;
    }

    if (!isLogin) {
      if (!form.name.trim() || !form.city.trim() || !form.confirmPassword.trim()) {
        setErrorMsg("All fields are required");
        return;
      }
      if (!form.email.includes('@')) {
        setErrorMsg("Email must be valid format");
        return;
      }
      if (form.password.length < 6) {
        setErrorMsg("Password must be at least 6 characters");
        return;
      }
      if (form.password !== form.confirmPassword) {
        setErrorMsg("Passwords do not match");
        return;
      }
    }

    setLoading(true);
    setErrorMsg('');

    try {
      if (!isLogin) {
        // Handle Signup
        await fetchAPI('/api/users/register/', {
          method: 'POST',
          body: JSON.stringify({
            username: form.email, // Using email as username
            email: form.email,
            password: form.password,
            confirm_password: form.confirmPassword,
            first_name: form.name,
            phone_number: form.phone,
            city: form.city
          })
        });
        setSuccessMsg("Registration successful. Please login.");
        // Redirect to Login tab after 2 seconds
        setTimeout(() => {
          setIsLogin(true);
          setForm({ name: '', email: form.email, phone: '', city: '', password: '', confirmPassword: '' });
          setSuccessMsg('');
        }, 2000);
        setLoading(false);
        return; // Don't auto-login yet, as per "redirect to login page" requirement
      }

      // Handle Login (run automatically after successful signup or explicitly on login)
      const loginRes = await fetchAPI('/api/users/login/', {
        method: 'POST',
        body: JSON.stringify({
          username: form.email,
          password: form.password
        })
      });

      if (loginRes.access) {
        localStorage.setItem('access_token', loginRes.access);
        localStorage.setItem('refresh_token', loginRes.refresh);
        
        // Fetch user profile data
        const profile = await fetchAPI('/api/users/profile/');
        
        setUser({
          name: profile.first_name
            ? `${profile.first_name} ${profile.last_name || ''}`.trim()
            : profile.username || '',
          email: profile.email || '',
          phone: profile.phone_number || '',
          city: profile.city || '',
          role: profile.role || '',
        });
        
        setIsLoggedIn(true);
        navigate('/dashboard');
      }

    } catch (err: any) {
      console.error("Auth failed:", err);
      let msg = err.message || 'Authentication failed.';
      
      if (isLogin) {
        if (msg.toLowerCase().includes('no active account') || msg.includes('401')) {
          msg = "User not found";
        } else if (msg.toLowerCase().includes('password')) {
          msg = "Incorrect password";
        } else {
          msg = "Something went wrong, try again";
        }
      } else {
        if (msg.toLowerCase().includes('exists')) {
          msg = "User already registered";
        }
      }
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-20 pb-12 flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gradient-to-br from-primary-50 via-white to-accent-50'}`}>
      <div className={`w-full max-w-md rounded-3xl p-8 animate-scale-in ${dark ? 'bg-slate-800 shadow-2xl shadow-slate-900/50' : 'bg-white shadow-2xl shadow-gray-200/50'}`}>
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Heart className="w-7 h-7 text-white" />
          </div>
          <h1 className={`text-2xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>
            {isLogin ? t.auth.login : t.auth.signup}
          </h1>
        </div>

        {/* Toggle Tabs */}
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

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-medium rounded-xl text-center">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm font-medium rounded-xl text-center">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="relative">
              <User className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type="text" placeholder={t.auth.name} value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
            </div>
          )}
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input type="email" placeholder={t.auth.email} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
          </div>
          {!isLogin && (
            <>
              <div className="relative">
                <Phone className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input type="tel" placeholder={t.auth.phone} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
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
            <input type={showPass ? 'text' : 'password'} placeholder={t.auth.password} value={form.password} 
              onChange={e => { setForm(p => ({ ...p, password: e.target.value })); calculateStrength(e.target.value); }} required
              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
            <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {!isLogin && (
            <div className="relative">
              <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input type={showPass ? 'text' : 'password'} placeholder="Confirm Password" value={form.confirmPassword} 
                onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} required
                className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
            </div>
          )}

          {!isLogin && form.password.length > 0 && (
            <div className="px-1">
              <div className="flex gap-1 h-1 mb-1">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i <= passStrength ? (passStrength <= 2 ? 'bg-orange-400' : 'bg-brand') : (dark ? 'bg-slate-700' : 'bg-gray-200')}`} />
                ))}
              </div>
              <p className={`text-[10px] font-medium ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                {passStrength <= 1 ? 'Weak' : passStrength <= 3 ? 'Medium' : 'Strong'} Security
              </p>
            </div>
          )}
          <button type="submit" disabled={loading} className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 ${
            dark 
              ? 'bg-white text-slate-900 shadow-xl shadow-white/10' 
              : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40'
          }`}>
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isLogin ? t.auth.loginBtn : t.auth.signupBtn)}
          </button>
        </form>

        {/* Removed redundant text at bottom since tabs now clearly control state */}
      </div>
    </div>
  );
}
