import { useState, useEffect } from 'react';
import { Bell, Loader, CheckCircle, Trash2, Search, Filter } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';


interface Props { darkMode: boolean; }

export default function Notifications({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [localSearch, setLocalSearch] = useState('');


  const fetchNotifications = async () => {
    try {
      const res = await fetchAPI('/api/chat/notifications/');
      setNotifications(res.results || res || []);
    } catch (err) {
      console.error("Failed to fetch notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await fetchAPI(`/api/chat/notifications/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error("Failed to mark as read", err);
    }
  };

  const deleteNotification = async (id: number) => {
    if (!confirm("Are you sure you want to delete this notification?")) return;
    try {
      await fetchAPI(`/api/chat/notifications/${id}/`, {
        method: 'DELETE'
      });
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Failed to delete notification", err);
    }
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;
    
    try {
      await Promise.all(unread.map(n => 
        fetchAPI(`/api/chat/notifications/${n.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ read: true })
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read", err);
    }
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const itemHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const unreadBg = darkMode ? 'bg-green-900/10' : 'bg-green-50/50';

  const combinedSearch = (searchQuery + ' ' + localSearch).trim().toLowerCase();
  const filtered = notifications.filter(n => {
    const matchesFilter = filter === 'all' || !n.read;
    const matchesSearch = !combinedSearch || n.title.toLowerCase().includes(combinedSearch) || n.message.toLowerCase().includes(combinedSearch);
    return matchesFilter && matchesSearch;
  });


  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border shadow-sm p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textMain}`}>System Notifications</h2>
            <p className={`text-sm ${textSub}`}>Stay updated with the latest activities and alerts</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={markAllRead}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${darkMode ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              Mark all as read
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border ${inputBg}`}>
            <Search size={16} className={textSub} />
            <input 
              className="bg-transparent outline-none w-full text-sm" 
              placeholder="Filter notifications on this page..." 
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-green-500 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('unread')}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${filter === 'unread' ? 'bg-green-500 text-white' : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600')}`}
            >
              Unread
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filtered.length === 0 ? (
            <div className={`py-12 text-center ${textSub}`}>
              <Bell size={48} className="mx-auto mb-4 opacity-20" />
              <p>No notifications found matching your criteria.</p>
            </div>
          ) : (
            filtered.map(n => (
              <div 
                key={n.id} 
                className={`flex items-start gap-4 p-4 rounded-2xl border transition-all ${itemHover} ${!n.read ? `${unreadBg} border-green-500/20` : (darkMode ? 'border-gray-700' : 'border-gray-100')}`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${!n.read ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : (darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                  {n.title.toLowerCase().includes('message') ? '💬' : 
                   n.title.toLowerCase().includes('donation') ? '🎁' : 
                   n.title.toLowerCase().includes('volunteer') ? '🤝' : 
                   n.title.toLowerCase().includes('pickup') ? '🚗' : '🔔'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-sm ${textMain}`}>{n.title}</h3>
                      {!n.read && <span className="px-1.5 py-0.5 rounded-md bg-green-500 text-[8px] text-white font-bold uppercase tracking-tighter">New</span>}
                    </div>
                    <span className={`text-[10px] font-medium uppercase tracking-wider ${textSub}`}>{new Date(n.timestamp).toLocaleString()}</span>
                  </div>
                  <p className={`text-sm mt-1 ${textSub} leading-relaxed`}>{n.message}</p>
                  <div className="flex items-center gap-3 mt-3">
                    {!n.read && (
                      <button 
                        onClick={() => markAsRead(n.id)}
                        className="text-xs font-bold text-green-500 hover:text-green-600 flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle size={12} /> Mark as read
                      </button>
                    )}
                    <button 
                      onClick={() => deleteNotification(n.id)}
                      className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
                {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5 animate-pulse" />}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
