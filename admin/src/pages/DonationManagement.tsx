import { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit3, CheckCircle, Trash2, 
  ChevronDown, X, Phone, MapPin
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getDonations } from '../api/donations';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { fetchAPI } from '../utils/api';
import TableSkeleton from '../components/TableSkeleton';

interface Props { darkMode: boolean; }

const statusColors: Record<string, string> = {
  Completed: 'text-green-700 dark:text-green-400 font-extrabold',
  Scheduled: 'text-blue-700 dark:text-blue-400 font-extrabold',
  Pending: 'text-indigo-700 dark:text-indigo-400 font-extrabold',
  Cancelled: 'text-red-700 dark:text-red-400 font-extrabold',
};

const getStatusColor = (status: string) => {
  const s = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
  return statusColors[s] || 'text-gray-600';
};

const getCatColor = (cat: string) => {
  const c = cat?.toLowerCase() || '';
  if (c.includes('money') || c.includes('monetary')) return 'text-emerald-600 dark:text-emerald-400 font-bold';
  if (c.includes('food')) return 'text-amber-600 dark:text-amber-400 font-bold';
  if (c.includes('clothes')) return 'text-purple-600 dark:text-purple-400 font-bold';
  if (c.includes('books')) return 'text-blue-600 dark:text-blue-400 font-bold';
  if (c.includes('tree') || c.includes('environment')) return 'text-green-600 dark:text-green-400 font-bold';
  return 'text-gray-600 dark:text-gray-400 font-bold';
};

