import { HashRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { useEffect, lazy, Suspense } from 'react';
import QueryProvider from './providers/QueryProvider';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Lazy load pages for performance
const Home = lazy(() => import('./pages/Home'));
const Auth = lazy(() => import('./pages/Auth'));
const Categories = lazy(() => import('./pages/Categories'));
const DonationForm = lazy(() => import('./pages/DonationForm'));
const About = lazy(() => import('./pages/About'));
const Volunteer = lazy(() => import('./pages/Volunteer'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Notifications = lazy(() => import('./pages/Notifications'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));
const EmailVerified = lazy(() => import('./pages/EmailVerified'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const PasswordResetSuccess = lazy(() => import('./pages/PasswordResetSuccess'));
const Stories = lazy(() => import('./pages/Stories'));

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] w-full">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    </div>
  );
}

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
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
