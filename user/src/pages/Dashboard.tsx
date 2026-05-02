import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useLocation } from 'react-router-dom';
import { User, MapPin, Clock, Download, HandHeart, TreePine, Utensils, TrendingUp, CheckCircle, Package, Loader, Mail, Send, Truck, Calendar, LogOut } from 'lucide-react';
import { fetchAPI } from '../utils/api';

export default function Dashboard() {
  const { dark, t, user: appUser, setUser: setAppUser, setNotifications, logout } = useApp();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'history' | 'profile' | 'addresses' | 'messages' | 'pickups'>('history');
  const [showDonationToast, setShowDonationToast] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  const [donations, setDonations] = useState<any[]>([]);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone_number: '', city: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    // Show success toast if coming from donation form
    if (location.state?.donated) {
      setShowDonationToast(true);
      const timer = setTimeout(() => setShowDonationToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [donsRes, notifRes, profRes, msgRes, volRes] = await Promise.all([
          fetchAPI('/api/donations/').catch(() => []),
          fetchAPI('/api/chat/notifications/').catch(() => []),
          fetchAPI('/api/users/profile/').catch(() => null),
          fetchAPI('/api/chat/messages/').catch(() => []),
          fetchAPI('/api/users/volunteer/').catch(() => [])
        ]);
        
        setDonations(donsRes.results || donsRes || []);
        setNotifications(notifRes.results || notifRes || []);
        setMessages(msgRes.results || msgRes || []);

        // --- Volunteer Status Monitor ---
        const apps = volRes.results || volRes || [];
        const prevStatuses = JSON.parse(localStorage.getItem('vol_app_statuses') || '{}');
        const newStatuses: Record<string, string> = {};
        
        for (const app of apps) {
          newStatuses[app.id] = app.status;
          // If status changed from Pending or doesn't exist, and is now Approved/Rejected
          if (prevStatuses[app.id] !== app.status && prevStatuses[app.id] && app.status !== 'Pending') {
            await fetchAPI('/api/chat/notifications/', {
              method: 'POST',
              body: JSON.stringify({
                title: 'Volunteer Status Updated',
                message: `Your application for ${app.volunteering_role} has been ${app.status.toLowerCase()}.`
              })
            }).catch(() => {});
          }
        }
        localStorage.setItem('vol_app_statuses', JSON.stringify(newStatuses));
        // ---------------------------------

        if (profRes) {
          setProfileForm({
            first_name: profRes.first_name || '',
            last_name: profRes.last_name || '',
            email: profRes.email || '',
            phone_number: profRes.phone_number || '',
            city: profRes.city || ''
          });
          // Sync global user context so the display name at top is always real DB data
          setAppUser({
            name: profRes.first_name
              ? `${profRes.first_name} ${profRes.last_name || ''}`.trim()
              : profRes.username || '',
            email: profRes.email || '',
            phone: profRes.phone_number || '',
            city: profRes.city || '',
            role: profRes.role || '',
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    loadDashboardData();
  }, []);

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      const res = await fetchAPI('/api/users/profile/', {
        method: 'PATCH',
        body: JSON.stringify(profileForm)
      });
      setProfileSuccess('Profile updated successfully!');
      setAppUser({
        name: res.first_name
          ? `${res.first_name} ${res.last_name || ''}`.trim()
          : res.username || '',
        email: res.email || '',
        phone: res.phone_number || '',
        city: res.city || '',
        role: res.role || '',
      });
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSendMessage = async () => {
    if (!replyText.trim()) return;
    setSendingMsg(true);
    try {
      // Find the admin user ID from received messages, or default to 1
      const adminMsg = messages.find(m => m.sender_username === 'admin');
      const adminId = adminMsg ? adminMsg.sender : 1;

      const newMsg = await fetchAPI('/api/chat/messages/', {
        method: 'POST',
        body: JSON.stringify({
          receiver: adminId,
          message_body: replyText
        })
      });
      setMessages([...messages, newMsg]);
      setReplyText('');
    } catch (err) {
      console.error("Failed to send message", err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleDownloadReceipt = async (donationId: number) => {
    try {
      const blob = await fetchAPI(`/api/donations/${donationId}/receipt/`);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donation_receipt_${donationId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Download error:', err);
      alert('Failed to download receipt: ' + err.message);
    }
  };

  // Notifications logic removed as it is handled globally or unused here

  const tabs = [
    { key: 'history' as const, label: t.dashboard.history, icon: Clock },
    { key: 'pickups' as const, label: 'Pickup Status', icon: Truck },
    { key: 'profile' as const, label: t.dashboard.profile, icon: User },
    { key: 'addresses' as const, label: t.dashboard.addresses, icon: MapPin },
    { key: 'messages' as const, label: 'Messages', icon: Mail },
  ];

  // Derived Stats
  const totalDonations = donations.length;
  const foodMeals = donations.filter(d => d.category === 'Food').length * 10;
  const treesPlanted = donations.filter(d => d.category === 'Environment').length * 5;
  const familiesHelped = Math.floor(totalDonations * 2.5);

  // Extract unique addresses from pickup_details
  const uniqueAddresses = Array.from(new Set(
    donations.filter(d => d.pickup_details?.full_address)
             .map(d => `${d.pickup_details.full_address}, ${d.pickup_details.city}, ${d.pickup_details.state} ${d.pickup_details.pincode}`)
  ));

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${dark ? 'bg-[#0f172b]' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Donation Success Toast */}
        {showDonationToast && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
            <div className={`flex items-center gap-3 px-5 py-3.5 ${dark ? 'bg-white text-slate-900' : 'bg-[#0f172b] text-white'} rounded-2xl shadow-2xl shadow-slate-900/20 animate-fade-in border ${dark ? 'border-gray-200' : 'border-slate-800'}`}>
              <CheckCircle className={`w-5 h-5 flex-shrink-0 ${dark ? 'text-green-600' : 'text-brand'}`} />
              <span className="text-sm font-bold">🎉 Donation saved successfully! Thank you for your generosity.</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.title}</h1>
          <p className={`mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{t.dashboard.welcome}, {appUser.name}! 👋</p>
        </div>

        {/* Impact Summary */}
        <div className={`rounded-3xl p-6 sm:p-8 mb-8 relative overflow-hidden text-white transition-all duration-500 ${dark ? 'bg-white/5 border border-white/10' : 'bg-[#0f172b] shadow-2xl shadow-slate-900/20'}`}>
          <div className="absolute inset-0 opacity-10 bg-gradient-to-br from-brand to-transparent" />
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl font-bold mb-1">{t.dashboard.impact}</h2>
            <p className="text-white/80 text-sm mb-6">{t.dashboard.helped} <span className="text-2xl font-bold">{familiesHelped}</span> {t.dashboard.people}</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { icon: Package, label: 'Total Donations', value: totalDonations.toString() },
                { icon: Utensils, label: 'Meals Provided', value: foodMeals.toString() },
                { icon: TreePine, label: 'Trees Planted', value: treesPlanted.toString() },
                { icon: HandHeart, label: 'Families Helped', value: familiesHelped.toString() },
              ].map((s, i) => (
                <div key={i} className={`rounded-2xl p-4 text-center backdrop-blur-sm transition-colors ${dark ? 'bg-white/10 hover:bg-white/20' : 'bg-white/10 hover:bg-white/20'}`}>
                  <s.icon className={`w-6 h-6 mx-auto mb-2 ${dark ? 'text-brand' : 'text-brand'}`} />
                  <div className="text-2xl font-bold">{s.value}</div>
                  <div className="text-xs text-white/70">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all shadow-sm active:scale-95 ${
                activeTab === tab.key
                  ? dark ? 'bg-white text-[#0f172b] shadow-lg shadow-white/10' : 'bg-[#0f172b] text-white shadow-xl shadow-slate-900/30'
                  : dark ? 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white' : 'bg-white text-slate-500 hover:bg-gray-100 hover:text-slate-900'
              }`}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className={`rounded-3xl p-6 sm:p-8 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-xl shadow-gray-200/20 border-gray-100 min-h-[400px]'}`}>
          {loading ? (
             <div className="flex justify-center items-center h-48"><Loader className="w-8 h-8 animate-spin text-primary-500" /></div>
          ) : (
            <>
              {/* Donation History */}
              {activeTab === 'history' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.history}</h3>
                  </div>
                  <div className="space-y-4">
                    {donations.length === 0 ? (
                      <div className="text-center py-10">
                        <p className={`text-lg mb-2 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No donations found in database.</p>
                      </div>
                    ) : donations.map(d => (
                      <div key={d.id} className={`flex items-center gap-4 p-4 rounded-2xl transition-colors ${dark ? 'bg-slate-700/50 hover:bg-slate-700' : 'bg-gray-50 hover:bg-gray-100'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          d.category === 'Food' ? 'bg-orange-100 text-orange-600' :
                          d.category === 'Clothes' ? 'bg-blue-100 text-blue-600' :
                          d.category === 'Books' ? 'bg-purple-100 text-purple-600' :
                          d.category === 'Monetary' ? 'bg-green-100 text-green-600' :
                          'bg-teal-100 text-teal-600'
                        }`}>
                          {d.category === 'Food' ? '🍲' : d.category === 'Clothes' ? '👕' : d.category === 'Books' ? '📚' : d.category === 'Monetary' ? '💰' : '🌱'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{d.category} Donation</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              d.status === 'Completed' ? (dark ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-green-100 text-green-700') : 
                              d.status === 'Scheduled' ? (dark ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-blue-100 text-blue-700') : 
                              (dark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-700')
                            }`}>
                              <CheckCircle className="w-3 h-3 inline mr-0.5" />{d.status}
                            </span>
                          </div>
                          <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'} mt-1`}>#DON-{d.id} • {new Date(d.timestamp).toLocaleDateString()} • {d.quantity_description}</p>
                          <p className={`text-xs mt-1 font-medium ${dark ? 'text-primary-400' : 'text-primary-600'}`}>
                            🌟 Impact: {d.category === 'Food' ? '10 Meals provided' : d.category === 'Environment' ? '5 Trees planted' : 'Supporting local families'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDownloadReceipt(d.id)}
                            className={`p-2 rounded-lg ${dark ? 'hover:bg-slate-600' : 'hover:bg-gray-200'}`} 
                            title="Download Receipt"
                          >
                            <Download className={`w-4 h-4 ${dark ? 'text-gray-400' : 'text-gray-500'}`} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pickup Status */}
              {activeTab === 'pickups' && (
                <div className="animate-fade-in">
                  <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>Track Your Pickups</h3>
                  <div className="space-y-4">
                    {donations.filter(d => d.status !== 'Completed' && d.status !== 'Cancelled').length === 0 ? (
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No active pickups at the moment.</p>
                    ) : donations.filter(d => d.status !== 'Completed' && d.status !== 'Cancelled').map(d => (
                      <div key={d.id} className={`p-6 rounded-3xl border-2 transition-all ${d.status === 'Scheduled' ? 'border-blue-500 bg-blue-50/10' : dark ? 'border-slate-700 bg-slate-800/40' : 'border-gray-100 bg-gray-50/50'}`}>
                         <div className="flex justify-between items-start mb-4">
                           <div>
                             <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{d.category} Donation</p>
                             <p className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>#{d.id} · {d.quantity_description}</p>
                           </div>
                           <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                             d.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                           }`}>
                             {d.status}
                           </span>
                         </div>
                         
                         <div className="space-y-3">
                           <div className="flex items-center gap-3 text-sm">
                             <MapPin className="w-4 h-4 text-green-500" />
                             <span className={dark ? 'text-gray-300' : 'text-gray-600'}>{d.pickup_details?.full_address}, {d.pickup_details?.city}</span>
                           </div>
                           {d.pickup_details?.scheduled_date && (
                             <div className="flex items-center gap-3 text-sm">
                               <Calendar className="w-4 h-4 text-blue-500" />
                               <span className={dark ? 'text-gray-300' : 'text-gray-600'}>{d.pickup_details.scheduled_date} at {d.pickup_details.scheduled_time || 'TBD'}</span>
                             </div>
                           )}
                           {d.pickup_details?.assigned_team && (
                             <div className={`mt-4 p-4 rounded-2xl flex items-center gap-4 ${dark ? 'bg-white/5' : 'bg-white border border-gray-100 shadow-sm'}`}>
                               <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl">🚚</div>
                               <div className="flex-1">
                                 <p className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Assigned Team</p>
                                 <p className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{d.pickup_details.assigned_team}</p>
                                 <p className={`text-[11px] ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Our team will arrive as per the scheduled slot.</p>
                               </div>
                             </div>
                           )}
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Profile */}
              {activeTab === 'profile' && (
                <div className="animate-fade-in">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.profile}</h3>
                    <button 
                      onClick={logout}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        dark 
                          ? 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white' 
                          : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white shadow-sm'
                      }`}
                    >
                      <LogOut className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-3xl text-white font-bold">
                      {appUser.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{appUser.name}</h4>
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{appUser.role === 'ADMIN' ? 'Administrator' : appUser.role === 'VOLUNTEER' ? 'Seva Marg Volunteer' : 'Seva Marg Donor'}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-4 h-4 text-primary-500" />
                        <span className={`text-xs font-medium ${dark ? 'text-primary-400' : 'text-primary-600'}`}>
                          {appUser.role === 'ADMIN' ? 'System Master' : appUser.role === 'VOLUNTEER' ? 'Impact Partner' : 'Impact Champion'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {profileSuccess && <div className="mb-4 p-3 bg-green-100 text-green-700 text-sm font-medium rounded-xl">{profileSuccess}</div>}
                  {profileError && <div className="mb-4 p-3 bg-red-100 text-red-700 text-sm font-medium rounded-xl">{profileError}</div>}

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>First Name</label>
                        <input type="text" value={profileForm.first_name} onChange={e => setProfileForm(p => ({ ...p, first_name: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Last Name</label>
                        <input type="text" value={profileForm.last_name} onChange={e => setProfileForm(p => ({ ...p, last_name: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                    </div>
                    <div>
                      <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Email</label>
                      <input type="email" value={profileForm.email} onChange={e => setProfileForm(p => ({ ...p, email: e.target.value }))}
                        className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>Phone</label>
                        <input type="text" value={profileForm.phone_number} onChange={e => setProfileForm(p => ({ ...p, phone_number: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                      <div>
                        <label className={`block text-sm font-semibold mb-1 ${dark ? 'text-gray-300' : 'text-gray-600'}`}>City</label>
                        <input type="text" value={profileForm.city} onChange={e => setProfileForm(p => ({ ...p, city: e.target.value }))}
                          className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                      </div>
                    </div>
                    <button 
                      onClick={handleProfileSave} 
                      disabled={savingProfile} 
                      className={`px-8 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 border-2 ${
                        dark 
                          ? 'bg-primary-500 text-white border-primary-400 shadow-lg shadow-primary-500/20 hover:scale-105' 
                          : 'bg-[#0f172b] text-white border-white/10 shadow-xl shadow-slate-900/20 hover:scale-105'
                      }`}
                    >
                      {savingProfile ? <Loader className="w-4 h-4 animate-spin" /> : null} Save Changes
                    </button>
                  </div>
                </div>
              )}

              {/* Saved Addresses */}
              {activeTab === 'addresses' && (
                <div className="animate-fade-in">
                  <h3 className={`text-lg font-bold mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.dashboard.addresses}</h3>
                  <div className="space-y-4">
                    {uniqueAddresses.length === 0 ? (
                      <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No addresses found. Complete a donation to save your pickup address.</p>
                    ) : uniqueAddresses.map((addr, i) => (
                      <div key={i} className={`p-4 rounded-2xl border-2 ${i === 0 ? 'border-primary-500' : dark ? 'border-slate-600' : 'border-gray-200'} ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className={`w-4 h-4 ${i === 0 ? 'text-primary-500' : dark ? 'text-gray-500' : 'text-gray-400'}`} />
                          <span className={`font-semibold text-sm ${dark ? 'text-white' : 'text-gray-900'}`}>{i === 0 ? 'Primary Address' : 'Past Address'}</span>
                          {i === 0 && <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full font-medium">Default</span>}
                        </div>
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{addr}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages from Admin (Chat Inbox) */}
              {activeTab === 'messages' && (
                <div className="animate-fade-in flex flex-col h-[500px]">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>Chat with Administrator</h3>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                       <span className={`text-xs font-medium ${dark ? 'text-gray-400' : 'text-slate-600'}`}>Support Online</span>
                    </div>
                  </div>
                  
                  {/* Message List */}
                  <div className={`flex-1 overflow-y-auto mb-4 space-y-4 pr-2 custom-scrollbar`}>
                    {messages.length === 0 ? (
                      <div className="h-full flex items-center justify-center">
                        <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>No messages yet. Send a message to start the conversation.</p>
                      </div>
                    ) : messages.map(m => {
                      const isMe = m.sender_username !== 'admin';
                      return (
                        <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-4 rounded-2xl ${
                            isMe 
                              ? `bg-primary-500 ${dark ? 'text-white' : 'text-slate-900'} rounded-tr-none shadow-md shadow-primary-500/20` 
                              : dark ? 'bg-slate-700 text-gray-200 rounded-tl-none border border-slate-600' : 'bg-slate-50 text-slate-900 border border-slate-200 rounded-tl-none shadow-sm'
                          }`}>
                            {!isMe && <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${dark ? 'text-white/60' : 'text-slate-500'}`}>Administrator</p>}
                            <p className="text-sm leading-relaxed">{m.message_body}</p>
                            <p className={`text-[9px] mt-1 text-right opacity-60`}>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Send Input */}
                  <div className="relative mt-auto">
                    <input 
                      type="text" 
                      value={replyText} 
                      onChange={e => setReplyText(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message to admin..." 
                      className={`w-full pl-5 pr-14 py-4 rounded-2xl border-2 transition-all ${
                        dark ? 'bg-slate-800 border-slate-700 text-white focus:border-primary-500' : 'bg-white border-gray-100 focus:border-primary-500 shadow-sm'
                      } outline-none text-sm`}
                    />
                    <button 
                      onClick={handleSendMessage}
                      disabled={sendingMsg || !replyText.trim()}
                      className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${
                        replyText.trim() ? 'bg-primary-500 text-white shadow-lg' : 'bg-gray-200 text-gray-400 dark:bg-slate-700'
                      }`}
                    >
                      {sendingMsg ? <Loader className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
