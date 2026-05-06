import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Menu, X, Sun, Moon, Globe, Bell, User } from 'lucide-react';

export default function Navbar() {
  const { dark, toggleDark, lang, setLang, t, isLoggedIn, notifications } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { to: '/', label: t.nav.home },
    { to: '/categories', label: t.nav.categories },
    { to: '/about', label: t.nav.about },
    { to: '/stories', label: t.nav.stories },
    { to: '/volunteer', label: t.nav.volunteer },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${dark ? 'bg-[#0f172b]/95' : 'bg-white/95'} backdrop-blur-lg border-b ${dark ? 'border-white/10' : 'border-gray-100'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transform transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${
              dark ? 'bg-white/5 border border-white/10' : 'bg-transparent'
            }`}>
              <Heart className={`w-6 h-6 transition-colors duration-500 ${dark ? 'text-white' : 'text-slate-900'}`} strokeWidth={2} fill="none" />
            </div>
            <span className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
              Seva<span className="text-brand">Marg</span>
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-300 ${
                  isActive(link.to)
                    ? dark 
                      ? 'bg-white/10 text-white' 
                      : 'bg-slate-900/5 text-slate-900'
                    : dark 
                      ? 'text-slate-400 hover:text-white' 
                      : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className={`p-2 rounded-xl transition-all duration-300 ${dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-600 hover:bg-gray-100'}`} title="Switch Language">
              <Globe className="w-4 h-4" />
              <span className="text-xs ml-1 font-bold">{lang === 'en' ? 'हि' : 'EN'}</span>
            </button>
            <button onClick={toggleDark} className={`p-2 rounded-xl transition-all duration-300 ${dark ? 'text-yellow-400 hover:bg-white/10' : 'text-slate-600 hover:bg-gray-100'}`}>
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isLoggedIn && (
              <Link to="/notifications" className={`relative p-2 rounded-xl transition-all duration-300 ${dark ? 'text-slate-200' : 'text-slate-600'}`}>
                <Bell className="w-5 h-5" />
                {notifications?.filter((n: any) => !n.read).length > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                    {notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </Link>
            )}

            {isLoggedIn ? (
              <Link to="/dashboard" className={`p-2 rounded-xl transition-all duration-300 ${dark ? 'text-slate-200 hover:bg-white/10' : 'text-slate-600 hover:bg-gray-100'}`}>
                <User className="w-4 h-4" />
              </Link>
            ) : (
              <Link to="/auth" className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-300 ${dark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-gray-100'}`}>
                {t.nav.login}
              </Link>
            )}

            <Link to="/donate" className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 active:scale-95 shadow-lg ${
              dark 
                ? 'bg-white text-slate-900 shadow-white/10 hover:bg-brand hover:text-slate-900 hover:shadow-brand/20' 
                : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
            }`}>
              {t.nav.donate}
            </Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className={`lg:hidden p-2 rounded-lg ${dark ? 'text-gray-300' : 'text-near-black'}`}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className={`lg:hidden border-t ${dark ? 'bg-near-black border-white/10' : 'bg-pure-white border-[rgba(0,0,0,0.05)]'} animate-fade-in`}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} onClick={() => setMobileOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${isActive(link.to) ? 'text-brand' : dark ? 'text-gray-300' : 'text-near-black/70'}`}>
                {link.label}
              </Link>
            ))}
            {isLoggedIn && (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${dark ? 'text-gray-300' : 'text-near-black/70'}`}>
                {t.nav.dashboard}
              </Link>
            )}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
              <button onClick={() => setLang(lang === 'en' ? 'hi' : 'en')} className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-bold ${dark ? 'text-gray-300' : 'text-near-black/70'}`}>
                <Globe className="w-4 h-4" /> {lang === 'en' ? 'हिंदी' : 'English'}
              </button>
              <button onClick={toggleDark} className={`px-3 py-2 rounded-lg text-sm ${dark ? 'text-yellow-400' : 'text-near-black/70'}`}>
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
            {!isLoggedIn && (
              <Link to="/auth" onClick={() => setMobileOpen(false)} className={`block px-3 py-2.5 rounded-lg text-sm font-semibold ${dark ? 'text-gray-300' : 'text-near-black/70'}`}>
                {t.nav.login}
              </Link>
            )}
            <Link to="/donate" onClick={() => setMobileOpen(false)} className="block text-center mt-4 mint-button-primary">
              {t.nav.donate}
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
