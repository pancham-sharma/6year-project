import { useState } from 'react';
import { Trash2, RotateCcw, Loader, Search, Heart, Handshake, MessageSquare, Bell, CheckCircle, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { getRecycledItems, restoreItemAPI, deleteItemAPI } from '../api/recycled';
import { useSearch } from '../context/SearchContext';

interface Props { darkMode: boolean; }

export default function RecycleBin({ darkMode }: Props) {
  const queryClient = useQueryClient();
  const { searchQuery: searchTerm } = useSearch();
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Pagination states
  const [pages, setPages] = useState({
    donation: 1,
    application: 1,
    notification: 1,
    message: 1
  });
  const limit = 5;

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Queries for each section
  const donationQuery = useQuery({
    queryKey: ['recycled', 'donation', pages.donation, searchTerm],
    queryFn: () => getRecycledItems(pages.donation, limit, searchTerm, 'donation'),
    placeholderData: keepPreviousData
  });

  const appQuery = useQuery({
    queryKey: ['recycled', 'application', pages.application, searchTerm],
    queryFn: () => getRecycledItems(pages.application, limit, searchTerm, 'application'),
    placeholderData: keepPreviousData
  });

  const notifQuery = useQuery({
    queryKey: ['recycled', 'notification', pages.notification, searchTerm],
    queryFn: () => getRecycledItems(pages.notification, limit, searchTerm, 'notification'),
    placeholderData: keepPreviousData
  });

  const msgQuery = useQuery({
    queryKey: ['recycled', 'message', pages.message, searchTerm],
    queryFn: () => getRecycledItems(pages.message, limit, searchTerm, 'message'),
    placeholderData: keepPreviousData
  });

  // Mutations
  const restoreMutation = useMutation({
    mutationFn: ({ id, type }: { id: any; type: string }) => restoreItemAPI(id, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recycled', variables.type] });
      showToast('Item restored successfully!', 'success');
    },
    onError: () => showToast('Failed to restore item.', 'error')
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: any; type: string }) => deleteItemAPI(id, type),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['recycled', variables.type] });
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

  const Pagination = ({ type, meta, loading }: { type: keyof typeof pages; meta: any; loading: boolean }) => {
    if (!meta || meta.totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-between mt-4 px-2">
        <p className={`text-[10px] font-bold ${textSub}`}>
          Page {pages[type]} of {meta.totalPages}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPages(p => ({ ...p, [type]: Math.max(1, p[type] - 1) }))}
            disabled={pages[type] === 1 || loading}
            className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all disabled:opacity-30 ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            Prev
          </button>
          <button
            onClick={() => setPages(p => ({ ...p, [type]: Math.min(meta.totalPages, p[type] + 1) }))}
            disabled={pages[type] === meta.totalPages || loading}
            className={`px-3 py-1 rounded-lg border text-[10px] font-bold uppercase transition-all disabled:opacity-30 ${
              darkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-600'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';

  return (
    <div className="space-y-6 pb-20">
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

        <div className="space-y-12">
          {/* Donations Section */}
          <section>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between ${textMain}`}>
              <div className="flex items-center gap-2">
                <Heart size={16} className="text-red-500" /> Recycled Donations ({donationQuery.data?.meta.total || 0})
              </div>
              {donationQuery.isLoading && <Loader size={14} className="animate-spin text-green-500" />}
            </h3>
            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
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
                  {donationQuery.data?.data.length === 0 ? (
                    <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled donations found</td></tr>
                  ) : donationQuery.data?.data.map((item: any) => (
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
            <Pagination type="donation" meta={donationQuery.data?.meta} loading={donationQuery.isLoading} />
          </section>

          {/* Volunteers Section */}
          <section>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between ${textMain}`}>
              <div className="flex items-center gap-2">
                <Handshake size={16} className="text-blue-500" /> Recycled Volunteer Applications ({appQuery.data?.meta.total || 0})
              </div>
              {appQuery.isLoading && <Loader size={14} className="animate-spin text-green-500" />}
            </h3>
            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
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
                  {appQuery.data?.data.length === 0 ? (
                    <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled applications found</td></tr>
                  ) : appQuery.data?.data.map((item: any) => (
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
            <Pagination type="application" meta={appQuery.data?.meta} loading={appQuery.isLoading} />
          </section>

          {/* Notifications Section */}
          <section>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between ${textMain}`}>
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-yellow-500" /> Recycled Notifications ({notifQuery.data?.meta.total || 0})
              </div>
              {notifQuery.isLoading && <Loader size={14} className="animate-spin text-green-500" />}
            </h3>
            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <table className="w-full text-sm">
                <thead className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                  <tr>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Title / Message</th>
                    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase ${textSub}`}>Date Recycled</th>
                    <th className={`px-4 py-3 text-right text-xs font-semibold uppercase ${textSub}`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {notifQuery.data?.data.length === 0 ? (
                    <tr><td colSpan={3} className={`py-8 text-center ${textSub}`}>No recycled notifications found</td></tr>
                  ) : notifQuery.data?.data.map((item: any) => (
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
            <Pagination type="notification" meta={notifQuery.data?.meta} loading={notifQuery.isLoading} />
          </section>

          {/* Messages Section */}
          <section>
            <h3 className={`text-sm font-bold uppercase tracking-wider mb-4 flex items-center justify-between ${textMain}`}>
              <div className="flex items-center gap-2">
                <MessageSquare size={16} className="text-purple-500" /> Recycled Messages ({msgQuery.data?.meta.total || 0})
              </div>
              {msgQuery.isLoading && <Loader size={14} className="animate-spin text-green-500" />}
            </h3>
            <div className={`overflow-x-auto rounded-xl border ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
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
                  {msgQuery.data?.data.length === 0 ? (
                    <tr><td colSpan={4} className={`py-8 text-center ${textSub}`}>No recycled messages found</td></tr>
                  ) : msgQuery.data?.data.map((item: any) => (
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
            <Pagination type="message" meta={msgQuery.data?.meta} loading={msgQuery.isLoading} />
          </section>
        </div>
      </div>
    </div>
  );
}
