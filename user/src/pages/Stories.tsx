import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Quote, Star, BookOpen, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const stories = [
  { id: 1, title: 'From Hunger to Hope', name: 'Lakshmi Devi', location: 'Mumbai', before: 'A family of 5 struggling to find daily meals', after: 'Now receives regular nutritious food packages every week', quote: 'SevaSetu gave us hope when we had lost everything. My children can now focus on studies instead of hunger.', image: '/images/stories-food.jpg', category: 'Food', color: 'from-orange-400 to-red-400' },
  { id: 2, title: 'Education Changes Everything', name: 'Arjun Kumar', location: 'Rural Bihar', before: 'Dropped out of school at age 10 due to lack of resources', after: 'Now studying in 8th grade with donated books and mentorship', quote: 'The books and guidance I received opened a new world for me. I want to become a teacher someday.', image: '/images/stories-education.jpg', category: 'Education', color: 'from-purple-400 to-pink-400' },
  { id: 3, title: 'A Greener Tomorrow', name: 'Ramesh Patel', location: 'Rajasthan', before: 'Barren land with no shade, water scarcity in the village', after: 'Over 500 trees planted, transforming the landscape', quote: 'Our village is green again. The trees bring rain, shade, and hope for our children\'s future.', image: '/images/stories-trees.jpg', category: 'Trees', color: 'from-green-400 to-emerald-400' },
  { id: 4, title: 'Clothes that Brought Dignity', name: 'Meena Yadav', location: 'Delhi', before: 'Children going to school in torn clothes, facing ridicule', after: 'Received quality clothing, restored confidence and dignity', quote: 'When my children got new clothes, I saw their faces light up. They stood taller that day.', image: '/images/volunteer-hero.jpg', category: 'Clothes', color: 'from-blue-400 to-indigo-400' },
  { id: 5, title: 'Rebuilding After Loss', name: 'Suresh Sharma', location: 'Kerala', before: 'Lost everything in floods, family displaced', after: 'Received monetary aid, groceries, and rehabilitation support', quote: 'When the flood took everything, SevaSetu volunteers were the first to arrive. They helped us rebuild.', image: '/images/about-team.jpg', category: 'Monetary', color: 'from-yellow-400 to-orange-400' },
  { id: 6, title: 'The Power of Community', name: 'Fatima Begum', location: 'Hyderabad', before: 'Elderly woman living alone with no support', after: 'Connected with volunteer network, receives regular care', quote: 'I thought I was forgotten. But these young volunteers visit me every week. I feel like I have a family again.', image: '/images/hero.jpg', category: 'Community', color: 'from-pink-400 to-rose-400' },
];

const inspQuotes = [
  { text: "Chhoti si madad, kisi ki badi muskaan ban jaati hai.", author: "SevaMarge" },
  { text: "Daulat se nahi, niyat se ameer bano.", author: "SevaMarge" },
  { text: "Jo diya hai tumne, wahi kal dua ban kar lautega.", author: "SevaMarge" },
  { text: "Insaan woh nahi jo rakhta hai, woh hai jo baant deta hai.", author: "SevaMarge" },
  { text: "Ek roti dene se pet hi nahi, rishta bhi bhar jaata hai.", author: "SevaMarge" },
  { text: "Madad ka size chhota ho sakta hai, asar nahi.", author: "SevaMarge" },
  { text: "Dene wala bada hota hai, paise se nahi dil se.", author: "SevaMarge" },
];

