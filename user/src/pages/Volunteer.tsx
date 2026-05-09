import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Users, BookOpen, Megaphone, Truck, CheckCircle, Star, MapPin, Loader } from 'lucide-react';
import { fetchAPI } from '../utils/api';

const roles = [
  { value: 'teaching', label: 'Teaching', labelHi: 'शिक्षण', icon: BookOpen, desc: 'Help children learn and grow at community centers', color: 'from-purple-400 to-pink-400' },
  { value: 'distribution', label: 'Distribution', labelHi: 'वितरण', icon: Truck, desc: 'Deliver donations to families and communities in need', color: 'from-blue-400 to-indigo-400' },
  { value: 'awareness', label: 'Awareness Campaigns', labelHi: 'जागरूकता अभियान', icon: Megaphone, desc: 'Spread the word and organize community events', color: 'from-orange-400 to-red-400' },
  { value: 'tree', label: 'Tree Plantation', labelHi: 'वृक्षारोपण', icon: Heart, desc: 'Plant and nurture trees for a greener future', color: 'from-green-400 to-emerald-400' },
];

export default function Volunteer() {
  const { dark, t, lang, isLoggedIn } = useApp();
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '', role: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [pastApplications, setPastApplications] = useState<any[]>([]);

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  // Load past applications and monitor for status changes
  useEffect(() => {
    const checkStatusChanges = async () => {
      try {
        const data = await fetchAPI('/api/users/volunteer/');
        const apps = data.results || data || [];
        // Case-insensitive filter out 'Recycled' status with safety check
        setPastApplications(Array.isArray(apps) ? apps.filter((app: any) => app.status && app.status.toLowerCase() !== 'recycled') : []);

        // Get previous statuses from localStorage
        const prevStatuses = JSON.parse(localStorage.getItem('vol_app_statuses') || '{}');
        let changed = false;

        apps.forEach(async (app: any) => {
          const oldStatus = prevStatuses[app.id];
          if (oldStatus && oldStatus === 'Pending' && app.status !== 'Pending') {
            changed = true;
            // Create a notification for the status change
            await fetchAPI('/api/chat/notifications/', {
              method: 'POST',
              body: JSON.stringify({
                title: `Application ${app.status}`,
                message: `Your volunteer application for ${app.volunteering_role} in ${app.city} has been ${app.status.toLowerCase()}.`
              })
            }).catch(() => {});
          }
          prevStatuses[app.id] = app.status;
        });

        if (changed || Object.keys(prevStatuses).length !== apps.length) {
          localStorage.setItem('vol_app_statuses', JSON.stringify(prevStatuses));
        }
      } catch (err) {
        console.error('Failed to check volunteer status', err);
      }
    };

    if (isLoggedIn) {
      checkStatusChanges();
      const interval = setInterval(checkStatusChanges, 60000);
      return () => clearInterval(interval);
    }
  }, []);

  if (submitted) {
    return (
      <div className={`min-h-screen pt-24 pb-16 flex items-center justify-center ${dark ? 'bg-slate-900' : 'bg-gradient-to-b from-primary-50/30 to-white'}`}>
        <div className={`max-w-md w-full mx-4 rounded-3xl p-8 text-center animate-scale-in ${dark ? 'bg-slate-800' : 'bg-white shadow-xl'}`}>
          <div className="w-20 h-20 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h2 className={`text-2xl font-bold font-serif mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Welcome to the Family! 🎉</h2>
          <p className={`mb-6 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Your volunteer application has been saved. Our team will reach out to you shortly!</p>
          <p className={`text-sm mb-6 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Application saved to database ✓</p>
          <button onClick={() => { setSubmitted(false); setForm({ name: '', email: '', phone: '', city: '', role: '', message: '' }); }}
            className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 ${
              dark 
                ? 'bg-white text-[#0f172b] shadow-xl shadow-white/10' 
                : 'bg-[#0f172b] text-white shadow-2xl shadow-slate-900/40'
            }`}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pt-16 ${dark ? 'bg-[#0f172b]' : 'bg-slate-50'}`}>
      {/* Hero Banner */}
      <div className="max-w-7xl mx-auto px-4 mb-12 pt-8">
        <div className={`relative rounded-[32px] overflow-hidden shadow-2xl group`}>
          <img 
            src="https://images.unsplash.com/photo-1593113598332-cd288d649433?q=80&w=2000" 
            alt="Join the Movement" 
            className="w-full h-[300px] md:h-[450px] object-cover transition-transform duration-1000 group-hover:scale-105" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 bg-white/20 backdrop-blur-md text-white border border-white/10 w-fit">
              <Users className="w-3 h-3" /> Join the Movement
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-serif text-white mb-4 tracking-tight drop-shadow-lg leading-tight">
              {t.volunteer.title}
            </h1>
            <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-xl font-medium drop-shadow-md">
              {t.volunteer.sub}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
          {[
            { num: '2,500+', label: 'Active Volunteers' },
            { num: '50+', label: 'Cities' },
            { num: '100+', label: 'Events/Month' },
          ].map((s, i) => (
            <div key={i} className={`flex flex-col items-center justify-center text-center p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-slate-800' : 'bg-white shadow-md border border-gray-100'}`}>
              <div className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{s.num}</div>
              <div className={`text-[13px] font-medium mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Role Selection */}
          <div>
            <h3 className={`text-xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.volunteer.roles}</h3>
            <div className="space-y-4">
              {roles.map(role => {
                const existingApp = pastApplications.find(a => a.volunteering_role === role.value);
                const isApproved = existingApp?.status === 'Approved';
                const isPending = existingApp?.status === 'Pending';
                const isDisabled = isApproved || isPending;

                return (
                  <button key={role.value} onClick={() => !isDisabled && update('role', role.value)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                      isDisabled ? 'opacity-60 cursor-not-allowed bg-slate-100/50' : 
                      form.role === role.value ? 'border-primary-500 shadow-md shadow-primary-500/10' : 
                      dark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center flex-shrink-0 shadow-lg ${isDisabled ? 'grayscale opacity-50' : ''}`}>
                      <role.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>{lang === 'hi' ? role.labelHi : role.label}</h4>
                        {isApproved && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-500 text-white uppercase tracking-wider">✓ Active</span>}
                        {isPending && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white uppercase tracking-wider">⏳ Reviewing</span>}
                      </div>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{role.desc}</p>
                    </div>
                    {form.role === role.value && !isDisabled && (
                      <CheckCircle className={`w-5 h-5 ml-auto flex-shrink-0 ${dark ? 'text-white' : 'text-primary-500'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Roles End */}
          </div>

          {/* Form */}
          <div className={`rounded-3xl p-6 sm:p-8 ${dark ? 'bg-slate-800' : 'bg-white shadow-xl border border-gray-100'}`}>
            <h3 className={`text-xl font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Your Details</h3>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-medium rounded-xl">{errorMsg}</div>
            )}

            {/* Status moved to Dashboard */}


            <form onSubmit={async (e) => {
              e.preventDefault();
              const existingApp = pastApplications.find(a => a.volunteering_role === form.role);
              if (existingApp?.status === 'Pending') {
                setErrorMsg('You already have a pending application for this role.');
                return;
              }
              if (existingApp?.status === 'Approved') {
                setErrorMsg('You are already an approved volunteer for this role!');
                return;
              }
              if (!form.role) { setErrorMsg('Please select a volunteering role.'); return; }
              setLoading(true);
              setErrorMsg('');
              try {
                await fetchAPI('/api/users/volunteer/', {
                  method: 'POST',
                  body: JSON.stringify({
                    name: form.name,
                    email: form.email,
                    phone: form.phone,
                    city: form.city,
                    volunteering_role: form.role,
                    message: form.message,
                  })
                });
                
                // Create a notification for the user about the submission
                await fetchAPI('/api/chat/notifications/', {
                  method: 'POST',
                  body: JSON.stringify({
                    title: 'Application Submitted',
                    message: `Your application for ${form.role} has been received and is under review.`
                  })
                }).catch(() => {}); // Don't break if notification fails

                setSubmitted(true);
                
                // Update local status cache so the monitor doesn't trigger on new submission
                const latestApps = await fetchAPI('/api/users/volunteer/').catch(() => []);
                const appsData = latestApps.results || latestApps || [];
                const currentStatuses = JSON.parse(localStorage.getItem('vol_app_statuses') || '{}');
                appsData.forEach((app: any) => { currentStatuses[app.id] = app.status; });
                localStorage.setItem('vol_app_statuses', JSON.stringify(currentStatuses));
                
                // Update past applications list locally to disable the role immediately
                setPastApplications(appsData);
              } catch (err: any) {
                setErrorMsg(err.message || 'Submission Failed. Please Login First');
              } finally {
                setLoading(false);
              }
            }} className="space-y-4">
              {[
                { key: 'name', label: t.auth.name, type: 'text', icon: Users },
                { key: 'email', label: t.auth.email, type: 'email', icon: Star },
                { key: 'phone', label: t.auth.phone, type: 'tel', icon: Megaphone },
                { key: 'city', label: t.auth.city, type: 'text', icon: MapPin },
              ].map(f => (
                <div key={f.key} className="relative">
                  <f.icon className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                  <input type={f.type} placeholder={f.label} value={form[f.key as keyof typeof form]} onChange={e => update(f.key, e.target.value)}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 text-sm transition-all ${
                      dark 
                        ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-brand' 
                        : 'bg-white border-gray-100 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 shadow-sm'
                    } outline-none`} />
                </div>
              ))}
              <textarea placeholder="Why do you want to volunteer? (Optional)" value={form.message} onChange={e => update('message', e.target.value)} rows={3}
                className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none transition-all ${
                  dark 
                    ? 'bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-400 focus:border-brand' 
                    : 'bg-white border-gray-100 text-slate-900 placeholder:text-slate-400 focus:border-slate-900 shadow-sm'
                } outline-none`} />
              <button type="submit" disabled={loading} 
                className={`w-full flex justify-center py-4 rounded-xl font-bold transition-all active:scale-95 ${
                  loading
                    ? (dark ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
                    : (dark 
                        ? 'bg-white text-[#0f172b] shadow-xl shadow-white/10 hover:bg-slate-100' 
                        : 'bg-[#0f172b] text-white shadow-2xl shadow-slate-900/40 hover:bg-slate-800')
                }`}>
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : t.volunteer.submit}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
