import { useState, useMemo } from 'react';
import { UserCheck, UserX, Mail, Phone, MapPin, Briefcase, Search, X } from 'lucide-react';
import CardSkeleton from '../components/CardSkeleton';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getVolunteersData, updateVolunteerStatus } from '../api/volunteers';
import { useSearch } from '../context/SearchContext';

interface Props { darkMode: boolean; }

export default function Volunteers({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'applications' | 'active'>('applications');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Rejected'>('All');

  // React Query
  const { data, isLoading: loading } = useQuery({
    queryKey: ['volunteers'],
    queryFn: getVolunteersData,
  });

  const applications = useMemo(() => {
    return (data?.applications || []).filter((a: any) => a.status !== 'Recycled');
  }, [data]);

  const activeVolunteers = useMemo(() => {
    const apps = (data?.applications || []).filter((a: any) => a.status !== 'Recycled');
    const users = data?.users || [];
    
    const roleVolunteers = users.filter((u: any) => u.role === 'VOLUNTEER');
    const approvedApps = apps.filter((a: any) => a.status === 'Approved');
    
    const combined = [...roleVolunteers];
    approvedApps.forEach((app: any) => {
      if (!combined.some((v: any) => v.email?.toLowerCase() === app.email?.toLowerCase())) {
        combined.push({
          id: `app-${app.id}`,
          username: app.name,
          email: app.email,
          city: app.city,
          role: 'VOLUNTEER',
          role_category: app.volunteering_role,
          message: app.message,
          isFromApp: true
        });
      }
    });
    return combined;
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

  const filteredApps = applications.filter((v: any) => {
    const g = searchQuery.toLowerCase();
    
    const matchesGlobal = !g || 
      v.name.toLowerCase().includes(g) || 
      v.email.toLowerCase().includes(g) || 
      v.volunteering_role.toLowerCase().includes(g) || 
      v.city.toLowerCase().includes(g);

    const matchesFilter = statusFilter === 'All' || v.status === statusFilter;
    return matchesGlobal && matchesFilter;
  });
  
  const filteredActive = activeVolunteers.filter((v: any) => {
    const g = searchQuery.toLowerCase();
    
    const matchesGlobal = !g || 
      v.username.toLowerCase().includes(g) || 
      v.email.toLowerCase().includes(g);
      
    return matchesGlobal;
  });


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-700';
      case 'Rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-indigo-100 text-indigo-700 border border-indigo-200';
    }
  };

  // No full page loader, use inline skeletons in the grid below

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
            filteredApps.length === 0 ? (
              <div className={`col-span-2 py-12 text-center ${textSub}`}>No applications found.</div>
            ) : (
              filteredApps.map((v: any) => (
                <div key={v.id} className={`rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-700/20' : 'border-gray-100 bg-gray-50/50'} p-5 transition-all hover:shadow-md`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-md">
                        {v.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className={`font-bold text-base ${textMain}`}>{v.name}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(v.status)}`}>
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
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-400"><Mail size={12} /> {v.email}</div>
                    <div className="flex items-center gap-2 text-gray-400"><Phone size={12} /> {v.phone}</div>
                    <div className="flex items-center gap-2 text-gray-400"><MapPin size={12} /> {v.city}</div>
                    <div className="flex items-center gap-2 font-medium text-green-500"><Briefcase size={12} /> {v.volunteering_role}</div>
                  </div>
                  {v.message && <p className={`mt-3 p-3 rounded-lg text-xs italic ${textSub} ${darkMode ? 'bg-gray-800' : 'bg-white'} border ${divider}`}>"{v.message}"</p>}
                </div>
              ))
            )
          ) : (
            filteredActive.length === 0 ? (
              <div className={`col-span-2 py-12 text-center ${textSub}`}>No active volunteers found.</div>
            ) : (
              filteredActive.map((v: any) => (
                <div key={v.id} className={`rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-700/20' : 'border-gray-100 bg-gray-50/50'} p-5 transition-all hover:shadow-md flex items-center gap-4`}>
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-md flex-shrink-0">
                    {v.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-bold text-base truncate ${textMain}`}>{v.username}</h3>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase whitespace-nowrap">Active</span>
                    </div>
                    <p className={`text-sm ${textSub} truncate`}>{v.email}</p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                       <span className={`text-[10px] text-gray-400 flex items-center gap-1 font-medium`}><MapPin size={10} /> {v.city || 'Not specified'}</span>
                       {v.role_category && (
                         <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><Briefcase size={10} /> {v.role_category}</span>
                       )}
                    </div>
                    {v.message && (
                      <p className={`mt-2 text-[10px] italic ${textSub} line-clamp-1`}>"{v.message}"</p>
                    )}
                  </div>
                  <button className={`p-2 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                    <Mail size={16} />
                  </button>
                </div>
              ))
            )
          )}
        </div>
      </div>
    </div>
  );
}
