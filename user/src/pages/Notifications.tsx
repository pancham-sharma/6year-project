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
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>
              Notifications
            </h1>
            <p className={`mt-1 text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              {unread.length > 0 ? `${unread.length} unread notification${unread.length > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unread.length > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                dark ? 'bg-slate-700 text-gray-300 hover:bg-slate-600' : 'bg-white text-gray-600 hover:bg-gray-100 shadow-sm border border-gray-200'
              } disabled:opacity-50`}
            >
              {markingAll ? <Loader className="w-4 h-4 animate-spin" /> : <CheckCheck className="w-4 h-4" />}
              Mark all read
            </button>
          )}
        </div>

        {/* Empty State */}
        {notifications.length === 0 && (
          <div className={`rounded-3xl p-16 text-center ${dark ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-100'}`}>
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className={`text-lg font-semibold mb-2 ${dark ? 'text-white' : 'text-gray-900'}`}>No Notifications Yet</h3>
            <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              You'll see updates here about your donations, pickups, and volunteer activities.
            </p>
          </div>
        )}

        {/* Unread Section */}
        {unread.length > 0 && (
          <div className="mb-8">
            <h2 className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              New Activity · {unread.length}
            </h2>
            <div className="space-y-4">
              {unread.map(n => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    className={`group relative flex items-start gap-4 p-5 rounded-[2rem] cursor-pointer transition-all duration-300 border ${
                      dark 
                        ? 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 shadow-lg' 
                        : 'bg-white border-gray-100 hover:border-primary-100 shadow-sm hover:shadow-xl hover:shadow-primary-500/5'
                    }`}
                  >
                    {/* Active Status Bar */}
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-primary-500 rounded-r-full shadow-[0_0_10px_rgba(24,226,153,0.5)]" />
                    
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                      dark ? 'bg-primary-500/20 text-white shadow-lg shadow-primary-500/10' : 'bg-primary-50 text-primary-600'
                    }`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 pt-1">
                      <p className={`text-[15px] font-bold leading-snug mb-1 ${dark ? 'text-white' : 'text-slate-900'}`}>{n.text}</p>
                      <p className={`text-xs ${dark ? 'text-slate-400' : 'text-slate-500'}`}>{n.time}</p>
                    </div>
                    
                    <div className="w-2.5 h-2.5 rounded-full bg-primary-500 animate-pulse mt-2 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Read Section */}
        {read.length > 0 && (
          <div>
            <h2 className={`text-[11px] font-bold uppercase tracking-[0.2em] mb-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
              Earlier · {read.length}
            </h2>
            <div className={`rounded-[2rem] overflow-hidden border ${dark ? 'bg-slate-800/20 border-slate-700/50' : 'bg-white border-gray-100 shadow-sm'}`}>
              {read.map((n, i) => {
                const Icon = getIcon(n.text);
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-4 p-5 transition-colors ${
                      i < read.length - 1 ? (dark ? 'border-b border-slate-700/50' : 'border-b border-gray-50') : ''
                    } ${dark ? 'hover:bg-slate-800/40' : 'hover:bg-gray-50/50'}`}
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      dark ? 'bg-slate-700/50 text-slate-200' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <p className={`text-[14px] font-medium leading-snug mb-1 ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{n.text}</p>
                      <p className={`text-xs ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{n.time}</p>
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
