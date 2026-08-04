import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function EmailVerified() {
  const { dark } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/auth');
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl text-center transition-all animate-scale-in ${dark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className={`text-3xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Email Verified!</h1>
        <p className={`text-lg mb-8 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
          Your account is now ready. You can sign in and start donating.
        </p>

        <button 
          onClick={() => navigate('/auth')}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
          }`}
        >
          Go to Login <ArrowRight className="w-5 h-5" />
        </button>

        <p className="mt-6 text-xs text-gray-400">
          Redirecting to login in 5 seconds...
        </p>
      </div>
    </div>
  );
}
