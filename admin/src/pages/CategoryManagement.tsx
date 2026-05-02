import { useState, useEffect } from 'react';
import { 
  Plus, Edit2, Trash2, Save, X, Image as ImageIcon, 
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

const getImageUrl = (path: any) => {
  if (!path) return null;
  if (typeof path !== 'string') return URL.createObjectURL(path);
  if (path.startsWith('http') || path.startsWith('https')) return path;
  if (path.startsWith('/media/')) return `http://127.0.0.1:8000${path}`;
  if (path.startsWith('/')) return path; // Frontend asset
  return `http://127.0.0.1:8000/media/${path}`;
};

interface Category {
  id?: number | string;
  name: string;
  description: string;
  image: string | File | null;
  impact_badge: string;
  icon_name: string;
  is_active: boolean;
  is_system?: boolean;
}

export default function CategoryManagement({ darkMode }: { darkMode: boolean }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | 'new' | null>(null);
  const [formData, setFormData] = useState<Category>({
    name: '',
    description: '',
    image: null,
    impact_badge: '',
    icon_name: 'Heart',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const { searchQuery } = useSearch();
  const [localSearch, setLocalSearch] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const permanentCategories: Category[] = [
    { id: 'p1', name: 'Food', description: 'Help feed families in need with nutritious meals', impact_badge: "₹500 feeds 5 people", icon_name: 'Utensils', image: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=800", is_active: true, is_system: true },
    { id: 'p2', name: 'Clothes', description: 'Provide warmth and dignity through clothing', impact_badge: "10 clothes help 1 family", icon_name: 'Shirt', image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb8?q=80&w=800", is_active: true, is_system: true },
    { id: 'p3', name: 'Books', description: 'Empower minds through education materials', impact_badge: "5 books educate 1 child", icon_name: 'BookOpen', image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800", is_active: true, is_system: true },
    { id: 'p4', name: 'Money', description: 'Your financial support drives all our programs', impact_badge: "₹1000 provides healthcare", icon_name: 'Banknote', image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=800", is_active: true, is_system: true },
    { id: 'p5', name: 'Trees', description: 'Plant hope for a greener tomorrow', impact_badge: "₹200 plants 1 tree", icon_name: 'Sprout', image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=800", is_active: true, is_system: true },
  ];

  const fetchCategories = async () => {
    try {
      const data = await fetchAPI('/api/donations/categories/');
      const res = Array.isArray(data) ? data : (data.results || []);
      
      // Merge logic: Use DB category if it exists (by name matching), otherwise use permanent default
      const merged = permanentCategories.map(p => {
        const dbVersion = res.find((cat: any) => cat.name.toLowerCase() === p.name.toLowerCase());
        return dbVersion ? { ...dbVersion, is_system: true } : p;
      });

      const dbOnlyCategories = res.filter((cat: any) => 
        !permanentCategories.some(p => p.name.toLowerCase() === cat.name.toLowerCase())
      );
      
      setCategories([...merged, ...dbOnlyCategories]);
    } catch (err) {
      console.error("Failed to fetch categories", err);
      setCategories(permanentCategories);
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
      image: null, // Reset image for upload
      impact_badge: cat.impact_badge || '',
      icon_name: cat.icon_name || 'Heart',
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
      icon_name: 'Heart',
      is_active: true
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('impact_badge', formData.impact_badge);
      data.append('icon_name', formData.icon_name);
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

      const isNew = editingId === 'new' || (typeof editingId === 'string' && editingId.startsWith('p'));
      const url = isNew ? '/api/donations/categories/' : `/api/donations/categories/${editingId}/`;
      const method = isNew ? 'POST' : 'PATCH';

      await fetchAPI(url, {
        method,
        body: data
      });

      setMessage({ text: `Category ${editingId === 'new' ? 'created' : 'updated'} successfully!`, type: 'success' });
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      setMessage({ text: "Error saving category. Please try again.", type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (typeof id === 'string' && id.startsWith('p')) return;
    if (!window.confirm("Are you sure you want to delete this category?")) return;
    try {
      await fetchAPI(`/api/donations/categories/${id}/`, { method: 'DELETE' });
      setCategories(prev => prev.filter(c => c.id !== id));
      setMessage({ text: "Category deleted successfully", type: 'success' });
    } catch (err) {
      setMessage({ text: "Failed to delete category", type: 'error' });
    }
  };

  const cardClass = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputClass = `w-full px-4 py-2 rounded-xl border ${darkMode ? 'bg-gray-900 border-gray-700 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:ring-2 focus:ring-green-500 outline-none transition-all`;

  const filtered = categories.filter(c => {
    const g = searchQuery.toLowerCase();
    const l = localSearch.toLowerCase();
    
    const matchesGlobal = !g || 
      c.name.toLowerCase().includes(g) || 
      c.description.toLowerCase().includes(g);
      
    const matchesLocal = !l || 
      c.name.toLowerCase().includes(l) || 
      c.description.toLowerCase().includes(l);
      
    return matchesGlobal && matchesLocal;
  });

  if (loading) return <div className="flex justify-center items-center h-64"><Loader className="animate-spin text-green-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Donation Categories</h2>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Manage the causes displayed on the user landing page</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors shadow-lg shadow-green-900/20"
        >
          <Plus size={18} /> Add Category
        </button>
      </div>
      
      {/* Search Bar */}
      <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border shadow-sm ${cardClass} ${darkMode ? 'bg-gray-700/30' : 'bg-white'} mb-6`}>
        <Search size={15} className={darkMode ? 'text-gray-400' : 'text-gray-500'} />
        <input 
          className="bg-transparent outline-none text-sm flex-1" 
          placeholder="Filter categories on this page..." 
          value={localSearch} 
          onChange={e => setLocalSearch(e.target.value)} 
        />
        {localSearch && <button onClick={() => setLocalSearch('')}><X size={13} className={darkMode ? 'text-gray-400' : 'text-gray-500'} /></button>}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <p className="text-sm font-medium">{message.text}</p>
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
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Health & Medical"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                  <textarea 
                    rows={3}
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    placeholder="Short description for the user..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Impact Badge Text</label>
                  <input 
                    type="text" 
                    value={formData.impact_badge} 
                    onChange={e => setFormData({...formData, impact_badge: e.target.value})}
                    placeholder="e.g. ₹1000 provides basic kit"
                    className={inputClass}
                  />
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
                  <div className={`relative h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center transition-all ${darkMode ? 'border-gray-700 hover:border-green-500' : 'border-gray-200 hover:border-green-500'}`}>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setFormData({...formData, image: e.target.files ? e.target.files[0] : null})}
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((cat) => {
          const Icon = iconList.find(i => i.name === cat.icon_name)?.icon || LayoutGrid;
          return (
            <div key={cat.id} className={`group rounded-2xl border overflow-hidden shadow-sm transition-all hover:shadow-md ${cardClass}`}>
              <div className="h-40 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
                {cat.image ? (
                  <img 
                    src={getImageUrl(cat.image) || ''} 
                    alt={cat.name} 
                    className="w-full h-full object-cover card-img-grayscale transition-all duration-500 group-hover:grayscale-0" 
                    onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=400')}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2 transition-all duration-300">
                  <button 
                    onClick={() => handleEdit(cat)}
                    className="p-2 bg-white/90 dark:bg-gray-800/90 text-blue-600 rounded-lg shadow-lg hover:scale-110 transition-transform"
                    title="Edit Category"
                  >
                    <Edit2 size={16} />
                  </button>
                  {!cat.is_system && (
                    <button 
                      onClick={() => handleDelete(cat.id as number)}
                      className="p-2 bg-white/90 dark:bg-gray-800/90 text-red-600 rounded-lg shadow-lg hover:scale-110 transition-transform"
                      title="Delete Category"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                  {cat.is_system && (
                    <div className="p-2 bg-green-500/90 text-white rounded-lg shadow-lg text-[10px] font-bold px-3">
                      SYSTEM
                    </div>
                  )}
                </div>
                {!cat.is_active && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <span className="px-3 py-1 bg-gray-800 text-white text-[10px] font-bold uppercase rounded-full tracking-widest">Hidden</span>
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                    <Icon size={16} />
                  </div>
                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{cat.name}</h4>
                </div>
                <p className={`text-xs leading-relaxed mb-4 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {cat.description}
                </p>
                <div className="flex items-center justify-between mt-auto">
                   <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[10px] font-bold rounded-lg uppercase">
                     {cat.impact_badge}
                   </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
