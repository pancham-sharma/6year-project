import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchAPI } from '../utils/api';
import { Check, ChevronRight, ChevronLeft, Package, MapPin, Navigation, Shield, Upload, Calendar, Clock, Utensils, Shirt, BookOpen, Banknote, Sprout, Loader } from 'lucide-react';

const donationTypes = [
  { value: 'food', label: 'Food', icon: Utensils, color: 'from-orange-400 to-red-400' },
  { value: 'clothes', label: 'Clothes', icon: Shirt, color: 'from-blue-400 to-indigo-400' },
  { value: 'books', label: 'Books', icon: BookOpen, color: 'from-purple-400 to-pink-400' },
  { value: 'money', label: 'Monetary', icon: Banknote, color: 'from-green-400 to-emerald-400' },
  { value: 'trees', label: 'Environment', icon: Sprout, color: 'from-teal-400 to-cyan-400' },
];

const categoryMap: Record<string, string> = {
  food: 'Food',
  clothes: 'Clothes',
  books: 'Books',
  money: 'Monetary',
  trees: 'Environment'
};

export default function DonationForm() {
  const { dark, t, user } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    types: [] as string[], quantities: {} as Record<string, string>, descriptions: {} as Record<string, string>, images: {} as Record<string, string | null>,
    address: '', city: '', state: '', pincode: '', landmark: '', phone: '', date: '', time: '',
    useCurrentLocation: false, consent: false, transactionId: '',
  });

  // Pre-fill user details if available
  useEffect(() => {
    if (user.city || user.phone) {
      setForm(prev => ({
        ...prev,
        city: prev.city || user.city || '',
        phone: prev.phone || user.phone || ''
      }));
    }
  }, [user]);

  const steps = [
    { num: 1, label: t.donate.step1, icon: Package },
    { num: 2, label: 'Location & Address', icon: MapPin },
    { num: 3, label: t.donate.step4, icon: Shield },
  ];

  const update = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));
  const updateQuantities = (type: string, val: string) => setForm(p => ({ ...p, quantities: { ...p.quantities, [type]: val } }));
  const updateDescriptions = (type: string, val: string) => setForm(p => ({ ...p, descriptions: { ...p.descriptions, [type]: val } }));

  const handleImageChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setForm(p => ({ ...p, images: { ...p.images, [type]: reader.result as string } }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (form.types.length === 0) return false;
      return form.types.every(type => form.quantities[type]?.trim() && form.descriptions[type]?.trim());
    }
    if (s === 2) {
      return (
        form.address?.trim() &&
        form.city?.trim() &&
        form.state?.trim() &&
        form.pincode?.trim() &&
        form.phone?.trim() &&
        form.date &&
        form.time
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // Create a separate donation record for each type selected
      const promises = form.types.map(type => {
        const payload = {
          category: categoryMap[type],
          quantity: parseInt(form.quantities[type] || '1', 10),
          quantity_description: type === 'money'
            ? `₹${form.quantities[type] || '0'} (Txn: ${form.transactionId})`
            : `${form.quantities[type] || 'N/A'} - ${form.descriptions[type] || ''}`,

          pickup_details: {
            full_address: form.address || '',
            city: form.city || '',
            state: form.state || '',
            pincode: form.pincode || '',
            landmark: form.landmark || '',
            // Split into separate date and time fields as the model expects
            scheduled_date: form.date || null,
            scheduled_time: form.time || null,
          }
        };

        return fetchAPI('/api/donations/', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      });

      await Promise.all(promises);
      // ✅ Redirect to dashboard — live changes will reflect via the data fetch there
      navigate('/dashboard', { state: { donated: true } });
    } catch (err: any) {
      console.error("Submission failed", err);
      setErrorMsg(err.message || "Donation Failed. Please Login First");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen pt-24 pb-16 ${dark ? 'bg-slate-900' : 'bg-gradient-to-b from-primary-50/30 to-white'}`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className={`text-3xl sm:text-4xl font-bold font-serif ${dark ? 'text-white' : 'text-gray-900'}`}>{t.donate.title}</h1>
          <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-accent-500 mx-auto mt-4 rounded-full" />
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-center font-medium">
            {errorMsg}
          </div>
        )}

        {/* Step Progress */}
        <div className="flex items-center justify-center mb-12">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl transition-all duration-300 ${
                step >= s.num 
                  ? (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20') 
                  : (dark ? 'bg-slate-800/50 text-slate-400 border border-slate-700' : 'bg-gray-100 text-slate-500')
              }`}>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${step >= s.num ? (dark ? 'bg-slate-900/20' : 'bg-white/20') : (dark ? 'bg-slate-700' : 'bg-white shadow-sm')}`}>
                  {step > s.num ? (
                    <Check className={`w-4 h-4 ${step >= s.num ? (dark ? 'text-slate-900' : 'text-white') : (dark ? 'text-white' : 'text-slate-900')}`} />
                  ) : (
                    <s.icon className={`w-4 h-4 ${step >= s.num ? (dark ? 'text-slate-900' : 'text-white') : (dark ? 'text-slate-400' : 'text-slate-500')}`} />
                  )}
                </div>
                <span className="text-[13px] font-bold hidden sm:inline">{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 sm:w-16 h-1 mx-2 rounded-full transition-all duration-500 ${step > s.num ? 'bg-brand' : dark ? 'bg-slate-700' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Form Content */}
        <div className={`rounded-3xl p-6 sm:p-8 ${dark ? 'bg-slate-800' : 'bg-white shadow-xl shadow-gray-100/50 border border-gray-100'}`}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.type} (Select multiple)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {donationTypes.map(dt => {
                    const isSelected = form.types.includes(dt.value);
                    return (
                      <button key={dt.value} onClick={() => {
                          const newTypes = isSelected ? form.types.filter(t => t !== dt.value) : [...form.types, dt.value];
                          update('types', newTypes);
                        }}
                        className={`p-4 rounded-2xl border-2 text-center transition-all ${isSelected ? (dark ? 'border-brand bg-brand/10 shadow-lg shadow-brand/20' : 'border-slate-900 bg-slate-50 shadow-lg shadow-slate-900/10') : dark ? 'border-slate-700 hover:border-slate-600' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${dt.color} flex items-center justify-center mx-auto mb-2 ${isSelected ? 'scale-110 shadow-lg' : ''} transition-transform`}>
                          <dt.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className={`text-[13px] font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{dt.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {form.types.length > 0 && (
                <div className={`mt-8 grid gap-6 ${form.types.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                  {form.types.map(type => {
                     const dt = donationTypes.find(d => d.value === type);
                     if (!dt) return null;
                     return (
                       <div key={type} className="p-6 rounded-2xl border-2 border-primary-100 bg-primary-50/20 space-y-4 animate-fade-in">
                         <div className="flex items-center gap-3 mb-2">
                           <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dt.color} flex items-center justify-center`}>
                             <dt.icon className="w-4 h-4 text-white" />
                           </div>
                           <h4 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{dt.label} Details</h4>
                         </div>
                         {type === 'money' ? (
                           <div className="space-y-4">
                             <div>
                               <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Amount (₹) (Required)</label>
                               <input type="text" value={form.quantities[type] || ''} onChange={e => updateQuantities(type, e.target.value)} placeholder="e.g. 500"
                                 className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none`} />
                             </div>
                             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                 <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Transaction ID (Required)</label>
                                 <input type="text" value={form.transactionId} onChange={e => update('transactionId', e.target.value)} placeholder="e.g. UTR Number"
                                   className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm ${dark ? 'bg-slate-800 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none transition-colors`} />
                             </div>
                           </div>
                         ) : (
                            <>
                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Quantity of {dt.label} (Number Required)</label>
                                <input type="number" value={form.quantities[type] || ''} onChange={e => updateQuantities(type, e.target.value)} placeholder="e.g. 10"
                                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none`} />
                              </div>


                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Description (Required)</label>
                                <textarea value={form.descriptions[type] || ''} onChange={e => updateDescriptions(type, e.target.value)} rows={2} placeholder="Describe the items..."
                                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none`} />
                              </div>
                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Upload Image (Optional)</label>
                                <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-300 hover:border-primary-400'} ${form.images[type] ? 'border-primary-500' : ''}`}>
                                  {form.images[type] ? (
                                    <img src={form.images[type] as string} alt="Preview" className="h-full w-full object-cover rounded-xl" />
                                  ) : (
                                    <div className="flex flex-col items-center p-2 text-center">
                                      <Upload className={`w-6 h-6 mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                                      <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Click to upload</span>
                                    </div>
                                  )}
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(type, e)} />
                                </label>
                              </div>
                            </>
                         )}
                       </div>
                     );
                   })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Location & Contact */}
          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              {/* Location Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => update('useCurrentLocation', true)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${form.useCurrentLocation ? (dark ? 'border-brand bg-brand/5' : 'border-slate-900 bg-slate-50 shadow-lg') : dark ? 'border-slate-700' : 'border-gray-100 shadow-sm'}`}>
                  <Navigation className={`w-8 h-8 mx-auto mb-3 ${form.useCurrentLocation ? (dark ? 'text-brand' : 'text-slate-900') : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.donate.useLocation}</span>
                </button>
                <button onClick={() => update('useCurrentLocation', false)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${!form.useCurrentLocation ? (dark ? 'border-brand bg-brand/5' : 'border-slate-900 bg-slate-50 shadow-lg') : dark ? 'border-slate-700' : 'border-gray-100 shadow-sm'}`}>
                  <MapPin className={`w-8 h-8 mx-auto mb-3 ${!form.useCurrentLocation ? (dark ? 'text-brand' : 'text-slate-900') : 'text-slate-400'}`} />
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.donate.manualAddress}</span>
                </button>
              </div>

              {/* Map Preview */}
              <div className={`rounded-2xl overflow-hidden border-2 ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
                <div className={`h-64 relative ${dark ? 'bg-slate-700' : 'bg-gradient-to-br from-primary-50 to-accent-50'}`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="relative inline-block">
                        <MapPin className="w-12 h-12 text-primary-500 animate-bounce" />
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-1 bg-black/20 rounded-full blur-sm" />
                      </div>
                      <p className={`mt-3 text-sm font-medium ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {form.useCurrentLocation ? '📍 Using your current location' : '📍 Pin your pickup location'}
                      </p>
                      {form.address && <p className={`mt-1 text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>{form.address}, {form.city}</p>}
                    </div>
                  </div>
                  {/* Decorative map grid */}
                  <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`h${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="currentColor" strokeWidth="0.3" />
                    ))}
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line key={`v${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="currentColor" strokeWidth="0.3" />
                    ))}
                  </svg>
                </div>
              </div>

              {/* Address Form */}
              <div className="space-y-5 pt-4 border-t border-gray-100 dark:border-slate-700">
                <h3 className={`font-semibold ${dark ? 'text-white' : 'text-gray-900'}`}>Contact & Address Details</h3>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.address} (Required)</label>
                  <textarea value={form.address} onChange={e => update('address', e.target.value)} rows={2}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.city} (Required)</label>
                    <input type="text" value={form.city} onChange={e => update('city', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.state} (Required)</label>
                    <input type="text" value={form.state} onChange={e => update('state', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.pincode} (Required)</label>
                    <input type="text" value={form.pincode} onChange={e => update('pincode', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.landmark} (Optional)</label>
                    <input type="text" value={form.landmark} onChange={e => update('landmark', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.phone} (Required)</label>
                  <input type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}><Calendar className="w-4 h-4 inline mr-1" />{t.donate.date} (Required)</label>
                    <input type="date" value={form.date} onChange={e => update('date', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                  <div>
                    <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}><Clock className="w-4 h-4 inline mr-1" />{t.donate.time} (Required)</label>
                    <input type="time" value={form.time} onChange={e => update('time', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-gray-50 border-gray-200 focus:border-primary-500 focus:bg-white'} outline-none transition-colors`} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Consent / Review */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <div className={`rounded-2xl p-6 ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>Review Your Donation</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Type(s)', value: form.types.length ? form.types.map(t => categoryMap[t]).join(', ') : '—' },
                    { label: 'Quantities', value: form.types.length ? form.types.map(t => `${categoryMap[t]}: ${form.quantities[t] || '0'}`).join(' | ') : '—' },
                    { label: 'Address', value: form.address ? `${form.address}, ${form.city}, ${form.state} ${form.pincode}` : '—' },
                    { label: 'Pickup', value: form.date && form.time ? `${form.date} at ${form.time}` : '—' },
                    { label: 'Location', value: form.useCurrentLocation ? 'Current location' : 'Manual address' },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-start">
                      <span className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                      <span className={`text-sm font-medium text-right max-w-[60%] capitalize ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <label className={`flex items-start gap-3 p-4 rounded-2xl cursor-pointer transition-colors ${form.consent ? (dark ? 'bg-primary-900/20 border-primary-500' : 'bg-primary-50 border-primary-500') : (dark ? 'border-slate-600' : 'border-gray-200')} border-2`}>
                <input type="checkbox" checked={form.consent} onChange={e => update('consent', e.target.checked)}
                  className="mt-1 w-5 h-5 rounded accent-primary-500" />
                <div>
                  <span className={`text-sm font-medium ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.consent}</span>
                  <p className={`text-xs mt-1 ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Your data is secure and will only be used for donation pickup coordination.</p>
                </div>
              </label>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-slate-700">
            {step > 1 ? (
              <button onClick={() => setStep(s => s - 1)} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium text-sm transition-colors ${dark ? 'text-gray-300 hover:bg-slate-700' : 'text-gray-600 hover:bg-gray-100'}`}>
                <ChevronLeft className="w-4 h-4" /> {t.donate.prev}
              </button>
            ) : <div />}
            {step < 3 ? (
              <button onClick={() => setStep(s => s + 1)} disabled={!validateStep(step)}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${
                  !validateStep(step) 
                    ? (dark ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed') 
                    : (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10 hover:bg-slate-100' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20 hover:bg-slate-800')
                }`}>
                {t.donate.next} <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={!form.consent || !validateStep(1) || !validateStep(2) || loading}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${
                  form.consent && validateStep(1) && validateStep(2) && !loading 
                    ? (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10 hover:bg-slate-100' : 'bg-brand text-slate-900 shadow-xl shadow-brand/20 hover:bg-slate-800 hover:text-white') 
                    : (dark ? 'bg-slate-800 text-slate-400 border-2 border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
                }`}>
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : <>{t.donate.submit} <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
