import { useState, useEffect } from 'react';
import { 
  Users, UserCheck, Eye, X, Loader, Shield, 
  Mail, Copy, Search, 
  ArrowUpDown
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';

interface Props { darkMode: boolean; }

export default function UserManagement({ darkMode }: Props) {
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [roleFilter, setRoleFilter] = useState('');
  const [orderBy, setOrderBy] = useState('-date_joined');
  
  const { searchQuery } = useSearch();
  const { showToast } = useToast();
  const [emailPopover, setEmailPopover] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);

  // Reset page when search or filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, roleFilter]);

  const { data: statsData } = useQuery({
    queryKey: ['users-stats'],
    queryFn: () => fetchAPI('/api/users/stats/'),
    staleTime: 1000 * 60 * 5
  });

  const { data, isLoading: loading, isPlaceholderData } = useQuery({
    queryKey: ['users-list', page, limit, searchQuery, roleFilter, orderBy],
    queryFn: async () => {
      let url = `/api/users/list/?page=${page}&page_size=${limit}&ordering=${orderBy}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      
      const res = await fetchAPI(url);

      // Handle CustomPagination {data, meta} format
      const rawUsers: any[] = Array.isArray(res)
        ? res
        : (res?.data ?? res?.results ?? []);
      const total: number = res?.meta?.total ?? res?.count ?? rawUsers.length;
      const totalPages: number = res?.meta?.totalPages ?? (Math.ceil(total / limit) || 1);
      
      return {
        users: rawUsers.map((u: any) => ({
          id: u.id,
          name: u.first_name ? `${u.first_name} ${u.last_name || ''}`.trim() : u.username,
          email: u.email,
          phone: u.phone_number || 'N/A',
          city: u.city || 'N/A',
          joinDate: u.date_joined ? new Date(u.date_joined).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
          role: u.role || 'DONOR',
          isStaff: u.is_staff,
          avatar: (u.first_name || u.username).charAt(0).toUpperCase(),
          donationCount: u.donation_count ?? u.annotated_donation_count ?? 0,
          raw: u
        })),
        meta: { total, totalPages }
      };
    },
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 // 1 minute cache
  });

  const users = data?.users || [];
  const meta = data?.meta || { total: 0, totalPages: 1 };

  const toggleSort = (field: string) => {
    setOrderBy(prev => {
      if (prev === field) return `-${field}`;
      return field;
    });
  };

  const card = darkMode ? 'bg-[#1e293b] border-gray-800' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const rowHover = darkMode ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50';
  const divider = darkMode ? 'divide-gray-800' : 'divide-gray-100';
  const theadBg = darkMode ? 'bg-slate-800/80' : 'bg-slate-50/80';
  const modalBg = darkMode ? 'bg-[#0f172a]' : 'bg-white';

  const avatarColors = [
    'from-emerald-400 to-teal-500',
    'from-blue-400 to-indigo-500',
    'from-violet-400 to-purple-500',
    'from-amber-400 to-orange-500',
    'from-rose-400 to-pink-500',
    'from-sky-400 to-cyan-500',
  ];

  const TableSkeleton = () => (
    <>
      {[...Array(limit)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-slate-700/20" /><div className="space-y-2"><div className="h-3 w-24 bg-slate-700/20 rounded" /><div className="h-2 w-12 bg-slate-700/20 rounded" /></div></div></td>
          <td className="px-5 py-4"><div className="h-3 w-32 bg-slate-700/20 rounded" /></td>
          <td className="px-5 py-4"><div className="h-3 w-24 bg-slate-700/20 rounded" /></td>
          <td className="px-5 py-4"><div className="h-3 w-20 bg-slate-700/20 rounded" /></td>
          <td className="px-5 py-4"><div className="h-3 w-16 bg-slate-700/20 rounded" /></td>
          <td className="px-5 py-4"><div className="h-5 w-16 bg-slate-700/20 rounded-full" /></td>
          <td className="px-5 py-4"><div className="h-8 w-16 bg-slate-700/20 rounded-lg" /></td>
        </tr>
      ))}
    </>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-black ${textMain}`}>User Management</h1>
          <p className={`text-sm ${textSub}`}>Manage registrations, roles and monitor user activity</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Add User button removed as registrations are user-facing */}
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: statsData?.total || meta.total, icon: Users, color: 'from-green-400 to-emerald-500' },
          { label: 'New Users (7d)', value: statsData?.new_users || 0, icon: Loader, color: 'from-blue-400 to-indigo-500' },
          { label: 'Volunteers', value: statsData?.volunteers || 0, icon: UserCheck, color: 'from-amber-400 to-orange-500' },
          { label: 'Admins', value: statsData?.admins || 0, icon: Shield, color: 'from-violet-400 to-purple-500' },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${card}`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-lg text-white`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className={`text-2xl font-black ${textMain}`}>{s.value.toLocaleString()}</p>
                  <p className={`text-[11px] font-bold uppercase tracking-widest ${textSub}`}>{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Table Container */}
      <div className={`rounded-3xl border shadow-xl overflow-hidden flex flex-col ${card}`}>
        {/* Table Filters */}
        <div className={`px-6 py-5 border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex flex-wrap items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${textMain}`}>Role:</span>
                <select 
                  value={roleFilter} 
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  <option value="">All Roles</option>
                  <option value="DONOR">Donor</option>
                  <option value="VOLUNTEER">Volunteer</option>
                  <option value="ADMIN">Admin</option>
                </select>
             </div>
             <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${textMain}`}>Show:</span>
                <select 
                  value={limit} 
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold outline-none transition-all ${darkMode ? 'bg-slate-800 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
             </div>
          </div>
          
          <div className={`text-xs font-bold ${textSub} flex items-center gap-2`}>
            {loading && !isPlaceholderData ? (
               <Loader size={14} className="animate-spin text-green-500" />
            ) : (
               <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
            )}
            {meta.total} Registered Users
          </div>
        </div>

        {/* Table Body */}
        <div className="overflow-x-auto relative" style={{ minHeight: '400px' }}>
          <table className="w-full text-left border-collapse">
            <thead className={`sticky top-0 z-10 ${theadBg} backdrop-blur-md`}>
              <tr>
                {[
                  { label: 'User', sort: 'username' },
                  { label: 'Email', sort: 'email' },
                  { label: 'Phone', sort: 'phone_number' },
                  { label: 'Join Date', sort: 'date_joined' },
                  { label: 'Donations', sort: 'donation_count' },
                  { label: 'Role', sort: 'role' },
                  { label: 'Actions', sort: null }
                ].map((h, i) => (
                  <th 
                    key={i} 
                    onClick={() => h.sort && toggleSort(h.sort)}
                    className={`px-6 py-4 text-[11px] font-black uppercase tracking-widest ${textSub} ${h.sort ? 'cursor-pointer hover:text-green-500' : ''} transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      {h.label}
                      {h.sort && <ArrowUpDown size={12} className={orderBy.includes(h.sort) ? 'text-green-500' : 'opacity-30'} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {loading && !isPlaceholderData ? (
                <TableSkeleton />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`py-20 text-center ${textSub}`}>
                    <div className="flex flex-col items-center gap-3">
                      <Search size={40} className="opacity-10" />
                      <p className="font-bold">No matching users found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                users.map((u: any, idx: number) => (
                  <tr key={u.id} className={`group transition-all ${rowHover} ${isPlaceholderData ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <span className="text-white text-sm font-black">{u.avatar}</span>
                        </div>
                        <div>
                          <p className={`font-bold text-sm ${textMain}`}>{u.name}</p>
                          <p className="text-[10px] text-green-500 font-mono font-bold tracking-tighter opacity-70">#{u.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className={`text-xs font-bold ${textSub}`}>{u.email}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={`text-xs font-bold ${textSub}`}>{u.phone}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className={`text-xs font-bold ${textSub}`}>{u.joinDate}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-1.5 w-16 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} overflow-hidden shadow-inner`}>
                          <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" style={{ width: `${Math.min((u.donationCount / 10) * 100, 100)}%` }} />
                        </div>
                        <span className={`text-xs font-black ${textMain}`}>{u.donationCount}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        u.role === 'VOLUNTEER' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 
                        u.role === 'ADMIN' ? 'bg-violet-500/10 text-violet-500 border border-violet-500/20' : 
                        'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewUser(u)} className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 hover:bg-blue-500/20 text-blue-400' : 'bg-slate-50 hover:bg-blue-50 text-blue-600'}`}>
                          <Eye size={16} />
                        </button>
                        <div className="relative">
                          <button 
                            onClick={() => setEmailPopover(emailPopover === u.email ? null : u.email)}
                            className={`p-2 rounded-xl transition-all ${darkMode ? 'bg-slate-800 hover:bg-green-500/20 text-green-400' : 'bg-slate-50 hover:bg-green-50 text-green-600'}`}
                          >
                            <Mail size={16} />
                          </button>
                          {emailPopover === u.email && (
                            <div className="absolute right-0 bottom-full mb-3 z-50">
                               <div className="fixed inset-0" onClick={() => setEmailPopover(null)} />
                               <div className={`relative w-48 rounded-2xl border shadow-2xl overflow-hidden p-1.5 space-y-1 ${card} animate-in slide-in-from-bottom-2`}>
                                  <button onClick={() => { window.location.href = `mailto:${u.email}`; setEmailPopover(null); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl ${rowHover} ${textMain}`}>
                                    <Mail size={14} className="text-blue-500" /> Direct Email
                                  </button>
                                  <button onClick={() => { navigator.clipboard.writeText(u.email); setCopying(u.email); showToast("Copied!", "success"); setTimeout(() => setEmailPopover(null), 1000); }} className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-bold rounded-xl ${rowHover} ${textMain}`}>
                                    <Copy size={14} className="text-amber-500" /> {copying === u.email ? 'Copied!' : 'Copy Email'}
                                  </button>
                               </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className={`px-6 py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-6 ${darkMode ? 'border-gray-800' : 'border-gray-100'} bg-transparent`}>
          <div className={`text-xs font-bold ${textSub}`}>
            Page <span className={textMain}>{page}</span> of <span className={textMain}>{meta.totalPages}</span>
            <span className="mx-2 opacity-20">|</span>
            Showing <span className={textMain}>{Math.min((page - 1) * limit + 1, meta.total)}</span>-
            <span className={textMain}>{Math.min(page * limit, meta.total)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? 'hover:bg-slate-800 border-gray-700 text-gray-300' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            <div className="flex items-center gap-1.5 px-2">
              {[...Array(meta.totalPages)].map((_, i) => {
                const p = i + 1;
                const isCurrent = page === p;
                if (meta.totalPages > 5 && Math.abs(p - page) > 1 && p !== 1 && p !== meta.totalPages) {
                  if (Math.abs(p - page) === 2) return <span key={p} className="text-xs opacity-30">...</span>;
                  return null;
                }
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    disabled={loading}
                    className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${
                      isCurrent 
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 scale-110 z-10' 
                        : `${darkMode ? 'hover:bg-slate-800 text-slate-500' : 'hover:bg-slate-100 text-slate-600'}`
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages || loading}
              className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? 'hover:bg-slate-800 border-gray-700 text-gray-300' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in" onClick={() => setViewUser(null)}>
          <div className={`rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col border ${darkMode ? 'border-gray-800' : 'border-gray-100'} ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-8 py-6 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <div>
                <h3 className={`font-black text-xl ${textMain}`}>User Profile</h3>
                <p className="text-xs text-green-500 font-mono font-bold">REGISTRATION ID: #{viewUser.id}</p>
              </div>
              <button onClick={() => setViewUser(null)} className={`p-2.5 rounded-2xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={22} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              <div className={`flex items-center gap-6 p-6 rounded-[2rem] ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-black shadow-xl`}>
                  {viewUser.avatar}
                </div>
                <div>
                  <p className={`text-2xl font-black ${textMain}`}>{viewUser.name}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                       viewUser.role === 'ADMIN' ? 'bg-violet-500 text-white' : 'bg-green-500 text-white'
                    }`}>{viewUser.role}</span>
                    <span className={`text-xs font-bold ${textSub}`}>Joined {viewUser.joinDate}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Email Address', value: viewUser.email, icon: Mail },
                  { label: 'Contact Number', value: viewUser.phone, icon: Loader },
                  { label: 'City / Location', value: viewUser.city, icon: UserCheck },
                  { label: 'Total Contributions', value: `${viewUser.donationCount} Donation${viewUser.donationCount !== 1 ? 's' : ''}`, icon: Users },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center justify-between p-5 rounded-2xl border ${darkMode ? 'bg-slate-800/20 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-400'}`}>
                          <item.icon size={18} />
                       </div>
                       <div>
                          <p className={`text-[10px] font-black uppercase tracking-widest ${textSub}`}>{item.label}</p>
                          <p className={`text-sm font-bold ${textMain}`}>{item.value}</p>
                       </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                 <h4 className={`text-xs font-black uppercase tracking-widest ${textSub}`}>Activity Overview</h4>
                 <div className={`p-6 rounded-3xl border border-dashed ${darkMode ? 'border-gray-800' : 'border-gray-200'} text-center`}>
                    <p className={`text-sm font-medium ${textSub}`}>Detailed history is available in the donation logs.</p>
                 </div>
              </div>
            </div>
            
            <div className={`px-8 py-6 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'} flex gap-3`}>
               <button onClick={() => setViewUser(null)} className="flex-1 py-4 rounded-2xl bg-green-500 text-white font-black uppercase tracking-widest text-xs shadow-lg shadow-green-500/20 hover:scale-[1.02] transition-all">Close Profile</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
