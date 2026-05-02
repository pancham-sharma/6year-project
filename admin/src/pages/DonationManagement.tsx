import { useState, useEffect } from 'react';
import { Search, Filter, Eye, Edit3, CheckCircle, Trash2, ChevronDown, X, Phone, MapPin, Loader, Download } from 'lucide-react';
import { donations as mockDonations, Donation, DonationStatus, DonationCategory } from '../data/mockData';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';

interface Props { darkMode: boolean; }

const CATEGORIES: DonationCategory[] = ['Food', 'Clothes', 'Books', 'Monetary', 'Environment'];
const STATUSES: DonationStatus[] = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];
const CITIES = ['All', 'Mumbai', 'Delhi', 'Bangalore', 'Kolkata', 'Chennai', 'Pune', 'Hyderabad', 'Ahmedabad', 'Jaipur'];


const statusColors: Record<DonationStatus, string> = {
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Scheduled: 'bg-blue-100 text-blue-700',
  Pending: 'bg-amber-100 text-amber-700',
  Cancelled: 'bg-red-100 text-red-700',
};

const catColors: Record<DonationCategory, string> = {
  Food: 'bg-amber-50 text-amber-700',
  Clothes: 'bg-purple-50 text-purple-700',
  Books: 'bg-blue-50 text-blue-700',
  Monetary: 'bg-emerald-50 text-emerald-700',
  Environment: 'bg-green-50 text-green-700',
};

