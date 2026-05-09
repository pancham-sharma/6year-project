import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Heart, DollarSign, Clock, CheckCircle2, TrendingUp, ArrowUpRight, Loader } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDashboardData } from '../api/dashboard';

interface Props { darkMode: boolean; }

export default function Dashboard({ darkMode }: Props) {
  // React Query for Dashboard Data
  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboard-data'],
    queryFn: getDashboardData,
    staleTime: 1000 * 60 * 5,
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
    Pending: 'bg-amber-100 text-amber-900 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-none',
    Cancelled: 'bg-red-100 text-red-900 border border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-none',
  };

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
  
  const catColors: any = { Food: '#f59e0b', Clothes: '#8b5cf6', Books: '#3b82f6', Monetary: '#10b981', Environment: '#22c55e' };
  
  const categoryPieData = Object.keys(catCounts).map(cat => ({
    name: cat, value: catCounts[cat], color: catColors[cat] || '#9ca3af'
  }));

  // Activity Feed derived from Notifications or fallback to Donations
  const recentActivity = notifications.length > 0 
    ? notifications.slice(0, 5).map((n: any) => ({
        id: n.id, action: n.title, donor: 'System', category: 'Alert',
        time: new Date(n.timestamp).toLocaleTimeString(), icon: '🔔'
      }))
    : donations.slice(0, 5).map((d: any) => ({
        id: d.id, action: `New Donation added`, donor: d.donor, category: d.category,
        time: new Date(d.timestamp).toLocaleDateString(), icon: '✨'
      }));

  // Inventory Snapshot derived from real Inventory items
  const inventoryData = inventory.map((inv: any) => ({
    category: inv.category,
    totalReceived: inv.quantity, 
    distributed: inv.distributed || 0, 
    color: catColors[inv.category] || '#9ca3af',
    icon: inv.category === 'Food' ? '🍲' : inv.category === 'Clothes' ? '👕' : '📦'
  }));

  // Monthly trends (Mapped to show real counts on right side of chart)
  // Monthly trends dynamically generated from the last 4 months
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const monthlyTrends = Array.from({ length: 4 }).map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (3 - i), 1);
    return { 
      month: months[d.getMonth()], 
      monthIdx: d.getMonth(), 
      year: d.getFullYear(),
      Food: 0, Clothes: 0, Books: 0, Environment: 0, Monetary: 0 
    };
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

  if (loading) {
    return <div className="flex justify-center items-center h-full min-h-[300px]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
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
                    {c.trend === 'up' && <ArrowUpRight size={12} className="text-green-500" />}
                    <p className="text-xs text-green-500 font-medium">{c.sub}</p>
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
                      <span className="text-base">{item.icon}</span>
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
                    <span className="text-xs text-green-500">{item.distributed.toLocaleString()} distributed</span>
                    <span className={`text-xs ${textSub}`}>{(item.totalReceived - item.distributed).toLocaleString()} left</span>
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
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.quantity_description}</td>
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
