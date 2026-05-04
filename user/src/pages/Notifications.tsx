import { useState } from 'react';
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
  const [markingAll, setMarkingAll] = useState(false);

  const unread = notifications.filter(n => !n.read);
  const read = notifications.filter(n => n.read);

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    try {
      // Mark all unread ones via PATCH
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

  return (
    <div className={`min-h-screen pt-24 pb-16 ${dark ? 'bg-slate-900' : 'bg-gray-50'}`}>
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
          <div className="mb-8">
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-1 ${dark ? 'text-slate-500' : 'text-gray-400'}`}>
              New Activity
            </h2>
            <div className="space-y-2.5">
              {unread.map(n => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`group relative flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl cursor-pointer transition-all duration-300 border ${
                      dark 
                        ? 'bg-slate-800/60 border-slate-700/50 hover:bg-slate-800 shadow-md' 
                        : 'bg-white border-gray-100 hover:border-primary-100 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      dark 
                        ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                        : 'bg-primary-50 text-primary-600'
                    }`}>
                      <Icon className="w-5 h-5 sm:w-5.5 sm:h-5.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[14px] sm:text-[15px] font-bold leading-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                        {n.title || 'Update'}
                      </h4>
                      <p className={`text-[12px] sm:text-[13px] leading-snug mt-0.5 ${dark ? 'text-slate-200' : 'text-slate-600'} line-clamp-2`}>
                        {n.text}
                      </p>
                      <p className={`text-[9px] sm:text-[10px] mt-1.5 font-semibold uppercase tracking-widest ${dark ? 'text-primary-400' : 'text-slate-400'}`}>
                        {n.time}
                      </p>
                    </div>
                    
                    <div className="w-2 h-2 rounded-full bg-primary-400 flex-shrink-0 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Read Section */}
        {read.length > 0 && (
          <div>
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Earlier · {read.length}
            </h2>
            <div className={`rounded-[1.5rem] overflow-hidden border ${dark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-gray-100 shadow-sm'}`}>
              {read.map((n, i) => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3.5 p-3.5 transition-colors ${
                      i < read.length - 1 ? (dark ? 'border-b border-slate-700/50' : 'border-b border-gray-50') : ''
                    } ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      dark ? 'bg-slate-700/50 text-slate-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5">
                      <h4 className={`text-[13px] font-bold leading-tight mb-0.5 ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {n.title || 'Notification'}
                      </h4>
                      <p className={`text-[12px] leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {n.text}
                      </p>
                      <p className={`text-[9px] mt-1.5 font-medium uppercase tracking-wider ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
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
          <div className={`rounded-[2rem] p-10 text-center ${dark ? 'bg-slate-800/40 border border-slate-700/50' : 'bg-white shadow-sm border border-gray-100'}`}>
            <div className="w-12 h-12 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-primary-500" />
            </div>
            <h3 className={`text-base font-bold mb-1 ${dark ? 'text-white' : 'text-gray-900'}`}>No Notifications</h3>
            <p className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              We'll notify you here when something happens.
            </p>
          </div>
        )}

        {/* Read Section */}
        {read.length > 0 && (
          <div>
            <h2 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 px-1 ${dark ? 'text-slate-600' : 'text-gray-400'}`}>
              Earlier
            </h2>
            <div className={`rounded-2xl overflow-hidden border ${dark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-gray-100'}`}>
              {read.map((n, i) => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    className={`flex items-center gap-3 p-2.5 sm:p-3 transition-colors ${
                      i < read.length - 1 ? (dark ? 'border-b border-slate-700/50' : 'border-b border-gray-50') : ''
                    } ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      dark ? 'bg-slate-700 text-white shadow-sm' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-[13px] font-bold leading-tight ${dark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {n.title || 'Update'}
                      </h4>
                      <p className={`text-[11px] leading-snug mt-0.5 ${dark ? 'text-slate-400' : 'text-slate-500'} line-clamp-1`}>
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
      </div>
    </div>
  );
}
