import { useState, useMemo } from 'react';
import { Trash2, RotateCcw, Loader, Search, Heart, Handshake, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRecycledItems, restoreItemAPI, deleteItemAPI } from '../api/recycled';
import { useSearch } from '../context/SearchContext';

interface Props { darkMode: boolean; }

export default function RecycleBin({ darkMode }: Props) {
  const queryClient = useQueryClient();
  const { searchQuery: searchTerm } = useSearch();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // React Query
  const { data, isLoading: loading } = useQuery({
    queryKey: ['recycled'],
    queryFn: getRecycledItems,
  });

  const donations = useMemo(() => data?.donations || [], [data]);
  const applications = useMemo(() => data?.applications || [], [data]);
  const notifications = useMemo(() => data?.notifications || [], [data]);
  const messages = useMemo(() => data?.messages || [], [data]);

  // Mutations
  const restoreMutation = useMutation({
    mutationFn: ({ id, type }: { id: any; type: string }) => restoreItemAPI(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycled'] });
      showToast('Item restored successfully!', 'success');
    },
    onError: () => showToast('Failed to restore item.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: any; type: string }) => deleteItemAPI(id, type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recycled'] });
      showToast('Item permanently deleted.', 'success');
    },
    onError: () => showToast('Failed to delete item.', 'error')
  });

  const restoreItem = async (id: any, type: 'donation' | 'application' | 'notification' | 'message') => {
    restoreMutation.mutate({ id, type });
  };

  const permanentDelete = async (id: any, type: 'donation' | 'application' | 'notification' | 'message') => {
    if (!window.confirm("PERMANENTLY DELETE this item? This cannot be undone.")) return;
    deleteMutation.mutate({ id, type });
  };

  // Helper: action buttons with loading state
  const ActionButtons = ({ id, type }: { id: any; type: 'donation' | 'application' | 'notification' | 'message' }) => {
    const isRestoring = restoreMutation.isPending && restoreMutation.variables?.id === id;
    const isDeleting = deleteMutation.isPending && deleteMutation.variables?.id === id;
    return (
      <div className="flex items-center justify-end gap-2">
        <button
          title="Restore"
          onClick={() => restoreItem(id, type)}
          disabled={isRestoring || isDeleting}
          className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 disabled:opacity-50 transition-all"
        >
          {isRestoring ? <Loader size={14} className="animate-spin" /> : <RotateCcw size={14} />}
        </button>
        <button
          title="Delete Permanently"
          onClick={() => permanentDelete(id, type)}
          disabled={isRestoring || isDeleting}
          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all"
        >
          {isDeleting ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
        </button>
      </div>
    );
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';

  const filteredDonations = donations.filter((d: any) => d.donor?.toLowerCase().includes(searchTerm.toLowerCase()) || d.id.toString().includes(searchTerm));
  const filteredApps = applications.filter((a: any) => a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || a.email?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredNotifs = notifications.filter((n: any) => n.title?.toLowerCase().includes(searchTerm.toLowerCase()) || n.message?.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredMessages = messages.filter((m: any) => m.message_body?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-bold animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.msg}
        </div>
      )}

      <div className={`rounded-2xl border p-6 ${card} shadow-sm`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textMain}`}>Recycle Bin</h2>
            <p className={`text-sm ${textSub}`}>Items here can be restored or permanently deleted</p>
          </div>
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
                    ) : filteredDonations.map((item: any) => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>Donation #{item.id}</p>
                          <p className={`text-xs ${textSub}`}>{item.donor}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{item.category} - {item.quantity_description}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><ActionButtons id={item.id} type="donation" /></td>
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
                    ) : filteredApps.map((item: any) => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>{item.name}</p>
                          <p className={`text-xs ${textSub}`}>{item.email}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{item.volunteering_role} in {item.city}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.created_at).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><ActionButtons id={item.id} type="application" /></td>
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
                    ) : filteredNotifs.map((item: any) => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>{item.title}</p>
                          <p className={`text-xs ${textSub} truncate max-w-md`}>{item.message}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><ActionButtons id={item.id} type="notification" /></td>
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
                    ) : filteredMessages.map((item: any) => (
                      <tr key={item.id} className={`transition-colors ${rowHover}`}>
                        <td className="px-4 py-4">
                          <p className={`font-semibold ${textMain}`}>From: {item.sender_username}</p>
                          <p className={`text-xs ${textSub}`}>To: {item.receiver_username}</p>
                        </td>
                        <td className={`px-4 py-4 ${textSub} max-w-md truncate`}>{item.message_body}</td>
                        <td className={`px-4 py-4 ${textSub}`}>{new Date(item.timestamp).toLocaleDateString()}</td>
                        <td className="px-4 py-4"><ActionButtons id={item.id} type="message" /></td>
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
