import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Bell, CheckCheck, Loader, Info, Package, Leaf, Star, UserCheck } from 'lucide-react';
import { fetchAPI } from '../utils/api';

const getIcon = (text: string) => {
  if (text?.toLowerCase().includes('donation') || text?.toLowerCase().includes('pickup')) return Package;
  if (text?.toLowerCase().includes('tree') || text?.toLowerCase().includes('environment')) return Leaf;
  if (text?.toLowerCase().includes('thank') || text?.toLowerCase().includes('impact')) return Star;
  if (text?.toLowerCase().includes('volunteer') || text?.toLowerCase().includes('application')) return UserCheck;
  return Info;
};

export default function Notifications() {
  const { dark, notifications, markRead, setNotifications } = useApp();
  const navigate = useNavigate();
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      await Promise.all(
        unread.map(n =>
          fetchAPI(`/api/chat/notifications/${n.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ read: true })
          }).catch(() => {})
        )
      );
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = (n: any) => {
    if (!n.read) markRead(n.id);
    
    const content = (n.title + ' ' + (n.message || n.text || '')).toLowerCase();
    
    // Redirect logic
    if (content.includes('volunteer') || content.includes('application') || content.includes('teaching') || content.includes('status')) {
      navigate('/dashboard'); // Volunteer status is on dashboard
    } else if (content.includes('donation') || content.includes('received') || content.includes('pickup')) {
      navigate('/dashboard'); // Donation history is on dashboard
    } else {
      navigate('/dashboard'); // Default hub
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-xl sm:text-2xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h1>
            <p className={`mt-1 text-[10px] sm:text-xs uppercase tracking-wider ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              {unread.length > 0 ? `${unread.length} unread` : 'All caught up'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                dark 
                  ? 'bg-primary-600 text-white hover:bg-primary-500 shadow-lg shadow-primary-500/20' 
                  : 'bg-white text-primary-600 hover:bg-gray-50 shadow-sm border border-gray-100'
              } disabled:opacity-50`}
            >
              {markingAll ? <Loader className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3 h-3" />}
              Mark Read
            </button>
          )}
        </div>

        {/* Unread Section */}
        {unread.length > 0 && (
          <div className="mb-10">
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              New Activity
            </h2>
            <div className="space-y-2.5">
              {unread.map(n => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`group relative flex items-center gap-3.5 p-3 sm:p-3.5 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      dark 
                        ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 shadow-md' 
                        : 'bg-white border-gray-100 hover:border-primary-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      dark 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'bg-primary-50 text-primary-600'
                    }`}>
                      <Icon className="w-5.5 h-5.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[14px] sm:text-[15px] font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {n.title || 'Update'}
                      </h4>
                      <p className={`text-[12px] sm:text-[13px] leading-relaxed mt-0.5 ${dark ? 'text-slate-200' : 'text-slate-600'} line-clamp-2`}>
                        {n.text}
                      </p>
                      <p className={`text-[9px] sm:text-[10px] mt-1.5 font-semibold uppercase tracking-widest ${dark ? 'text-primary-400' : 'text-slate-400'}`}>
                        {n.time}
                      </p>
                    </div>
                    
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-400 flex-shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Read Section */}
        {read.length > 0 && (
          <div>
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              Earlier
            </h2>
            <div className={`rounded-3xl overflow-hidden border transition-all ${dark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-gray-100 shadow-sm'}`}>
              {read.map((n, i) => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    className={`flex items-center gap-4 p-3.5 sm:p-4 cursor-pointer transition-all ${
                      i < read.length - 1 ? (dark ? 'border-b border-slate-700/50' : 'border-b border-gray-50') : ''
                    } ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-opacity group-hover:opacity-100 ${
                      dark ? 'bg-slate-700 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[13px] font-bold leading-tight ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {n.title || 'Update'}
                      </h4>
                      <p className={`text-[12px] leading-snug mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1`}>
                        {n.text}
                      </p>
                      <p className={`text-[8px] mt-1.5 font-medium uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
                        {n.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className={`rounded-[2.5rem] p-12 text-center transition-all ${dark ? 'bg-slate-800/40 border border-slate-700/50 shadow-xl shadow-black/20' : 'bg-white shadow-xl shadow-gray-100 border border-gray-100'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
              <Bell className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className={`text-lg font-bold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>No Notifications Yet</h3>
            <p className={`text-[13px] max-w-[200px] mx-auto ${dark ? 'text-gray-400' : 'text-gray-500'} leading-relaxed`}>
              We'll let you know when there's an update on your donations or applications.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