export default function DonationManagement({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const [localSearch, setLocalSearch] = useState('');

  const [filterCat, setFilterCat] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCity, setFilterCity] = useState<string>('All');
  const [localDonations, setLocalDonations] = useState<any[]>([]);
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDonations = async () => {
      try {
        const data = await fetchAPI('/api/donations/');
        // Mapping Django backend fields to frontend UI structure
        const formatted = (data.results || data).map((d: any) => ({
          id: d.id.toString(),
          donorName: d.donor,
          contact: 'N/A', // Phone number not included in serializer
          address: d.pickup_details ? d.pickup_details.full_address : 'N/A',
          city: d.pickup_details ? d.pickup_details.city : 'N/A',
          category: d.category,
          quantity: d.quantity_description,
          date: new Date(d.timestamp).toLocaleDateString(),
          status: d.status,
          pickupTime: d.pickup_details ? d.pickup_details.scheduled_time : '',
          assignedTo: d.pickup_details ? d.pickup_details.volunteer : null,
          notes: ''
        }));
        setLocalDonations(formatted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDonations();
  }, []);

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const modalBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const selectBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700';

  const filtered = localDonations.filter(d => {
    const g = searchQuery.toLowerCase();
    const l = localSearch.toLowerCase();
    
    // Global search matches
    const matchesGlobal = !g || 
      d.donorName.toLowerCase().includes(g) || 
      d.id.toString().toLowerCase().includes(g) || 
      d.address.toLowerCase().includes(g) || 
      d.category.toLowerCase().includes(g);
      
    // Local search matches
    const matchesLocal = !l || 
      d.donorName.toLowerCase().includes(l) || 
      d.id.toString().toLowerCase().includes(l) || 
      d.address.toLowerCase().includes(l) || 
      d.category.toLowerCase().includes(l);

    const matchCat = filterCat === 'All' || d.category === filterCat;
    const matchStatus = filterStatus === 'All' || d.status === filterStatus;
    const matchCity = filterCity === 'All' || d.city === filterCity;
    
    return matchesGlobal && matchesLocal && matchCat && matchStatus && matchCity;
  });


  const markComplete = async (id: string) => {
    try {
      await fetchAPI(`/api/donations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' })
      });
      
      const don = localDonations.find(d => d.id === id);
      if (don) {
        await fetchAPI('/api/chat/notifications/', {
          method: 'POST',
          body: JSON.stringify({
            user: don.user_id, // Assuming user_id is in the object
            title: "Donation Completed! ✅",
            message: `Your donation #${id} has been marked as completed. Thank you for your contribution!`,
            type: 'donation'
          })
        }).catch(() => {});
      }

      setLocalDonations(prev => prev.map(d => d.id === id ? { ...d, status: 'Completed' as DonationStatus } : d));
    } catch (err) {
      console.error("Failed to mark donation as complete", err);
    }
  };


  const deleteDon = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this donation record?")) return;
    try {
      await fetchAPI(`/api/donations/${id}/`, { method: 'DELETE' });
      setLocalDonations(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      console.error("Failed to delete donation", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className={`rounded-2xl border p-4 ${card} shadow-sm`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border ${inputBg}`}>
            <Search size={15} className={textSub} />
            <input className="bg-transparent outline-none text-sm w-full" placeholder="Filter donations on this page..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} />
            {localSearch && <button onClick={() => setLocalSearch('')}><X size={13} className={textSub} /></button>}
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
              ${showFilters ? (darkMode ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-green-50 border-green-300 text-green-700') : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600')}`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-dashed border-gray-200">
            <div>
              <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Category</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${selectBg}`} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Status</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${selectBg}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Location</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${selectBg}`} value={filterCity} onChange={e => setFilterCity(e.target.value)}>
                {CITIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Count */}
      <div className="flex items-center justify-between">
        <p className={`text-sm ${textSub}`}>Showing <span className={`font-semibold ${textMain}`}>{filtered.length}</span> of <span className="font-semibold">{localDonations.length}</span> donations</p>
        {(filterCat !== 'All' || filterStatus !== 'All' || filterCity !== 'All' || localSearch) && (
          <button onClick={() => { setLocalSearch(''); setFilterCat('All'); setFilterStatus('All'); setFilterCity('All'); }} className="text-xs text-green-500 font-semibold hover:underline">Clear filters</button>
        )}

      </div>

      {/* Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={theadBg}>
                {['ID', 'Donor Name', 'Contact', 'Address', 'Category', 'Quantity', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub} whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {loading ? (
                <tr>
                  <td colSpan={9} className={`py-16 text-center ${textSub} text-sm`}>Loading donations from database...</td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className={`py-16 text-center ${textSub} text-sm`}>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-4xl">🔍</span>
                      <span>No donations found in database</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.map(d => (
                <tr key={d.id} className={`transition-colors ${rowHover}`}>
                  <td className={`px-4 py-3.5 font-mono text-xs font-semibold text-green-600`}>{d.id}</td>
                  <td className={`px-4 py-3.5 font-medium ${textMain} whitespace-nowrap`}>{d.donorName}</td>
                  <td className={`px-4 py-3.5 ${textSub} whitespace-nowrap`}>
                    <div className="flex items-center gap-1.5">
                      <Phone size={11} />
                      {d.contact}
                    </div>
                  </td>
                  <td className={`px-4 py-3.5 ${textSub} max-w-[160px]`}>
                    <div className="flex items-start gap-1">
                      <MapPin size={11} className="mt-0.5 flex-shrink-0" />
                      <span className="truncate">{d.address}, {d.city}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${catColors[d.category as keyof typeof catColors] || 'bg-gray-100 text-gray-700'}`}>{d.category}</span>
                  </td>
                  <td className={`px-4 py-3.5 ${textMain} font-medium`}>{d.quantity}</td>
                  <td className={`px-4 py-3.5 ${textSub} whitespace-nowrap`}>{d.date}</td>
                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[d.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button title="View" onClick={() => setViewItem(d)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-blue-900/30 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}><Eye size={14} /></button>
                      <button title="Edit" onClick={() => setEditItem(d)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-amber-900/30 text-amber-400' : 'hover:bg-amber-50 text-amber-600'}`}><Edit3 size={14} /></button>
                      {d.status !== 'Completed' && (
                        <button title="Mark Complete" onClick={() => markComplete(d.id)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-green-900/30 text-green-400' : 'hover:bg-green-50 text-green-600'}`}><CheckCircle size={14} /></button>
                      )}
                      <button title="Delete" onClick={() => deleteDon(d.id)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Modal */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <h3 className={`font-bold text-base ${textMain}`}>Donation Details</h3>
                <p className="text-xs text-green-500 font-mono font-semibold">{viewItem.id}</p>
              </div>
              <button onClick={() => setViewItem(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Donor Name', value: viewItem.donorName },
                { label: 'Contact', value: viewItem.contact },
                { label: 'Address', value: `${viewItem.address}, ${viewItem.city}` },
                { label: 'Category', value: viewItem.category },
                { label: 'Quantity', value: viewItem.quantity },
                { label: 'Date', value: viewItem.date },
                { label: 'Status', value: viewItem.status },
                { label: 'Pickup Time', value: viewItem.pickupTime || 'Not scheduled' },
                { label: 'Assigned To', value: viewItem.assignedTo || 'Unassigned' },
                { label: 'Notes', value: viewItem.notes || 'None' },
              ].map(item => (
                <div key={item.label} className={`flex justify-between items-start gap-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                  <span className={`text-sm font-semibold ${textSub}`}>{item.label}</span>
                  <span className={`text-sm text-right ${textMain}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-end gap-3`}>
              <button onClick={() => setViewItem(null)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Close</button>
              {viewItem.status !== 'Completed' && (
                <button onClick={() => { markComplete(viewItem.id); setViewItem(null); }} className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors">Mark Completed</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-base ${textMain}`}>Edit Donation</h3>
              <button onClick={() => setEditItem(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4">
              {['Status', 'Assigned To', 'Pickup Time', 'Notes'].map(field => (
                <div key={field}>
                  <label className={`text-xs font-semibold ${textSub} mb-1 block`}>{field}</label>
                  {field === 'Status' ? (
                    <select className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${selectBg}`} defaultValue={editItem.status}>
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input className={`w-full px-3 py-2.5 rounded-xl border text-sm outline-none ${inputBg}`}
                      defaultValue={field === 'Assigned To' ? editItem.assignedTo : field === 'Pickup Time' ? editItem.pickupTime : editItem.notes} />
                  )}
                </div>
              ))}
            </div>
            <div className={`px-6 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex justify-end gap-3`}>
              <button onClick={() => setEditItem(null)} className={`px-4 py-2 rounded-xl text-sm font-medium ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Cancel</button>
              <button onClick={() => setEditItem(null)} className="px-4 py-2 rounded-xl text-sm font-medium bg-green-500 text-white border border-white/20 hover:bg-green-600 transition-all shadow-md">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
