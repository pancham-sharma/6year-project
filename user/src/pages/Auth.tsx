import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Eye, EyeOff, Mail, Lock, User, Phone, MapPin, Loader, Shield, Check, AlertCircle } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

// Professional Email Blacklist (Disposable domains)
const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', '10minutemail.com', 
  'trashmail.com', 'yopmail.com', 'sharklasers.com', 'dispostable.com'
];

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
  
  // Forgot Password States
  const [isForgotPass, setIsForgotPass] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOTP, setResetOTP] = useState('');

  const handleForgotPassRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchAPI('/api/users/forgot-password/', {
        method: 'POST',
        body: JSON.stringify({ email: resetEmail })
      });
      setResetSent(true);
      setIsResetMode(true);
      setSuccessMsg(res.message || "Reset code sent!");
    } catch (err) {
      setErrorMsg("Failed to send reset code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await fetchAPI('/api/users/reset-password/', {
        method: 'POST',
        body: JSON.stringify({ 
          email: resetEmail, 
          otp: resetOTP, 
          password: form.password 
        })
      });
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          setIsForgotPass(false);
          setIsResetMode(false);
          setResetSent(false);
          setIsLogin(true);
          setSuccessMsg('');
          setResetOTP('');
          setForm(p => ({ ...p, password: '', confirmPassword: '' }));
        }, 2000);
      } else {
        setErrorMsg(res.error || "Reset failed");
      }
    } catch (err) {
      setErrorMsg("Failed to reset password");
    } finally {
      setLoading(false);
    }
  };
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', password: '', confirmPassword: '' });
  const [passStrength, setPassStrength] = useState(0);
  
  // Real-time validation states
  const [emailStatus, setEmailStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [emailError, setEmailError] = useState('');
  
  // OTP Verification States
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpArray, setOtpArray] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const handleOtpChange = (value: string, index: number) => {
    if (isNaN(Number(value)) && value !== "") return;
    const newOtp = [...otpArray];
    newOtp[index] = value.substring(value.length - 1);
    setOtpArray(newOtp);
    setOtp(newOtp.join(''));

    // Auto-focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpArray[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const data = e.clipboardData.getData('text').substring(0, 6);
    if (!/^\d+$/.test(data)) return;
    
    const newOtp = [...otpArray];
    data.split('').forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtpArray(newOtp);
    setOtp(newOtp.join(''));
    
    // Focus last or next empty
    const focusIndex = Math.min(data.length, 5);
    setTimeout(() => {
      document.getElementById(`otp-${focusIndex}`)?.focus();
    }, 0);
  };

  // Strict Email Regex
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    try {
      await fetchAPI('/api/users/resend-otp/', {
        method: 'POST',
        body: JSON.stringify({ email: form.email })
      });
      setResendTimer(60); // 1 minute cooldown
      setSuccessMsg("New OTP sent to your email!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to resend OTP");
    }
  };

  const handleVerifyOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setVerifying(true);
    setErrorMsg('');
    try {
      const res = await fetchAPI('/api/users/verify-email/', {
        method: 'POST',
        body: JSON.stringify({ email: form.email, otp })
      });
      
      if (res.success) {
        setSuccessMsg(res.message || "Email verified successfully! Redirecting...");
        
        // Auto-login if tokens are present
        if (res.access) {
          localStorage.setItem('access_token', res.access);
          localStorage.setItem('refresh_token', res.refresh);
          localStorage.setItem('user', JSON.stringify(res.user));
          
          if (typeof setUser === 'function') {
            setUser({
              id: res.user.id,
              name: res.user.first_name || res.user.username,
              email: res.user.email,
              phone: res.user.phone_number || '',
              city: res.user.city || '',
              role: res.user.role,
              image: res.user.profile_image || ''
            });
          }
          setIsLoggedIn(true);
          setTimeout(() => navigate('/dashboard'), 1500);
        } else {
          setTimeout(() => {
            setShowOTP(false);
            setIsLogin(true);
            setSuccessMsg('');
          }, 2000);
        }
      } else {
        setErrorMsg(res.message || "Verification failed");
      }
    } catch (err) {
      setErrorMsg("Connection error. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setInterval(() => setResendTimer(p => p - 1), 1000);
      return () => clearInterval(t);
    }
  }, [resendTimer]);

  const validateEmail = (email: string) => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setEmailStatus('idle');
      setEmailError('Email is required');
      return false;
    }
    
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailStatus('invalid');
      setEmailError('Please enter a valid email address');
      return false;
    }

    const domain = trimmed.split('@')[1];
    const EXTENDED_DISPOSABLE = [
      ...DISPOSABLE_DOMAINS,
      'getnada.com', 'mailinator.com', 'mail.ru', 'temp-mail.org', 'internal.com'
    ];
    if (EXTENDED_DISPOSABLE.includes(domain)) {
      setEmailStatus('invalid');
      setEmailError('Temporary/Disposable emails are not allowed');
      return false;
    }

    // Check for fake keywords in prefix
    const prefix = trimmed.split('@')[0];
    if (['test', 'fake', 'demo', 'example', 'asdf'].some(k => prefix.includes(k))) {
      setEmailStatus('invalid');
      setEmailError('Please use a real email address, not a test one');
      return false;
    }

    setEmailStatus('valid');
    setEmailError('');
    
    // Optional: Abstract API real-time verification (if key exists)
    const apiKey = import.meta.env.VITE_ABSTRACT_API_KEY;
    if (apiKey && apiKey !== 'your_abstract_api_key_here') {
      verifyWithAbstract(trimmed);
    }
    return true;
  };

  const verifyWithAbstract = async (email: string) => {
    try {
      const apiKey = import.meta.env.VITE_ABSTRACT_API_KEY;
      const res = await fetch(`https://emailvalidation.abstractapi.com/v1/?api_key=${apiKey}&email=${email}`);
      const data = await res.json();
      
      if (data.deliverability === 'UNDELIVERABLE') {
        setEmailStatus('invalid');
        setEmailError('This email is undeliverable. Please use a real one.');
      } else if (data.is_disposable_email?.value) {
        setEmailStatus('invalid');
        setEmailError('Disposable emails are blocked for security.');
      }
    } catch (e) {
      console.error("Verification API failed", e);
    }
  };

  useEffect(() => {
    if (form.email) validateEmail(form.email);
    else {
      setEmailStatus('idle');
      setEmailError('');
    }
  }, [form.email]);

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
    
    // Auto-clean email
    const cleanEmail = form.email.trim().toLowerCase();

    // Client-side Validation
    if (!cleanEmail || !form.password.trim()) {
      setErrorMsg("Email and password are required");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setErrorMsg(emailError || "Please enter a valid email address");
      return;
    }

    if (!isLogin) {
      if (!form.name.trim() || !form.city.trim() || !form.confirmPassword.trim()) {
        setErrorMsg("All fields are required except phone");
        return;
      }
      if (form.name.trim().length < 3) {
        setErrorMsg("Please enter your real full name");
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
        const res = await fetchAPI('/api/users/register/', {
          method: 'POST',
          body: JSON.stringify({
            username: cleanEmail,
            email: cleanEmail,
            password: form.password,
            confirm_password: form.confirmPassword,
            first_name: form.name,
            phone_number: form.phone,
            city: form.city
          })
        });
        
        if (res.is_redirect || res.success) {
          setSuccessMsg(res.message || "Verification OTP has been sent to your email.");
          setTimeout(() => {
            setShowOTP(true);
            setSuccessMsg('');
          }, 1500);
          return;
        } else {
          setErrorMsg(res.message || "Registration failed");
        }
        return;
      }

      // Handle Login
      const loginRes = await fetchAPI('/api/users/login/', {
        method: 'POST',
        body: JSON.stringify({
          username: cleanEmail,
          password: form.password
        })
      });

      if (loginRes.access) {
        localStorage.setItem('access_token', loginRes.access);
        localStorage.setItem('refresh_token', loginRes.refresh);
        
        // Fetch user profile data
        const profile = await fetchAPI('/api/users/profile/');
        
        setUser({
          id: profile.id,
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
        if (msg.toLowerCase().includes('verification required') || msg.includes('403')) {
          msg = "Your email is not verified. Please verify your email first.";
        } else if (msg.toLowerCase().includes('no active account') || msg.includes('401')) {
          msg = "User not found";
        } else if (msg.toLowerCase().includes('password')) {
          msg = "Incorrect password";
        } else {
          msg = "Something went wrong, try again";
        }
      } else {
        if (msg.toLowerCase().includes('exists')) {
          msg = "User already exists. Please login instead.";
        } else if (msg.includes('500')) {
          msg = "Server error: Please run migrations (makemigrations & migrate)";
        }
      }
      
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      
      // Send token to backend
      const res = await fetchAPI('/api/users/auth/google/', {
        method: 'POST',
        body: JSON.stringify({ token: idToken }),
      });

      if (res.access) {
        localStorage.setItem('access_token', res.access);
        localStorage.setItem('refresh_token', res.refresh);
        localStorage.setItem('user', JSON.stringify(res.user));
        
        // Update global user state if available
        if (typeof setUser === 'function') {
          setUser({
            id: res.user.id,
            name: res.user.first_name || res.user.username,
            email: res.user.email,
            phone: res.user.phone_number || '',
            city: res.user.city || '',
            role: res.user.role,
            image: res.user.profile_image || ''
          });
        }
        setIsLoggedIn(true);
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error("Google Auth failed:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Login cancelled. Please try again.');
      } else {
        setErrorMsg('Google authentication failed. Please try again.');
      }
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
            {showOTP ? "Verify Email" : isForgotPass ? "Reset Password" : (isLogin ? t.auth.login : t.auth.signup)}
          </h1>
          {showOTP && (
            <p className={`mt-2 text-xs ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              Enter the 6-digit code sent to {form.email}
            </p>
          )}
        </div>

        {showOTP ? (
          <form onSubmit={handleVerifyOTP} className="space-y-8 animate-scale-in">
            <div className="flex justify-between gap-2" onPaste={handlePaste}>
              {otpArray.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  maxLength={1}
                  value={digit}
                  autoFocus={index === 0}
                  onChange={e => handleOtpChange(e.target.value, index)}
                  onKeyDown={e => handleKeyDown(e, index)}
                  className={`w-12 h-14 text-center text-2xl font-bold rounded-xl border-2 transition-all outline-none ${
                    dark 
                      ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-primary-500 focus:bg-white focus:ring-4 focus:ring-primary-500/10'
                  }`}
                />
              ))}
            </div>
            
            <button 
              type="submit" 
              disabled={verifying || otp.length !== 6} 
              className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 shadow-lg ${
                otp.length === 6 && !verifying 
                  ? (dark ? 'bg-primary-500 text-white shadow-primary-500/20' : 'bg-primary-600 text-white shadow-primary-600/20')
                  : (dark ? 'bg-slate-700 text-slate-400' : 'bg-gray-200 text-gray-400')
              }`}
            >
              {verifying ? <Loader className="w-5 h-5 animate-spin" /> : "Verify & Continue"}
            </button>

            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Didn't receive code?</span>
                <button 
                  type="button" 
                  onClick={handleResendOTP} 
                  disabled={resendTimer > 0}
                  className={`text-sm font-bold transition-colors ${resendTimer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-primary-500 hover:text-primary-600'}`}
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend Now"}
                </button>
              </div>

              <button 
                type="button" 
                onClick={() => setShowOTP(false)}
                className={`text-xs font-medium underline underline-offset-4 transition-colors ${dark ? 'text-gray-500 hover:text-gray-400' : 'text-gray-400 hover:text-gray-500'}`}
              >
                Change email address
              </button>
            </div>
          </form>
        ) : isForgotPass ? (
          <form onSubmit={resetSent ? handleResetPasswordConfirm : handleForgotPassRequest} className="space-y-4 animate-fade-in">
            {!resetSent ? (
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  value={resetEmail} 
                  onChange={e => setResetEmail(e.target.value)} 
                  required
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
                />
              </div>
            ) : (
              <>
                <div className="relative">
                  <Shield className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input 
                    type="text" 
                    placeholder="Enter 6-digit Reset Code" 
                    value={resetOTP} 
                    onChange={e => setResetOTP(e.target.value)} 
                    maxLength={6}
                    required
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
                  />
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="New Password" 
                    value={form.password} 
                    onChange={e => setForm(p => ({ ...p, password: e.target.value }))} 
                    required
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
                  />
                </div>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input 
                    type={showPass ? 'text' : 'password'} 
                    placeholder="Confirm New Password" 
                    value={form.confirmPassword} 
                    onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))} 
                    required
                    className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} 
                  />
                </div>
              </>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 bg-primary-600 text-white shadow-lg shadow-primary-600/20`}
            >
              {loading ? <Loader className="w-5 h-5 animate-spin" /> : resetSent ? "Reset Password Now" : "Send Reset Code"}
            </button>

            <button 
              type="button" 
              onClick={() => { setIsForgotPass(false); setResetSent(false); }}
              className={`w-full text-sm font-bold text-center ${dark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Back to Login
            </button>
          </form>
        ) : (
          <>
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
          <div className={`mb-6 p-4 rounded-2xl text-center animate-shake border ${
            dark 
              ? 'bg-red-500/10 border-red-500/20 text-red-400' 
              : 'bg-red-50 border-red-100 text-red-600'
          }`}>
            <p className="text-xs font-bold tracking-wide uppercase flex items-center justify-center gap-2">
              <Shield className="w-3 h-3" /> {errorMsg}
            </p>
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

            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {emailStatus === 'valid' && <Check className="w-4 h-4 text-green-500 animate-scale-in" />}
              {emailStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-red-500 animate-shake" />}
            </div>

            {emailStatus === 'invalid' && emailError && (
              <p className="mt-1 ml-1 text-[10px] font-bold text-red-500 animate-fade-in uppercase tracking-tighter">
                {emailError}
              </p>
            )}
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
            <input type={showPass ? 'text' : 'password'} placeholder={isResetMode ? "New Password" : t.auth.password} value={form.password} 
              onChange={e => { setForm(p => ({ ...p, password: e.target.value })); calculateStrength(e.target.value); }} required
              className={`w-full pl-10 pr-10 py-3 rounded-xl border-2 text-sm transition-colors ${dark ? 'bg-slate-700 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-gray-50 border-gray-200 placeholder:text-gray-400 focus:border-primary-500 focus:bg-white'} outline-none`} />
            <button type="button" onClick={() => setShowPass(!showPass)} className={`absolute right-3 top-1/2 -translate-y-1/2 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {isLogin && !isForgotPass && (
            <div className="flex justify-end px-1">
              <button 
                type="button" 
                onClick={() => { setIsForgotPass(true); setResetEmail(form.email); }}
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
          <button 
            type="submit" 
            disabled={loading} 
            className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
              emailStatus === 'valid' && !loading ? 'animate-valid' : ''
            } ${
              dark 
                ? 'bg-white text-slate-900 shadow-xl shadow-white/10' 
                : 'bg-slate-900 text-white shadow-2xl shadow-slate-900/40'
            }`}
          >
            {loading ? <Loader className="w-5 h-5 animate-spin" /> : (isLogin ? t.auth.loginBtn : t.auth.signupBtn)}
          </button>

          {/* Google Login Button */}
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
              dark 
                ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-750 hover:border-slate-600 shadow-lg shadow-black/20' 
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm'
            } group`}
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google
          </button>
        </form>
          </>
        )}

        {/* Removed redundant text at bottom since tabs now clearly control state */}
      </div>
    </div>
  );
}
