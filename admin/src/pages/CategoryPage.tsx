import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, Package, ArrowDownCircle, Archive, Loader } from 'lucide-react';
import { fetchAPI } from '../utils/api';

export type DonationCategory = 'Food' | 'Clothes' | 'Books' | 'Monetary' | 'Environment';

interface Props { darkMode: boolean; category: DonationCategory; }

const categoryConfig: Record<DonationCategory, { icon: string; color: string; gradient: string; unit: string; barColor: string }> = {
  Food: { icon: '🍱', color: 'text-amber-500', gradient: 'from-amber-400 to-orange-500', unit: 'kg', barColor: '#f59e0b' },
  Clothes: { icon: '👗', color: 'text-purple-500', gradient: 'from-purple-400 to-violet-500', unit: 'items', barColor: '#8b5cf6' },
  Books: { icon: '📚', color: 'text-blue-500', gradient: 'from-blue-400 to-indigo-500', unit: 'books', barColor: '#3b82f6' },
  Monetary: { icon: '💰', color: 'text-emerald-500', gradient: 'from-emerald-400 to-green-500', unit: 'INR', barColor: '#10b981' },

  Environment: { icon: '🌱', color: 'text-green-500', gradient: 'from-green-400 to-teal-500', unit: 'saplings', barColor: '#22c55e' },
};

