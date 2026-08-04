import { useState, useMemo, useEffect } from 'react';
import { UserCheck, UserX, Mail, Phone, MapPin, Briefcase, X, Copy, ExternalLink, Check, CheckCircle2 } from 'lucide-react';
import CardSkeleton from '../components/CardSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVolunteersData, updateVolunteerStatus } from '../api/volunteers';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';

interface Props { darkMode: boolean; }

export default function Volunteers({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'applications' | 'active'>('applications');
  const [viewUser, setViewUser] = useState<any | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('Pending');
  const { showToast } = useToast();
  const [emailPopover, setEmailPopover] = useState<string | null>(null);
  const [copying, setCopying] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;

  // React Query
  const { data, isLoading: loading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: getVolunteersData,
  });

  const applications = useMemo(() => {
    return (data?.applications || []).filter((a: any) => a.status !== 'Recycled');
  }, [data]);

  const activeVolunteers = useMemo(() => {
    return (data?.active || []).map((v: any) => ({
      ...v,
      totalActivities: v.activities?.length || 0,
      lastActivity: v.activities?.length > 0 ? new Date(v.activities[0].date).toLocaleDateString() : 'N/A'
    }));
  }, [data]);

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateVolunteerStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteers'] });
    }
  });

  const updateStatus = async (app: any, status: string) => {
    statusMutation.mutate({ id: app.id, status });
  };

  const deleteApp = async (id: number) => {
    if (!window.confirm("Move this application to Recycle Bin?")) return;
    statusMutation.mutate({ id, status: 'Recycled' });
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-100';
  const tabActive = 'border-green-500 text-green-500';
  const tabInactive = 'border-transparent text-gray-500 hover:text-gray-700';

  const displayed = useMemo(() => {
    const list = activeTab === 'applications' 
      ? applications.filter((a: any) => statusFilter === 'All' || a.status === statusFilter)
      : activeVolunteers;
    
    return list.filter((v: any) => {
      const q = searchQuery.toLowerCase();
      const name = (v.username || v.name || v.first_name || '').toLowerCase();
      const email = (v.email || '').toLowerCase();
      const roles = (v.activities || []).map((a: any) => a.role.toLowerCase()).join(' ');
      return !q || name.includes(q) || email.includes(q) || roles.includes(q);
    });
  }, [activeTab, statusFilter, applications, activeVolunteers, searchQuery]);

  const totalPages = Math.ceil(displayed.length / limit) || 1;
  const paginatedData = displayed.slice((page - 1) * limit, page * limit);

  // Reset page on tab/filter change
  useEffect(() => { setPage(1); }, [activeTab, statusFilter, searchQuery]);


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-2xl border shadow-sm p-6 ${card}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-xl font-bold ${textMain}`}>Volunteer Management</h2>
            <p className={`text-sm ${textSub}`}>Review applications and manage active volunteers</p>
          </div>
          <div className="flex items-center gap-4">
             {activeTab === 'applications' && (
                <select 
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium border ${inputBg} outline-none focus:ring-2 focus:ring-green-500/20`}
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
             )}
             <div className="flex border-b border-gray-200">
               <button onClick={() => setActiveTab('applications')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'applications' ? tabActive : tabInactive}`}>Applications</button>
               <button onClick={() => setActiveTab('active')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'active' ? tabActive : tabInactive}`}>Active Volunteers</button>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} darkMode={darkMode} />)
          ) : activeTab === 'applications' ? (
            paginatedData.length === 0 ? (
              <div className={`col-span-2 py-12 text-center ${textSub}`}>No applications found.</div>
            ) : (
              paginatedData.map((v: any) => (
                <div key={v.id} className={`rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-700/20' : 'border-gray-100 bg-gray-50/50'} p-5 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={`font-bold text-sm ${textMain}`}>{v.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${getStatusColor(v.status)}`}>
                          {v.status}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.status === 'Pending' && (
                        <>
                          <button onClick={() => updateStatus(v, 'Approved')} className="p-2 rounded-lg bg-green-500 text-white hover:bg-green-600 shadow-sm"><UserCheck size={16} /></button>
                          <button onClick={() => updateStatus(v, 'Rejected')} className="p-2 rounded-lg bg-red-500 text-white hover:bg-red-600 shadow-sm"><UserX size={16} /></button>
                          <button title="Move to Recycle Bin" onClick={() => deleteApp(v.id)} className={`p-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}><X size={16} /></button>
                        </>
                      )}
                      {v.status !== 'Pending' && (
                         <button title="Move to Recycle Bin" onClick={() => deleteApp(v.id)} className={`p-2 rounded-lg ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><X size={16} /></button>
                      )}

                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-[11px]">
                    <div className="flex items-center gap-2 text-gray-400"><Mail size={11} className="flex-shrink-0" /> <span className="truncate">{v.email}</span></div>
                    <div className="flex items-center gap-2 text-gray-400"><Phone size={11} className="flex-shrink-0" /> <span>{v.phone}</span></div>
                    <div className="flex items-center gap-2 text-gray-400"><MapPin size={11} className="flex-shrink-0" /> <span>{v.city}</span></div>
                    <div className="flex items-center gap-2 font-bold text-green-500 uppercase tracking-tighter"><Briefcase size={11} className="flex-shrink-0" /> <span>{v.volunteering_role}</span></div>
                  </div>
                  {v.message && <p className={`mt-3 p-2.5 rounded-xl text-[10px] italic leading-relaxed ${textSub} ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${divider}`}>"{v.message}"</p>}
                </div>
              ))
            )
          ) : (
            paginatedData.length === 0 ? (
              <div className={`col-span-2 py-12 text-center ${textSub}`}>No active volunteers found.</div>
            ) : (
              paginatedData.map((v: any) => (
                <div key={v.id} className={`rounded-2xl border p-5 transition-all hover:shadow-lg ${darkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-white border-gray-100 shadow-sm'}`}>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-4">
                      {v.profile_picture ? (
                        <img src={v.profile_picture} alt={v.username} className="w-14 h-14 rounded-2xl object-cover shadow-md border-2 border-green-500/20" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                          {(v.username || v.first_name || '?')[0].toUpperCase()}
                        </div>
                      )}
                      <div>
                        <h3 className={`font-bold text-base ${textMain}`}>{v.first_name ? `${v.first_name} ${v.last_name || ''}` : v.username}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-500 text-white font-black uppercase tracking-widest shadow-sm shadow-green-500/20">Active</span>
                          <span className={`text-[10px] font-bold ${textSub} flex items-center gap-1`}><Briefcase size={10} /> {v.totalActivities} {v.totalActivities === 1 ? 'Activity' : 'Activities'}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 sm:self-start">
                       <button 
                        onClick={() => setEmailPopover(emailPopover === v.email ? null : v.email)}
                        className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'} border ${divider}`}
                      >
                        <Mail size={18} />
                      </button>
                      <button 
                        onClick={() => setViewUser(v)}
                        title="View Full Profile"
                        className={`p-2.5 rounded-xl transition-all ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-500'} border ${divider}`}
                      >
                        <ExternalLink size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${textSub} mb-1`}>Contact Email</p>
                      <p className={`text-sm font-medium ${textMain} truncate`}>{v.email}</p>
                    </div>
                    <div className={`p-3 rounded-xl border ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50/50 border-gray-100'}`}>
                      <p className={`text-[10px] uppercase font-bold tracking-wider ${textSub} mb-1`}>Location</p>
                      <p className={`text-sm font-medium ${textMain} truncate`}>{v.city || 'Not specified'}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${textSub}`}>Joined Activities</p>
                    <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                      {v.activities?.length > 0 ? (Array.from(new Set(v.activities.map((a: any) => a.role))) as string[]).map((role: string) => (
                        <span key={role} className="px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-tighter border border-green-500/20 flex items-center gap-2">
                          <Check size={10} /> {role}
                        </span>
                      )) : (
                        <span className={`text-xs italic ${textSub}`}>No approved activities yet</span>
                      )}
                    </div>
                  </div>

                  <div className={`mt-5 pt-4 border-t ${divider} flex items-center justify-between`}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-blue-500" />
                      <span className={`text-xs font-medium ${textMain}`}>{v.phone_number || 'No Phone'}</span>
                    </div>
                    <span className={`text-[10px] font-bold ${textSub}`}>Last Active: {v.lastActivity}</span>
                  </div>

                  {/* Email Popover logic remains same but anchored to the new button */}
                  {emailPopover === v.email && (
                      <div className="relative">
                        <div className="fixed inset-0 z-[60]" onClick={() => setEmailPopover(null)} />
                        <div className={`absolute right-0 bottom-full mb-2 w-48 rounded-xl border shadow-xl z-[70] overflow-hidden ${card} animate-fade-in`}>
                          <div className="p-1.5 space-y-1 text-left">
                            <button 
                              onClick={() => {
                                window.location.href = `mailto:${v.email}?subject=Volunteer Update from Seva Marg`;
                                setEmailPopover(null);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-800'}`}
                            >
                              <Mail size={12} className="text-blue-500" /> Direct Email
                            </button>
                            <button 
                              onClick={() => {
                                navigator.clipboard.writeText(v.email);
                                setCopying(v.email);
                                showToast("Email copied!", 'success');
                                setTimeout(() => { setCopying(null); setEmailPopover(null); }, 1500);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-800'}`}
                            >
                              {copying === v.email ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-amber-500" />} 
                              {copying === v.email ? 'Copied!' : 'Copy Email'}
                            </button>
                            <button 
                              onClick={() => {
                                window.open('https://mail.google.com/', '_blank');
                                setEmailPopover(null);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-white' : 'hover:bg-gray-50 text-gray-800'}`}
                            >
                              <ExternalLink size={12} className="text-red-500" /> Open Gmail
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ))
            )
          )}
        </div>

        {/* Pagination Footer */}
        {displayed.length > 0 && (
          <div className={`px-5 py-4 border-t flex flex-col lg:flex-row items-center justify-between gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`text-xs font-medium ${textSub}`}>
              Showing <span className={textMain}>{((page - 1) * limit) + 1}</span> to <span className={textMain}>{Math.min(page * limit, displayed.length)}</span> of <span className={textMain}>{displayed.length}</span> entries
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode ? 'hover:bg-gray-700 border-gray-700 text-gray-300' : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1.5 mx-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const p = i + 1;
                  const isCurrent = page === p;
                  
                  if (totalPages > 7) {
                    if (p !== 1 && p !== totalPages && Math.abs(p - page) > 1) {
                      if (p === 2 || p === totalPages - 1) return <span key={p} className="px-1 text-gray-400">...</span>;
                      return null;
                    }
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 rounded-2xl text-xs font-bold transition-all ${
                        isCurrent 
                          ? 'bg-[#10b981] text-white border-[3px] border-[#1e293b] shadow-lg scale-105' 
                          : `${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode ? 'hover:bg-gray-700 border-gray-700 text-gray-300' : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {viewUser && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setViewUser(null)}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-5 flex items-center justify-between border-b ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>Volunteer Profile</h3>
              <button onClick={() => setViewUser(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {/* Header Info */}
              <div className={`flex items-center gap-5 p-5 rounded-3xl ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
                {viewUser.profile_picture ? (
                  <img src={viewUser.profile_picture} alt={viewUser.username} className="w-20 h-20 rounded-2xl object-cover shadow-lg border-2 border-green-500/20" />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {(viewUser.username || viewUser.first_name || '?')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{viewUser.first_name ? `${viewUser.first_name} ${viewUser.last_name || ''}` : viewUser.username}</p>
                  <p className="text-sm text-green-500 font-mono">ID: #{viewUser.id}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-500 text-white shadow-sm">ACTIVE</span>
                    <span className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{viewUser.totalActivities || viewUser.activities?.length || 0} Activities</span>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Email Address', value: viewUser.email, icon: Mail },
                  { label: 'Phone Number', value: viewUser.phone_number || 'N/A', icon: Phone },
                  { label: 'City / Location', value: viewUser.city || 'N/A', icon: MapPin },
                  { label: 'Member Since', value: viewUser.date_joined ? new Date(viewUser.date_joined).toLocaleDateString() : 'N/A', icon: CheckCircle2 },
                ].map((item, idx) => (
                  <div key={idx} className={`flex items-center gap-4 p-4 rounded-2xl border ${darkMode ? 'border-gray-800 bg-gray-800/20' : 'border-gray-100 bg-white shadow-sm'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-50 text-gray-400'}`}>
                      <item.icon size={18} />
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{item.label}</p>
                      <p className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Activities List */}
              <div className="space-y-4">
                <h4 className={`text-sm font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Joined Activities</h4>
                <div className="flex flex-wrap gap-2">
                  {viewUser.activities?.length > 0 ? (Array.from(new Set(viewUser.activities.map((a: any) => a.role))) as string[]).map((role: string) => (
                    <div key={role} className="px-4 py-2 rounded-xl bg-green-500/10 text-green-500 text-xs font-bold border border-green-500/20 flex items-center gap-2">
                      <Briefcase size={14} /> {role}
                    </div>
                  )) : (
                    <p className={`text-sm italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No activities joined yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
