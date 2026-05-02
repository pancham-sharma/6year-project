import { useState, useEffect } from 'react';
import { Package, TrendingDown, TrendingUp, Edit3, Save, X, Loader, Search } from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';


interface Props { darkMode: boolean; }

export default function Inventory({ darkMode }: Props) {
  const { searchQuery } = useSearch();
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  const [impactMetrics, setImpactMetrics] = useState<any[]>([]);
  const [distributeModal, setDistributeModal] = useState<any | null>(null);
  const [distAmount, setDistAmount] = useState('');


  const catColors: any = { Food: '#f59e0b', Clothes: '#8b5cf6', Books: '#3b82f6', Monetary: '#10b981', Environment: '#22c55e' };
  const catIcons: any = { Food: '🍲', Clothes: '👕', Books: '📚', Monetary: '💰', Environment: '🌱' };
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, impactRes] = await Promise.all([
          fetchAPI('/api/inventory/items/').catch(() => []),
          fetchAPI('/api/inventory/impact-metrics/').catch(() => [])
        ]);
        
        const impactData = impactRes.results || impactRes || [];
        setImpactMetrics(impactData);

        const data = (invRes.results || invRes || []).map((item: any) => {
          // Try to find a matching impact metric to use as 'distributed'
          // e.g. "Meals Served" for Food
          const impact = impactData.find((m: any) => 
            (item.category === 'Food' && m.name.toLowerCase().includes('meal')) ||
            (item.category === 'Clothes' && m.name.toLowerCase().includes('cloth')) ||
            (item.category === 'Books' && m.name.toLowerCase().includes('book')) ||
            (item.category === 'Environment' && m.name.toLowerCase().includes('tree'))
          );

          return {
            id: item.id,
            category: item.category,
            totalReceived: item.quantity, 
            distributed: item.distributed || 0, 
            unit: item.category === 'Food' ? 'kg' : item.category === 'Monetary' ? 'INR' : 'units',
            color: catColors[item.category] || '#9ca3af',
            icon: catIcons[item.category] || '📦',
            lastUpdated: new Date(item.last_updated).toLocaleDateString('en-IN')
          };
        });

        setInventory(data);
      } catch (err) {
        console.error("Failed to fetch inventory data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const editInputBg = darkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-gray-50 border-gray-300 text-gray-800';

  const combinedSearch = (searchQuery + ' ' + (editValues.search || '')).trim().toLowerCase();
  const filtered = inventory.filter(i => 
    !combinedSearch || 
    i.category.toLowerCase().includes(combinedSearch)
  );


  const startEdit = (item: any) => {
    setEditId(item.category);
    setEditValues({ totalReceived: item.totalReceived, distributed: item.distributed, id: item.id });
  };

  const saveEdit = async (category: string) => {
    try {
      if (editValues.id) {
        if (editValues.distributed > editValues.totalReceived) {
          alert("Distributed quantity cannot exceed total received!");
          return;
        }
        await fetchAPI(`/api/inventory/items/${editValues.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ 
            quantity: editValues.totalReceived,
            distributed: editValues.distributed
          })
        });
      }
      setInventory(prev => prev.map(i => i.category === category ? {
        ...i,
        totalReceived: editValues.totalReceived ?? i.totalReceived,
        distributed: editValues.distributed ?? i.distributed,
        lastUpdated: new Date().toLocaleDateString('en-IN'),
      } : i));

    } catch (err) {
      console.error("Failed to update inventory", err);
    }
    setEditId(null);
  };

  const handleDistribute = async () => {
    if (!distributeModal || !distAmount || isNaN(+distAmount)) return;
    const amount = +distAmount;
    const item = inventory.find(i => i.id === distributeModal.id);
    if (!item) return;

    if (item.distributed + amount > item.totalReceived) {
      alert("Cannot distribute more than available stock!");
      return;
    }

    try {
      await fetchAPI(`/api/inventory/items/${item.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ 
          distributed: item.distributed + amount
        })
      });
      setInventory(prev => prev.map(i => i.id === item.id ? {
        ...i,
        distributed: i.distributed + amount,
        lastUpdated: new Date().toLocaleDateString('en-IN'),
      } : i));
      setDistributeModal(null);
      setDistAmount('');
    } catch (err) {
      console.error("Failed to distribute items", err);
    }
  };


  const totalItems = inventory.reduce((s, i) => s + i.totalReceived, 0);
  const totalDistributed = inventory.reduce((s, i) => s + i.distributed, 0);
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

      {/* Search Bar */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-sm ${card} ${inputBg}`}>
        <Search size={15} className={textSub} />
        <input className="bg-transparent outline-none text-sm flex-1" placeholder="Filter inventory on this page..." value={editValues.search || ''} onChange={e => setEditValues((v: any) => ({ ...v, search: e.target.value }))} />
        {editValues.search && <button onClick={() => setEditValues((v: any) => ({ ...v, search: '' }))}><X size={13} className={textSub} /></button>}
      </div>


      {/* Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        {loading ? (
           <div className="col-span-full flex justify-center py-10"><Loader className="animate-spin text-green-500" /></div>
        ) : filtered.length === 0 ? (
           <div className={`col-span-full text-center py-10 ${textSub}`}>No categories matching your search.</div>
        ) : filtered.map(item => {
          const pct = item.totalReceived > 0 ? Math.round((item.distributed / item.totalReceived) * 100) : 0;
          const remaining = item.totalReceived - item.distributed;
          return (
            <div key={item.category} className={`rounded-2xl border p-4 shadow-sm ${card} hover:shadow-md transition-shadow`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-2xl">{item.icon}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full`} style={{ backgroundColor: item.color + '20', color: item.color }}>
                  {pct}%
                </span>
              </div>
              <h3 className={`font-bold text-sm ${textMain}`}>{item.category}</h3>
              <div className="mt-3 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Total Received</span>
                  <span className={`font-semibold ${textMain}`}>{item.totalReceived.toLocaleString()} {item.unit}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Distributed</span>
                  <span className="font-semibold text-green-500">{item.distributed.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className={textSub}>Remaining</span>
                  <span className="font-semibold text-amber-500">{remaining.toLocaleString()}</span>
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
              {filtered.length === 0 ? (
                 <tr>
                   <td colSpan={8} className={`py-8 text-center ${textSub}`}>No matching inventory items.</td>
                 </tr>
              ) : filtered.map(item => {
                const pct = item.totalReceived > 0 ? Math.round((item.distributed / item.totalReceived) * 100) : 0;
                const remaining = item.totalReceived - item.distributed;
                const isEditing = editId === item.category;
                return (
                  <tr key={item.category} className={`transition-colors ${rowHover}`}>
                    <td className={`px-5 py-4 font-semibold ${textMain}`}>{item.category}</td>
                    <td className="px-5 py-4 text-xl">{item.icon}</td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input type="number" className={`w-24 px-2 py-1 rounded-lg border text-sm ${editInputBg}`}
                          value={editValues.totalReceived} onChange={e => setEditValues((v: any) => ({ ...v, totalReceived: +e.target.value }))} />
                      ) : (
                        <span className={`font-medium ${textMain}`}>{item.totalReceived.toLocaleString()} {item.unit}</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {isEditing ? (
                        <input type="number" className={`w-24 px-2 py-1 rounded-lg border text-sm ${editInputBg}`}
                          value={editValues.distributed} onChange={e => setEditValues((v: any) => ({ ...v, distributed: +e.target.value }))} />
                      ) : (
                        <span className="font-medium text-green-500">{item.distributed.toLocaleString()}</span>
                      )}
                    </td>
                    <td className={`px-5 py-4 font-medium text-amber-500`}>{remaining.toLocaleString()}</td>
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
      </div>

      {/* Impact Metrics Section */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h2 className={`font-bold text-base ${textMain}`}>Operational Impact Metrics</h2>
          <p className={`text-xs ${textSub}`}>Key results tracked in database</p>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {impactMetrics.length === 0 ? (
            <div className={`col-span-full py-4 text-center ${textSub}`}>No impact metrics found in database.</div>
          ) : impactMetrics.map(m => (
            <div key={m.id} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
               <p className={`text-xs font-semibold uppercase tracking-wide ${textSub} mb-1`}>{m.name}</p>
               <p className={`text-2xl font-bold ${textMain}`}>{m.value.toLocaleString()}</p>
            </div>
          ))}
        </div>
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
                  <p className={`text-lg font-bold ${textMain}`}>{distributeModal.totalReceived - distributeModal.distributed} {distributeModal.unit}</p>
                </div>
                <span className="text-3xl">{distributeModal.icon}</span>
              </div>
              <div>
                <label className={`text-xs font-semibold ${textSub} mb-1 block`}>Amount to Distribute</label>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${inputBg}`}>
                  <input 
                    type="number" 
                    autoFocus
                    className="bg-transparent outline-none flex-1 text-sm" 
                    placeholder={`Enter amount in ${distributeModal.unit}...`}
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
