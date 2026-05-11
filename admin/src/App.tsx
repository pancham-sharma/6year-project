import { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar, { NavSection } from './components/Sidebar';
import Topbar from './components/Topbar';

const lazyRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      // If there's an error loading the chunk (e.g. 404 after redeploy), 
      // refresh the page once to load the new version.
      console.error("Chunk load failed, refreshing...", error);
      window.location.reload();
      return { default: () => null }; // Return a dummy component while reloading
    }
  });

const Auth = lazyRetry(() => import('./pages/Auth'));
const Dashboard = lazyRetry(() => import('./pages/Dashboard'));
const DonationManagement = lazyRetry(() => import('./pages/DonationManagement'));
const Inventory = lazyRetry(() => import('./pages/Inventory'));
const LocationTracking = lazyRetry(() => import('./pages/LocationTracking'));
const PickupManagement = lazyRetry(() => import('./pages/PickupManagement'));
const UserManagement = lazyRetry(() => import('./pages/UserManagement'));
const Messages = lazyRetry(() => import('./pages/Messages'));
const Reports = lazyRetry(() => import('./pages/Reports'));
const Settings = lazyRetry(() => import('./pages/Settings'));
const CategoryPage = lazyRetry(() => import('./pages/CategoryPage'));
const Notifications = lazyRetry(() => import('./pages/Notifications'));
const Volunteers = lazyRetry(() => import('./pages/Volunteers'));
const CategoryManagement = lazyRetry(() => import("./pages/CategoryManagement.tsx"));
const RecycleBin = lazyRetry(() => import('./pages/RecycleBin'));

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

// Loading skeleton component for lazy routes
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
    <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin" />
    <p className="text-sm font-medium text-gray-500 animate-pulse">Loading experience...</p>
  </div>
);

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
          const key = cat.name.toLowerCase().replace(/\s+/g, '_');
          newTitles[key] = `${cat.name} Donations`;
          newMap[key] = cat.name;
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
    return (
      <Suspense fallback={<PageLoader />}>
        {catSection ? (
          <CategoryPage darkMode={darkMode} category={catSection} />
        ) : (
          (() => {
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
          })()
        )}
      </Suspense>
    );
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
                <div className={`p-4 lg:p-6 h-full flex flex-col`}>
                  <div className={`flex-1 flex flex-col min-h-0 animate-[fadeIn_0.3s_ease-out]`} key={activeSection}>
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
