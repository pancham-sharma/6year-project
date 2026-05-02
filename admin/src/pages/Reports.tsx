import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { TrendingUp, Download, Loader } from 'lucide-react';
import { fetchAPI } from '../utils/api';

interface Props { darkMode: boolean; }

export default function Reports({ darkMode }: Props) {
  const [donations, setDonations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donsRes, invRes, usersRes] = await Promise.all([
          fetchAPI('/api/donations/').catch(() => []),
          fetchAPI('/api/inventory/items/').catch(() => []),
          fetchAPI('/api/users/list/').catch(() => [])
        ]);
        setDonations(donsRes.results || donsRes || []);
        setInventory(invRes.results || invRes || []);
        setUsers(usersRes.results || usersRes || []);
      } catch (err) {
        console.error("Analytics fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const gridLine = darkMode ? '#374151' : '#f3f4f6';
  const axisColor = darkMode ? '#9ca3af' : '#6b7280';

  const catColors: any = { Food: '#f59e0b', Clothes: '#8b5cf6', Books: '#3b82f6', Monetary: '#10b981', Environment: '#22c55e' };
  const catIcons: any = { Food: '🍲', Clothes: '👕', Books: '📚', Monetary: '💰', Environment: '🌱' };

  // Calculate KPIs
  const totalDonationsThisMonth = donations.length; 
  const totalMonetary = donations
    .filter((d: any) => d.category === 'Monetary')
    .reduce((sum, d) => sum + (d.quantity || 0), 0);
  
  const totalInvReceived = inventory.reduce((acc: number, inv: any) => acc + inv.quantity, 0);
  const totalInvDistributed = inventory.reduce((acc: number, inv: any) => acc + (inv.distributed || 0), 0);
  const distRate = totalInvReceived > 0 ? Math.round((totalInvDistributed / totalInvReceived) * 100) : 0;

  
  const activeDonors = users.filter((u: any) => true).length; // Assume all active for now

  const kpis = [
    { label: 'Total Donations Recorded', value: totalDonationsThisMonth.toLocaleString('en-IN'), change: 'Live', up: true },
    { label: 'Monetary Received', value: `₹${totalMonetary.toLocaleString('en-IN')}`, change: 'Live', up: true },
    { label: 'Distribution Rate', value: `${distRate}%`, change: 'Live', up: true },
    { label: 'Registered Donors', value: activeDonors.toLocaleString('en-IN'), change: 'Live', up: true },
  ];


  // Calculate Category Pie Data
  const catCounts = donations.reduce((acc: any, d: any) => {
    acc[d.category] = (acc[d.category] || 0) + 1;
    return acc;
  }, {});
  const categoryPieData = Object.keys(catCounts).map(cat => ({
    name: cat, value: catCounts[cat], color: catColors[cat] || '#9ca3af'
  }));

  // Setup Monthly Trends for the charts (simplified to place all current live data into current month)
  const monthlyTrends = [
    { month: 'Jan', Food: 0, Clothes: 0, Books: 0, Monetary: 0, Environment: 0 },
    { month: 'Feb', Food: 0, Clothes: 0, Books: 0, Monetary: 0, Environment: 0 },
    { month: 'Mar', Food: 0, Clothes: 0, Books: 0, Monetary: 0, Environment: 0 },
    { month: 'Apr', Food: 0, Clothes: 0, Books: 0, Monetary: 0, Environment: 0 }
  ];
  
  donations.forEach((d: any) => {
    const cat = d.category;
    if (monthlyTrends[3][cat as keyof typeof monthlyTrends[0]] !== undefined) {
      (monthlyTrends[3] as any)[cat]++;
    }
  });

  const monetaryData = monthlyTrends.map(m => ({ month: m.month, amount: donations
    .filter((d: any) => d.category === 'Monetary' && new Date(d.timestamp).toLocaleDateString('en-US', { month: 'short' }) === m.month)
    .reduce((sum, d) => sum + (d.quantity || 0), 0) }));


  // Inventory Table Data
  const formattedInventory = inventory.map((inv: any) => ({
    category: inv.category,
    totalReceived: inv.quantity,
    distributed: inv.distributed || 0,
    color: catColors[inv.category] || '#9ca3af',
    icon: catIcons[inv.category] || '📦'
  }));


  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-xl p-3 shadow-2xl border text-sm ${darkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
          <p className="font-bold mb-2">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} className="text-sm" style={{ color: p.color }}>{p.name}: <span className="font-semibold">{typeof p.value === 'number' && p.value > 100 ? `$${p.value.toLocaleString()}` : p.value}</span></p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <div key={i} className={`rounded-2xl border p-4 shadow-sm ${card}`}>
            <p className={`text-xs font-semibold uppercase tracking-wide ${textSub} mb-2`}>{k.label}</p>
            <p className={`text-2xl font-bold ${textMain}`}>{k.value}</p>
            <div className="flex items-center gap-1 mt-1">
              <TrendingUp size={11} className="text-green-500" />
              <span className="text-xs text-green-500 font-semibold">{k.change} updates</span>
            </div>
          </div>
        ))}
      </div>

      {/* Monthly Donation Count Trend */}
      <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className={`font-bold text-base ${textMain}`}>Monthly Donation Volume</h2>
            <p className={`text-xs ${textSub}`}>Realtime extraction from Django DB</p>
          </div>
          <button className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            <Download size={12} /> Export
          </button>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={monthlyTrends} barSize={12} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
            <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="Food" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Clothes" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Books" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Environment" fill="#22c55e" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Monetary Trend */}
        <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="mb-5">
            <h2 className={`font-bold text-base ${textMain}`}>Monetary Donation Trend</h2>
            <p className={`text-xs ${textSub}`}>Monthly monetary contributions (INR)</p>

          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monetaryData}>
              <defs>
                <linearGradient id="monetaryGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
              <Tooltip formatter={(v: any) => [`₹${Number(v).toLocaleString('en-IN')}`, 'Amount']} contentStyle={{ background: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />

              <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fill="url(#monetaryGrad)" dot={{ fill: '#10b981', r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Pie */}
        <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="mb-5">
            <h2 className={`font-bold text-base ${textMain}`}>Category-wise Performance</h2>
            <p className={`text-xs ${textSub}`}>Distribution of live DB donations</p>
          </div>
          {categoryPieData.length === 0 ? (
            <div className={`h-[220px] flex items-center justify-center text-sm ${textSub}`}>No category data found.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryPieData} cx="50%" cy="50%" outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }: { name: string; percent?: number }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`} labelLine={false}>
                  {categoryPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [Number(v).toLocaleString(), 'Total']} contentStyle={{ background: darkMode ? '#1f2937' : '#fff', borderRadius: '12px', border: 'none', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Distribution vs Received */}
      <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
        <div className="mb-5">
          <h2 className={`font-bold text-base ${textMain}`}>Received vs Distributed by Category</h2>
          <p className={`text-xs ${textSub}`}>Current live inventory performance overview</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {formattedInventory.length === 0 ? (
             <p className={`col-span-full py-6 text-center text-sm ${textSub}`}>No inventory recorded in the database yet.</p>
          ) : formattedInventory.map((item: any) => {
            const distPct = Math.round((item.distributed / item.totalReceived) * 100) || 0;
            const remPct = 100 - distPct;
            return (
              <div key={item.category} className={`p-4 rounded-xl border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <span className={`font-semibold text-sm ${textMain}`}>{item.category}</span>
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={textSub}>Distributed</span>
                      <span className="font-semibold text-green-500">{distPct}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-green-400 transition-all" style={{ width: `${distPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className={textSub}>Remaining</span>
                      <span className="font-semibold text-amber-500">{remPct}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-600' : 'bg-gray-200'}`}>
                      <div className="h-2 rounded-full bg-amber-400 transition-all" style={{ width: `${remPct}%` }} />
                    </div>
                  </div>
                </div>
                <div className={`mt-3 pt-3 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'} flex justify-between text-xs`}>
                  <span className={textSub}>Total</span>
                  <span className={`font-bold ${textMain}`}>{item.totalReceived.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
