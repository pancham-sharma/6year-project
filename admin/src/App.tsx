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
import { DonationCategory } from './data/mockData';
import { SearchProvider } from './context/SearchContext';


const pageTitles: Record<NavSection, string> = {
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
  monetary: 'Monetary Donations',
  environment: 'Environment Donations',
};

const categoryMap: Partial<Record<NavSection, DonationCategory>> = {
  food: 'Food',
  clothes: 'Clothes',
  books: 'Books',
  monetary: 'Monetary',
  environment: 'Environment',
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if token exists on mount
    if (localStorage.getItem('access_token')) {
      setIsAuthenticated(true);
    }

    const handleNavigate = (e: any) => {
      setActiveSection(e.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);


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
    return <Auth darkMode={darkMode} onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
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
  );
}

