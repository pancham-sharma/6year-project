import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function PasswordResetSuccess() {
  const { dark } = useApp();
  const navigate = useNavigate();

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl text-center animate-scale-in transition-all ${dark ? 'bg-slate-800' : 'bg-white'}`}>
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-8">
          <CheckCircle className="w-12 h-12 text-green-500" />
        </div>

        <h1 className={`text-2xl font-bold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Password Updated!</h1>
        <p className={`text-sm mb-8 ${dark ? 'text-slate-400' : 'text-gray-600'}`}>
          Your password has been successfully reset. You can now log in with your new password.
        </p>

        <button 
          onClick={() => navigate('/auth')}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-lg ${
            dark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
          }`}
        >
          Go to Login <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
