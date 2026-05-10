import { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins } from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../utils/api';
import { useQuery } from '@tanstack/react-query';

const getImageUrl = (path: string) => {
  if (!path) return '/images/hero.jpg';
  
  if (path.includes('pancham-sharma-6year-project.vercel.app')) {
    const p = path.toLowerCase();
    if (p.includes('food')) return '/images/stories-food.jpg';
    if (p.includes('clothes')) return "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg";
    if (p.includes('books') || p.includes('education')) return '/images/stories-education.jpg';
    if (p.includes('money')) return `${API_BASE_URL}/media/category_images/download_9.jpeg`;
    if (p.includes('trees')) return '/images/stories-trees.jpg';
    return '/images/hero.jpg'; 
  }

  if (path.startsWith('http')) {
    if (path.includes('images.unsplash.com') && !path.includes('w=')) {
      return `${path}${path.includes('?') ? '&' : '?'}w=800&q=80&auto=format&fit=crop`;
    }
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

// Memoized Category Card for performance
const CategoryCard = memo(({ cat, dark, getImageUrl }: any) => {
  const iconKey = (cat.icon_name || 'Heart').toLowerCase();
  const Icon = iconMap[iconKey] || Heart;
  
  return (
    <div className={`card-modern group w-full ${dark ? 'bg-white/5 border-white/10' : 'bg-white shadow-xl shadow-gray-200/40 border-gray-100'}`}>
      <div className="h-60 overflow-hidden relative">
        <img 
          src={getImageUrl(cat.image)} 
          alt={cat.name} 
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onError={(e) => {
            const name = cat.name.toLowerCase();
            if (name.includes('food')) e.currentTarget.src = "/images/stories-food.jpg";
            else if (name.includes('clothes')) e.currentTarget.src = "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg";
            else if (name.includes('book') || name.includes('education')) e.currentTarget.src = "/images/stories-education.jpg";
            else if (name.includes('money')) e.currentTarget.src = `${API_BASE_URL}/media/category_images/download_9.jpeg`;
            else if (name.includes('tree') || name.includes('environment')) e.currentTarget.src = "/images/stories-trees.jpg";
            else if (name.includes('gift')) e.currentTarget.src = `${API_BASE_URL}/media/category_images/download_10.jpeg`;
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
        <p className={`text-[15px] leading-relaxed mb-6 h-12 overflow-hidden ${dark ? 'text-gray-400' : 'text-near-black/70 font-medium'}`}>
          {cat.description}
        </p>
        <div className="mb-8">
          <span className={`modern-badge ${dark ? 'bg-white/20 text-white border border-white/25' : 'bg-brand/10 text-brand-deep border border-brand/20'}`}>
            {cat.impact_badge}
          </span>
        </div>
        <Link to="/donate" className={`modern-link group/link justify-center ${dark ? 'text-brand hover:text-white' : 'text-[#0f172b] hover:text-brand-deep'} font-bold flex items-center gap-1.5 transition-colors w-full`}>
          Donate Now <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
        </Link>
      </div>
    </div>
  );
});

const SkeletonCard = memo(({ dark }: { dark: boolean }) => (
  <div className={`card-modern w-full animate-pulse ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40'}`}>
    <div className={`h-60 ${dark ? 'bg-white/5' : 'bg-gray-100'}`} />
    <div className="p-8 flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full mb-4 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className={`h-6 w-32 rounded mb-4 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className={`h-4 w-full rounded mb-2 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
      <div className={`h-4 w-2/3 rounded mb-6 ${dark ? 'bg-white/10' : 'bg-gray-200'}`} />
    </div>
  </div>
));

export default function Home() {
  const { dark, t } = useApp();

  const permanentCategories = useMemo(() => [
    { id: 'p1', key: 'food', name: t.categories.food, description: t.categories.foodDesc, impact_badge: t.categories.foodImpact, icon_name: 'Utensils', image: "/images/stories-food.jpg" },
    { id: 'p2', key: 'clothes', name: t.categories.clothes, description: t.categories.clothesDesc, impact_badge: t.categories.clothesImpact, icon_name: 'Shirt', image: "/images/cat-clothes.jpg" },
    { id: 'p3', key: 'books', name: t.categories.books, description: t.categories.booksDesc, impact_badge: t.categories.booksImpact, icon_name: 'BookOpen', image: "/images/cat-books.jpg" },
    { id: 'p4', key: 'money', name: t.categories.money, description: t.categories.moneyDesc, impact_badge: t.categories.moneyImpact, icon_name: 'Banknote', image: "/images/cat-money.jpg" },
    { id: 'p5', key: 'trees', name: t.categories.trees, description: t.categories.treesDesc, impact_badge: t.categories.treesImpact, icon_name: 'Sprout', image: "/images/stories-trees.jpg" },
    { id: 'p6', key: 'gift', name: t.categories.gift, description: t.categories.giftDesc, impact_badge: t.categories.giftImpact, icon_name: 'Gift', image: "/images/cat-gifts.jpg" },
  ], [t]);

  // Optimized fetching with React Query
  const { data: statsData } = useQuery({
    queryKey: ['public-stats'],
    queryFn: () => fetchAPI('/api/donations/public_stats/'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: categoriesDataRaw, isLoading: loadingCats } = useQuery({
    queryKey: ['categories'],
    queryFn: () => fetchAPI('/api/donations/categories/'),
    staleTime: 10 * 60 * 1000,
  });

  const stats = useMemo(() => ({
    total_donations: 50 + (statsData?.total_donations || 0),
    total_donors: 25 + (statsData?.total_donors || 0),
    food_meals: 1000 + (statsData?.food_meals || 0),
    trees_planted: 200 + (statsData?.trees_planted || 0),
    distribution: {
      food: 40 + (statsData?.distribution?.food || 0),
      education: 30 + (statsData?.distribution?.education || 0),
      green: 30 + (statsData?.distribution?.green || 0)
    }
  }), [statsData]);

  const categories = useMemo(() => {
    const raw = Array.isArray(categoriesDataRaw) ? categoriesDataRaw : (categoriesDataRaw?.results || []);
    
    // Deduplicate and merge with permanent
    const uniqueDB = raw.reduce((acc: any[], current: any) => {
      if (!acc.find(c => c.name.toLowerCase() === current.name.toLowerCase())) {
        acc.push(current);
      }
      return acc;
    }, []);

    const updatedPermanent = permanentCategories.map(p => {
      const dbVersion = uniqueDB.find((cat: any) => 
        cat.name.toLowerCase() === p.name.toLowerCase() || 
        cat.name.toLowerCase() === p.key.toLowerCase() ||
        (p.key === 'money' && cat.name.toLowerCase() === 'monetary') ||
        (p.key === 'trees' && cat.name.toLowerCase() === 'environment') ||
        (p.key === 'gift' && cat.name.toLowerCase() === 'gifts')
      );
      return dbVersion ? { ...p, ...dbVersion, image: dbVersion.image ? getImageUrl(dbVersion.image) : p.image } : p;
    });

    const onlyDynamic = uniqueDB.filter((cat: any) => 
      !permanentCategories.some(p => 
        p.name.toLowerCase() === cat.name.toLowerCase() || 
        p.key.toLowerCase() === cat.name.toLowerCase() ||
        (p.key === 'money' && cat.name.toLowerCase() === 'monetary') ||
        (p.key === 'trees' && cat.name.toLowerCase() === 'environment') ||
        (p.key === 'gift' && cat.name.toLowerCase() === 'gifts')
      )
    );

    return [...updatedPermanent, ...onlyDynamic].filter(cat => cat.is_active !== false);
  }, [categoriesDataRaw, permanentCategories]);

  return (
    <div className={`min-h-screen ${dark ? 'bg-near-black text-white' : 'bg-white text-near-black'}`}>
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden hero-gradient-wash">
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center pt-20">
          <div className="animate-fade-in-up">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mono-label mb-6 transition-colors ${dark ? 'bg-white/5 text-white' : 'bg-brand-light text-brand-deep'}`}>
              <Heart className={`w-4 h-4 drop-shadow-sm ${dark ? 'text-white' : 'text-heart-red'}`} strokeWidth={2.5} />
              <span>Trusted by {stats.total_donors}+ donors</span>
            </div>
          </div>
          <h1 className={`display-hero mb-6 animate-fade-in-up ${dark ? 'text-white' : 'text-slate-900'}`}>
            {t.hero.tagline}
          </h1>
          <p className={`text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up font-medium ${dark ? 'text-slate-400' : 'text-slate-600'}`} style={{ animationDelay: '0.1s' }}>
            {t.hero.sub}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <Link to="/donate" className={`px-6 py-2.5 rounded-full text-[15px] font-bold transition-all duration-300 active:scale-95 shadow-xl flex items-center gap-2 group ${
              dark 
                ? 'bg-white text-slate-900 shadow-white/10 hover:bg-brand hover:text-slate-900 hover:shadow-brand/20' 
                : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-slate-800'
            }`}>
              {t.hero.donateBtn} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/volunteer" className={`px-6 py-2.5 rounded-full text-[15px] font-bold transition-all duration-300 active:scale-95 border-2 ${
              dark 
                ? 'border-white/10 text-white hover:bg-white/5' 
                : 'border-slate-200 text-slate-900 hover:bg-slate-50'
            }`}>
              {t.hero.volunteerBtn}
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="py-12 sm:py-16 bg-slate-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 md:mb-24 px-4">
            <p className={`mono-label mb-4 uppercase tracking-[0.2em] text-[11px] font-extrabold ${dark ? 'text-brand' : 'text-brand-deep'}`}>{t.categories.title}</p>
            <h2 className={`section-heading mb-6 font-bold tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>{t.categories.title}</h2>
            <p className={`text-base sm:text-lg max-w-2xl mx-auto font-medium leading-relaxed ${dark ? 'text-slate-400' : 'text-slate-600'}`}>{t.categories.sub}</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
            {loadingCats ? [1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} dark={dark} />) : 
              categories.map((cat) => (
                <CategoryCard key={cat.id} cat={cat} dark={dark} getImageUrl={getImageUrl} />
              ))
            }
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative group">
            {/* The Main Premium Card - Slimmer and Wider */}
            <div className={`
              rounded-[48px] p-8 sm:p-12 md:p-16 relative overflow-hidden text-center transition-all duration-500 
              ${dark 
                ? 'bg-gradient-to-br from-[#0a0f1e] via-[#0f172a] to-[#050814] border-white/10' 
                : 'bg-white border-emerald-50'}
              border shadow-[0_30px_70px_rgba(0,0,0,0.08)]
              group-hover:scale-[1.005] group-hover:shadow-[0_40px_90px_rgba(0,0,0,0.12)]
            `}>
              
              {!dark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#18E299] opacity-[0.15] blur-[100px] rounded-full"></div>
                  <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#18E299] opacity-[0.15] blur-[100px] rounded-full"></div>
                </div>
              )}

              {dark && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#18E299] opacity-10 blur-[120px] rounded-full animate-glow-pulse"></div>
                  <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-[#18E299] opacity-10 blur-[130px] rounded-full animate-glow-float"></div>
                </div>
              )}

              <div className="relative z-20 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
                <h2 className={`
                  text-3xl sm:text-4xl md:text-[2.75rem] font-bold font-serif mb-5 tracking-tight
                  ${dark ? 'text-[#95f0c9]' : 'text-[#0a0f1e]'}
                  transition-all duration-500
                `}>
                  Ready to Make a Difference?
                </h2>
                
                <p className={`
                  text-base sm:text-lg mb-10 font-medium leading-relaxed px-4
                  ${dark ? 'text-slate-400' : 'text-slate-600'}
                  max-w-2xl
                `}>
                  Every donation, no matter how small, creates ripples of positive change. Start your journey of giving today.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 w-full">
                  <Link 
                    to="/donate" 
                    className={`
                      px-9 py-3 rounded-full text-base font-bold transition-all duration-300 shadow-lg active:scale-95
                      ${dark ? 'bg-white text-[#0a0f1e] hover:bg-[#95f0c9]' : 'bg-[#0a0f1e] text-white hover:bg-[#1a233e]'}
                    `}
                  >
                    Start Donating
                  </Link>
                  
                  <Link 
                    to="/about" 
                    className={`
                      px-9 py-3 rounded-full text-base font-bold border-2 transition-all active:scale-95
                      ${dark 
                        ? 'border-white/20 text-white glass-morphism hover:bg-white/10' 
                        : 'border-slate-200 text-[#0a0f1e] hover:bg-slate-50'}
                    `}
                  >
                    Learn More
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