export default function DonationManagement({ darkMode }: Props) {
  const { searchQuery: globalSearch } = useSearch();
  const { showToast } = useToast();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10); 
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search input
  const debouncedSearch = useDebounce(globalSearch, 500);

  // Modals state
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({ 
    status: '', assigned_team: '', scheduled_date: '', scheduled_time: '', notes: '' 
  });

  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/api/donations/categories/'),
  });

  const CATEGORIES = (catData?.results || catData || []).map((c: any) => c.name);
  const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterCat, filterStatus]);

  // Fetch donations with React Query
  const { 
    data, 
    isLoading, 
    isError, 
    isPlaceholderData,
    refetch 
  } = useQuery({
    queryKey: ['donations', page, limit, debouncedSearch, filterCat, filterStatus],
    queryFn: () => getDonations(page, limit, debouncedSearch, filterCat, filterStatus),
    placeholderData: keepPreviousData,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });



  useEffect(() => {
    if (isError) {
      showToast('Failed to fetch donations. Please try again.', 'error');
    }
  }, [isError, showToast]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.meta?.totalPages || 1)) {
      setPage(newPage);
    }
  };

  const markComplete = async (id: string) => {
    try {
      await fetchAPI(`/api/donations/${id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' })
      });
      showToast('Donation marked as completed!', 'success');
      refetch();
    } catch (err) {
      showToast('Failed to update status.', 'error');
    }
  };

  const handleSaveEdit = async () => {
    if (!editItem) return;
    try {
      const payload = {
        status: editForm.status,
        pickup_details: {
          assigned_team: editForm.assigned_team,
          scheduled_date: editForm.scheduled_date || null,
          scheduled_time: editForm.scheduled_time || null,
        }
      };

      await fetchAPI(`/api/donations/${editItem.id}/`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });

      showToast('Donation updated successfully!', 'success');
      setEditItem(null);
      refetch();
    } catch (err) {
      showToast('Failed to save changes.', 'error');
    }
  };

  const deleteDon = async (id: string) => {
    if (!window.confirm("Move this donation to Recycle Bin?")) return;
    try {
      await fetchAPI(`/api/donations/${id}/`, { 
        method: 'PATCH',
        body: JSON.stringify({ status: 'Recycled' })
      });
      showToast('Moved to recycle bin.', 'info');
      refetch();
    } catch (err) {
      showToast('Failed to delete.', 'error');
    }
  };

  // Styles
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const selectBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-700';
  const modalBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const greenText = darkMode ? 'text-green-400' : 'text-green-600';

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className={`rounded-2xl border p-4 ${card} shadow-sm`}>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1">
            <h2 className={`text-lg font-bold ${textMain} flex items-center gap-3`}>
              Donation Management
            </h2>
          </div>
          
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors
              ${showFilters ? 'bg-green-500 border-green-500 text-white' : (darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-white border-gray-200 text-gray-600')}`}
          >
            <Filter size={14} />
            Filters
            <ChevronDown size={12} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-dashed border-gray-200">
            <div>
              <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Category</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${selectBg}`} value={filterCat} onChange={e => setFilterCat(e.target.value)}>
                <option value="All">All Categories</option>
                {CATEGORIES.map((c: string) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Status</label>
              <select className={`w-full px-3 py-2 rounded-xl border text-sm outline-none ${selectBg}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="All">All Statuses</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className={theadBg}>
                {['ID', 'Donor Name', 'Email', 'Contact', 'Address', 'Category', 'Quantity', 'Description', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${textSub}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-0">
                    <TableSkeleton columns={9} rows={limit} darkMode={darkMode} />
                  </td>
                </tr>
              ) : data?.data?.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-4 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <Search size={24} className={textSub} />
                      </div>
                      <p className={`font-semibold ${textMain}`}>No donations found</p>
                      <p className={`text-xs ${textSub}`}>Try adjusting your filters or search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data?.data.map((d: any) => (
                  <tr key={d.id} className={`transition-colors ${rowHover} ${isPlaceholderData ? 'opacity-50' : ''}`}>
                    <td className={`px-5 py-3.5 font-mono text-xs font-bold ${greenText}`}>#{d.id}</td>
                    <td className={`px-4 py-4 font-medium ${textMain}`}>{d.donorName}</td>
                    <td className={`px-4 py-4 text-[11px] font-medium ${textSub}`}>{d.donorEmail}</td>
                    <td className={`px-4 py-4 ${textSub}`}>
                      <div className="flex items-center gap-1.5"><Phone size={12} /> {d.contact}</div>
                    </td>
                    <td className={`px-4 py-4 ${textSub}`}>
                      <div className="flex items-start gap-1"><MapPin size={12} className="mt-0.5" /> <span className="truncate max-w-[120px]">{d.address.split(',')[0]}</span></div>
                    </td>
                    <td className="px-4 py-4 min-w-[120px]">
                      <span style={{ backgroundColor: 'var(--color-gray-100)' }} className={`px-2.5 py-1 rounded-full text-[10px] uppercase whitespace-nowrap inline-block ${getCatColor(d.category)}`}>{d.category}</span>
                    </td>
                    <td className={`px-4 py-4 font-medium ${textMain}`}>
                      <div className="flex flex-col">
                        <span className="text-[13px]">{d.quantity}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${textSub}`}>{d.unit || 'Units'}</span>
                      </div>
                    </td>
                    <td className={`px-4 py-4 ${textSub} max-w-[150px]`}>
                      <p className="text-xs line-clamp-2" title={d.description}>{d.description || 'N/A'}</p>
                    </td>
                    <td className={`px-4 py-4 ${textSub}`}>{d.date}</td>
                    <td className="px-4 py-4">
                      <span style={{ backgroundColor: 'var(--color-gray-100)' }} className={`px-2.5 py-1 rounded-full text-[10px] uppercase ${getStatusColor(d.status)}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        <button title="View" onClick={() => setViewItem(d)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20' : 'bg-blue-50 border-blue-100 text-blue-600 hover:bg-blue-100'}`}><Eye size={15} /></button>
                        {d.status !== 'Completed' && (
                          <>
                            <button title="Edit" onClick={() => { setEditItem(d); setEditForm({ ...d }); }} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20' : 'bg-amber-50 border-amber-100 text-amber-600 hover:bg-amber-100'}`}><Edit3 size={15} /></button>
                            <button title="Complete" onClick={() => markComplete(d.id)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20' : 'bg-green-50 border-green-100 text-green-600 hover:bg-green-100'}`}><CheckCircle size={15} /></button>
                          </>
                        )}
                        <button title="Delete" onClick={() => deleteDon(d.id)} className={`p-2 rounded-xl border transition-all ${darkMode ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20' : 'bg-red-50 border-red-100 text-red-600 hover:bg-red-100'}`}><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && (
          <div className={`px-5 py-4 border-t flex flex-col lg:flex-row items-center justify-between gap-4 ${divider}`}>
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className={`text-xs font-medium ${textSub}`}>
                Showing <span className={textMain}>{((page - 1) * limit) + 1}</span> to <span className={textMain}>{Math.min(page * limit, data?.meta?.total || 0)}</span> of <span className={textMain}>{data?.meta?.total || 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || isPlaceholderData}
                className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                  darkMode ? 'hover:bg-gray-700 border-gray-700 text-gray-300' : 'hover:bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1.5 mx-2">
                {Array.from({ length: data?.meta?.totalPages || 1 }).map((_, i) => {
                  const p = i + 1;
                  const isCurrent = page === p;
                  
                  // Show current, first, last, and 1-2 pages around current
                  const isFirst = p === 1;
                  const isLast = p === data?.meta?.totalPages;
                  const isNear = Math.abs(p - page) <= 1;
                  
                  if (!isFirst && !isLast && !isNear) {
                    if (p === 2 || p === data?.meta?.totalPages - 1) return <span key={p} className="px-1 text-gray-400">...</span>;
                    return null;
                  }

                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-10 h-10 rounded-2xl text-sm font-bold transition-all ${
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
                onClick={() => handlePageChange(page + 1)}
                disabled={page === (data?.meta?.totalPages || 1) || isPlaceholderData}
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

      {/* Modals (View & Edit) - Kept mostly same but using refetch() */}
      {viewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setViewItem(null)}>
           <div className={`rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <div>
                <h3 className={`font-bold text-base ${textMain}`}>Donation Details</h3>
                <p className="text-xs text-green-500 font-mono font-semibold">DON-{viewItem.id}</p>
              </div>
              <button onClick={() => setViewItem(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {viewItem.image && (
                <div className="mb-6 rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-700 shadow-sm">
                  <img 
                    src={viewItem.image} 
                    alt="Donated Item" 
                    className="w-full h-64 object-cover"
                    onError={(e) => e.currentTarget.style.display = 'none'}
                  />
                </div>
              )}
              {[
                { label: 'Donor Name', value: viewItem.donorName },
                { label: 'Contact', value: viewItem.contact },
                { label: 'Full Address', value: viewItem.address },
                { label: 'Category', value: viewItem.category },
                { label: 'Quantity', value: `${viewItem.quantity} ${viewItem.unit || 'Units'}` },
                { label: 'Quantity Description', value: viewItem.quantity_description || viewItem.quantity },
                { label: 'Submission Date', value: viewItem.date },
                { label: 'Current Status', value: viewItem.status },
              ].map(item => (
                <div key={item.label} className={`flex justify-between items-start gap-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-50'}`}>
                  <span className={`text-sm font-semibold ${textSub} min-w-[140px]`}>{item.label}</span>
                  <span className={`text-sm text-right ${textMain}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEditItem(null)}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-md overflow-hidden ${modalBg}`} onClick={e => e.stopPropagation()}>
            <div className={`px-6 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-base ${textMain}`}>Edit Donation</h3>
              <button onClick={() => setEditItem(null)} className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={16} /></button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Status</label>
                <select 
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${selectBg}`}
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">Assign Team</label>
                <input 
                  className={`w-full px-4 py-3 rounded-xl border outline-none ${inputBg}`}
                  value={editForm.assigned_team}
                  onChange={e => setEditForm({ ...editForm, assigned_team: e.target.value })}
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t flex justify-end gap-3">
              <button onClick={() => setEditItem(null)} className="px-4 py-2 text-sm font-bold text-gray-400">Cancel</button>
              <button onClick={handleSaveEdit} className="px-6 py-2 rounded-xl text-sm font-bold bg-green-500 text-white">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
