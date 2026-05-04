import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins } from 'lucide-react';
import { fetchAPI } from '../utils/api';

const getImageUrl = (path: string) => {
  if (!path) return '/images/hero.jpg';
  if (path.startsWith('http') || path.startsWith('https')) return path;
  if (path.startsWith('/media/')) return `http://127.0.0.1:8000${path}`;
  if (path.startsWith('/') || path.startsWith('images/')) return path; // Frontend asset
  return `http://127.0.0.1:8000/media/${path}`;
};

const iconMap: Record<string, any> = {
  Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins
};

export default function Categories() {
  const { dark, t } = useApp();
  
  const permanentCategories = [
    { id: 'p1', name: t.categories.food, description: t.categories.foodDesc, impact_badge: "₹500 feeds 5 people", icon_name: 'Utensils', image: "/Join the Movement_ Support Our Homeless Community!.jpeg" },
    { id: 'p2', name: t.categories.clothes, description: t.categories.clothesDesc, impact_badge: "10 clothes help 1 family", icon_name: 'Shirt', image: "/Two individuals are sharing a box of donated clothes labeled 'DONATION' in a warm, communal setting_.jpeg" },
    { id: 'p3', name: t.categories.books, description: t.categories.booksDesc, impact_badge: "5 books educate 1 child", icon_name: 'BookOpen', image: 'http://127.0.0.1:8000/media/category_images/download_9_IOLG5uL.jpeg' },
    { id: 'p4', name: t.categories.money, description: t.categories.moneyDesc, impact_badge: "₹1000 provides healthcare", icon_name: 'Banknote', image: "http://127.0.0.1:8000/media/category_images/download_9.jpeg" },
    { id: 'p5', name: t.categories.trees, description: t.categories.treesDesc, impact_badge: "₹200 plants 1 tree", icon_name: 'Sprout', image: '/images/stories-trees.jpg' },
  ];

  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetchAPI('/api/donations/categories/');
        const categoriesData = Array.isArray(res) ? res : (res.results || []);
        const filtered = categoriesData.filter((cat: any) => 
          !permanentCategories.some(p => p.name.toLowerCase() === cat.name.toLowerCase())
        );
        setDynamicCategories(filtered);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };
    fetchCategories();
  }, []);

  const allCategories = [...permanentCategories, ...dynamicCategories];

  return (
    <div className={`min-h-screen pt-16 ${dark ? 'bg-[#0f172b]' : 'bg-white'}`}>
      {/* Clean Hero Header */}
      <div className={`max-w-7xl mx-auto px-4 pt-16 pb-8 text-center`}>
        <div className={`inline-flex items-center gap-2 px-4 py-1 rounded-full text-xs font-bold mb-6 transition-colors duration-300 ${
          dark ? 'text-brand' : 'text-slate-900 border border-slate-200 shadow-sm'
        }`}>
          <Heart className="w-3.5 h-3.5" /> Choose Your Cause
        </div>
        <h1 className={`text-4xl md:text-6xl font-bold font-serif mb-6 tracking-tight transition-colors duration-300 ${
          dark ? 'text-white' : 'text-slate-900'
        }`}>
          How Would You Like to Help?
        </h1>
        <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium transition-colors duration-300 ${
          dark ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {t.categories.sub}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
          {allCategories.map((cat) => {
            const Icon = iconMap[cat.icon_name];
            return (
              <div key={cat.id} className={`card-modern group ${dark ? 'bg-near-black/60 border-white/10' : 'bg-white shadow-2xl shadow-black/5'}`}>
                <div className="h-52 overflow-hidden relative">
                  <img 
                    src={getImageUrl(cat.image)} 
                    alt={cat.name} 
                    className="w-full h-full object-cover card-img-grayscale"
                    onError={(e) => (e.currentTarget.src = '/images/hero.jpg')}
                  />
                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="icon-soft-circle mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                      {Icon ? <Icon className="w-5 h-5" /> : <span className="text-xl">{cat.icon_name || '📦'}</span>}
                    </div>
                    <h3 className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-near-black'}`}>{cat.name}</h3>
                  </div>
                  <p className={`text-sm leading-relaxed mb-6 h-12 overflow-hidden ${dark ? 'text-gray-400' : 'text-gray-500 font-medium'}`}>
                    {cat.description}
                  </p>
                  <div className="mb-8">
                    <span className={`modern-badge ${dark ? 'bg-white/10 text-gray-300 border border-white/10' : 'bg-gray-100 text-gray-600'}`}>
                      {cat.impact_badge}
                    </span>
                  </div>
                  <Link to="/donate" className={`modern-link group/link justify-center ${dark ? 'text-white hover:text-brand' : 'text-near-black hover:text-brand'}`}>
                    Donate Now <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