export default function Stories() {
  const { dark, t } = useApp();
  const [selected, setSelected] = useState<string | null>(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const filtered = selected ? stories.filter(s => s.category === selected) : stories;
  const cats = [...new Set(stories.map(s => s.category))];

  // Auto-scroll quotes
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIdx(prev => (prev + 1) % inspQuotes.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-500 ${dark ? 'bg-[#0f172b]' : 'bg-white'}`}>
      {/* Hero Banner with Image */}
      <section className="relative overflow-hidden mb-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className={`relative rounded-3xl overflow-hidden ${dark ? 'shadow-2xl shadow-slate-950/50' : 'shadow-2xl'}`}>
            <img src="/images/stories-food.jpg" alt="Impact stories" className="w-full h-64 sm:h-80 object-cover" />
            <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-900/40' : 'bg-gradient-to-r from-black/70 via-black/50 to-black/20'}`} />
            <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-medium mb-3 w-fit">
                <BookOpen className="w-3 h-3" /> Real Impact Stories
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold font-serif text-white mb-3">{t.stories.title}</h1>
              <p className="text-white/80 text-sm sm:text-lg max-w-xl">{t.stories.sub}</p>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4">
        {/* Inspirational Quote Carousel */}
        <div className={`rounded-3xl p-8 sm:p-14 mb-12 relative overflow-hidden transition-all duration-700 ${dark ? 'bg-slate-800/50 border border-white/10 shadow-2xl shadow-slate-950/50' : 'bg-white shadow-2xl shadow-primary-900/10 border border-gray-100'}`}>
          <div className="absolute top-0 right-0 w-60 h-60 rounded-full bg-primary-500/5 -translate-y-1/2 translate-x-1/2 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-accent-500/5 translate-y-1/2 -translate-x-1/2 blur-3xl" />
          
          <Quote className={`w-14 h-14 mb-8 ${dark ? 'text-white/30' : 'text-primary-200'}`} />
          
          <div className="relative h-[180px] sm:h-[140px] overflow-hidden">
            <div 
              className="flex transition-transform duration-1000 ease-in-out h-full"
              style={{ transform: `translateX(-${quoteIdx * 100}%)` }}
            >
              {inspQuotes.map((q, i) => (
                <div key={i} className="min-w-full flex flex-col justify-center pr-4">
                  <p className={`text-2xl sm:text-3xl font-serif italic leading-relaxed ${dark ? 'text-white' : 'text-slate-800'}`}>
                    "{q.text}"
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-10 relative z-10">
            {inspQuotes.map((_, i) => (
              <button 
                key={i} 
                onClick={() => setQuoteIdx(i)} 
                className={`h-1.5 rounded-full transition-all duration-700 ${i === quoteIdx ? (dark ? 'bg-white w-12' : 'bg-primary-500 w-12') : (dark ? 'bg-white/20 hover:bg-white/40 w-3' : 'bg-gray-200 hover:bg-gray-300 w-3')}`} 
              />
            ))}
          </div>
        </div>

        {/* Filter */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          <button onClick={() => setSelected(null)} className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${
            !selected 
              ? (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20') 
              : (dark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200')
          }`}>
            All Stories
          </button>
          {cats.map(c => (
            <button key={c} onClick={() => setSelected(c)} className={`px-6 py-2.5 rounded-full text-[13px] font-bold transition-all ${
              selected === c 
                ? (dark ? 'bg-white text-slate-900 shadow-xl shadow-white/10' : 'bg-slate-900 text-white shadow-xl shadow-slate-900/20') 
                : (dark ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-gray-100 text-slate-600 hover:bg-gray-200')
            }`}>
              {c}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filtered.map(story => (
            <div key={story.id} className={`group rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${dark ? 'bg-slate-800 hover:shadow-slate-700/30' : 'bg-white shadow-lg border border-gray-100'}`}>
              {/* Image Header */}
              <div className="relative h-52 overflow-hidden">
                <img src={story.image} alt={story.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent`} />
                <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-xs font-medium">
                  {story.category}
                </div>
                <div className="absolute bottom-4 left-5 right-5">
                  <h3 className="text-xl font-bold text-white">{story.title}</h3>
                  <p className="text-white/80 text-sm mt-1">{story.name} • {story.location}</p>
                </div>
              </div>
              <div className="p-6">
                {/* Before / After */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`rounded-xl p-3 ${dark ? 'bg-red-900/20 border border-red-800/30' : 'bg-red-50 border border-red-100'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wide ${dark ? 'text-red-400' : 'text-red-600'}`}>Before</span>
                    <p className={`text-sm mt-1.5 leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{story.before}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${dark ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-100'}`}>
                    <span className={`text-xs font-bold uppercase tracking-wide ${dark ? 'text-green-400' : 'text-green-600'}`}>After</span>
                    <p className={`text-sm mt-1.5 leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{story.after}</p>
                  </div>
                </div>
                {/* Quote */}
                <div className={`rounded-xl p-4 ${dark ? 'bg-slate-700/50' : 'bg-gray-50'}`}>
                  <Quote className={`w-4 h-4 mb-1 ${dark ? 'text-primary-400/40' : 'text-primary-300'}`} />
                  <p className={`text-sm italic leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>"{story.quote}"</p>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <span className={`text-xs font-medium ${dark ? 'text-primary-400' : 'text-primary-600'}`}>Verified Story</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <div className={`rounded-3xl p-8 sm:p-12 relative overflow-hidden ${dark ? 'bg-[#0f172b] border border-white/10' : 'bg-[#1e293b]'}`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-5 left-5 w-32 h-32 rounded-full bg-white" />
              <div className="absolute bottom-5 right-5 w-48 h-48 rounded-full bg-white" />
            </div>
            <div className="relative z-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif mb-3">Want to Create More Stories Like These?</h2>
              <p className="text-white/80 mb-6 max-w-md mx-auto">Your donation has the power to transform lives and create lasting impact.</p>
              <Link to="/donate" className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-slate-900 rounded-full text-[15px] font-bold hover:bg-brand-50 transition-all shadow-xl active:scale-95 group">
                Donate Now <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
