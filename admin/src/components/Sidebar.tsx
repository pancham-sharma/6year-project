import {
  LayoutDashboard, Heart, Package, MapPin, Truck,
  Users, MessageSquare, Bell, BarChart3, Settings, ChevronLeft,
  Utensils, Shirt, BookOpen, Coins, Leaf, X, Handshake, LayoutGrid, Trash2
} from 'lucide-react';
import { useSearch } from '../context/SearchContext';
import { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';

export type NavSection =
  | 'dashboard' | 'donations' | 'inventory' | 'location' | 'pickups'
  | 'users' | 'volunteers' | 'messages' | 'notifications' | 'reports' | 'settings' | 'category_mgmt' | 'recycle'
  | 'food' | 'clothes' | 'books' | 'monetary' | 'environment';

interface SidebarProps {
  active: NavSection;
  onNavigate: (section: NavSection) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  darkMode: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const mainNav = [
  { id: 'dashboard' as NavSection, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'donations' as NavSection, label: 'Donations', icon: Heart },
  { id: 'inventory' as NavSection, label: 'Inventory', icon: Package },
  { id: 'location' as NavSection, label: 'Location Tracking', icon: MapPin },
  { id: 'pickups' as NavSection, label: 'Pickup Management', icon: Truck },
  { id: 'users' as NavSection, label: 'User Management', icon: Users },
  { id: 'volunteers' as NavSection, label: 'Volunteers', icon: Handshake },
  { id: 'messages' as NavSection, label: 'Messages', icon: MessageSquare },
  { id: 'notifications' as NavSection, label: 'Notifications', icon: Bell },
  { id: 'reports' as NavSection, label: 'Reports & Analytics', icon: BarChart3 },
  { id: 'category_mgmt' as NavSection, label: 'Manage Categories', icon: LayoutGrid },
  { id: 'recycle' as NavSection, label: 'Recycle Bin', icon: Trash2 },
  { id: 'settings' as NavSection, label: 'Settings', icon: Settings },
];

const categoryNav = [
  { id: 'food' as NavSection, label: 'Food', icon: Utensils, color: 'text-amber-500' },
  { id: 'clothes' as NavSection, label: 'Clothes', icon: Shirt, color: 'text-purple-500' },
  { id: 'books' as NavSection, label: 'Books', icon: BookOpen, color: 'text-blue-500' },
  { id: 'monetary' as NavSection, label: 'Monetary', icon: Coins, color: 'text-emerald-500' },
  { id: 'environment' as NavSection, label: 'Environment', icon: Leaf, color: 'text-green-500' },
];

export default function Sidebar({ active, onNavigate, collapsed, onToggleCollapse, darkMode, mobileOpen, onMobileClose }: SidebarProps) {
  const { searchQuery } = useSearch();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const res = await fetchAPI('/api/inventory/items/');
        const data = res.results || res || [];
        const countMap: Record<string, number> = {};
        data.forEach((item: any) => {
          countMap[item.category.toLowerCase()] = item.quantity;
        });
        setCounts(countMap);
      } catch (err) {
        console.error("Sidebar count fetch error:", err);
      }
    };
    fetchCounts();
    // Refresh every 30 seconds for live updates
    const interval = setInterval(fetchCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  const bg = darkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200';
  const textBase = darkMode ? 'text-gray-300' : 'text-gray-600';
  const textHover = darkMode ? 'hover:bg-gray-800 hover:text-white' : 'hover:bg-green-50 hover:text-green-700';
  const activeStyle = darkMode ? 'bg-green-900/40 text-green-400 font-semibold' : 'bg-green-50 text-green-700 font-semibold';
  const divider = darkMode ? 'border-gray-700' : 'border-gray-100';
  const labelColor = darkMode ? 'text-gray-500' : 'text-gray-400';

  const q = searchQuery.toLowerCase();
  const filteredMain = mainNav.filter(item => !q || item.label.toLowerCase().includes(q));
  const filteredCat = categoryNav.filter(item => !q || item.label.toLowerCase().includes(q));


  const [lastSeen, setLastSeen] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('admin_sidebar_seen') || '{}'); } catch { return {}; }
  });

  useEffect(() => {
    // If the active section is a category, mark its current count as "seen"
    const isCat = categoryNav.some(c => c.id === active);
    if (isCat && counts[active] !== undefined) {
      const newSeen = { ...lastSeen, [active]: counts[active] };
      setLastSeen(newSeen);
      localStorage.setItem('admin_sidebar_seen', JSON.stringify(newSeen));
    }
  }, [active, counts]);

  const NavItem = ({ item, iconColor }: { item: typeof mainNav[0]; iconColor?: string }) => {
    const Icon = item.icon;
    const isActive = active === item.id;
    const isCategory = !!iconColor;
    
    // Show green dot if it's a category and the count has increased since last visit
    const hasNew = isCategory && (counts[item.id] || 0) > (lastSeen[item.id] || 0);

    return (
      <button
        onClick={() => { onNavigate(item.id); onMobileClose(); }}
        title={collapsed ? item.label : undefined}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group relative
          ${isActive ? activeStyle : `${textBase} ${textHover}`}`}
      >
        <Icon size={18} className={`flex-shrink-0 transition-colors ${isActive ? 'text-green-600' : iconColor || ''}`} />
        {!collapsed && <span className="truncate">{item.label}</span>}
        
        {!collapsed && counts[item.id] !== undefined && (
          <>
            {/* Show number badge ONLY for main menu items, not categories */}
            {!isCategory ? (
              <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${isActive ? 'bg-green-500 text-white' : (darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500')}`}>
                {counts[item.id]}
              </span>
            ) : (
              /* Show green dot for categories with NEW donations */
              hasNew && (
                <span className="ml-auto w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)] animate-pulse" />
              )
            )}
          </>
        )}
        
        {!collapsed && isActive && counts[item.id] === undefined && (
          <span className="ml-auto w-1.5 h-1.5 rounded-full bg-green-500" />
        )}

        {collapsed && (
          <div className={`absolute left-full ml-3 px-2 py-1 text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap transition-opacity
            ${darkMode ? 'bg-gray-800 text-white' : 'bg-gray-900 text-white'}`}>
            {item.label}
          </div>
        )}
      </button>
    );
  };

  const sidebarContent = (
    <div className={`flex flex-col h-full transition-all duration-300 ${collapsed ? 'w-16' : 'w-64'} ${bg} border-r`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b ${divider}`}>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-md">
          <Heart size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div>
            <div className={`font-bold text-base leading-tight ${darkMode ? 'text-white' : 'text-gray-800'}`}>Seva Marg</div>
            <div className="text-xs text-green-500 font-medium">Admin Panel</div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`ml-auto p-1 rounded-lg transition-colors hidden lg:flex
            ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-400'}`}
        >
          <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
        <button onClick={onMobileClose} className={`ml-auto p-1 rounded-lg lg:hidden ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
          <X size={16} />
        </button>
      </div>

      {/* Scrollable Nav */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2 space-y-1">
        {/* Main Nav */}
        {!collapsed && filteredMain.length > 0 && <p className={`text-xs font-semibold uppercase tracking-wider px-2 mb-2 ${labelColor}`}>Main Menu</p>}
        {filteredMain.map(item => <NavItem key={item.id} item={item} />)}

        {/* Categories */}
        {filteredCat.length > 0 && (
          <div className={`border-t ${divider} mt-4 pt-4`}>
            {!collapsed && <p className={`text-xs font-semibold uppercase tracking-wider px-2 mb-2 ${labelColor}`}>Categories</p>}
            {filteredCat.map(item => <NavItem key={item.id} item={item} iconColor={item.color} />)}
          </div>
        )}
        
        {searchQuery && filteredMain.length === 0 && filteredCat.length === 0 && (
          <p className={`text-xs text-center py-4 ${labelColor}`}>No matching items</p>
        )}

      </div>

      {/* Footer */}
      <div className={`p-3 border-t ${divider}`}>
        {!collapsed && (
          <div className={`flex items-center gap-3 px-2 py-2 rounded-xl ${darkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`}>Admin</p>
              <p className="text-xs text-green-500 truncate">admin@sevamarg.org</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">AD</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onMobileClose} />
      )}
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="w-64 h-full">{sidebarContent}</div>
      </div>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        {sidebarContent}
      </div>
    </>
  );
}
