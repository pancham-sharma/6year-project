import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { dark, t } = useApp();

  return (
    <footer className={`${dark ? 'bg-near-black border-white/10' : 'bg-pure-white border-[rgba(0,0,0,0.05)]'} border-t pt-10 pb-6`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-6 group cursor-pointer">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${
                dark ? 'bg-white/5 border border-white/20' : 'bg-transparent'
              }`}>
                <Heart className={`w-6 h-6 transition-transform duration-500 ${
                  dark ? 'text-white' : 'text-slate-900'
                }`} strokeWidth={2} fill="none" />
              </div>
              <span className={`text-2xl font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-white' : 'text-slate-900'}`}>Seva<span className="text-brand">Marg</span></span>
            </div>
            <p className={`text-[15px] leading-relaxed mb-6 ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>{t.footer.tagline}</p>
            <div className="flex gap-2">
              {['facebook', 'twitter', 'instagram'].map(s => (
                <a key={s} href="#" className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-white/10 text-slate-300 hover:text-brand hover:bg-white/20' : 'bg-slate-100 text-slate-600 hover:text-brand'}`}>
                  <span className="text-[10px] font-bold uppercase mono-label">{s[0]}</span>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className={`mono-label text-[13px] mb-6 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>{t.footer.quickLinks}</h4>
            <div className="space-y-3">
              {[{ to: '/', label: t.nav.home }, { to: '/categories', label: t.nav.categories }, { to: '/about', label: t.nav.about }, { to: '/volunteer', label: t.nav.volunteer }, { to: '/stories', label: t.nav.stories }].map(l => (
                <Link key={l.to} to={l.to} className={`block text-[15px] font-medium transition-colors ${dark ? 'text-slate-400 hover:text-brand' : 'text-slate-600 hover:text-brand'}`}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className={`mono-label text-[13px] mb-6 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>{t.footer.contact}</h4>
            <div className="space-y-4">
              <div className={`flex items-start gap-3 text-[15px] ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <MapPin className={`w-4 h-4 mt-1 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>123 Seva Marg, Andheri West, Mumbai 400058</span>
              </div>
              <div className={`flex items-center gap-3 text-[15px] ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <Phone className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>+91 98765 43210</span>
              </div>
              <div className={`flex items-center gap-3 text-[15px] ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <Mail className={`w-4 h-4 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>hello@sevamarg.org</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className={`mono-label text-[13px] mb-6 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Newsletter</h4>
            <p className={`text-[15px] mb-6 ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>Stay updated with our impact stories</p>
            <div className="relative group">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className={`w-full px-5 py-4 rounded-2xl border-2 transition-all outline-none ${
                  dark 
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-brand' 
                    : 'bg-white border-gray-100 text-near-black placeholder:text-gray-400 focus:border-[#0f172b] shadow-sm'
                }`} 
              />
              <button className={`absolute right-1.5 top-1.5 bottom-1.5 px-6 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                dark 
                  ? 'bg-white text-slate-900 shadow-lg shadow-white/5 hover:bg-brand' 
                  : 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
              }`}>
                Join
              </button>
            </div>
          </div>
        </div>

        <div className={`mt-10 pt-6 border-t ${dark ? 'border-white/5' : 'border-gray-100'} flex flex-col sm:flex-row items-center justify-between gap-4`}>
          <p className={`text-[11px] font-bold tracking-widest uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            &copy; {new Date().getFullYear()} Seva Marg. All Rights Reserved.
          </p>
          <div className={`flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
            Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> for a better world
          </div>
        </div>
      </div>
    </footer>
  );
}
