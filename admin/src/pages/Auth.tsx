import { useState } from 'react';
import { Lock, Mail, ChevronRight, CheckCircle2 } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface AuthProps {
  onLoginSuccess: () => void;
  darkMode: boolean;
}

export default function Auth({ onLoginSuccess, darkMode }: AuthProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const bg = darkMode ? 'bg-gray-950' : 'bg-slate-50';
  const cardBg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-900';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-green-500';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await fetchAPI('/api/users/login/', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });
      
      // Temporarily store token to fetch profile
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Verify Admin privileges
      try {
        const profile = await fetchAPI('/api/users/profile/');
        if (profile.role !== 'ADMIN' && profile.role !== 'VOLUNTEER' && !profile.is_staff && !profile.is_superuser) {
           throw new Error("You do not have administrative privileges to access this portal.");
        }
      } catch (profileErr: any) {
        // Remove token and reject
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        throw new Error(profileErr.message || "You do not have administrative privileges.");
      }

      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${bg} transition-colors duration-300`}>
      <div className={`w-full max-w-md p-8 rounded-3xl border shadow-xl ${cardBg}`}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h1 className={`text-2xl font-bold ${textMain}`}>Admin Portal</h1>
          <p className={`mt-2 text-sm ${textSub}`}>Enter your credentials to access the dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-600 text-sm border border-red-100 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${textSub}`}>Username</label>
            <div className="relative">
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all text-sm ${inputBg}`} 
                placeholder="admin"
              />
              <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div>
            <label className={`block text-xs font-semibold mb-1.5 uppercase tracking-wider ${textSub}`}>Password</label>
            <div className="relative">
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none transition-all text-sm ${inputBg}`} 
                placeholder="••••••••"
              />
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-gray-400" />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ChevronRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}
