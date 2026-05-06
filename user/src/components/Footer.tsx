import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { Heart, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const { dark, t } = useApp();

  return (
    <footer className={`${dark ? 'bg-near-black border-white/10' : 'bg-pure-white border-[rgba(0,0,0,0.05)]'} border-t pt-8 pb-6`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-y-8 lg:gap-8 text-center md:text-left">
          <div className="lg:col-span-1 flex flex-col items-center md:items-start">
            <div className="flex items-center gap-2 mb-3 group cursor-pointer justify-center md:justify-start">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-500 group-hover:rotate-12 group-hover:scale-110 ${
                dark ? 'bg-white/5 border border-white/20' : 'bg-transparent'
              }`}>
                <Heart className={`w-5 h-5 transition-transform duration-500 ${
                  dark ? 'text-white' : 'text-slate-900'
                }`} strokeWidth={2} fill="none" />
              </div>
              <span className={`text-xl font-bold tracking-tight transition-colors duration-500 ${dark ? 'text-white' : 'text-slate-900'}`}>Seva<span className="text-brand">Marg</span></span>
            </div>
            <p className={`text-[13px] leading-relaxed mb-3 ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>{t.footer.tagline}</p>
            <div className="flex gap-2.5 justify-center md:justify-start">
              {[
                { s: 'F', url: 'https://www.facebook.com/' },
                { s: 'T', url: 'https://x.com/' },
                { s: 'I', url: 'https://www.instagram.com/' }
              ].map(link => (
                <a key={link.s} href={link.url} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${dark ? 'bg-white/10 text-slate-300 hover:text-brand hover:bg-white/20' : 'bg-slate-50 text-slate-600 hover:text-brand border border-gray-100 shadow-sm'}`}>
                  <span className="text-[10px] font-bold uppercase mono-label">{link.s}</span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className={`mono-label text-[11px] mb-3 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>{t.footer.quickLinks}</h4>
            <div className="space-y-1.5">
              {[{ to: '/', label: t.nav.home }, { to: '/categories', label: t.nav.categories }, { to: '/about', label: t.nav.about }, { to: '/volunteer', label: t.nav.volunteer }, { to: '/stories', label: t.nav.stories }].map(l => (
                <Link key={l.to} to={l.to} className={`block text-[14px] font-medium transition-colors ${dark ? 'text-slate-400 hover:text-brand' : 'text-slate-500 hover:text-brand'}`}>{l.label}</Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className={`mono-label text-[11px] mb-3 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>{t.footer.contact}</h4>
            <div className="space-y-2.5">
              <div className={`flex items-start gap-2.5 text-[14px] justify-center md:justify-start ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <MapPin className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>123 Seva Marg, Andheri West, Mumbai 400058</span>
              </div>
              <div className={`flex items-center gap-2.5 text-[14px] justify-center md:justify-start ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <Phone className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>+91 98765 43210</span>
              </div>
              <div className={`flex items-center gap-2.5 text-[14px] justify-center md:justify-start ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>
                <Mail className={`w-3.5 h-3.5 flex-shrink-0 ${dark ? 'text-brand' : 'text-slate-400'}`} />
                <span>hello@sevamarg.org</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start">
            <h4 className={`mono-label text-[11px] mb-3 font-bold tracking-widest ${dark ? 'text-white' : 'text-slate-900'}`}>Newsletter</h4>
            <p className={`text-[13px] mb-3 ${dark ? 'text-slate-300' : 'text-slate-600 font-medium'}`}>Stay updated with our impact stories</p>
            <div className="relative group w-full max-w-xs">
              <input 
                type="email" 
                placeholder="your@email.com" 
                className={`w-full px-4 py-2.5 rounded-xl border transition-all outline-none text-center md:text-left ${
                  dark 
                    ? 'bg-slate-800/50 border-slate-700 text-white placeholder:text-gray-500 focus:border-brand' 
                    : 'bg-slate-50 border-gray-100 text-near-black placeholder:text-gray-400 focus:border-slate-900'
                }`} 
              />
              <button className={`absolute right-1 top-1 bottom-1 px-3 rounded-lg text-[9px] font-bold transition-all active:scale-95 ${
                dark 
                  ? 'bg-white text-slate-900 hover:bg-brand hover:text-white' 
                  : 'bg-slate-900 text-white shadow-md shadow-slate-900/20 hover:bg-brand'
              }`}>
                Join
              </button>
            </div>
          </div>
        </div>

        <div className={`mt-6 pt-4 border-t ${dark ? 'border-white/5' : 'border-gray-50'} flex flex-col sm:flex-row items-center justify-between gap-1 sm:gap-4 text-center sm:text-left`}>
          <p className={`text-[10px] font-bold tracking-widest uppercase ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            &copy; {new Date().getFullYear()} Seva Marg.
          </p>
          <div className={`flex items-center gap-1 text-[10px] font-bold tracking-widest uppercase ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            Made with <Heart className="w-2.5 h-2.5 text-red-500 fill-red-500" /> for a better world
          </div>
        </div>
      </div>
    </footer>
  );
}
