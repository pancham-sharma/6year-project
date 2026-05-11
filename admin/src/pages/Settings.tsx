import { useState, useEffect } from 'react';
import { 
  Settings2, Plus, Trash2, Save, Bell, Shield, Palette, Database, Loader, CheckCircle2, AlertCircle, RefreshCcw, Download,
  Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins
} from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import RecycleBin from './RecycleBin';

interface Props { darkMode: boolean; onToggleDark: () => void; }

interface Category {
  id: number | string;
  name: string;
  icon_name: string;
  is_active: boolean;
  description: string;
  is_system?: boolean;
}

const settingsSections = [
  { id: 'categories', label: 'Donation Categories', icon: Settings2 },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'data', label: 'Data Management', icon: Database },
  { id: 'recycle', label: 'Recycle Bin', icon: Trash2 },
];

const iconMap: Record<string, any> = {
  utensils: Utensils,
  bookopen: BookOpen,
  shirt: Shirt,
  banknote: Banknote,
  sprout: Sprout,
  heart: Heart,
  layoutgrid: LayoutGrid,
  handheart: HandHeart,
  users: Users,
  treepine: TreePine,
  gift: Gift,
  shoppingbag: ShoppingBag,
  graduationcap: GraduationCap,
  coins: Coins
};

export default function Settings({ darkMode, onToggleDark }: Props) {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState('categories');
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const setBtnLoading = (id: string, isLoading: boolean) => {
    setActionLoading(prev => ({ ...prev, [id]: isLoading }));
  };

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('layoutgrid');
  const [passwords, setPasswords] = useState({ current: '', new: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [notifSettings, setNotifSettings] = useState({
    newDonation: true, newMessage: true, pickupUpdates: true,
    lowStock: true, weeklyReport: false, emailDigest: true,
  });

  useEffect(() => {
    const lower = newCatName.toLowerCase().trim();
    if (!lower) {
      setNewCatIcon('layoutgrid');
      return;
    }
    if (lower.includes('food') || lower.includes('meal')) setNewCatIcon('utensils');
    else if (lower.includes('cloth') || lower.includes('shirt')) setNewCatIcon('shirt');
    else if (lower.includes('book') || lower.includes('study')) setNewCatIcon('bookopen');
    else if (lower.includes('money') || lower.includes('cash')) setNewCatIcon('banknote');
    else if (lower.includes('tree') || lower.includes('plant')) setNewCatIcon('sprout');
    else if (lower.includes('medicine') || lower.includes('health')) setNewCatIcon('heart');
    else if (lower.includes('education') || lower.includes('school')) setNewCatIcon('graduationcap');
    else if (lower.includes('animal') || lower.includes('pet')) setNewCatIcon('handheart');
    else if (lower.includes('gift')) setNewCatIcon('gift');
    else if (lower.includes('shop')) setNewCatIcon('shoppingbag');
  }, [newCatName]);

  const permanentCategories: Category[] = [
    { id: 'p1', name: 'Food', icon_name: 'utensils', is_active: true, description: '', is_system: true },
    { id: 'p2', name: 'Clothes', icon_name: 'shirt', is_active: true, description: '', is_system: true },
    { id: 'p3', name: 'Books', icon_name: 'bookopen', is_active: true, description: '', is_system: true },
    { id: 'p4', name: 'Money', icon_name: 'banknote', is_active: true, description: '', is_system: true },
    { id: 'p5', name: 'Trees', icon_name: 'sprout', is_active: true, description: '', is_system: true },
  ];

  useEffect(() => {
    if (activeSection === 'categories') {
      fetchCategories();
    }
  }, [activeSection]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI('/api/donations/categories/');
      const res = Array.isArray(data) ? data : (data.results || []);
      const dbCategories = res.filter((cat: any) => 
        !permanentCategories.some(p => p.name.toLowerCase() === cat.name.toLowerCase())
      );
      setCategories([...permanentCategories, ...dbCategories]);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setCategories(permanentCategories);
    } finally {
      setLoading(false);
    }
  };

  const handleExportJSON = async () => {
    setBtnLoading('export_json', true);
    try {
      const data = await fetchAPI('/api/donations/data/export_all/');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sevamarg_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("JSON export downloaded", "success");
    } catch (err: any) {
      console.error("Export failed", err);
      showToast(err.message || "Export failed", "error");
    } finally {
      setBtnLoading('export_json', false);
    }
  };

  const handleExportCSV = async () => {
    setBtnLoading('export_csv', true);
    try {
      const donations = await fetchAPI('/api/donations/');
      const data = donations.results || donations;
      if (!data.length) {
        showToast("No data to export", "warning");
        return;
      }

      const headers = ['ID', 'Donor', 'Category', 'Quantity', 'Status', 'Date'];
      const rows = data.map((d: any) => [
        d.id,
        d.donor || d.donor_name || 'N/A',
        d.category,
        d.quantity_description,
        d.status,
        new Date(d.timestamp).toLocaleDateString()
      ]);

      const csvContent = [headers.join(','), ...rows.map((r: any[]) => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donations_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("CSV export downloaded", "success");
    } catch (err: any) {
      console.error("CSV Export failed", err);
      showToast("Failed to generate CSV", "error");
    } finally {
      setBtnLoading('export_csv', false);
    }
  };

  const handleBackup = async () => {
    setBtnLoading('backup', true);
    try {
      await fetchAPI('/api/donations/data/backup/', { method: 'POST' });
      showToast("Database backup created successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Backup failed", "error");
    } finally {
      setBtnLoading('backup', false);
    }
  };

  const handleClearCache = () => {
    if (window.confirm("ARE YOU SURE? This will clear all local session data and you might need to log in again.")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleUpdatePassword = async () => {
    if (!passwords.current || !passwords.new) {
      showToast("Please fill both password fields", "warning");
      return;
    }
    setPassLoading(true);
    try {
      await fetchAPI('/api/users/change-password/', {
        method: 'POST',
        body: JSON.stringify({
          old_password: passwords.current,
          new_password: passwords.new
        })

      });
      setPasswords({ current: '', new: '' });
      showToast("Password updated successfully!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to update password", "error");
    } finally {
      setPassLoading(false);
    }
  };

  const card = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100';
  const textMain = darkMode ? 'text-white' : 'text-gray-800';
  const textSub = darkMode ? 'text-gray-400' : 'text-gray-500';
  const inputBg = darkMode ? 'bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400' : 'bg-white border-gray-200 text-gray-700 placeholder-gray-400';
  const sideActive = darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-50 text-green-700';
  const sideInactive = darkMode ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-200' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-100';
  const toggleOn = 'bg-green-500';
  const toggleOff = darkMode ? 'bg-gray-600' : 'bg-gray-300';

  const addCategory = async () => {
    if (!newCatName.trim()) return;
    if (!newCatIcon.trim()) {
      setErrorMsg("Please provide an icon or emoji for this category.");
      return;
    }
    setErrorMsg(null);
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      setErrorMsg(`Category "${newCatName}" already exists.`);
      return;
    }
    try {
      const newCat = await fetchAPI('/api/donations/categories/', {
        method: 'POST',
        body: JSON.stringify({
          name: newCatName.trim(),
          icon_name: newCatIcon,
          description: `Help with ${newCatName.trim()} donations.`,
          is_active: true
        })
      });
      setCategories(prev => [...prev, newCat]);
      setNewCatName('');
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err: any) {
      console.error("Failed to add category", err);
      setErrorMsg(err.message || "Error adding category.");
    }
  };

  const removeCategory = async (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('p')) return;
    if (!window.confirm("Delete this category?")) return;
    setLoading(true);
    try {
      await fetchAPI(`/api/donations/categories/${id}/`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err: any) {
      console.error("Failed to delete category", err);
      setErrorMsg(err.message || "Failed to delete category.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = async (cat: Category) => {
    if (cat.is_system) return;
    try {
      const updated = await fetchAPI(`/api/donations/categories/${cat.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !cat.is_active })
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...updated } : c));
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err: any) {
      console.error("Failed to toggle category", err);
      setErrorMsg(err.message || "Failed to update category status.");
    }
  };

  const handleSave = () => {
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2500);
  };

  const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) => (
    <button onClick={onChange} disabled={disabled} className={`relative w-10 h-5.5 rounded-full transition-colors ${checked ? toggleOn : toggleOff} flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} style={{ height: '22px', width: '40px' }}>
      <span className={`absolute w-4 h-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
    </button>
  );

  return (
    <div className={`rounded-2xl border shadow-sm overflow-hidden flex flex-col lg:flex-row min-h-[600px] ${card}`}>
      <div className={`w-full lg:w-56 border-b lg:border-b-0 lg:border-r ${divider} flex-shrink-0 p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible no-scrollbar`}>
        <p className={`hidden lg:block text-xs font-semibold uppercase tracking-wider px-3 py-2 ${textSub}`}>Configuration</p>
        {settingsSections.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex-shrink-0 lg:w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeSection === s.id ? sideActive : sideInactive}`}>
              <Icon size={15} />
              <span className="whitespace-nowrap">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex-1 p-4 lg:p-6 overflow-y-auto">
        {activeSection === 'categories' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Donation Categories</h2>
              <p className={`text-sm ${textSub} mt-1`}>Manage donation categories. Permanent categories are built-in.</p>
            </div>

            {loading ? (
              <div className="flex justify-center py-10"><Loader className="animate-spin text-green-500" /></div>
            ) : (
              <div className="space-y-2">
                {categories.map(cat => {
                  const iconKey = (cat.icon_name || '').toLowerCase();
                  const LucideIcon = iconMap[iconKey];
                  return (
                    <div key={cat.id} className={`flex items-center gap-3 p-3.5 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/40' : 'border-gray-100 bg-gray-50'}`}>
                      <span className="w-8 h-8 flex items-center justify-center">
                        {LucideIcon ? <LucideIcon size={18} className="text-green-500" /> : <span className="text-xl">{cat.icon_name}</span>}
                      </span>
                    <span className={`flex-1 font-medium text-sm ${textMain}`}>
                      {cat.name}
                      {cat.is_system && <span className="ml-2 px-1.5 py-0.5 bg-green-100 text-green-600 text-[10px] font-bold rounded uppercase">Core</span>}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold uppercase hidden sm:inline-block ${cat.is_active ? 'text-green-500' : 'text-gray-400'}`}>
                        {cat.is_active ? 'Live' : 'Off'}
                      </span>
                      <Toggle checked={cat.is_active} onChange={() => toggleCategory(cat)} disabled={cat.is_system} />
                    </div>
                    {!cat.is_system && (
                      <button onClick={() => removeCategory(cat.id)} className={`p-1.5 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}>
                        <Trash2 size={13} />
                      </button>
                    )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`text-sm font-semibold ${textMain} mb-3`}>Add New Category</p>
              <div className="flex flex-wrap gap-2 mb-3 items-center">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  {(() => {
                    const Icon = iconMap[newCatIcon.toLowerCase()];
                    return Icon ? <Icon size={20} className="text-green-500" /> : <span className="text-xl">{newCatIcon}</span>;
                  })()}
                </div>
                <input className={`w-28 lg:w-32 px-3 py-2 rounded-xl border text-sm ${inputBg}`} value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} placeholder="Icon..." title="Type a Lucide icon name (e.g. utensils, heart) or an emoji" />
                <input className={`flex-1 min-w-[150px] px-3 py-2 rounded-xl border text-sm ${inputBg}`} value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Category name..." onKeyDown={e => e.key === 'Enter' && addCategory()} />
                <button onClick={addCategory} className="w-full sm:w-auto px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors flex items-center justify-center gap-1.5">
                  <Plus size={13} /> Add
                </button>
              </div>
              
              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-100 text-red-700 text-xs font-medium mb-3 animate-shake">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}

              <button onClick={handleSave} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-green-600 text-white text-sm font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-900/20">
                <Save size={14} /> Save Category Changes
              </button>
            </div>

            <p className={`text-xs ${textSub}`}>💡 Use the "Manage Categories" sidebar menu for advanced options like uploading cover images and impact badges.</p>
            {savedMsg && <p className="text-green-500 text-sm font-medium animate-fade-in flex items-center gap-1.5"><CheckCircle2 size={14} /> Changes saved successfully!</p>}
          </div>
        )}
        
        {activeSection === 'notifications' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Notification Settings</h2>
              <p className={`text-sm ${textSub} mt-1`}>Control which notifications you receive.</p>
            </div>
            <div className="space-y-3">
              {Object.entries(notifSettings).map(([key, val]) => {
                const labels: Record<string, { label: string; desc: string }> = {
                  newDonation: { label: 'New Donations', desc: 'Alert when a new donation is received' },
                  newMessage: { label: 'New Messages', desc: 'Alert when a donor sends a message' },
                  pickupUpdates: { label: 'Pickup Updates', desc: 'Notify on pickup status changes' },
                  lowStock: { label: 'Low Stock Alerts', desc: 'Alert when inventory falls below threshold' },
                  weeklyReport: { label: 'Weekly Reports', desc: 'Receive weekly performance digest' },
                  emailDigest: { label: 'Email Digest', desc: 'Daily email summary of activities' },
                };
                return (
                  <div key={key} className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
                    <div>
                      <p className={`font-medium text-sm ${textMain}`}>{labels[key]?.label}</p>
                      <p className={`text-xs ${textSub}`}>{labels[key]?.desc}</p>
                    </div>
                    <Toggle checked={val} onChange={() => setNotifSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))} />
                  </div>
                );
              })}
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors">
              <Save size={14} /> Save Preferences
            </button>
            {savedMsg && <p className="text-green-500 text-sm font-medium">✅ Preferences saved!</p>}
          </div>
        )}

        {activeSection === 'appearance' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Appearance</h2>
              <p className={`text-sm ${textSub} mt-1`}>Customize the look and feel of the admin panel.</p>
            </div>
            <div className={`flex items-center justify-between p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
              <div>
                <p className={`font-medium text-sm ${textMain}`}>Dark Mode</p>
                <p className={`text-xs ${textSub}`}>Toggle dark/light color scheme</p>
              </div>
              <Toggle checked={darkMode} onChange={onToggleDark} />
            </div>
          </div>
        )}
        
        {activeSection === 'security' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Security Settings</h2>
              <p className={`text-sm ${textSub} mt-1`}>Enhance your account security.</p>
            </div>
            
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
                <p className={`font-medium text-sm ${textMain} mb-3`}>Change Password</p>
                <div className="space-y-2">
                  <input 
                    type="password" 
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`} 
                    placeholder="Current Password" 
                    value={passwords.current}
                    onChange={e => setPasswords(p => ({ ...p, current: e.target.value }))}
                  />
                  <input 
                    type="password" 
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${inputBg}`} 
                    placeholder="New Password" 
                    value={passwords.new}
                    onChange={e => setPasswords(p => ({ ...p, new: e.target.value }))}
                  />
                  <button 
                    onClick={handleUpdatePassword}
                    disabled={passLoading}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {passLoading && <Loader size={14} className="animate-spin" />}
                    {passLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'data' && (
          <div className="space-y-5 max-w-xl">
            <div>
              <h2 className={`font-bold text-base ${textMain}`}>Data Management</h2>
              <p className={`text-sm ${textSub} mt-1`}>Export and manage your application data.</p>
            </div>

            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Download className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${textMain}`}>Export Data</p>
                    <p className={`text-xs ${textSub}`}>Download a complete export of your donations and users.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={handleExportJSON}
                    disabled={actionLoading['export_json']}
                    className={`flex-1 px-3 py-2 bg-green-100 ${darkMode ? 'text-green-400' : 'text-green-800'} dark:bg-green-900/20 text-xs font-bold rounded-lg hover:bg-green-200 dark:hover:bg-green-900/30 transition-colors flex items-center justify-center gap-2`}
                  >
                    {actionLoading['export_json'] && <Loader size={12} className="animate-spin" />}
                    JSON
                  </button>
                  <button 
                    onClick={handleExportCSV}
                    disabled={actionLoading['export_csv']}
                    className={`flex-1 px-3 py-2 bg-blue-100 ${darkMode ? 'text-white' : 'text-blue-800'} dark:bg-blue-900/20 text-xs font-bold rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center justify-center gap-2`}
                  >
                    {actionLoading['export_csv'] && <Loader size={12} className="animate-spin" />}
                    CSV/Excel
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'border-gray-700 bg-gray-700/30' : 'border-gray-100 bg-gray-50'}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Database className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className={`font-medium text-sm ${textMain}`}>Database Backup</p>
                    <p className={`text-xs ${textSub}`}>Create a full snapshot of the database.</p>
                  </div>
                </div>
                <button 
                  onClick={handleBackup}
                  disabled={actionLoading['backup']}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading['backup'] ? <Loader size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                  Create New Backup
                </button>
              </div>

              <div className={`p-4 rounded-xl border ${darkMode ? 'border-red-900/20 bg-red-900/5' : 'border-red-100 bg-red-50/30'}`}>
                <p className="text-sm font-bold text-red-500 mb-1">Danger Zone</p>
                <p className="text-xs text-red-400 mb-3">Irreversible actions that affect your system.</p>
                <button 
                  onClick={handleClearCache}
                  className="px-4 py-2 bg-white dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-red-500 rounded-lg text-xs font-bold hover:bg-red-50 dark:hover:bg-red-900/40 transition-colors"
                >
                  Clear Application Cache
                </button>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'recycle' && (
          <div className="animate-fade-in">
            <RecycleBin darkMode={darkMode} />
          </div>
        )}
      </div>
    </div>
  );
}
