import { useState, useEffect } from 'react';
import { Trash2, RotateCcw, Loader, Search, Heart, Handshake, MessageSquare, Bell } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface Props { darkMode: boolean; }

export default function RecycleBin({ darkMode }: Props) {
  const [loading, setLoading] = useState(true);
  const [donations, setDonations] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchRecycled = async () => {
    setLoading(true);
    try {
      const [donRes, appRes, notifRes, msgRes] = await Promise.all([
        fetchAPI('/api/donations/'),
        fetchAPI('/api/users/volunteer/admin/list/'),
        fetchAPI('/api/chat/notifications/'),
        fetchAPI('/api/chat/messages/')
      ]);
      
      const allDons = donRes.results || donRes || [];
      const allApps = appRes.results || appRes || [];
      const allNotifs = notifRes.results || notifRes || [];
      const allMsgs = msgRes.results || msgRes || [];
      
      setDonations(allDons.filter((d: any) => d.status === 'Recycled'));
      setApplications(allApps.filter((a: any) => a.status === 'Recycled'));
      setNotifications(allNotifs.filter((n: any) => n.status === 'Recycled'));
      setMessages(allMsgs.filter((m: any) => m.status === 'Recycled'));
    } catch (err) {
      console.error("Failed to fetch recycled items", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecycled();
  }, []);

  const restoreItem = async (id: any, type: 'donation' | 'application' | 'notification' | 'message') => {
    try {
      let endpoint = '';
      if (type === 'donation') endpoint = `/api/donations/${id}/`;
      else if (type === 'application') endpoint = `/api/users/volunteer/admin/${id}/`;
      else if (type === 'notification') endpoint = `/api/chat/notifications/${id}/`;
      else if (type === 'message') endpoint = `/api/chat/messages/${id}/`;
        
      await fetchAPI(endpoint, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Active' }) // Note: donations use 'Pending', others might differ, but 'Active' is our new default
      });
      
      if (type === 'donation') setDonations(prev => prev.filter(d => d.id !== id));
      else if (type === 'application') setApplications(prev => prev.filter(a => a.id !== id));
      else if (type === 'notification') setNotifications(prev => prev.filter(n => n.id !== id));
      else if (type === 'message') setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to restore item", err);
    }
  };

  const permanentDelete = async (id: any, type: 'donation' | 'application' | 'notification' | 'message') => {
    if (!window.confirm("PERMANENTLY DELETE this item? This cannot be undone.")) return;
    try {
      let endpoint = '';
      if (type === 'donation') endpoint = `/api/donations/${id}/`;
      else if (type === 'application') endpoint = `/api/users/volunteer/admin/${id}/`;
      else if (type === 'notification') endpoint = `/api/chat/notifications/${id}/`;
      else if (type === 'message') endpoint = `/api/chat/messages/${id}/`;
        
      await fetchAPI(endpoint, { method: 'DELETE' });
      
      if (type === 'donation') setDonations(prev => prev.filter(d => d.id !== id));
      else if (type === 'application') setApplications(prev => prev.filter(a => a.id !== id));
      else if (type === 'notification') setNotifications(prev => prev.filter(n => n.id !== id));
      else if (type === 'message') setMessages(prev => prev.filter(m => m.id !== id));
    } catch (err) {
      console.error("Failed to delete item", err);
    }
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';

  const filteredDonations = donations.filter(d => d.donor?.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toString().includes(searchTerm));
  const filteredApps = applications.filter(a => a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredNotifs = notifications.filter(n => n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || n.message?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMessages = messages.filter(m => m.message_body?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border p-6 ${card} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textMain}`}>Recycle Bin</h2>
            <p className={`text-sm ${textSub}`}>Items here can be restored or permanently deleted</p>
          </div>
        </div>

        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'} mb-6`}>
          <Search size={16} className={darkMode ? 'text-gray-300' : textSub} />
          <input 
            className={`bg-transparent outline-none w-full text-sm ${darkMode ? 'text-white placeholder-gray-300' : 'text-gray-700 placeholder-gray-400'}`} 
            placeholder="Search recycled items..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="py-12 text-center"><Loader className="animate-spin mx-auto text-green-500" /></div>
        ) : (
          <div className="space-y-8">
            {/* Donations Section */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textMain}`}>
                <Heart size={16} className="text-red-500" /> Recycled Donations ({donations.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>ID / Donor</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Details</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Date Recycled</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${textSub}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredDonations.length === 0 ? (
                      <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled donations found</td></tr>
                    ) : filteredDonations.map(item => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>Donation #{item.id}</p>
                          <p className={`text-xs ${textSub}`}>{item.donor}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{item.category} - {item.quantity_description}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button title="Restore" onClick={() => restoreItem(item.id, 'donation')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            <RotateCcw size={14} />
                          </button>
                          <button title="Delete Permanently" onClick={() => permanentDelete(item.id, 'donation')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Volunteers Section */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textMain}`}>
                <Handshake size={16} className="text-blue-500" /> Recycled Volunteer Applications ({applications.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Name / Email</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Details</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Date Recycled</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${textSub}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredApps.length === 0 ? (
                      <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled applications found</td></tr>
                    ) : filteredApps.map(item => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>{item.name}</p>
                          <p className={`text-xs ${textSub}`}>{item.email}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{item.volunteering_role} in {item.city}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button title="Restore" onClick={() => restoreItem(item.id, 'application')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            <RotateCcw size={14} />
                          </button>
                          <button title="Delete Permanently" onClick={() => permanentDelete(item.id, 'application')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notifications Section */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textMain}`}>
                <Bell size={16} className="text-yellow-500" /> Recycled Notifications ({notifications.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Title / Message</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Date Recycled</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${textSub}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredNotifs.length === 0 ? (
                      <tr><td colSpan={3} className={`py-8 text-center ${textSub}`}>No recycled notifications found</td></tr>
                    ) : filteredNotifs.map(item => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>{item.title}</p>
                          <p className={`text-xs ${textSub} truncate max-w-md`}>{item.message}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button title="Restore" onClick={() => restoreItem(item.id, 'notification')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            <RotateCcw size={14} />
                          </button>
                          <button title="Delete Permanently" onClick={() => permanentDelete(item.id, 'notification')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Messages Section */}
            <div>
              <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 ${textMain}`}>
                <MessageSquare size={16} className="text-purple-500" /> Recycled Messages ({messages.length})
              </h3>
              <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-700">
                <table className="w-full text-sm">
                  <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                    <tr>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>From / To</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Content</th>
                      <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Date Recycled</th>
                      <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${textSub}`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredMessages.length === 0 ? (
                      <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled messages found</td></tr>
                    ) : filteredMessages.map(item => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>From: {item.sender_username}</p>
                          <p className={`text-xs ${textSub}`}>To: {item.receiver_username}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub} max-w-md truncate`}>{item.message_body}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4 text-right space-x-2">
                          <button title="Restore" onClick={() => restoreItem(item.id, 'message')} className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400">
                            <RotateCcw size={14} />
                          </button>
                          <button title="Delete Permanently" onClick={() => permanentDelete(item.id, 'message')} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
