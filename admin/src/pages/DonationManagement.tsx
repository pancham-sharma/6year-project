import { useState, useEffect } from 'react';
import { 
  Search, Filter, Eye, Edit3, CheckCircle, Trash2, 
  ChevronDown, X, Phone, MapPin, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getDonations } from '../api/donations';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { fetchAPI } from '../utils/api';

interface Props { darkMode: boolean; }

const CATEGORIES = ['Food', 'Clothes', 'Books', 'Monetary', 'Environment'];
const STATUSES = ['Pending', 'Scheduled', 'Completed', 'Cancelled'];

const statusColors: Record<string, string> = {
  Completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  Scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  Cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const catColors: Record<string, string> = {
  Food: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  Clothes: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300',
  Books: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300',
  Monetary: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  Environment: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
};

export default function DonationManagement({ darkMode }: Props) {
  const { searchQuery: globalSearch } = useSearch();
  const { showToast } = useToast();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [localSearch, setLocalSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search input
  const debouncedSearch = useDebounce(localSearch || globalSearch, 500);

  // Modals state
  const [viewItem, setViewItem] = useState<any | null>(null);
  const [editItem, setEditItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({ 
    status: '', assigned_team: '', scheduled_date: '', scheduled_time: '', notes: '' 
  });

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
    queryKey: ['donations', page, limit, debouncedSearch, filterCat],
    queryFn: () => getDonations(page, limit, debouncedSearch, filterCat),
    placeholderData: keepPreviousData,
  });

  useEffect(() => {
    if (isError) {
      showToast('Failed to fetch donations. Please try again.', 'error');
    }
  }, [isError, showToast]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= (data?.totalPages || 1)) {
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

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className={`rounded-2xl border p-4 ${card} shadow-sm`}>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl border ${inputBg}`}>
            <Search size={15} className={textSub} />
            <input 
              className="bg-transparent outline-none text-sm w-full" 
              placeholder="Search by donor, ID, or address..." 
              value={localSearch} 
              onChange={e => setLocalSearch(e.target.value)} 
            />
            {localSearch && <button onClick={() => setLocalSearch('')}><X size={13} className={textSub} /></button>}
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
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className={theadBg}>
                {['ID', 'Donor Name', 'Contact', 'Address', 'Category', 'Quantity', 'Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className={`px-4 py-4 text-xs font-bold uppercase tracking-wider ${textSub}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {isLoading ? (
                // Skeleton Loader
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className={`h-4 rounded ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}></div></td>
                    ))}
                  </tr>
                ))
              ) : data?.data.length === 0 ? (
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
                    <td className="px-4 py-4 font-mono text-xs font-bold text-green-600">#{d.id}</td>
                    <td className={`px-4 py-4 font-medium ${textMain}`}>{d.donorName}</td>
                    <td className={`px-4 py-4 ${textSub}`}>
                      <div className="flex items-center gap-1.5"><Phone size={12} /> {d.contact}</div>
                    </td>
                    <td className={`px-4 py-4 ${textSub}`}>
                      <div className="flex items-start gap-1"><MapPin size={12} className="mt-0.5" /> <span className="truncate max-w-[150px]">{d.address}</span></div>
                    </td>
                    <td className="px-4 py-4 min-w-[120px]">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap inline-block ${catColors[d.category] || 'bg-gray-100 text-gray-600'}`}>{d.category}</span>
                    </td>
                    <td className={`px-4 py-4 font-medium ${textMain} min-w-[150px]`}>{d.quantity}</td>
                    <td className={`px-4 py-4 ${textSub}`}>{d.date}</td>
                    <td className="px-4 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusColors[d.status] || 'bg-gray-100 text-gray-600'}`}>{d.status}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button title="View" onClick={() => setViewItem(d)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-500 transition-colors"><Eye size={16} /></button>
                        {d.status !== 'Completed' && (
                          <>
                            <button title="Edit" onClick={() => { setEditItem(d); setEditForm({ ...d }); }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-500 transition-colors"><Edit3 size={16} /></button>
                            <button title="Complete" onClick={() => markComplete(d.id)} className="p-1.5 rounded-lg hover:bg-green-50 text-green-500 transition-colors"><CheckCircle size={16} /></button>
                          </>
                        )}
                        <button title="Delete" onClick={() => deleteDon(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && data.totalPages > 1 && (
          <div className={`px-4 py-4 border-t ${divider} flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-50/50 dark:bg-gray-800/50`}>
            <p className={`text-xs ${textSub}`}>
              Showing <span className="font-bold text-green-500">{(page - 1) * limit + 1}</span> to <span className="font-bold text-green-500">{Math.min(page * limit, data.total)}</span> of <span className="font-bold">{data.total}</span> entries
            </p>
            
            <div className="flex items-center gap-1">
              <button 
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
                className={`p-2 rounded-lg border transition-all ${page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 hover:text-green-600'}`}
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, data.totalPages) }).map((_, i) => {
                  let pageNum = page;
                  if (page <= 3) pageNum = i + 1;
                  else if (page >= data.totalPages - 2) pageNum = data.totalPages - 4 + i;
                  else pageNum = page - 2 + i;
                  
                  if (pageNum <= 0 || pageNum > data.totalPages) return null;

                  return (
                    <button
                      key={pageNum}
                      onClick={() => handlePageChange(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === pageNum ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'border hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => handlePageChange(page + 1)}
                disabled={page === data.totalPages}
                className={`p-2 rounded-lg border transition-all ${page === data.totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50 hover:text-green-600'}`}
              >
                <ChevronRight size={16} />
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
              {[
                { label: 'Donor Name', value: viewItem.donorName },
                { label: 'Contact', value: viewItem.contact },
                { label: 'Full Address', value: viewItem.address },
                { label: 'Category', value: viewItem.category },
                { label: 'Quantity Description', value: viewItem.quantity },
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
