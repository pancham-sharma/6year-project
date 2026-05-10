import { useState, useEffect } from 'react';
import { Search, Users, Heart, UserCheck, Eye, X, Loader, Shield } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';

interface Props { darkMode: boolean; }

export default function UserManagement({ darkMode }: Props) {
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const { searchQuery } = useSearch();

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const { data: statsData } = useQuery({
    queryKey: ['users-stats'],
    queryFn: () => fetchAPI('/api/users/stats/'),
    staleTime: 1000 * 60 * 5
  });

  const { data, isLoading: loading } = useQuery({
    queryKey: ['users-list', page, searchQuery],
    queryFn: async () => {
      const usersRes = await fetchAPI(`/api/users/list/?page=${page}&limit=${limit}&search=${searchQuery}`);
      const rawUsers = usersRes?.results || (Array.isArray(usersRes) ? usersRes : []);
      const total = usersRes?.count || rawUsers.length;
      const totalPages = Math.ceil(total / limit);
      
      return {
        users: rawUsers.map((u: any) => ({
          id: u.id,
          name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username,
          email: u.email,
          phone: u.phone_number || 'N/A',
          joinDate: u.date_joined ? new Date(u.date_joined).toLocaleDateString() : 'N/A',
          status: u.role || 'Donor',
          avatar: u.username.charAt(0).toUpperCase(),
          donationCount: u.donation_count || 0
        })),
        meta: { total, totalPages }
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 30
  });

  const users = data?.users || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };


  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const modalBg = darkMode ? 'bg-gray-800' : 'bg-white';

  const filtered = users; // Server side filtering handled via queryFn

  const donorCount = users.filter((u: any) => (u.role || "").toUpperCase() === 'DONOR').length;
  const volunteerCount = users.filter((u: any) => (u.role || "").toUpperCase() === 'VOLUNTEER').length;
  const adminCount = users.filter((u: any) => (u.role || "").toUpperCase() === 'ADMIN').length;


  const avatarColors = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-violet-500',
    'from-amber-400 to-orange-500',
    'from-pink-400 to-rose-500',
    'from-cyan-400 to-sky-500',
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: statsData?.total || meta.total, icon: Users, color: 'from-green-400 to-emerald-500' },
          { label: 'New Users (7d)', value: statsData?.new_users || 0, icon: Users, color: 'from-blue-400 to-indigo-500' },
          { label: 'Volunteers', value: statsData?.volunteers || 0, icon: UserCheck, color: 'from-amber-400 to-orange-500' },
          { label: 'Admins', value: statsData?.admins || 0, icon: Shield, color: 'from-violet-400 to-purple-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl border p-4 shadow-sm ${card}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${textMain}`}>{s.value}</p>
                  <p className={`text-xs ${textSub}`}>{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>



      {/* Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-base ${textMain}`}>Registered Users</h2>
            <span className={`text-xs ${textSub}`}>{filtered.length} of {users.length} users</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={theadBg}>
                {['User', 'Email', 'Phone', 'Join Date', 'Total Donations', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub} whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-8 text-center ${textSub}`}>No users found in database.</td>
                </tr>
              ) : filtered.map((u: any, idx: number) => {
                const userDons = u.donationCount;
                return (
                <tr key={u.id} className={`transition-colors ${rowHover}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                        <span className="text-white text-xs font-bold">{u.avatar}</span>
                      </div>
                      <div>
                        <p className={`font-semibold text-sm ${textMain}`}>{u.name}</p>
                        <p className="text-xs text-green-500 font-mono">#{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{u.email}</td>
                  <td className={`px-5 py-3.5 ${textSub} whitespace-nowrap`}>{u.phone}</td>
                  <td className={`px-5 py-3.5 ${textSub} whitespace-nowrap`}>{u.joinDate}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-1.5 w-16 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        <div className="h-1.5 rounded-full bg-green-400" style={{ width: `${Math.min((userDons / 5) * 100, 100)}%` }} />
                      </div>
                      <span className={`font-semibold ${textMain}`}>{userDons}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${u.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => setViewUser(u)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}>
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between bg-transparent`}>
          <div className={`text-xs ${textSub}`}>
            Showing <span className="font-semibold textMain">{Math.min((page - 1) * limit + 1, meta.total)}</span> to <span className="font-semibold textMain">{Math.min(page * limit, meta.total)}</span> of <span className="font-semibold textMain">{meta.total}</span> users
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${page === 1 ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50 border-gray-200')} ${textMain}`}
            >
              Previous
            </button>
            <div className="flex items-center gap-1">
              {[...Array(meta.totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${page === i + 1 ? 'bg-green-500 text-white shadow-md' : (darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-50 text-gray-500')}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button 
              disabled={page === meta.totalPages}
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${page === meta.totalPages ? 'opacity-50 cursor-not-allowed' : (darkMode ? 'hover:bg-gray-700 border-gray-600' : 'hover:bg-gray-50 border-gray-200')} ${textMain}`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewUser(null)}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-base ${textMain}`}>User Profile</h3>
              <button onClick={() => setViewUser(null)} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Avatar + Info */}
              <div className={`flex items-center gap-4 p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-md">
                  <span className="text-white text-lg font-bold">{viewUser.avatar}</span>
                </div>
                <div>
                  <p className={`font-bold text-base ${textMain}`}>{viewUser.name}</p>
                  <p className="text-xs text-green-500">#{viewUser.id}</p>
                  <span className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${viewUser.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{viewUser.status}</span>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3">
                {[
                  { label: 'Email', value: viewUser.email },
                  { label: 'Phone', value: viewUser.phone },
                  { label: 'Join Date', value: viewUser.joinDate },
                  { label: 'Total Donations', value: (viewUser.donationCount || 0).toString() },
                ].map(item => (
                  <div key={item.label} className={`flex justify-between py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                    <span className={`text-sm ${textSub}`}>{item.label}</span>
                    <span className={`text-sm font-semibold ${textMain}`}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Donation History */}
              <div>
                <h4 className={`font-bold text-sm mb-3 ${textMain}`}>Donation History</h4>
                {/* (Donation history fetch removed for performance) */}
                <p className={`text-sm ${textSub}`}>No donations found in database.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
