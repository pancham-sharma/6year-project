import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Heart, DollarSign, Clock, CheckCircle2, TrendingUp, ArrowUpRight, RefreshCw, Utensils, BookOpen, Shirt, Banknote, Sprout, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins, LayoutGrid } from 'lucide-react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { getDashboardData } from '../api/dashboard';
import { fetchAPI } from '../utils/api';

// Skeleton components for ultra-fast perceived performance
const CardSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 p-5 bg-white animate-pulse">
    <div className="flex justify-between">
      <div className="space-y-3 flex-1">
        <div className="h-3 w-20 bg-gray-100 rounded" />
        <div className="h-8 w-24 bg-gray-200 rounded" />
        <div className="h-3 w-32 bg-gray-50 rounded" />
      </div>
      <div className="w-12 h-12 rounded-2xl bg-gray-100" />
    </div>
  </div>
);

const ChartSkeleton = () => (
  <div className="rounded-2xl border border-gray-100 p-5 bg-white animate-pulse h-[300px] flex flex-col gap-4">
    <div className="h-4 w-40 bg-gray-200 rounded mb-4" />
    <div className="flex-1 w-full bg-gray-50 rounded-lg relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]" />
    </div>
  </div>
);

interface Props { darkMode: boolean; }

export default function Dashboard({ darkMode }: Props) {
  // React Query for Dashboard Data
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: keepPreviousData,
  });

  const donations = useMemo(() => Array.isArray(data?.donations) ? data.donations : [], [data]);
  const inventory = useMemo(() => Array.isArray(data?.inventory) ? data.inventory : [], [data]);
  const notifications: any[] = []; // Notifications now handled separately or via another stream

  // Styling Variables
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const gridLine = darkMode ? '#374151' : '#f3f4f6';
  const axisColor = darkMode ? '#9ca3af' : '#6b7280';
  
  const statusColors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-900 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-none',
    Scheduled: 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-none',
    Pending: 'bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-none',
    Cancelled: 'bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-none',
  };

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

  // React Query for Categories
  const { data: catData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetchAPI('/api/donations/categories/?limit=100');
      return Array.isArray(res) ? res : (res?.data ?? res?.results ?? []);
    },
  });

  const categoriesList = useMemo(() => {
    return Array.isArray(catData) ? catData : [];
  }, [catData]);

  const getStatusColor = (status: string) => {
    const s = status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase();
    return statusColors[s] || 'bg-gray-100 text-gray-800 border border-gray-200';
  };

  // Compute Metrics dynamically from Donations Table
  // (Using server-side stats now)

  const summaryCards = [
    { label: 'Total Donations', value: data?.stats?.total_donations?.toLocaleString('en-IN') || 0, icon: Heart, bg: 'from-green-400 to-emerald-500', sub: 'Updated live', trend: 'up' },
    { label: 'Total Users', value: data?.stats?.total_users?.toLocaleString('en-IN') || 0, icon: DollarSign, bg: 'from-blue-400 to-indigo-500', sub: 'Est. Community Size', trend: 'up' },
    { label: 'Pending Pickups', value: data?.stats?.pending_donations || 0, icon: Clock, bg: 'from-amber-400 to-orange-500', sub: 'Needs attention', trend: 'neutral' },
    { label: 'Active Volunteers', value: data?.stats?.active_volunteers || 0, icon: CheckCircle2, bg: 'from-violet-400 to-purple-500', sub: 'Ready for action', trend: 'up' },
  ];

  // Category Pie Data derived from real donations
  const catCounts = donations.reduce((acc: any, d: any) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});
  
  const categoryPieData = useMemo(() => {
    return Object.keys(catCounts).map(cat => {
      return {
        name: cat, 
        value: catCounts[cat], 
        color: colorMap[cat.toLowerCase()] || '#10b981'
      };
    });
  }, [catCounts, categoriesList]);

  // Activity Feed derived from Notifications or fallback to Donations
  const recentActivity = notifications.length > 0 
    ? notifications.slice(0, 5).map((n: any) => ({
        id: n.id, action: n.title, donor: 'System', category: 'Alert',
        time: new Date(n.timestamp).toLocaleTimeString(), icon: '🔔'
      }))
    : donations.slice(0, 5).map((d: any) => ({
        id: d.id, 
        action: `New Donation added`, 
        donor: d.donor, 
        category: d.category,
        time: new Date(d.timestamp).toLocaleDateString(), 
        icon: '✨'
      }));
  const impactStats = useMemo(() => Array.isArray((data as any)?.impact_stats) ? (data as any).impact_stats : [], [data]);

  // Inventory Snapshot aggregated by category with normalization
  const inventoryData = useMemo(() => {
    // Normalization mapping for consolidation
    const normMap: Record<string, string> = {
      'cake': 'Food',
      'meals': 'Food',
      'meal': 'Food',
      'grocery': 'Food',
      'shirts': 'Clothes',
      'shirt': 'Clothes',
      'jeans': 'Clothes',
      'pants': 'Clothes',
      'footwear': 'Clothes',
      'monetary': 'Money',
      'fund': 'Money',
      'gifts': 'Gift'
    };

    const agg = inventory.reduce((acc: any, inv: any) => {
      const rawCat = inv.category;
      let targetCat = categoriesList.find((c: any) => c.name.toLowerCase() === rawCat.toLowerCase())?.name;
      
      // If not an exact match, try the normalization map
      if (!targetCat) {
        const mappedName = normMap[rawCat.toLowerCase()];
        if (mappedName) {
          targetCat = categoriesList.find((c: any) => c.name.toLowerCase() === mappedName.toLowerCase())?.name;
        }
      }

      // Only aggregate if it belongs to an official category
      if (targetCat) {
        acc[targetCat] = {
          totalReceived: (acc[targetCat]?.totalReceived || 0) + inv.quantity,
          distributed: (acc[targetCat]?.distributed || 0) + (inv.distributed || 0)
        };
      }
      return acc;
    }, {});

    // Ensure ALL official categories are shown, even with 0 data
    return categoriesList.map(cat => {
      const iconKey = (cat.icon_name || '').toLowerCase();
      const stats = agg[cat.name] || { totalReceived: 0, distributed: 0 };
      
      return {
        category: cat.name,
        totalReceived: stats.totalReceived,
        distributed: stats.distributed,
        color: colorMap[cat.name.toLowerCase()] || '#10b981',
        icon: iconMap[iconKey] || '📦'
      };
    });
  }, [inventory, categoriesList]);


  // Monthly trends (Mapped to show real counts on right side of chart)
  // Monthly trends dynamically generated from the last 4 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrends = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
    const monthData: any = { 
      month: months[d.getMonth()], 
      monthIdx: d.getMonth(), 
      year: d.getFullYear()
    };
    // Initialize all categories to 0
    categoriesList.forEach((c: any) => {
      monthData[c.name] = 0;
    });
    return monthData;
  });
  
  donations.forEach((d: any) => {
    const date = new Date(d.timestamp);
    const trend = monthlyTrends.find(t => t.monthIdx === date.getMonth() && t.year === date.getFullYear());
    if (trend && trend[d.category as keyof typeof trend] !== undefined) {
      (trend as any)[d.category]++;
    }
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-xl p-3 shadow-xl border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
          <p className="font-bold mb-2">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2"><ChartSkeleton /></div>
          <div><ChartSkeleton /></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {isFetching && !isLoading && (
        <div className="absolute top-0 right-0 z-50 flex items-center gap-2 px-3 py-1 bg-green-500 text-white text-[10px] font-bold rounded-full shadow-lg animate-bounce">
          <RefreshCw size={10} className="animate-spin" />
          SYNCING...
        </div>
      )}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {summaryCards.map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-shadow ${card}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-medium uppercase tracking-wide ${textSub}`}>{c.label}</p>
                  <p className={`text-3xl font-bold mt-2 ${textMain}`}>{c.value}</p>
                  <div className="flex items-center gap-1 mt-2">
                    {c.trend === 'up' && <ArrowUpRight size={10} className="text-green-500" />}
                    <p className="text-[10px] text-green-500 font-bold uppercase tracking-tight">{c.sub}</p>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.bg} flex items-center justify-center shadow-md`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Real-time Impact Section */}
      {impactStats.length > 0 && (
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <h2 className={`font-bold text-lg ${textMain}`}>Real-time Impact</h2>
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 text-green-500 text-[10px] font-bold rounded-full">
              <TrendingUp size={12} /> DYNAMIC CALCULATION
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5 gap-4">
            {impactStats.map((impact: any, idx: number) => {
              const IconComp = iconMap[impact.icon?.toLowerCase()] || LayoutGrid;
              return (
                <div 
                  key={idx} 
                  className={`relative overflow-hidden group rounded-2xl border p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-xl ${card}`}
                >
                  <div className="relative z-10 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg group-hover:rotate-6 transition-transform`}>
                        <IconComp size={20} />
                      </div>
                      <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-lg text-[8px] font-black uppercase tracking-tighter opacity-50">
                        1:{impact.impact_per_quantity} Ratio
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <p className={`text-4xl font-black mb-1 ${textMain} tracking-tighter`}>
                        {impact.count.toLocaleString()}
                      </p>
                      <p className={`text-xs font-bold uppercase tracking-widest ${textSub} opacity-80`}>
                        {impact.label}
                      </p>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                       <span className={`text-[9px] font-bold ${textSub}`}>{impact.category}</span>
                       <div className="h-1.5 w-12 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full w-2/3 animate-pulse" />
                       </div>
                    </div>
                  </div>
                  
                  {/* Decorative Background Element */}
                  <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <IconComp size={100} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Trend Bar Chart */}
        <div className={`xl:col-span-2 rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Inventory: Received vs Distributed</h2>
              <p className={`text-xs ${textSub}`}>Stock Management Comparison</p>
            </div>
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-green-600 ${darkMode ? 'bg-green-900/30' : 'bg-green-50'}`}>
              <TrendingUp size={12} />
              Real-time DB
            </div>
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={inventoryData} barSize={20} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis dataKey="category" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <Bar name="Total Received" dataKey="totalReceived" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar name="Distributed" dataKey="distributed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>

        </div>

        {/* Pie Chart */}
        <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="mb-4">
            <h2 className={`font-bold text-base ${textMain}`}>Category Distribution</h2>
            <p className={`text-xs ${textSub}`}>All time breakdown from DB</p>
          </div>
          {categoryPieData.length === 0 ? (
            <div className={`h-[180px] flex items-center justify-center ${textSub} text-sm`}>No Data</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {categoryPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [Number(v).toLocaleString()]} />
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="space-y-2 mt-2">
            {categoryPieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className={`text-xs ${textSub}`}>{item.name}</span>
                </div>
                <span className={`text-xs font-semibold ${textMain}`}>{item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: Recent Activity + Inventory Snapshot */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Recent Activity Feed */}
        <div className={`xl:col-span-2 rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold text-base ${textMain}`}>Recent Activity</h2>
            <span className={`text-xs ${textSub}`}>Live Feed</span>
          </div>
          <div className="space-y-3">
            {recentActivity.length === 0 ? (
              <p className={`text-sm ${textSub}`}>No recent activity in the database.</p>
            ) : recentActivity.map((item: any) => (
              <div 
                key={item.id} 
                className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'}`}
                onClick={() => {
                  // Redirect logic based on action type
                  if (item.action.toLowerCase().includes('donation')) window.dispatchEvent(new CustomEvent('navigate', { detail: 'donations' }));
                  else if (item.action.toLowerCase().includes('message')) window.dispatchEvent(new CustomEvent('navigate', { detail: 'messages' }));
                  else if (item.action.toLowerCase().includes('volunteer')) window.dispatchEvent(new CustomEvent('navigate', { detail: 'volunteers' }));
                }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${textMain}`}>{item.action}</p>
                  <p className={`text-xs ${textSub}`}>{item.donor} · {item.category}</p>
                </div>
                <span className={`text-xs flex-shrink-0 ${textSub}`}>{item.time}</span>
              </div>
            ))}

          </div>
        </div>

        {/* Inventory Snapshot */}
        <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`font-bold text-base ${textMain}`}>Inventory Snapshot</h2>
          </div>
          <div className="space-y-4">
            {inventoryData.length === 0 ? (
              <p className={`text-sm ${textSub}`}>No inventory recorded yet.</p>
            ) : inventoryData.map((item: any) => {
              const pct = Math.round((item.distributed / item.totalReceived) * 100) || 0;
              return (
                <div key={item.category}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base flex items-center justify-center">
                        {typeof item.icon === 'string' ? item.icon : <item.icon size={16} className="text-gray-500" />}
                      </span>
                      <span className={`text-sm font-medium ${textMain}`}>{item.category}</span>
                    </div>

                    <span className={`text-xs font-semibold ${textSub}`}>{pct}% distributed</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: item.color }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-green-500 font-medium">{item.distributed.toLocaleString()} distributed</span>
                    <span className={`text-xs font-medium ${textSub}`}>{(item.totalReceived - item.distributed).toLocaleString()} left</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Donations Table */}
      <div className={`rounded-2xl border shadow-sm ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between flex-wrap gap-3`}>
          <h2 className={`font-bold text-base ${textMain}`}>Recent Donations</h2>

        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                {['ID', 'Donor', 'Category', 'Quantity', 'Date', 'Status'].map(h => (
                  <th key={h} className={`px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider ${textSub}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {donations.length === 0 ? (
                 <tr>
                   <td colSpan={6} className={`py-8 text-center ${textSub}`}>No donations stored yet.</td>
                 </tr>
              ) : donations.slice(0, 5).map((d: any) => (

                <tr key={d.id} className={`transition-colors ${darkMode ? 'divide-gray-700 hover:bg-gray-700/40' : 'hover:bg-gray-50'}`}>
                  <td className={`px-5 py-3.5 font-mono font-medium text-green-600`}>#{d.id}</td>
                  <td className={`px-5 py-3.5 font-medium ${textMain}`}>{d.donor}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.category}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.quantity} {d.unit || 'Units'}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{new Date(d.timestamp).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase whitespace-nowrap inline-block ${getStatusColor(d.status)}`}>{d.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
