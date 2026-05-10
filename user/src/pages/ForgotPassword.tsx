import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, ArrowLeft, Loader, Shield, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const { dark } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('Please enter your email');
    
    setLoading(true);
    setError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setSuccess(true);
    } catch (err: any) {
      const code = err.code || '';
      if (code === 'auth/user-not-found') {
        setError('No account found with this email.');
      } else {
        setError('Failed to send reset link. Please check your email.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl transition-all ${dark ? 'bg-slate-800' : 'bg-white'}`}>
        {success ? (
          <div className="text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h1 className={`text-2xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Email Sent!</h1>
            <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
              We've sent a password reset link to:<br/>
              <span className="font-bold text-primary-500">{email}</span>
            </p>
            <button 
              onClick={() => navigate('/auth')}
              className={`w-full py-4 rounded-xl font-bold transition-all shadow-lg ${
                dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
              }`}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <button onClick={() => navigate('/auth')} className={`flex items-center gap-2 text-sm font-medium mb-8 transition-colors ${dark ? 'text-slate-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}`}>
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>

            <h1 className={`text-2xl font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>Forgot Password?</h1>
            <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="relative">
                <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${dark ? 'text-slate-500' : 'text-gray-400'}`} />
                <input 
                  type="email" 
                  placeholder="Email Address" 
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className={`w-full pl-11 pr-4 py-4 rounded-xl border-2 transition-all outline-none ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-100 focus:border-primary-500 focus:bg-white'}`}
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 ${
                  dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/40'
                }`}
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
