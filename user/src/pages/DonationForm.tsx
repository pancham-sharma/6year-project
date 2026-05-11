import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { fetchAPI } from '../utils/api';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/donations';
import { 
  Check, ChevronRight, ChevronLeft, Package, MapPin, Navigation, Shield, Upload, Calendar, Clock, Loader,
  Utensils, Shirt, BookOpen, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins
} from 'lucide-react';

const getCategoryIcon = (iconName: string) => {
  const iconMap: Record<string, any> = { Utensils, Shirt, BookOpen, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins };
  return iconMap[iconName] || LayoutGrid;
};

const categoryColors: string[] = [
  'from-orange-400 to-red-400',
  'from-blue-400 to-indigo-400',
  'from-purple-400 to-pink-400',
  'from-green-400 to-emerald-400',
  'from-teal-400 to-cyan-400',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-emerald-400 to-teal-500',
];

declare const L: any;

const MapEffect = ({ coords, onSelect, dark, mapRef }: any) => {
  // Initialization & Cleanup
  useEffect(() => {
    if (typeof L === 'undefined') return;
    
    if (!mapRef.current) {
      const map = L.map('map').setView([20.5937, 78.9629], 5); // Center of India
      L.tileLayer(dark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);

      map.on('click', (e: any) => {
        onSelect(e.latlng.lat, e.latlng.lng);
      });

      mapRef.current = map;
      mapRef.marker = L.marker([0, 0]).addTo(map);
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []); // Run once on mount/unmount

  // Handle Coordinate Updates
  useEffect(() => {
    if (coords && mapRef.current && mapRef.marker) {
      mapRef.marker.setLatLng([coords.lat, coords.lon]);
      mapRef.current.setView([coords.lat, coords.lon], 15);
    }
  }, [coords]);

  // Handle Theme Updates
  useEffect(() => {
    if (mapRef.current) {
       mapRef.current.eachLayer((layer: any) => {
         if (layer._url) mapRef.current.removeLayer(layer);
       });
       L.tileLayer(dark 
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }
  }, [dark]);

  return null;
};

export default function DonationForm() {
  const { dark, t, user } = useApp();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState({
    types: [] as string[], 
    quantities: {} as Record<string, string>, 
    units: {} as Record<string, string>, 
    descriptions: {} as Record<string, string>, 
    images: {} as Record<string, File | string | null>,
    address: '', city: '', state: '', pincode: '', landmark: '', phone: '', date: '', time: '',
    useCurrentLocation: false, consent: false, transactionId: '', donorMobile: '',
  });
  const [existingDonations, setExistingDonations] = useState<any[]>([]);

  // React Query for Categories
  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Load existing donations to check for active requests
  useEffect(() => {
    const loadExisting = async () => {
      try {
        const res = await fetchAPI('/api/donations/');
        const data = res.results || res || [];
        // Filter out recycled to get relevant history with safety check
        setExistingDonations(Array.isArray(data) ? data.filter((d: any) => d.status && d.status.toLowerCase() !== 'recycled') : []);
      } catch (err) {
        console.error("Failed to load existing donations", err);
      }
    };
    if (user.id) loadExisting();
  }, [user.id]);

  // Derived Dynamic Types
  const dynamicTypes = useMemo(() => {
    const data = Array.isArray(categoryData) ? categoryData : (categoryData?.results || []);
    
    // Filter and map database categories
    const activeCategories = data.filter((c: any) => c && c.is_active !== false);

    if (activeCategories.length === 0) return [];

    return activeCategories.map((c: any, index: number) => ({
      value: c.name.toLowerCase().replace(/\s+/g, '_'),
      label: c.name,
      icon: getCategoryIcon(c.icon_name),
      color: categoryColors[index % categoryColors.length],
      impact_label: c.impact_label || 'Families Helped',
      impact_per_quantity: c.impact_per_quantity || 1
    }));
  }, [categoryData]);

  // Extract unique addresses from history for auto-fill
  const uniqueAddresses = useMemo(() => {
    if (!Array.isArray(existingDonations)) return [];
    const seen = new Set();
    const result: any[] = [];
    
    existingDonations.forEach((d: any) => {
      const p = d.pickup_details;
      if (!p || !p.full_address) return;
      const key = `${p.full_address}-${p.city}-${p.state}-${p.pincode}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(p);
      }
    });
    return result;
  }, [existingDonations]);

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

  const [mapCoords, setMapCoords] = useState<{lat: number, lon: number} | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const mapRef = useRef<any>(null);

  const handleLocationSelect = async (lat: number, lon: number) => {
    setMapCoords({ lat, lon });
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data && data.address) {
        const addr = data.address;
        setForm(prev => ({
          ...prev,
          address: data.display_name || "",
          city: addr.city || addr.town || addr.village || addr.suburb || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
        }));
      }
    } catch (err) {
      console.error("Reverse geocoding failed", err);
    }
  };

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg("Geolocation is not supported by your browser");
      return;
    }

    setGeoLoading(true);
    setErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        handleLocationSelect(latitude, longitude);
        update('useCurrentLocation', true);
        setGeoLoading(false);
      },
      (err) => {
        console.error("Geolocation error", err);
        setErrorMsg("Location permission denied or unavailable");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Debounced forward geocoding for manual address entry
  useEffect(() => {
    if (form.useCurrentLocation || !form.address || form.address.length < 5) return;

    const timer = setTimeout(async () => {
      try {
        const query = encodeURIComponent(`${form.address}, ${form.city}, ${form.state} ${form.pincode}`);
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=1`);
        const data = await res.json();
        
        if (data && data[0]) {
          setMapCoords({ 
            lat: parseFloat(data[0].lat), 
            lon: parseFloat(data[0].lon) 
          });
        }
      } catch (err) {
        console.error("Forward geocoding failed", err);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [form.address, form.city, form.state, form.pincode, form.useCurrentLocation]);

  const steps = [
    { num: 1, label: t.donate.step1, icon: Package },
    { num: 2, label: 'Location & Address', icon: MapPin },
    { num: 3, label: t.donate.step4, icon: Shield },
  ];

  const update = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));
  const updateQuantities = (type: string, val: string) => setForm(p => ({ ...p, quantities: { ...p.quantities, [type]: val } }));
  const updateUnits = (type: string, val: string) => setForm(p => ({ ...p, units: { ...p.units, [type]: val } }));
  const updateDescriptions = (type: string, val: string) => setForm(p => ({ ...p, descriptions: { ...p.descriptions, [type]: val } }));

  const handleImageChange = (type: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(p => ({ ...p, images: { ...p.images, [type]: file } }));
    }
  };

  const validateStep = (s: number) => {
    if (s === 1) {
      if (form.types.length === 0) return false;
      return form.types.every(type => {
        const dt = dynamicTypes.find((t: any) => t.value === type);
        const hasQuantity = form.quantities[type]?.toString().trim();
        const isMoney = type === 'monetary' || type === 'money' || dt?.label?.toLowerCase().includes('money') || dt?.label?.toLowerCase().includes('monetary');
        if (isMoney) {
          return hasQuantity && form.transactionId?.trim() && form.donorMobile?.trim();
        }
        return hasQuantity && form.descriptions[type]?.trim();
      });
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
      const promises = form.types.map(async (type: string) => {
        const dt = dynamicTypes.find((d: any) => d.value === type);
        const categoryLabel = dt ? dt.label : type;

        const formData = new FormData();
        formData.append('category', categoryLabel);
        formData.append('quantity', (form.quantities[type] || '1').toString());
        formData.append('unit', form.units[type] || 'Units');
        if (form.transactionId) formData.append('transaction_id', form.transactionId);
        if (form.donorMobile) formData.append('donor_mobile', form.donorMobile);
        
        const isMoney = type === 'monetary' || type === 'money' || categoryLabel.toLowerCase().includes('money') || categoryLabel.toLowerCase().includes('monetary');
        
        const description = isMoney
          ? `₹${form.quantities[type] || '0'} (Txn: ${form.transactionId})`
          : `${form.quantities[type] || 'N/A'} ${form.units[type] || 'Units'} - ${form.descriptions[type] || ''}`;
        formData.append('quantity_description', description);

        const pickupDetails = {
          full_address: form.address || '',
          city: form.city || '',
          state: form.state || '',
          pincode: form.pincode || '',
          landmark: form.landmark || '',
          scheduled_date: form.date || null,
          scheduled_time: form.time || null,
        };

        const imageFile = form.images[type];
        if (imageFile instanceof File) {
          formData.append('pickup_details', JSON.stringify(pickupDetails));
          formData.append('image', imageFile);

          return fetchAPI('/api/donations/', {
            method: 'POST',
            body: formData
          });
        } else {
          // No image? Standard JSON is fine
          const payload = {
            category: categoryLabel,
            quantity: parseInt(form.quantities[type] || '1', 10),
            unit: form.units[type] || 'Units',
            quantity_description: description,
            pickup_details: pickupDetails
          };

          return fetchAPI('/api/donations/', {
            method: 'POST',
            body: JSON.stringify(payload)
          });
        }
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
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-xl text-center font-medium shadow-sm border border-red-200">
            {errorMsg}
          </div>
        )}

        {/* Status moved to Dashboard */}

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
        <div className={`rounded-3xl p-6 sm:p-8 transition-all ${
          existingDonations.some(d => ['Pending', 'Scheduled'].includes(d.status)) 
            ? 'opacity-40 pointer-events-none grayscale-[0.5] scale-[0.98]' 
            : ''
        } ${dark ? 'bg-slate-800' : 'bg-white shadow-xl shadow-gray-100/50 border border-gray-100'}`}>
          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-6 animate-fade-in">
              <div>
                <label className={`block text-sm font-semibold mb-3 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>{t.donate.type} (Select multiple)</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dynamicTypes.map((dt: any) => {
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
                  {form.types.map((type: string) => {
                     const dt = dynamicTypes.find((d: any) => d.value === type);
                     if (!dt) return null;
                     return (
                       <div key={type} className="p-6 rounded-2xl border-2 border-primary-100 bg-primary-50/20 space-y-4 animate-fade-in">
                         <div className="flex items-center gap-3 mb-2">
                           <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${dt.color} flex items-center justify-center`}>
                             <dt.icon className="w-4 h-4 text-white" />
                           </div>
                           <h4 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{dt.label} Details</h4>
                         </div>
                          { (type === 'monetary' || type === 'money' || dt.label.toLowerCase().includes('money') || dt.label.toLowerCase().includes('monetary')) ? (
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
                             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                 <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Mobile Number (Required)</label>
                                 <input type="text" value={form.donorMobile} onChange={e => update('donorMobile', e.target.value)} placeholder="e.g. 9876543210"
                                   className={`w-full px-4 py-2.5 rounded-xl border-2 text-sm ${dark ? 'bg-slate-800 border-slate-600 text-white placeholder:text-gray-500 focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none transition-colors`} />
                             </div>
                             <div className="mt-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                                 <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Payment Proof (Optional)</label>
                                 <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-300 hover:border-primary-400'} ${form.images[type] ? 'border-primary-500' : ''}`}>
                                   {form.images[type] ? (
                                     <img 
                                       src={form.images[type] instanceof File ? URL.createObjectURL(form.images[type] as File) : (form.images[type] as string)} 
                                       alt="Preview" 
                                       className="h-full w-full object-cover rounded-xl" 
                                     />
                                   ) : (
                                     <div className="flex flex-col items-center p-2 text-center">
                                       <Upload className={`w-6 h-6 mb-2 ${dark ? 'text-gray-500' : 'text-gray-400'}`} />
                                       <span className={`text-xs ${dark ? 'text-gray-500' : 'text-gray-400'}`}>Click to upload</span>
                                     </div>
                                   )}
                                   <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(type, e)} />
                                 </label>
                             </div>
                             
                             {/* Real-time Impact for Money */}
                             <div className={`mt-4 p-4 rounded-xl ${dark ? 'bg-emerald-900/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-100'} animate-bounce-subtle`}>
                               <p className={`text-xs font-bold ${dark ? 'text-emerald-400' : 'text-emerald-600'} uppercase tracking-wider mb-1`}>Your Impact</p>
                               <p className={`text-sm font-black ${dark ? 'text-white' : 'text-emerald-900'}`}>
                                 ₹{form.quantities[type] || '0'} = {Math.ceil((parseInt(form.quantities[type]) || 0) / (dt.impact_per_quantity || 1))} {dt.impact_label}
                               </p>
                             </div>
                           </div>
                         ) : (
                            <>
                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Quantity of {dt.label} (Number Required)</label>
                                <div className="flex flex-col lg:flex-row gap-2">
                                  <input type="number" value={form.quantities[type] || ''} onChange={e => updateQuantities(type, e.target.value)} placeholder="e.g. 10"
                                    className={`flex-1 min-w-0 px-4 py-3 rounded-xl border-2 text-sm ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none`} />
                                  <select 
                                    value={form.units[type] || 'Units'} 
                                    onChange={e => updateUnits(type, e.target.value)}
                                    className={`w-full lg:w-28 px-3 py-3 rounded-xl border-2 text-sm font-medium ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none cursor-pointer`}
                                  >
                                    <option value="Units">Units</option>
                                    <option value="KG">KG</option>
                                    <option value="Pieces">Pieces</option>
                                    <option value="Liters">Liters</option>
                                    <option value="Grams">Grams</option>
                                    <option value="Servings">Servings</option>
                                    <option value="Packets">Packets</option>
                                    <option value="Boxes">Boxes</option>
                                  </select>
                                </div>
                              </div>


                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Description (Required)</label>
                                <textarea value={form.descriptions[type] || ''} onChange={e => updateDescriptions(type, e.target.value)} rows={2} placeholder="Describe the items..."
                                  className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none ${dark ? 'bg-slate-700 border-slate-600 text-white focus:border-primary-500' : 'bg-white border-gray-200 focus:border-primary-500'} outline-none`} />
                              </div>

                              {/* Real-time Impact for Quantity */}
                              <div className={`p-4 rounded-xl ${dark ? 'bg-brand/20 border border-brand/30' : 'bg-primary-50 border border-primary-100'} animate-bounce-subtle`}>
                                <p className={`text-xs font-bold ${dark ? 'text-brand' : 'text-primary-600'} uppercase tracking-wider mb-1`}>Your Impact</p>
                                <p className={`text-sm font-black ${dark ? 'text-white' : 'text-primary-900'}`}>
                                  {form.quantities[type] || '0'} {form.units[type] || 'Units'} = {Math.ceil((parseInt(form.quantities[type]) || 0) / (dt.impact_per_quantity || 1))} {dt.impact_label}
                                </p>
                              </div>
                              <div>
                                <label className={`block text-sm font-semibold mb-2 ${dark ? 'text-gray-200' : 'text-gray-700'}`}>Upload Image (Optional)</label>
                                <label className={`flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${dark ? 'border-slate-600 hover:border-slate-500' : 'border-gray-300 hover:border-primary-400'} ${form.images[type] ? 'border-primary-500' : ''}`}>
                                  {form.images[type] ? (
                                    <img 
                                      src={form.images[type] instanceof File ? URL.createObjectURL(form.images[type] as File) : (form.images[type] as string)} 
                                      alt="Preview" 
                                      className="h-full w-full object-cover rounded-xl" 
                                    />
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
              {/* Saved Addresses Section */}
              {uniqueAddresses.length > 0 && (
                <div className="space-y-3">
                  <h3 className={`text-sm font-bold flex items-center gap-2 ${dark ? 'text-white' : 'text-slate-900'}`}>
                    <Clock className="w-4 h-4 text-brand" /> Saved Addresses
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {uniqueAddresses.map((addr, i) => (
                      <button 
                        key={i}
                        onClick={() => {
                          setForm(prev => ({
                            ...prev,
                            address: addr.full_address || '',
                            city: addr.city || '',
                            state: addr.state || '',
                            pincode: addr.pincode || '',
                            landmark: addr.landmark || '',
                            useCurrentLocation: false
                          }));
                          // If coordinates exist from previous donation, we could set mapCoords here too if available
                        }}
                        className={`flex-shrink-0 p-4 rounded-2xl border-2 text-left transition-all max-w-[240px] ${dark ? 'bg-slate-700/50 border-slate-700 hover:border-brand/50' : 'bg-gray-50 border-gray-100 hover:border-slate-300'}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-3.5 h-3.5 text-brand" />
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${dark ? 'text-slate-400' : 'text-slate-500'}`}>Address {i + 1}</span>
                        </div>
                        <p className={`text-xs font-medium line-clamp-2 leading-relaxed ${dark ? 'text-white' : 'text-slate-900'}`}>
                          {addr.full_address}, {addr.city}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Location Choice */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleUseLocation}
                  disabled={geoLoading}
                  className={`p-6 rounded-2xl border-2 text-center transition-all relative overflow-hidden ${form.useCurrentLocation ? (dark ? 'border-[#95f0c9] bg-[#95f0c9]/5 ring-1 ring-[#95f0c9]/30' : 'border-slate-900 bg-slate-50 shadow-lg') : dark ? 'border-slate-700/50 hover:border-slate-600' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}
                >
                  {geoLoading && (
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/20 flex items-center justify-center z-10">
                      <Loader className="w-5 h-5 animate-spin text-brand" />
                    </div>
                  )}
                  <Navigation className={`w-8 h-8 mx-auto mb-3 transition-colors ${form.useCurrentLocation ? (dark ? 'text-[#95f0c9]' : 'text-slate-900') : (dark ? 'text-slate-500' : 'text-slate-400')}`} />
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.donate.useLocation}</span>
                </button>
                <button onClick={() => update('useCurrentLocation', false)}
                  className={`p-6 rounded-2xl border-2 text-center transition-all ${!form.useCurrentLocation ? (dark ? 'border-[#95f0c9] bg-[#95f0c9]/5 ring-1 ring-[#95f0c9]/30' : 'border-slate-900 bg-slate-50 shadow-lg') : dark ? 'border-slate-700/50 hover:border-slate-600' : 'border-gray-100 hover:border-gray-200 shadow-sm'}`}>
                  <MapPin className={`w-8 h-8 mx-auto mb-3 transition-colors ${!form.useCurrentLocation ? (dark ? 'text-[#95f0c9]' : 'text-slate-900') : (dark ? 'text-slate-500' : 'text-slate-400')}`} />
                  <span className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>{t.donate.manualAddress}</span>
                </button>
              </div>

              {/* Map Preview */}
              <div className={`rounded-2xl overflow-hidden border-2 relative ${dark ? 'border-slate-600' : 'border-gray-200'}`}>
                <div id="map" className="h-80 w-full z-0"></div>
                {!mapCoords && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 pointer-events-none text-white text-center p-4">
                    <div className="animate-bounce">
                       <MapPin className="w-10 h-10 mx-auto mb-2" />
                       <p className="text-sm font-bold">Click on the map to pin your location</p>
                    </div>
                  </div>
                )}
                
                {/* Custom Map Script */}
                <MapEffect 
                  coords={mapCoords} 
                  onSelect={handleLocationSelect} 
                  dark={dark} 
                  mapRef={mapRef} 
                />

                <div className={`absolute bottom-4 left-4 right-4 p-3 rounded-xl backdrop-blur-md border ${dark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-gray-100'} z-10 shadow-lg`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${dark ? 'text-[#95f0c9]' : 'text-slate-900'}`}>
                        {form.useCurrentLocation ? '📍 Current Location' : '📍 Selected Location'}
                      </p>
                      <p className={`text-[11px] truncate leading-tight ${dark ? 'text-gray-300' : 'text-slate-600'}`}>
                        {form.address || 'Select a point on the map...'}
                      </p>
                    </div>
                    {mapCoords && (
                      <div className={`px-2 py-1 rounded text-[9px] font-mono ${dark ? 'bg-white/5 text-gray-500' : 'bg-slate-100 text-slate-500'}`}>
                        {mapCoords.lat.toFixed(4)}, {mapCoords.lon.toFixed(4)}
                      </div>
                    )}
                  </div>
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
                    { label: 'Type(s)', value: form.types.length ? form.types.map((t: string) => dynamicTypes.find((d: any) => d.value === t)?.label || t).join(', ') : '—' },
                    { label: 'Quantities', value: form.types.length ? form.types.map((t: string) => `${dynamicTypes.find((d: any) => d.value === t)?.label || t}: ${form.quantities[t] || '0'}`).join(' | ') : '—' },
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
              <button onClick={handleSubmit} disabled={!form.consent || !validateStep(1) || !validateStep(2) || loading || existingDonations.some(d => ['Pending', 'Scheduled'].includes(d.status))}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-sm transition-all ${
                  form.consent && validateStep(1) && validateStep(2) && !loading && !existingDonations.some(d => ['Pending', 'Scheduled'].includes(d.status))
                    ? (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10 hover:bg-slate-100' : 'bg-brand text-slate-900 shadow-xl shadow-brand/20 hover:bg-slate-800 hover:text-white') 
                    : (dark ? 'bg-slate-800 text-slate-400 border-2 border-slate-700 cursor-not-allowed' : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed')
                }`}>
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : existingDonations.some(d => ['Pending', 'Scheduled'].includes(d.status)) ? 'Request Pending' : <>{t.donate.submit} <Check className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
