import { useState, useEffect } from 'react';
import Sidebar, { NavSection } from './components/Sidebar';
import Topbar from './components/Topbar';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import DonationManagement from './pages/DonationManagement';
import Inventory from './pages/Inventory';
import LocationTracking from './pages/LocationTracking';
import PickupManagement from './pages/PickupManagement';
import UserManagement from './pages/UserManagement';
import Messages from './pages/Messages';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CategoryPage from './pages/CategoryPage';
import Notifications from './pages/Notifications';
import Volunteers from './pages/Volunteers';
import CategoryManagement from "./pages/CategoryManagement.tsx";
import RecycleBin from './pages/RecycleBin';
import { SearchProvider } from './context/SearchContext';
import { ToastProvider } from './context/ToastContext';
import { fetchAPI } from './utils/api';
import QueryProvider from './providers/QueryProvider';

const initialPageTitles: Record<string, string> = {
  dashboard: 'Dashboard',
  donations: 'Donation Management',
  inventory: 'Inventory Management',
  location: 'Location Tracking',
  pickups: 'Pickup Management',
  users: 'User Management',
  volunteers: 'Volunteer Management',
  messages: 'Messages',
  notifications: 'Notifications',
  reports: 'Reports & Analytics',
  category_mgmt: 'Category Management',
  recycle: 'Recycle Bin',
  settings: 'Settings',
  food: 'Food Donations',
  clothes: 'Clothes Donations',
  books: 'Books Donations',
  money: 'Money Donations',
  trees: 'Trees Donations',
};

const initialCategoryMap: Record<string, string> = {
  food: 'Food',
  clothes: 'Clothes',
  books: 'Books',
  money: 'Money',
  trees: 'Trees',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pageTitles, setPageTitles] = useState(initialPageTitles);
  const [categoryMap, setCategoryMap] = useState(initialCategoryMap);

  useEffect(() => {
    if (localStorage.getItem('access_token')) {
      setIsAuthenticated(true);
    }

    const fetchCategories = async () => {
      try {
        const res = await fetchAPI('/api/donations/categories/');
        const categoriesData = Array.isArray(res) ? res : (res.results || []);
        
        const newTitles = { ...initialPageTitles };
        const newMap = { ...initialCategoryMap };
        
        categoriesData.forEach((cat: any) => {
          const key = cat.name.toLowerCase();
          if (!newTitles[key]) {
            newTitles[key] = `${cat.name} Donations`;
            newMap[key] = cat.name;
          }
        });
        
        setPageTitles(newTitles);
        setCategoryMap(newMap);
      } catch (err) {
        console.error("Failed to fetch categories for App", err);
      }
    };

    if (isAuthenticated) {
      fetchCategories();
    }

    const handleCategoriesUpdate = () => {
      if (isAuthenticated) fetchCategories();
    };
    window.addEventListener('categoriesUpdated', handleCategoriesUpdate);

    const handleNavigate = (e: any) => {
      setActiveSection(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => {
      window.removeEventListener('navigate', handleNavigate);
      window.removeEventListener('categoriesUpdated', handleCategoriesUpdate);
    };
  }, [isAuthenticated]);

  const bg = darkMode ? 'bg-gray-950' : 'bg-slate-50';

  const renderPage = () => {
    const catSection = categoryMap[activeSection];
    if (catSection) {
      return <CategoryPage darkMode={darkMode} category={catSection} />;
    }
    switch (activeSection) {
      case 'dashboard': return <Dashboard darkMode={darkMode} />;
      case 'donations': return <DonationManagement darkMode={darkMode} />;
      case 'inventory': return <Inventory darkMode={darkMode} />;
      case 'location': return <LocationTracking darkMode={darkMode} />;
      case 'pickups': return <PickupManagement darkMode={darkMode} />;
      case 'users': return <UserManagement darkMode={darkMode} />;
      case 'volunteers': return <Volunteers darkMode={darkMode} />;
      case 'messages': return <Messages darkMode={darkMode} />;
      case 'notifications': return <Notifications darkMode={darkMode} />;
      case 'reports': return <Reports darkMode={darkMode} />;
      case 'category_mgmt': return <CategoryManagement darkMode={darkMode} />;
      case 'recycle': return <RecycleBin darkMode={darkMode} />;
      case 'settings': return <Settings darkMode={darkMode} onToggleDark={() => setDarkMode(d => !d)} />;
      default: return <Dashboard darkMode={darkMode} />;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <ToastProvider>
        <Auth darkMode={darkMode} onLoginSuccess={() => setIsAuthenticated(true)} />
      </ToastProvider>
    );
  }

  return (
    <QueryProvider>
      <ToastProvider>
        <SearchProvider>
          <div className={`flex h-screen overflow-hidden ${bg} transition-colors duration-300`}>
            <Sidebar
              active={activeSection}
              onNavigate={setActiveSection}
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(c => !c)}
              darkMode={darkMode}
              mobileOpen={mobileMenuOpen}
              onMobileClose={() => setMobileMenuOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              <Topbar
                darkMode={darkMode}
                onToggleDark={() => setDarkMode(d => !d)}
                onMobileMenuOpen={() => setMobileMenuOpen(true)}
                pageTitle={pageTitles[activeSection]}
                onLogout={handleLogout}
              />

              <main className="flex-1 overflow-y-auto">
                <div className={`p-4 lg:p-6 ${activeSection === 'messages' ? 'h-full flex flex-col' : ''}`}>
                  <div className={`fade-in ${activeSection === 'messages' ? 'flex-1 flex flex-col min-h-0' : ''}`} key={activeSection}>
                    {renderPage()}
                  </div>
                </div>
              </main>
            </div>
          </div>
        </SearchProvider>
      </ToastProvider>
    </QueryProvider>
  );
}
