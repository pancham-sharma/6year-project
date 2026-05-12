import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Image as ImageIcon, Eye, EyeOff,
  Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins, Loader, CheckCircle2, AlertCircle, Search
} from 'lucide-react';
import { fetchAPI } from '../utils/api';
import { useSearch } from '../context/SearchContext';

const iconList = [
  { name: 'Utensils', icon: Utensils },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Shirt', icon: Shirt },
  { name: 'Banknote', icon: Banknote },
  { name: 'Sprout', icon: Sprout },
  { name: 'Heart', icon: Heart },
  { name: 'HandHeart', icon: HandHeart },
  { name: 'Users', icon: Users },
  { name: 'TreePine', icon: TreePine },
  { name: 'Gift', icon: Gift },
  { name: 'ShoppingBag', icon: ShoppingBag },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Coins', icon: Coins },
  { name: 'LayoutGrid', icon: LayoutGrid }
];





interface Category {
  id?: number | string;
  name: string;
  description: string;
  image: string | File | null;
  impact_badge: string;
  impact_label: string;
  impact_per_quantity: number;
  icon_name: string;
  unit_name: string;
  is_active: boolean;
  is_system?: boolean;
}

const iconMap: Record<string, any> = iconList.reduce((acc, item) => ({
  ...acc,
  [item.name.toLowerCase()]: item.icon
}), {});