export default function CategoryPage({ darkMode, category }: Props) {
  const [donations, setDonations] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [donsRes, invRes] = await Promise.all([
          fetchAPI('/api/donations/').catch(() => []),
          fetchAPI('/api/inventory/items/').catch(() => [])
        ]);
        setDonations(donsRes.results || donsRes || []);
        setInventory(invRes.results || invRes || []);
      } catch (err) {
        console.error("Failed to fetch category data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category]); // Re-fetch or re-calculate if category prop somehow changes

  const cfg = categoryConfig[category];
  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const gridLine = darkMode ? '#374151' : '#f3f4f6';
  const axisColor = darkMode ? '#9ca3af' : '#6b7280';
  const rowHover = darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const divider = darkMode ? 'divide-gray-700' : 'divide-gray-100';
  const theadBg = darkMode ? 'bg-gray-700/50' : 'bg-gray-50';

  const catDonations = donations.filter((d: any) => d.category === category);
  
  // Find matching inventory
  const rawInv = inventory.find((i: any) => i.category === category);
  const inv = rawInv ? {
    totalReceived: rawInv.quantity,
    distributed: rawInv.distributed || 0,
    unit: cfg.unit
  } : { totalReceived: 0, distributed: 0, unit: cfg.unit };


  const remaining = inv.totalReceived - inv.distributed;
  const distPct = inv.totalReceived > 0 ? Math.round((inv.distributed / inv.totalReceived) * 100) : 0;

  // Monthly Data setup
  const monthlyTrends = [
    { month: 'Jan', amount: 0 },
    { month: 'Feb', amount: 0 },
    { month: 'Mar', amount: 0 },
    { month: 'Apr', amount: 0 } // Assuming April current month
  ];
  
  catDonations.forEach((d: any) => {
    const val = category === 'Monetary' ? (d.quantity || 1) : 1;
    monthlyTrends[3].amount += val;
  });


  const statusCount = catDonations.reduce((acc: any, d: any) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusColors: Record<string, string> = {
    Completed: 'bg-green-100 text-green-700',
    Scheduled: 'bg-blue-100 text-blue-700',
    Pending: 'bg-amber-100 text-amber-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[50vh]"><Loader className="animate-spin text-green-500 w-8 h-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className={`rounded-2xl bg-gradient-to-br ${cfg.gradient} p-6 text-white shadow-lg`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-4xl backdrop-blur-sm">
            {cfg.icon}
          </div>
          <div>
            <h2 className="text-2xl font-bold">{category} Donations</h2>
            <p className="text-white/80 text-sm mt-1">Live data extraction from PostgreSQL database</p>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'Total Received', value: inv.totalReceived > 0 ? `${inv.totalReceived.toLocaleString('en-IN')} ${inv.unit}` : '0', icon: Package, sub: 'Live DB' },

          { label: 'Distributed', value: `${inv.distributed.toLocaleString()}`, icon: ArrowDownCircle, sub: `${distPct}% of total` },
          { label: 'Remaining Stock', value: remaining.toLocaleString(), icon: Archive, sub: `${100 - distPct}% available` },
          { label: 'Active Donations', value: catDonations.length.toString(), icon: TrendingUp, sub: `${catDonations.filter((d: any) => d.status === 'Pending').length} pending` },
        ].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className={`rounded-2xl border p-4 shadow-sm ${card}`}>
              <div className="flex items-start justify-between">
                <div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${textSub}`}>{s.label}</p>
                  <p className={`text-2xl font-bold mt-1 ${textMain}`}>{s.value}</p>
                  <p className={`text-xs ${textSub} mt-1`}>{s.sub}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradient} flex items-center justify-center shadow`}>
                  <Icon size={17} className="text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Monthly Trend */}
        <div className={`xl:col-span-2 rounded-2xl border p-5 shadow-sm ${card}`}>
          <div className="mb-4">
            <h3 className={`font-bold text-sm ${textMain}`}>Monthly {category} Trend</h3>
            <p className={`text-xs ${textSub}`}>Current database extractions</p>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrends} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridLine} vertical={false} />
              <XAxis dataKey="month" tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: axisColor, fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: darkMode ? '#1f2937' : '#fff', border: 'none', borderRadius: '12px', fontSize: '12px' }} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {monthlyTrends.map((_, i) => <Cell key={i} fill={cfg.barColor} opacity={0.7 + (i / monthlyTrends.length) * 0.3} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status Breakdown */}
        <div className={`rounded-2xl border p-5 shadow-sm ${card}`}>
          <h3 className={`font-bold text-sm ${textMain} mb-4`}>Status Breakdown</h3>
          <div className="space-y-3">
            {Object.keys(statusCount).length === 0 ? (
               <p className={`text-sm ${textSub}`}>No donations stored yet.</p>
            ) : Object.entries(statusCount).map(([status, count]) => {
              const pct = Math.round((Number(count) / catDonations.length) * 100);
              return (
                <div key={status}>
                  <div className="flex justify-between mb-1">
                    <span className={`text-xs font-semibold ${textMain}`}>{status}</span>
                    <span className={`text-xs ${textSub}`}>{count as number} ({pct}%)</span>
                  </div>
                  <div className={`h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                    <div className={`h-2 rounded-full transition-all`}
                      style={{ width: `${pct}%`, backgroundColor: status === 'Completed' ? '#22c55e' : status === 'Scheduled' ? '#3b82f6' : '#f59e0b' }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Inventory Progress */}
          <div className={`mt-5 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
            <p className={`text-xs font-semibold ${textMain} mb-3`}>Inventory Status</p>
            <div className={`h-3 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} overflow-hidden`}>
              <div className="h-3 rounded-full transition-all" style={{ width: `${distPct}%`, backgroundColor: cfg.barColor }} />
            </div>
            <div className="flex justify-between mt-2 text-xs">
              <span className="text-green-500 font-semibold">{inv.distributed.toLocaleString()} distributed</span>
              <span className={textSub}>{remaining.toLocaleString()} left</span>
            </div>
          </div>
        </div>
      </div>

      {/* Donations Table */}
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${card}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className={`font-bold text-base ${textMain}`}>{category} Donation Records</h3>
          <p className={`text-xs ${textSub}`}>{catDonations.length} total live records</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={theadBg}>
                {['ID', 'Donor', 'Quantity', 'Address', 'Date', 'Pickup Time', 'Assigned To', 'Status'].map(h => (
                  <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider ${textSub} whitespace-nowrap`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={`divide-y ${divider}`}>
              {catDonations.length === 0 ? (
                 <tr>
                   <td colSpan={8} className={`py-8 text-center ${textSub}`}>No {category.toLowerCase()} donations recorded in the database yet.</td>
                 </tr>
              ) : catDonations.map((d: any) => (
                <tr key={d.id} className={`transition-colors ${rowHover}`}>
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-green-500">#{d.id}</td>
                  <td className={`px-5 py-3.5 font-medium ${textMain}`}>{d.donor}</td>
                  <td className={`px-5 py-3.5 ${textMain} font-semibold`}>{d.quantity_description}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.pickup_details?.full_address || '—'}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{new Date(d.timestamp).toLocaleDateString()}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.pickup_details?.scheduled_time || '—'}</td>
                  <td className={`px-5 py-3.5 ${textSub}`}>{d.pickup_details?.volunteer || '—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors[d.status] || 'bg-gray-100 text-gray-700'}`}>{d.status}</span>
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
