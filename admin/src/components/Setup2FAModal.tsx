import React, { useState, useEffect } from 'react';
import { Shield, X, CheckCircle2, Loader2, Copy } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

interface Setup2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  darkMode: boolean;
}

export const Setup2FAModal: React.FC<Setup2FAModalProps> = ({ isOpen, onClose, onSuccess, darkMode }) => {
  const [step, setStep] = useState<'info' | 'qr' | 'success'>('info');
  const [loading, setLoading] = useState(false);
  const [qrData, setQrData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [otp, setOtp] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setStep('info');
      setOtp('');
    }
  }, [isOpen]);

  const handleStartSetup = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/api/users/2fa/setup/');
      setQrData(data);
      setStep('qr');
    } catch (err: any) {
      showToast(err.message || 'Failed to start setup', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      showToast('Please enter a 6-digit OTP', 'warning');
      return;
    }
    setLoading(true);
    try {
      await fetchAPI('/api/users/2fa/verify/', {
        method: 'POST',
        body: JSON.stringify({ otp })
      });
      setStep('success');
      showToast('Two-Factor Authentication enabled!', 'success');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const bg = darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200';
  const text = darkMode ? 'text-white' : 'text-slate-900';
  const subtext = darkMode ? 'text-gray-400' : 'text-slate-500';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden ${bg} ${text} animate-scale-up`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-bold">Secure Your Account</h3>
            </div>
            <button onClick={onClose} className={`p-1 rounded-lg hover:bg-gray-500/10 transition-colors ${subtext}`}>
              <X className="w-5 h-5" />
            </button>
          </div>

          {step === 'info' && (
            <div className="space-y-4">
              <p className={subtext}>
                Two-factor authentication adds an extra layer of security to your account by requiring more than just a password to log in.
              </p>
              <div className={`p-4 rounded-xl border ${darkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50/50 border-blue-100'}`}>
                <h4 className="text-sm font-bold mb-2">How it works:</h4>
                <ul className={`text-xs space-y-2 ${subtext}`}>
                  <li className="flex gap-2"><span>1.</span> Scan a QR code using Google Authenticator or Authy.</li>
                  <li className="flex gap-2"><span>2.</span> Enter the 6-digit code from the app.</li>
                  <li className="flex gap-2"><span>3.</span> Your account is now extra secure!</li>
                </ul>
              </div>
              <button
                onClick={handleStartSetup}
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Start Setup'}
              </button>
            </div>
          )}

          {step === 'qr' && qrData && (
            <div className="space-y-6 flex flex-col items-center">
              <p className={`text-center text-sm ${subtext}`}>
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              
              <div className="p-4 bg-white rounded-2xl shadow-inner">
                <img src={qrData.qr_code} alt="2FA QR Code" className="w-48 h-48" />
              </div>

              <div className="w-full space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className={`w-full px-4 py-3 rounded-xl border text-center text-2xl font-mono tracking-[0.5em] focus:ring-2 focus:ring-blue-500 outline-none transition-all ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-slate-50 border-slate-200'}`}
                />
              </div>

              <button
                onClick={handleVerify}
                disabled={loading || otp.length !== 6}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Enable'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="py-8 flex flex-col items-center text-center space-y-4">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </div>
              <h4 className="text-xl font-bold">You're All Set!</h4>
              <p className={subtext}>
                Two-factor authentication is now enabled. You'll be asked for a code next time you log in.
              </p>
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-200 dark:bg-gray-800 hover:opacity-80 rounded-xl font-bold transition-all"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
