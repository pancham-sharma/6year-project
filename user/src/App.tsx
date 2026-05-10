import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useEffect } from 'react';
import QueryProvider from './providers/QueryProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Auth from './pages/Auth';
import Categories from './pages/Categories';
import DonationForm from './pages/DonationForm';
import About from './pages/About';
import Volunteer from './pages/Volunteer';
import Dashboard from './pages/Dashboard';
import Notifications from './pages/Notifications';
import VerifyEmail from './pages/VerifyEmail';
import EmailVerified from './pages/EmailVerified';
import ForgotPassword from './pages/ForgotPassword';
import PasswordResetSuccess from './pages/PasswordResetSuccess';
import Stories from './pages/Stories';

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
  const hideFooterRoutes = ['/auth', '/dashboard', '/notifications', '/verify-email', '/email-verified', '/forgot-password', '/password-reset-success'];
  const hideNavbarRoutes = ['/auth', '/verify-email', '/email-verified', '/forgot-password', '/password-reset-success'];
  const shouldHideFooter = hideFooterRoutes.includes(location.pathname);
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${dark ? 'bg-slate-900 text-gray-100' : 'bg-white text-gray-900'}`}>
      <ScrollToTop />
      {!shouldHideNavbar && <Navbar />}
      <main className="pb-16 md:pb-24 lg:pb-32">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/about" element={<About />} />
          <Route path="/volunteer" element={<Volunteer />} />
          <Route path="/stories" element={<Stories />} />

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

          {/* Verification & Password Routes */}
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/email-verified" element={<EmailVerified />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/password-reset-success" element={<PasswordResetSuccess />} />
        </Routes>
      </main>
      {!shouldHideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <QueryProvider>
      <AppProvider>
        <Router>
          <AppContent />
        </Router>
      </AppProvider>
    </QueryProvider>
  );
}
