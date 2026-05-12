import { useState, useMemo } from 'react';
import { Package, TrendingDown, TrendingUp, Edit3, Save, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TableSkeleton from '../components/TableSkeleton';
import CardSkeleton from '../components/CardSkeleton';
import { getInventoryItems, updateInventoryItem } from '../api/inventory';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';
import { Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins } from 'lucide-react';


interface Props { darkMode: boolean; }

export default function Inventory({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [distributeModal, setDistributeModal] = useState<any | null>(null);
  const [distAmount, setDistAmount] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const limit = 10;


  const iconMap: Record<string, any> = {
    utensils: Utensils,
    bookopen: BookOpen,
    shirt: Shirt,
    banknote: Banknote,
    sprout: Sprout,
    heart: Heart,
    handheart: HandHeart,
    users: Users,
    treepine: TreePine,
    gift: Gift,
    shoppingbag: ShoppingBag,
    graduationcap: GraduationCap,
    coins: Coins,
    layoutgrid: LayoutGrid
  };

  const colorMap: Record<string, string> = {
    food: '#f59e0b',
    clothes: '#8b5cf6',
    books: '#3b82f6',
    money: '#10b981',
    monetary: '#10b981',
    trees: '#22c55e',
    environment: '#22c55e'
  };
  
  // React Query for Categories to get icons/units
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/api/donations/categories/'),
  });

  const categoriesList = useMemo(() => {
    const data = catData?.data || catData?.results || catData || [];
    return Array.isArray(data) ? data : [];
  }, [catData]);
  
  // React Query for Inventory Items
  const { data: invData, isLoading: invLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: getInventoryItems,
  });


  const inventory = useMemo(() => {
    const rawData = invData?.data || invData?.results || invData;
    const raw = Array.isArray(rawData) ? rawData : [];
    
    // Get valid active category names
    const activeCategoryNames = new Set(
      categoriesList
        .filter((c: any) => c.is_active !== false)
        .map((c: any) => c.name.toLowerCase())
    );

    return raw
      .filter((item: any) => item?.category && activeCategoryNames.has(item.category.toLowerCase()))
      .map((item: any) => {
        const catInfo = categoriesList.find((c: any) => c.name.toLowerCase() === item.category.toLowerCase());
        const iconKey = (catInfo?.icon_name || '').toLowerCase();
        
        return {
          id: item.id,
          category: item.category,
          totalReceived: item.quantity, 
          distributed: item.distributed || 0, 
          unit: item.unit_name || catInfo?.unit_name || 'units',
          color: colorMap[item.category.toLowerCase()] || '#10b981',
          icon: iconMap[iconKey] || LayoutGrid,
          lastUpdated: new Date(item.last_updated).toLocaleDateString('en-IN')
        };
      });
  }, [invData, categoriesList]);


  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateInventoryItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const loading = invLoading;

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-300' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const editInputBg = darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-800';

  const filtered = inventory.filter((i: any) => 
    !searchQuery || 
    i.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / limit) || 1;
  const paginatedData = filtered.slice((page - 1) * limit, page * limit);


  const startEdit = (item: any) => {
    setEditId(item.category);
    setEditValues({ totalReceived: item.totalReceived, distributed: item.distributed, id: item.id });
  };

  const saveEdit = async (_category: string) => {
    if (editValues.id) {
      if (editValues.distributed > editValues.totalReceived) {
        alert("Distributed quantity cannot exceed total received!");
        return;
      }
      updateMutation.mutate({ 
        id: editValues.id, 
        data: { 
          quantity: editValues.totalReceived,
          distributed: editValues.distributed
        } 
      });
    }
    setEditId(null);
  };

  const handleDistribute = async () => {
    if (!distributeModal || !distAmount || isNaN(+distAmount)) return;
    const amount = +distAmount;
    const item = inventory.find((i: any) => i.id === distributeModal.id);
    if (!item) return;

    if (item.distributed + amount > item.totalReceived) {
      alert("Cannot distribute more than available stock!");
      return;
    }

    updateMutation.mutate({ 
      id: item.id, 
      data: { 
        distributed: item.distributed + amount
      } 
    });
    setDistributeModal(null);
    setDistAmount('');
  };


  const totalItems = inventory.reduce((s: number, i: any) => s + i.totalReceived, 0);
  const totalDistributed = inventory.reduce((s: number, i: any) => s + i.distributed, 0);
  const totalRemaining = totalItems - totalDistributed;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Items Received', value: totalItems.toLocaleString(), icon: Package, color: 'from-green-400 to-emerald-500', trend: 'up' },
          { label: 'Total Distributed', value: totalDistributed.toLocaleString(), icon: TrendingDown, color: 'from-blue-400 to-indigo-500', trend: 'up' },
          { label: 'Remaining Stock', value: totalRemaining.toLocaleString(), icon: TrendingUp, color: 'from-amber-400 to-orange-500', trend: 'neutral' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`rounded-2xl border p-5 shadow-sm ${card}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>{c.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${textMain}`}>{c.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>



      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {loading ? (
           Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} darkMode={darkMode} />)
        ) : filtered.length === 0 ? (
           <div className={`col-span-full text-center py-10 ${textSub}`}>No categories matching your search.</div>
        ) : filtered.map((item: any) => {
          const pct = item.totalReceived > 0 ? Math.round((item.distributed / item.totalReceived) * 100) : 0;
          const remaining = item.totalReceived - item.distributed;
          return (
            <div key={item.category} className={`rounded-2xl border p-4 shadow-sm ${card} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-md`}>
                  <item.icon size={20} />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full`} style={{ backgroundColor: item.color + '20', color: item.color }}>
                  {pct}%
                </span>
              </div>
              <h3 className={`font-bold text-sm ${textMain}`}>{item.category}</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Total Received</span>
                  <span className={`font-semibold ${textMain}`}>{item.totalReceived.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Distributed</span>
                  <span className="font-semibold text-green-500">{item.distributed.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Remaining</span>
                  <span className="font-semibold text-amber-500">{remaining.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</span>
                </div>
              </div>
              <div className={`mt-3 h-1.5 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: item.color }} />
              </div>
              <p className={`text-xs ${textSub} mt-2`}>Updated {item.lastUpdated}</p>
            </div>
          );
        })}
      </div>

      {/* Inventory Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
          <div>
            <h2 className={`font-bold text-base ${textMain}`}>Inventory Details</h2>
            <p className={`text-xs ${textSub}`}>Manage stock levels and distribution</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={theadBg}>
                {['Category', 'Icon', 'Total Received', 'Distributed', 'Remaining', 'Distribution %', 'Last Updated', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub} whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-0">
                    <TableSkeleton columns={8} rows={5} darkMode={darkMode} />
                  </td>
                </tr>
              ) : paginatedData.length === 0 ? (
                 <tr>
                   <td colSpan={8} className={`py-8 text-center ${textSub}`}>No matching inventory items.</td>
                 </tr>
              ) : paginatedData.map((item: any) => {
                const pct = item.totalReceived > 0 ? Math.round((item.distributed / item.totalReceived) * 100) : 0;
                const remaining = item.totalReceived - item.distributed;
                const isEditing = editId === item.category;
                return (
                  <tr key={item.category} className={`transition-colors ${rowHover}`}>
                    <td className={`px-5 py-4 font-semibold ${textMain}`}>{item.category}</td>
                    <td className="px-5 py-4">
                      <div className={`w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500`}>
                        <item.icon size={16} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input type="number" className={`w-24 px-2 py-1 rounded-lg border text-sm ${editInputBg}`}
                          value={editValues.totalReceived} onChange={e => setEditValues((v: any) => ({ ...v, totalReceived: +e.target.value }))} />
                      ) : (
                        <span className={`font-medium ${textMain}`}>{item.totalReceived.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input type="number" className={`w-24 px-2 py-1 rounded-lg border text-sm ${editInputBg}`}
                          value={editValues.distributed} onChange={e => setEditValues((v: any) => ({ ...v, distributed: +e.target.value }))} />
                      ) : (
                        <span className="font-medium text-green-500">{item.distributed.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 font-medium text-amber-500`}>{remaining.toLocaleString()} {item.category.toLowerCase().includes('money') || item.category.toLowerCase().includes('monetary') ? '' : item.unit}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex-1 h-2 rounded-full min-w-[80px] ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div className="h-2 rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                        </div>
                        <span className={`text-xs font-semibold ${textMain}`}>{pct}%</span>
                      </div>
                    </td>
                    <td className={`px-5 py-4 ${textSub}`}>{item.lastUpdated}</td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <div className="flex gap-1.5">
                          <button onClick={() => saveEdit(item.category)} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors"><Save size={13} /></button>
                          <button onClick={() => setEditId(null)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <button onClick={() => { setDistributeModal(item); setDistAmount(''); }} 
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors shadow-sm`}>
                            Distribute
                          </button>

                          <button onClick={() => startEdit(item)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-amber-900/30 text-amber-400' : 'hover:bg-amber-50 text-amber-600'}`}><Edit3 size={14} /></button>
                        </div>
                      )}
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {filtered.length > 0 && (
          <div className={`px-5 py-4 border-t flex flex-col lg:flex-row items-center justify-between gap-4 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <div className={`text-xs font-medium ${textSub}`}>
              Showing <span className={textMain}>{((page - 1) * limit) + 1}</span> to <span className={textMain}>{Math.min(page * limit, filtered.length)}</span> of <span className={textMain}>{filtered.length}</span> items
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

      {/* Distribution Modal */}
      {distributeModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDistributeModal(null)}>
          <div className={`rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
            <div className={`px-5 py-4 flex items-center justify-between border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
              <h3 className={`font-bold text-sm ${textMain}`}>Distribute {distributeModal.category}</h3>
              <button onClick={() => setDistributeModal(null)} className={`p-1.5 rounded-lg ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}><X size={14} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} flex justify-between items-center`}>
                <div>
                  <p className={`text-xs ${textSub}`}>Available to Distribute</p>
                  <p className={`text-lg font-bold ${textMain}`}>{distributeModal.totalReceived - distributeModal.distributed} {distributeModal.category.toLowerCase().includes('money') || distributeModal.category.toLowerCase().includes('monetary') ? '' : distributeModal.unit}</p>

                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg`}>
                  <distributeModal.icon size={28} />
                </div>
              </div>
              <div>
                <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Amount to Distribute</label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${inputBg}`}>
                  <input 
                    type="number" 
                    autoFocus
                    className="bg-transparent outline-none flex-1 text-sm" 
                    placeholder={distributeModal.category.toLowerCase().includes('money') || distributeModal.category.toLowerCase().includes('monetary') ? 'Enter amount in ₹...' : `Enter amount in ${distributeModal.unit}...`}

                    value={distAmount}
                    onChange={e => setDistAmount(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleDistribute()}
                  />
                </div>
              </div>
            </div>
            <div className={`px-5 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex gap-3`}>
              <button onClick={() => setDistributeModal(null)} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
              <button onClick={handleDistribute} disabled={!distAmount || isNaN(+distAmount) || +distAmount <= 0}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-500/20">
                Confirm Distribution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
