import { useState, useEffect } from 'react';
import { Truck, Clock, CheckCircle2, Calendar, User, MapPin, X, Loader, Search } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';


interface Props { darkMode: boolean; }

const teams = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta'];
const timeSlots = ['9:00 AM', '10:00 AM', '11:00 AM', '11:30 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];

export default function PickupManagement({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const [localDonations, setLocalDonations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignModal, setAssignModal] = useState<any | null>(null);
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');


  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const selectBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700';
  const tabActive = darkMode ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-green-50 text-green-700 border-green-300';
  const tabInactive = darkMode ? 'text-gray-400 border-transparent hover:bg-gray-700' : 'text-gray-500 border-transparent hover:bg-gray-50';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';

  useEffect(() => {
    const fetchPickups = async () => {
      try {
        const res = await fetchAPI('/api/donations/');
        const rawData = Array.isArray(res) ? res : (res.data || res.results || []);
        const data = rawData.map((d: any) => ({
          id: d.id,
          donorName: d.donor,
          status: d.status,
          address: d.pickup_details?.full_address || 'No address',
          city: d.pickup_details?.city || 'Unknown',
          date: new Date(d.timestamp).toLocaleDateString('en-IN'),

          pickupTime: d.pickup_details?.scheduled_time || '',
          assignedTo: d.pickup_details?.assigned_team || d.pickup_details?.volunteer || null,
          category: d.category,
          quantity: d.quantity_description
        }));
        setLocalDonations(data);
      } catch (err) {
        console.error("Failed to load pickups", err);
      } finally {
        setLoading(false);
      }
    };
    fetchPickups();
  }, []);

  const upcoming = localDonations.filter(d => d.status === 'Pending' || d.status === 'Scheduled');
  const completed = localDonations.filter(d => d.status === 'Completed');
  const filtered = (activeTab === 'upcoming' ? upcoming : completed).filter(p => {
    const q = searchQuery.toLowerCase();
    return !q || p.donorName.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || p.id.toString().includes(q);
  });

  const displayed = filtered;

  const statusColors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-none',
    Scheduled: 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-none',
    Pending: 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-none',
    Cancelled: 'bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-none',
  };

  const getStatusColor = (status: string) => {
    const s = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
    return statusColors[s] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  const assignPickup = async () => {
    if (!assignModal || !selectedTeam || !selectedTime) return;
    
    // Convert 12h format (e.g. 9:00 AM) to 24h (09:00:00) for Django TimeField
    let [time, modifier] = selectedTime.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = (parseInt(hours, 10) + 12).toString();
    const formattedTime = `${hours.padStart(2, '0')}:${minutes}:00`;

    try {
      await fetchAPI(`/api/donations/${assignModal.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          status: 'Scheduled',
          pickup_details: {
            scheduled_time: formattedTime,
            assigned_team: selectedTeam
          }
        })
      });
      setLocalDonations(prev => prev.map(d =>
        d.id === assignModal.id ? { ...d, assignedTo: selectedTeam, pickupTime: selectedTime, status: 'Scheduled' } : d
      ));
    } catch (err) {
      console.error("Failed to assign pickup", err);
    }
    setAssignModal(null); setSelectedTeam(''); setSelectedTime('');
  };

  const markComplete = async (id: string) => {
    try {
      await fetchAPI(`/api/donations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' })
      });
      setLocalDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'Completed' } : d));
    } catch (err) {
      console.error("Failed to complete pickup", err);
    }
  };

  const summaryStats = [
    { label: 'Total Pickups', value: localDonations.length, icon: Truck, color: 'from-green-400 to-emerald-500' },
    { label: 'Pending', value: localDonations.filter(d => d.status === 'Pending').length, icon: Clock, color: 'from-amber-400 to-orange-500' },
    { label: 'Scheduled', value: localDonations.filter(d => d.status === 'Scheduled').length, icon: Calendar, color: 'from-blue-400 to-indigo-500' },
    { label: 'Completed', value: localDonations.filter(d => d.status === 'Completed').length, icon: CheckCircle2, color: 'from-violet-400 to-purple-500' },
  ];

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryStats.map((s, i) => {
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

      {/* Tabs + Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className={`font-bold text-base ${textMain}`}>Pickup Schedule</h2>
            <div className="flex border rounded-xl overflow-hidden text-sm">
              {(['upcoming', 'completed'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 border capitalize font-medium transition-colors ${activeTab === tab ? tabActive : tabInactive}`}>
                  {tab} ({tab === 'upcoming' ? upcoming.length : completed.length})
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Pickup Cards */}
        <div className="p-5 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayed.length === 0 ? (
            <div className={`col-span-3 py-16 text-center ${textSub}`}>
              <div className="text-4xl mb-2">📦</div>
              <p>No {activeTab} pickups in database</p>
            </div>
          ) : displayed.map(d => (
            <div key={d.id} className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-100'}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className={`font-bold text-sm ${textMain}`}>{d.donorName}</p>
                  <p className="text-xs font-mono text-green-500">#{d.id}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap inline-block ${getStatusColor(d.status)}`}>{d.status}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                  <MapPin size={11} className="text-green-500 flex-shrink-0" />
                  {d.address}, {d.city}
                </div>
                <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                  <Calendar size={11} className="text-blue-500 flex-shrink-0" />
                  {d.date}
                </div>
                {d.pickupTime && (
                  <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                    <Clock size={11} className="text-amber-500 flex-shrink-0" />
                    {d.pickupTime}
                  </div>
                )}
                {d.assignedTo && (
                  <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                    <User size={11} className="text-purple-500 flex-shrink-0" />
                    {d.assignedTo}
                  </div>
                )}
                <div className={`flex items-center gap-2 text-xs ${textSub}`}>
                  <span className="text-amber-500">📦</span>
                  {d.category} · {d.quantity}
                </div>
              </div>

              <div className="flex gap-2">
                {d.status !== 'Completed' && (
                  <>
                    <button onClick={() => { setAssignModal(d); setSelectedTeam(d.assignedTo || ''); setSelectedTime(d.pickupTime || ''); }}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                      <User size={11} /> Assign
                    </button>
                    <button onClick={() => markComplete(d.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors">
                      <CheckCircle2 size={11} /> Complete
                    </button>
                  </>
                )}
                {d.status === 'Completed' && (
                  <div className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium ${darkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-50 text-green-600'}`}>
                    <CheckCircle2 size={11} /> Done
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Assign Modal */}
        {assignModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAssignModal(null)}>
            <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
              <div className={`px-5 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
                <h3 className={`font-bold text-sm ${textMain}`}>Assign Pickup</h3>
                <button onClick={() => setAssignModal(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={14} /></button>
              </div>
              <div className="p-5 space-y-4">
                <div className={`p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <p className={`text-sm font-semibold ${textMain}`}>{assignModal.donorName}</p>
                  <p className={`text-xs ${textSub}`}>{assignModal.address}, {assignModal.city}</p>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Assign Team</label>
                  <select className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${selectBg}`} value={selectedTeam} onChange={e => setSelectedTeam(e.target.value)}>
                    <option value="">Select team...</option>
                    {teams.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Pickup Time</label>
                  <select className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${selectBg}`} value={selectedTime} onChange={e => setSelectedTime(e.target.value)}>
                    <option value="">Select time slot...</option>
                    {timeSlots.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>
              <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex gap-3`}>
                <button onClick={() => setAssignModal(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                <button onClick={assignPickup} disabled={!selectedTeam || !selectedTime}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                  Confirm Assignment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
