import { Bell, Search, Moon, Sun, Menu, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';

interface TopbarProps {
  darkMode: boolean;
  onToggleDark: () => void;
  onMobileMenuOpen: () => void;
  pageTitle: string;
  onLogout: () => void;
}

export default function Topbar({ darkMode, onToggleDark, onMobileMenuOpen, pageTitle, onLogout }: TopbarProps) {
  const { searchQuery, setSearchQuery } = useSearch();
  const [showNotif, setShowNotif] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{ donations: any[], users: any[] }>({ donations: [], users: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [allData, setAllData] = useState<{ donations: any[], users: any[] }>({ donations: [], users: [] });

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetchAPI('/api/chat/notifications/');
        const rawData = res?.results || res;
        const data = Array.isArray(rawData) ? rawData : [];
        setNotifications(data.filter((n: any) => n.status !== 'Recycled'));
      } catch (err) {
        console.error("Failed to load notifications", err);
      }
    };
    fetchNotifications();

    // Fetch Search Pool
    const fetchSearchData = async () => {
      try {
        const [dons, users] = await Promise.all([
          fetchAPI('/api/donations/').catch(() => []),
          fetchAPI('/api/users/list/').catch(() => [])
        ]);
        setAllData({
          donations: Array.isArray(dons?.results) ? dons.results : (Array.isArray(dons) ? dons : []),
          users: Array.isArray(users?.results) ? users.results : (Array.isArray(users) ? users : [])
        });
      } catch (err) { console.error(err); }
    };
    fetchSearchData();
    
    // WebSocket for Real-Time Notifications
    const setupWS = () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const apiBase = import.meta.env.VITE_API_BASE_URL || '';
      const host = apiBase 
        ? apiBase.replace(/^https?:\/\//, '') 
        : (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.hostname}:8000` 
            : window.location.host);
      const wsUrl = `${protocol}://${host}/ws/notifications/?token=${token}`;

      
      const ws = new WebSocket(wsUrl);

      ws.onmessage = (e) => {
        const data = JSON.parse(e.data);
        if (data.type === 'notification') {
          const n = data.data;
          setNotifications((prev: any[]) => {
            // Avoid duplicates
            if (prev.some((x: any) => x.id === n.id)) return prev;
            return [n, ...prev].filter((x: any) => x.status !== 'Recycled');
          });
        }
      };

      ws.onclose = () => {
        setTimeout(setupWS, 5000);
      };
    };

    setupWS();
    const interval = setInterval(fetchNotifications, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle Global Search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ donations: [], users: [] });
      return;
    }
    const q = searchQuery.toLowerCase();

    const dResults = allData.donations.filter((d: any) => 
      d.donor?.toLowerCase().includes(q) || 
      d.id.toString().includes(q) || 
      d.category?.toLowerCase().includes(q)
    ).slice(0, 4);

    const uResults = allData.users.filter((u: any) => 
      u.username?.toLowerCase().includes(q) || 
      u.email?.toLowerCase().includes(q)
    ).slice(0, 4);

    setSearchResults({ donations: dResults, users: uResults });
  }, [searchQuery, allData]);


  const unread = Array.isArray(notifications) ? notifications.filter(n => !n.read).length : 0;

  const bg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-800/80 border-gray-700 text-white placeholder-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const btnHover = darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700';
  const notifBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const notifHover = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';
  const notifItemText = darkMode ? 'text-gray-200' : 'text-gray-700';
  const notifSubText = darkMode ? 'text-gray-400' : 'text-gray-500';

  const typeIcon: Record<string, string> = {
    donation: '🎁', message: '💬', pickup: '🚗', alert: '⚠️'
  };

  const handleMarkAllRead = async () => {
    setLoading(true);
    try {
      // Typically we'd have a mark-all-read endpoint, but for now we patch each or just clear locally
      await Promise.all(
        notifications.filter(n => !n.read).map(n => 
          fetchAPI(`/api/chat/notifications/${n.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ read: true })
          })
        )
      );
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error("Failed to mark notifications read", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotifClick = (n: any) => {
    // Mark as read immediately in UI
    if (!n.read) {
      fetchAPI(`/api/chat/notifications/${n.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ read: true })
      }).catch(() => {});
      setNotifications(prev => prev.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
    }

    // Smart Navigation Logic based on notification content
    let target = 'notifications';
    const content = (n.title + ' ' + n.message).toLowerCase();
    
    if (content.includes('donation')) target = 'donations';
    else if (content.includes('pickup')) target = 'pickups';
    else if (content.includes('volunteer')) target = 'volunteers';
    else if (content.includes('message') || n.type === 'message') target = 'messages';
    
    // Extract context for navigation
    if (target === 'messages') {
      const match = n.message.match(/Message from ([^:]+):/i);
      const username = match ? match[1].trim() : null;
      (window as any)._navState = { selectUser: username };
    } else if (target === 'donations') {
      const donorEmail = n.message.split(' ')[0];
      (window as any)._navState = { selectDonor: donorEmail };
    }
    
    window.dispatchEvent(new CustomEvent('navigate', { detail: target }));
    setShowNotif(false);
  };

  return (
    <header className={`flex items-center justify-between px-4 lg:px-6 py-3.5 border-b ${bg} sticky top-0 z-30`}>
      <div className="flex items-center gap-3">
        <button onClick={onMobileMenuOpen} className={`p-2 rounded-lg transition-colors lg:hidden ${btnHover}`}>
          <Menu size={20} />
        </button>
        <div>
          <h1 className={`text-lg font-bold ${textMain}`}>{pageTitle}</h1>
          <p className={`text-xs ${textSub}`}>{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative">
          <div className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border text-sm ${inputBg} w-56 focus-within:w-96 focus-within:shadow-lg focus-within:border-green-500/50 transition-all duration-500 ease-in-out`}>
            <Search size={14} className={darkMode ? 'text-gray-300' : textSub} />
            <input 
              className="bg-transparent outline-none w-full" 
              placeholder={pageTitle === 'Dashboard' ? "Search anything..." : `Search ${pageTitle}...`} 
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setShowSearch(true); }}
              onFocus={() => setShowSearch(true)}
            />
          </div>

          {showSearch && searchQuery && pageTitle === 'Dashboard' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowSearch(false)} />
              <div className={`absolute left-0 top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${notifBg} animate-fade-in`}>
                <div className="max-h-[400px] overflow-y-auto">
                  {searchResults.donations.length === 0 && searchResults.users.length === 0 ? (
                    <div className={`px-4 py-8 text-center text-sm ${textSub}`}>No results found for "{searchQuery}"</div>
                  ) : (
                    <div className="py-2">
                      {searchResults.donations.length > 0 && (
                        <div>
                          <p className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Donations</p>
                          {searchResults.donations.map(d => (
                            <div key={d.id} className={`px-4 py-2.5 ${notifHover} cursor-pointer`}>
                              <p className={`text-sm font-semibold ${notifItemText}`}>{d.donor}</p>
                              <div className="flex items-center justify-between">
                                <p className={`text-xs ${notifSubText}`}>{d.category} · {d.quantity_description}</p>
                                <p className="text-[10px] text-green-500 font-mono">#{d.id}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {searchResults.users.length > 0 && (
                        <div className="mt-2">
                          <p className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider ${textSub}`}>Users</p>
                          {searchResults.users.map(u => (
                            <div key={u.id} className={`px-4 py-2.5 ${notifHover} cursor-pointer`}>
                              <p className={`text-sm font-semibold ${notifItemText}`}>{u.username}</p>
                              <p className={`text-xs ${notifSubText}`}>{u.email}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>


        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDark}
          className={`p-2 rounded-xl transition-colors ${btnHover}`}
        >
          {darkMode ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className={`p-2 rounded-xl transition-colors relative ${btnHover}`}
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {unread}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowNotif(false)} />
              <div className={`absolute right-0 top-12 w-80 rounded-2xl border shadow-2xl z-50 overflow-hidden ${notifBg}`}>
                <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
                  <h3 className={`font-bold text-sm ${textMain}`}>Notifications</h3>
                  <span className="text-xs text-green-500 font-semibold">{unread} new</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.filter(n => !n.read).length === 0 ? (
                    <div className={`px-4 py-8 text-center text-sm ${textSub}`}>
                      No new notifications.
                    </div>
                  ) : notifications.filter(n => !n.read).map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 cursor-pointer ${notifHover} transition-colors border-b ${darkMode ? 'border-gray-700/50' : 'border-gray-50'} ${!n.read ? (darkMode ? 'bg-green-900/10' : 'bg-green-50/50') : ''}`}
                    >
                      <span className="text-lg flex-shrink-0 mt-0.5">{typeIcon[n.type] || '🔔'}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-semibold ${notifItemText}`}>{n.title}</p>
                        <p className={`text-xs ${notifSubText} mt-0.5`}>{n.message}</p>
                        <p className="text-xs text-green-500 mt-1">{new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />}
                    </div>
                  ))}
                </div>
                <div className={`px-4 py-2.5 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                  <button onClick={handleMarkAllRead} disabled={loading || unread === 0} className="flex justify-center items-center text-xs text-green-500 font-semibold w-full text-center hover:text-green-600 transition-colors disabled:opacity-50">
                    {loading ? <Loader size={12} className="animate-spin mr-1" /> : null} Mark all as read
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Logout Button */}
        <button 
          onClick={onLogout} 
          className={`ml-2 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${darkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : 'border-gray-200 text-gray-600 hover:bg-gray-100'}`}
        >
          Logout
        </button>
      </div>
    </header>
  );
}
