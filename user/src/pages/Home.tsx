import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { ArrowRight, Utensils, BookOpen, Shirt, Banknote, Sprout, Heart, LayoutGrid, HandHeart, Users, TreePine, Gift, ShoppingBag, GraduationCap, Coins } from 'lucide-react';
import { fetchAPI, API_BASE_URL } from '../utils/api';

const getImageUrl = (path: string) => {
  if (!path) return '/images/hero.jpg';
  
  if (path.includes('pancham-sharma-6year-project.vercel.app')) {
    const p = path.toLowerCase();
    if (p.includes('food')) return '/images/stories-food.jpg';
    if (p.includes('clothes')) return "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg";
    if (p.includes('books') || p.includes('education')) return '/images/stories-education.jpg';
    if (p.includes('money')) return "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=800";
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

export default function Home() {
  const { dark, t } = useApp();
  const [stats, setStats] = useState({
    total_donations: 0,
    total_donors: 0,
    food_meals: 0,
    trees_planted: 0,
    distribution: { food: 0, education: 0, green: 0 }
  });

  const permanentCategories = [
    { id: 'p1', key: 'food', name: t.categories.food, description: t.categories.foodDesc, impact_badge: t.categories.foodImpact, icon_name: 'Utensils', image: "/images/stories-food.jpg" },
    { id: 'p2', key: 'clothes', name: t.categories.clothes, description: t.categories.clothesDesc, impact_badge: t.categories.clothesImpact, icon_name: 'Shirt', image: "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg" },
    { id: 'p3', key: 'books', name: t.categories.books, description: t.categories.booksDesc, impact_badge: t.categories.booksImpact, icon_name: 'BookOpen', image: "/images/stories-education.jpg" },
    { id: 'p4', key: 'money', name: t.categories.money, description: t.categories.moneyDesc, impact_badge: t.categories.moneyImpact, icon_name: 'Banknote', image: "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=800" },
    { id: 'p5', key: 'trees', name: t.categories.trees, description: t.categories.treesDesc, impact_badge: t.categories.treesImpact, icon_name: 'Sprout', image: "/images/stories-trees.jpg" },
    { id: 'p6', key: 'gift', name: t.categories.gift, description: t.categories.giftDesc, impact_badge: t.categories.giftImpact, icon_name: 'Gift', image: "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800" },
  ];



  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetchAPI('/api/donations/public_stats/');
        setStats({
          total_donations: 50 + res.total_donations,
          total_donors: 25 + res.total_donors,
          food_meals: 1000 + res.food_meals,
          trees_planted: 200 + res.trees_planted,
          distribution: {
            food: 40 + res.distribution.food,
            education: 30 + res.distribution.education,
            green: 30 + res.distribution.green
          }
        });
      } catch (err) {
        console.error("Failed to load public stats", err);
      }
    };

    const fetchCategories = async () => {
      try {
        const res = await fetchAPI(`/api/donations/categories/?t=${new Date().getTime()}`);
        const categoriesData = Array.isArray(res) ? res : (res.results || res.data || []);
        console.log("Fetched Categories Data:", categoriesData);
        
        // Deduplicate categoriesData itself by name first
        const uniqueDB = categoriesData.reduce((acc: any[], current: any) => {
          if (!acc.find(c => c.name.toLowerCase() === current.name.toLowerCase())) {
            acc.push(current);
          }
          return acc;
        }, []);

        // Merge logic: Use DB version of permanent categories if they exist
        const updatedPermanent = permanentCategories.map(p => {
          const dbVersion = uniqueDB.find((cat: any) => 
            cat.name.toLowerCase() === p.name.toLowerCase() || 
            cat.name.toLowerCase() === p.key.toLowerCase() ||
            (p.key === 'money' && cat.name.toLowerCase() === 'monetary') ||
            (p.key === 'trees' && cat.name.toLowerCase() === 'environment') ||
            (p.key === 'gift' && cat.name.toLowerCase() === 'gifts')
          );
          
          if (dbVersion) {
            return {
              ...p,
              ...dbVersion,
              // If the DB has a valid image, use it via getImageUrl, else p.image
              image: dbVersion.image ? getImageUrl(dbVersion.image) : p.image
            };
          }
          return p;
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

        const allCategories = [...updatedPermanent, ...onlyDynamic];
        const visibleCategories = allCategories.filter(cat => cat.is_active !== false);

        setCategories(visibleCategories);
      } catch (err) {
        console.error("Failed to load categories", err);
        setCategories(permanentCategories);
      }
    };

    fetchStats();
    fetchCategories();
  }, [t]); // Re-run when language changes to keep translations in sync

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
            {categories.length > 0 ? categories.map((cat) => {
              const iconKey = (cat.icon_name || 'Heart').toLowerCase();
              const Icon = iconMap[iconKey] || Heart;
              return (
                <div key={cat.id} className={`card-modern group w-full ${dark ? 'bg-white/5 border-white/10' : 'bg-white shadow-xl shadow-gray-200/40 border-gray-100'}`}>
                  <div className="h-60 overflow-hidden relative">
                    <img 
                      src={getImageUrl(cat.image)} 
                      alt={cat.name} 
                      className="w-full h-full object-cover card-img-grayscale"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const name = cat.name.toLowerCase();
                        if (name.includes('food')) e.currentTarget.src = "/images/stories-food.jpg";
                        else if (name.includes('clothes')) e.currentTarget.src = "https://i.pinimg.com/736x/0c/59/51/0c5951d6535588129d8cb0deaabb35d0.jpg";
                        else if (name.includes('book') || name.includes('education')) e.currentTarget.src = "/images/stories-education.jpg";
                        else if (name.includes('money')) e.currentTarget.src = "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?q=80&w=800";
                        else if (name.includes('tree') || name.includes('environment')) e.currentTarget.src = "/images/stories-trees.jpg";
                        else if (name.includes('gift')) e.currentTarget.src = "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=800";
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
            }) : [1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className={`card-modern w-full animate-pulse ${dark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/40'}`}>
                <div className="h-60 bg-gray-200 dark:bg-gray-800" />
                <div className="p-8 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-800 mb-4" />
                  <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded mb-4" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-800 rounded mb-6" />
                  <div className="h-8 w-40 bg-gray-200 dark:bg-gray-800 rounded-full mb-8" />
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <div className={`rounded-[48px] py-16 px-10 sm:px-20 relative overflow-hidden text-center transition-all duration-700 group shadow-[0_40px_100px_rgba(0,0,0,0.1)] ${
            dark 
              ? 'bg-[#0f172b] border border-white/5' 
              : 'bg-white border border-slate-100'
          }`} style={{ 
            scrollbarWidth: 'thin', 
            scrollbarColor: 'var(--color-brand) transparent' 
          }}>
             {/* Dynamic Moving Green Glows - Targeted Corners */}
             <div className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-1000 group-hover:scale-110">
                <div className={`absolute -left-20 -top-20 w-[60%] h-[60%] rounded-full animate-bg-drift transition-opacity duration-700 opacity-40 group-hover:opacity-80`} 
                  style={{ backgroundColor: 'var(--color-brand)', filter: 'blur(100px)' }} />
                <div className={`absolute -right-20 -bottom-20 w-[60%] h-[60%] rounded-full animate-bg-drift transition-opacity duration-700 opacity-40 group-hover:opacity-80`} 
                  style={{ backgroundColor: 'var(--color-brand)', filter: 'blur(100px)', animationDirection: 'reverse', animationDelay: '-7s' }} />
             </div>
             
             <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-4xl mx-auto">
                <h2 className={`text-3xl sm:text-4xl md:text-5xl font-bold font-serif mb-6 tracking-tight leading-tight ${
                  dark ? 'text-[#95f0c9]' : 'text-slate-900'
                }`}>
                  Ready to Make a Difference?
                </h2>
                <p className={`text-base sm:text-lg mb-10 font-medium leading-relaxed px-6 ${
                  dark ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Every donation, no matter how small, creates ripples of positive change. Start your journey of giving today.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
                  <Link to="/donate" className={`px-8 py-3 rounded-full text-base font-bold transition-all duration-300 active:scale-95 shadow-2xl ${
                    dark ? 'bg-white text-slate-900 hover:bg-[#95f0c9]' : 'bg-slate-900 text-white shadow-slate-900/40 hover:bg-slate-800'
                  }`}>
                    Start Donating
                  </Link>
                  <Link to="/about" className={`px-8 py-3 rounded-full text-base font-bold border-2 transition-all active:scale-95 ${
                    dark ? 'border-white/10 text-white hover:bg-white/5' : 'border-slate-200 text-slate-900 hover:bg-slate-50'
                  }`}>
                    Learn More
                  </Link>
                </div>
             </div>
          </div>
        </div>
      </section>
    </div>
  );
}
