import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins } from 'lucide-react';
import { API_BASE_URL } from '../utils/api';
import { useQuery } from '@tanstack/react-query';
import { getCategories } from '../api/donations';

const getImageUrl = (path: string) => {
  if (!path) return '/images/hero.jpg';
  
  if (path.startsWith('http') || path.startsWith('https')) {
    // For Unsplash images, ensure we have good quality/size parameters
    if (path.includes('images.unsplash.com') && !path.includes('w=')) {
      return `${path}${path.includes('?') ? '&' : '?'}w=800&q=80&auto=format&fit=crop`;
    }
    
    // For Cloudinary images (from our backend), we already add optimization in the serializer
    // so we can return it as is.
    return path;
  }

  
  const base = API_BASE_URL;
  if (path.startsWith('/media/')) return `${base}${path}`;
  if (path.startsWith('/') || path.startsWith('images/')) return path;
  return `${base}/media/${path}`;
};


const iconMap: Record<string, any> = {
  utensils: Utensils,
  bookopen: BookOpen,
  shirt: Shirt,
  banknote: Banknote,
  sprout: Sprout,
  heart: Heart,
  layoutgrid: LayoutGrid,
  handheart: HandHeart,
  users: Users,
  treepine: TreePine,
  gift: Gift,
  shoppingbag: ShoppingBag,
  graduationcap: GraduationCap,
  coins: Coins
};

export default function Categories() {
  const { dark, t } = useApp();

  const { data: categoryData } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    if (categoryData) {
      const raw = Array.isArray(categoryData) ? categoryData : (categoryData.results || categoryData.data || []);
      // Filter out inactive and deduplicate by name
      const unique = raw.reduce((acc: any[], current: any) => {
        if (current.is_active !== false && current.name && !acc.find(c => c.name.toLowerCase() === current.name.toLowerCase())) {
          acc.push(current);
        }
        return acc;
      }, []);

      setCategories(unique);
    }
  }, [categoryData]);


  return (
    <div className={`min-h-screen pt-16 ${dark ? 'bg-[#0f172b]' : 'bg-white'}`}>
      {/* Clean Hero Header */}
      <div className={`max-w-7xl mx-auto px-4 pt-16 pb-8 text-center`}>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-6 transition-colors duration-300 ${
          dark ? 'bg-white/20 text-white border border-white/30' : 'text-slate-900 border border-slate-200 shadow-sm'
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
          {categories.length === 0 ? [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-80 rounded-3xl animate-pulse ${dark ? 'bg-white/5' : 'bg-gray-100'}`} />
          )) : categories.map((cat) => {
            const iconKey = (cat.icon_name || 'Heart').toLowerCase();
            const Icon = iconMap[iconKey] || Heart;
            return (
              <div key={cat.id || cat.name} className={`card-modern group ${dark ? 'bg-near-black/60 border-white/10' : 'bg-white shadow-2xl shadow-black/5'}`}>
                <div className="h-52 overflow-hidden relative">
                  <img 
                    src={(() => {
                      const name = cat.name.toLowerCase();
                      const path = cat.image || '';
                      // If it's a known category with a generic or missing path, use Unsplash directly
                      // But ONLY if the path is truly missing or a clear placeholder
                      if (!path || path.includes('placeholder') || path === '') {
                        if (name.includes('money') || name.includes('monetar') || name.includes('fund')) 
                          return "https://images.unsplash.com/photo-1554224155-1696413565d3?w=800&q=80&auto=format&fit=crop";
                        if (name.includes('gift'))
                          return "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80&auto=format&fit=crop";
                        if (name.includes('food'))
                          return "https://images.unsplash.com/photo-1488459711635-0c00289b8046?w=800&q=80&auto=format&fit=crop";
                      }
                      return getImageUrl(path);
                    })()} 
                    alt={cat.name} 
                    className="w-full h-full object-cover card-img-grayscale"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      const name = cat.name.toLowerCase();
                      if (name.includes('food')) e.currentTarget.src = "/images/stories-food.jpg";
                      else if (name.includes('clothes')) e.currentTarget.src = "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg";
                      else if (name.includes('book') || name.includes('education')) e.currentTarget.src = "/images/stories-education.jpg";
                      else if (name.includes('money') || name.includes('monetar') || name.includes('fund')) e.currentTarget.src = "https://images.unsplash.com/photo-1554224155-1696413565d3?w=800&q=80&auto=format&fit=crop";
                      else if (name.includes('tree') || name.includes('environment')) e.currentTarget.src = "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80&auto=format&fit=crop";
                      else if (name.includes('gift')) e.currentTarget.src = "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80&auto=format&fit=crop";
                      else e.currentTarget.src = '/images/hero.jpg';
                    }}
                  />

                </div>
                <div className="p-8 flex flex-col items-center text-center">
                  <div className="flex flex-col items-center mb-4">
                    <div className="icon-soft-circle mb-4 group-hover:scale-110 transition-transform duration-300 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className={`text-xl font-bold tracking-tight ${dark ? 'text-white' : 'text-near-black'}`}>{cat.name}</h3>
                  </div>
                  <p className={`text-sm leading-relaxed mb-6 h-12 overflow-hidden ${dark ? 'text-gray-400' : 'text-gray-500 font-medium'}`}>
                    {cat.description}
                  </p>
                  <div className="mb-8">
                    <span className={`modern-badge ${dark ? 'bg-white/20 text-white border border-white/25' : 'bg-gray-100 text-gray-600'}`}>
                      {cat.impact_badge}
                    </span>
                  </div>
                  <Link to="/donate" className={`modern-link group/link justify-center ${dark ? 'text-white hover:text-brand' : 'text-near-black hover:text-brand'}`}>
                    Donate Now <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                  </Link>
                </div>
              </div>
            );
          })
          }
        </div>
      </div>
    </div>
  );
}
