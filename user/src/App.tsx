import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Categories from './pages/Categories';
import DonationForm from './pages/DonationForm';
import About from './pages/About';
import Stories from './pages/Stories';
import Volunteer from './pages/Volunteer';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { dark } = useApp();
  const location = useLocation();
  const hideFooterRoutes = ['/auth', '/dashboard', '/notifications'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-slate-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/about" element={<About />} />
          <Route path="/stories" element={<Stories />} />
          <Route path="/volunteer" element={<Volunteer />} />
          
          {/* Protected Routes */}
          <Route path="/donate" element={
            <PrivateRoute>
              <DonationForm />
            </PrivateRoute>
          } />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/notifications" element={
            <PrivateRoute>
              <Notifications />
            </PrivateRoute>
          } />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
}