export default function CategoryManagement({ darkMode }: { darkMode: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | 'new' | null>(null);
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: '',
    image: null,
    impact_badge: '',
    impact_label: '',
    impact_per_quantity: 1,
    icon_name: 'Heart',
    unit_name: 'Units',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });
  const { searchQuery } = useSearch();
  const [localSearch, setLocalSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchCategories();
  }, [page, limit, searchQuery]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(`/api/donations/categories/?page=${page}&limit=${limit}&search=${searchQuery}&t=${new Date().getTime()}`);
      
      if (data && data.data) {
        setCategories(data.data);
        setMeta({
          total: data.meta.total,
          totalPages: data.meta.totalPages
        });
      } else {
        const res = Array.isArray(data) ? data : (data.results || []);
        setCategories(res);
        setMeta({
          total: res.length,
          totalPages: 1
        });
      }
    } catch (err) {
      console.error("Failed to fetch categories", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat: Category) => {
    if (!cat.id) return;
    setEditingId(cat.id);
    setFormData({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || null, // Preserve existing image URL
      impact_badge: cat.impact_badge || '',
      impact_label: cat.impact_label || '',
      impact_per_quantity: cat.impact_per_quantity || 1,
      icon_name: cat.icon_name || 'Heart',
      unit_name: cat.unit_name || 'Units',
      is_active: cat.is_active ?? true
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAddNew = () => {
    setEditingId('new');
    setFormData({
      name: '',
      description: '',
      image: null,
      impact_badge: '',
      impact_label: '',
      impact_per_quantity: 1,
      icon_name: 'Heart',
      unit_name: 'Units',
      is_active: true
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setErrors({});
    
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'This field is required';
    if (!formData.description.trim()) newErrors.description = 'This field is required';
    if (!formData.impact_badge.trim()) newErrors.impact_badge = 'This field is required';
    if (!formData.unit_name?.trim()) newErrors.unit_name = 'This field is required';
    
    // Image only required for NEW categories
    if (editingId === 'new' && !formData.image) newErrors.image = 'This field is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setMessage({ text: "Please fill all required fields", type: 'error' });
      setSaving(false);
      return;
    }

    try {
      const isNew = editingId === 'new';

      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('impact_badge', formData.impact_badge);
      data.append('icon_name', formData.icon_name);
      data.append('unit_name', formData.unit_name);
      data.append('is_active', String(formData.is_active));
      
      if (formData.image instanceof File) {
        let fileToUpload = formData.image;
        // Handle long filenames that exceed Django's default 100-char limit
        if (fileToUpload.name.length > 90) {
          const extension = fileToUpload.name.split('.').pop();
          const newName = `category_${Date.now()}.${extension}`;
          fileToUpload = new File([formData.image], newName, { type: formData.image.type });
        }
        data.append('image', fileToUpload);
      }

      const url = isNew ? '/api/donations/categories/' : `/api/donations/categories/${editingId}/`;
      const method = isNew ? 'POST' : 'PATCH';

      await fetchAPI(url, {
        method,
        body: data
      });

      setMessage({ text: `Category is successfully ${editingId === 'new' ? 'created' : 'updated'}!`, type: 'success' });
      setEditingId(null);
      fetchCategories();
      // Dispatch event to update sidebar immediately
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err) {
      setMessage({ text: "Error saving category. Please try again.", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetchAPI(`/api/donations/categories/${id}/`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      setMessage({ text: "Category deleted successfully", type: 'success' });
      // Dispatch event to update sidebar immediately
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err) {
      setMessage({ text: "Failed to delete category", type: 'error' });
    }
  };

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = `w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:ring-2 focus:ring-green-500 outline-none transition-all`;

  const filteredCategories = categories.filter(c => {
    const g = searchQuery.toLowerCase();
    const l = localSearch.toLowerCase();
    
    const matchesGlobal = !g || 
      c.name.toLowerCase().includes(g) || 
      (c.description || '').toLowerCase().includes(g);
      
    const matchesLocal = !l || 
      c.name.toLowerCase().includes(l) || 
      (c.description || '').toLowerCase().includes(l);
      
    return matchesGlobal && matchesLocal;
  });

  const handleToggle = async (cat: Category) => {
    try {
      const updated = await fetchAPI(`/api/donations/categories/${cat.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !cat.is_active })
      });
      setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, ...updated } : c));
      window.dispatchEvent(new CustomEvent('categoriesUpdated'));
    } catch (err) {
      setMessage({ text: "Failed to update category status", type: 'error' });
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-6">
      {message && (
        <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md p-4 rounded-2xl flex items-center gap-3 animate-slide-up shadow-2xl border ${message.type === 'success' ? 'bg-green-500 text-white border-green-400' : 'bg-red-500 text-white border-red-400'}`}>
          {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <p className="font-bold">{message.text}</p>
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Donation Categories</h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500 text-sm'}>Manage the causes displayed on the user landing page</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-green-900/20"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>
      
      {/* Search Bar */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-sm ${cardClass} ${darkMode ? 'bg-gray-700/30' : 'bg-white'} mb-6`}>
        <Search size={15} className={darkMode ? 'text-gray-300' : 'text-gray-500'} />
        <input 
          className={`bg-transparent outline-none text-sm flex-1 ${darkMode ? 'text-white placeholder-gray-300' : 'text-gray-700 placeholder-gray-400'}`} 
          placeholder="Filter categories on this page..." 
          value={localSearch} 
          onChange={e => setLocalSearch(e.target.value)} 
        />
        {localSearch && <button onClick={() => setLocalSearch('')}><X size={13} className={darkMode ? 'text-gray-400' : 'text-gray-500'} /></button>}
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCategories.map(cat => (
          <div key={cat.id} className={`group relative p-5 rounded-2xl border transition-all duration-300 ${cardClass} hover:shadow-xl ${darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-white'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl ${darkMode ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'}`}>
                {(() => {
                  const Icon = iconMap[cat.icon_name?.toLowerCase()] || Heart;
                  return <Icon size={24} />;
                })()}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(cat)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                >
                  <Edit2 size={16} />
                </button>
                 <button 
                  onClick={() => handleDelete(cat.id!)}
                  className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-500 hover:text-red-600'}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cat.name}</h4>
              </div>
              <p className={`text-xs line-clamp-2 leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{cat.description}</p>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleToggle(cat)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    cat.is_active 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-gray-500/10 text-gray-500'
                  }`}
                >
                  {cat.is_active ? <Eye size={12} /> : <EyeOff size={12} />}
                  {cat.is_active ? 'Visible' : 'Hidden'}
                </button>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${darkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                {cat.impact_badge}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination Footer */}
      {meta.totalPages > 1 && (
        <div className={`px-6 py-5 border-t flex flex-col sm:flex-row items-center justify-between gap-6 ${darkMode ? 'border-gray-800' : 'border-gray-100'} bg-transparent mt-8`}>
          <div className={`text-xs font-bold ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Page <span className={darkMode ? 'text-white' : 'text-gray-800'}>{page}</span> of <span className={darkMode ? 'text-white' : 'text-gray-800'}>{meta.totalPages}</span>
            <span className="mx-2 opacity-20">|</span>
            Showing <span className={darkMode ? 'text-white' : 'text-gray-800'}>{Math.min((page - 1) * limit + 1, meta.total)}</span>-
            <span className={darkMode ? 'text-white' : 'text-gray-800'}>{Math.min(page * limit, meta.total)}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
              className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? 'hover:bg-slate-800 border-gray-700 text-gray-300' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
              }`}
            >
              Previous
            </button>
            
            <button 
              onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages || loading}
              className={`px-5 py-2.5 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed ${
                darkMode ? 'hover:bg-slate-800 border-gray-700 text-gray-300' : 'hover:bg-slate-50 border-gray-200 text-gray-700'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}



      {/* Category Edit/Add Modal Overlay */}
      {editingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setEditingId(null)}></div>
          <div className={`relative w-full max-w-2xl p-6 rounded-3xl border shadow-2xl ${cardClass} animate-slide-up max-h-[90vh] overflow-y-auto`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {editingId === 'new' ? 'Create New Category' : 'Edit Cause Category'}
              </h3>
              <button onClick={() => setEditingId(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors">
                <X size={20} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Category Name</label>
                  <input 
                    type="text" 
                    value={formData.name} 
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      if (errors.name) setErrors(prev => ({...prev, name: ''}));
                    }}
                    placeholder="e.g. Health & Medical"
                    className={`${inputClass} ${errors.name ? 'border-red-500 bg-red-500/5' : ''}`}
                  />
                  {errors.name && <p className="text-[10px] text-red-500 mt-1 font-bold italic pl-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description} 
                    onChange={e => {
                      setFormData({...formData, description: e.target.value});
                      if (errors.description) setErrors(prev => ({...prev, description: ''}));
                    }}
                    placeholder="Short description for the user..."
                    className={`${inputClass} ${errors.description ? 'border-red-500 bg-red-500/5' : ''}`}
                  />
                  {errors.description && <p className="text-[10px] text-red-500 mt-1 font-bold italic pl-1">{errors.description}</p>}
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Impact Badge Text</label>
                  <input 
                    type="text" 
                    value={formData.impact_badge} 
                    onChange={e => {
                      setFormData({...formData, impact_badge: e.target.value});
                      if (errors.impact_badge) setErrors(prev => ({...prev, impact_badge: ''}));
                    }}
                    placeholder="e.g. ₹1000 provides basic kit"
                    className={`${inputClass} ${errors.impact_badge ? 'border-red-500 bg-red-500/5' : ''}`}
                  />
                  {errors.impact_badge && <p className="text-[10px] text-red-500 mt-1 font-bold italic pl-1">{errors.impact_badge}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Impact Label (Dynamic)</label>
                    <input 
                      type="text" 
                      value={formData.impact_label} 
                      onChange={e => setFormData({...formData, impact_label: e.target.value})}
                      placeholder="e.g. Families Helped"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Impact Divisor</label>
                    <input 
                      type="number" 
                      value={formData.impact_per_quantity} 
                      onChange={e => setFormData({...formData, impact_per_quantity: parseInt(e.target.value) || 1})}
                      placeholder="e.g. 1000"
                      className={inputClass}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Display Unit (Backend Calculation)</label>
                  <input 
                    type="text" 
                    value={formData.unit_name} 
                    onChange={e => {
                      setFormData({...formData, unit_name: e.target.value});
                      if (errors.unit_name) setErrors(prev => ({...prev, unit_name: ''}));
                    }}
                    placeholder="e.g. Meals, Trees, Sets"
                    className={`${inputClass} ${errors.unit_name ? 'border-red-500 bg-red-500/5' : ''}`}
                  />
                  {errors.unit_name && <p className="text-[10px] text-red-500 mt-1 font-bold italic pl-1">{errors.unit_name}</p>}
                  <p className="mt-1 text-[10px] text-gray-400 italic">This unit will be used for inventory tracking.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Choose Icon</label>
                  <div className="grid grid-cols-7 gap-2 p-3 border dark:border-gray-700 rounded-xl max-h-32 overflow-y-auto">
                    {iconList.map(item => {
                      const Icon = item.icon;
                      return (
                        <button 
                          key={item.name}
                          onClick={() => setFormData({...formData, icon_name: item.name})}
                          className={`p-2 rounded-lg flex items-center justify-center transition-all ${formData.icon_name === item.name ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        >
                          <Icon size={16} />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Cover Image</label>
                  <div className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${
                    errors.image ? 'border-red-500 bg-red-500/5' :
                    darkMode ? 'border-gray-700 hover:border-green-500' : 'border-gray-200 hover:border-green-500'
                  }`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => {
                        const file = e.target.files ? e.target.files[0] : null;
                        if (file) {
                          setFormData({...formData, image: file});
                          if (errors.image) setErrors(prev => ({...prev, image: ''}));
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    {formData.image ? (
                      <div className="flex items-center gap-2 text-green-500 font-semibold text-sm">
                        <CheckCircle2 size={16} /> Image Selected
                      </div>
                    ) : (
                      <>
                        <ImageIcon className="text-gray-400 mb-1" size={20} />
                        <span className="text-xs text-gray-500 font-medium">Click to upload</span>
                      </>
                    )}
                  </div>
                  {errors.image && <p className="text-[10px] text-red-500 mt-2 font-bold italic text-center">{errors.image}</p>}
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <input 
                    type="checkbox" 
                    id="is_active"
                    checked={formData.is_active}
                    onChange={e => setFormData({...formData, is_active: e.target.checked})}
                    className="w-4 h-4 accent-green-600 rounded"
                  />
                  <label htmlFor="is_active" className={`text-sm font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Visible on Website</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t dark:border-gray-700">
              <button 
                onClick={() => setEditingId(null)}
                className={`px-5 py-2 rounded-xl font-semibold ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-8 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-green-900/20"
              >
                {saving ? <Loader className="animate-spin" size={18} /> : <Save size={18} />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
