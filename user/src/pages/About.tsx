import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Target, Eye, BookOpen, Users, TreePine, Utensils, HandHeart, Award, Globe, ChevronRight, ChevronLeft } from 'lucide-react';
import { getImageUrl } from '../utils/api';

function useCountUp(end: number, dur = 2000) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    if (!started) return;
    let s = 0; const step = end / (dur / 16);
    const t = setInterval(() => { s += step; if (s >= end) { setCount(end); clearInterval(t); } else setCount(Math.floor(s)); }, 16);
    return () => clearInterval(t);
  }, [started, end, dur]);
  return { count, ref };
}

export default function About() {
  const { dark, t } = useApp();
  const d1 = useCountUp(35000);
  const d2 = useCountUp(18500);
  const d3 = useCountUp(12000);
  const d4 = useCountUp(25000);

  const timeline = [
    { year: '2019', title: 'The Beginning', desc: 'Started with 5 friends distributing food packets in Mumbai slums.' },
    { year: '2020', title: 'Digital Platform', desc: 'Launched online platform during pandemic to coordinate relief efforts.' },
    { year: '2021', title: 'Growing Impact', desc: 'Expanded to 10 cities with 500+ active volunteers.' },
    { year: '2022', title: 'Green Initiative', desc: 'Launched tree plantation drive, planted 5,000 trees in first year.' },
    { year: '2023', title: 'Education Wing', desc: 'Opened 15 free learning centers across rural India.' },
    { year: '2024', title: 'National Reach', desc: 'Present in 50+ cities with 10,000+ donors and counting.' },
  ];

  const team = [
    { name: 'Priya Rani', role: 'Founder & CEO', emoji: '👩‍💼' },
    { name: 'Ramandeep Kaur', role: 'Operations Head', emoji: '👨‍💻' },
    { name: 'Pancham', role: 'Community Lead', emoji: '👩‍🎓' },
    { name: 'Vikram Singh', role: 'Tech Lead', emoji: '👨‍🔬' },
  ];

  return (
    <div className={`min-h-screen pt-24 pb-16 ${dark ? 'bg-[#0f172b]' : 'bg-white'}`}>
      {/* Hero Banner */}
      <section className="max-w-7xl mx-auto px-4 mb-16">
        <div className={`relative rounded-[32px] overflow-hidden shadow-2xl group border border-gray-100`}>
          <img 
            src="/images/about-team.jpg" 
            alt="Our Team" 
            className="w-full h-[250px] sm:h-[320px] md:h-[400px] lg:h-[450px] object-cover transition-transform duration-1000 group-hover:scale-105" 
            loading="lazy"
            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero.jpg'; }}
          />

          <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/40 to-black/20" />
          
          <div className="absolute inset-0 flex flex-col justify-end p-8 sm:p-12 md:p-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-6 bg-white/20 backdrop-blur-md text-white border border-white/10 w-fit">
              <Heart className="w-4 h-4" /> About Us
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-serif text-white mb-4 tracking-tight leading-tight">
              About Seva Marg
            </h1>
            <p className="text-white/90 text-base sm:text-lg md:text-xl max-w-2xl leading-relaxed font-medium">
              Building bridges of compassion across India since 2019
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={`py-16 ${dark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`rounded-[32px] p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center ${dark ? 'bg-slate-800' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl rotate-3 ${
              dark ? 'bg-white shadow-white/5' : 'bg-[#0f172b] shadow-slate-900/20'
            }`}>
              <Target className={`w-8 h-8 ${dark ? 'text-brand' : 'text-white'}`} />
            </div>
            <h2 className={`text-2xl font-bold font-serif mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.mission}</h2>
            <p className={`text-[15px] leading-relaxed font-medium ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.missionText}</p>
          </div>
          <div className={`rounded-[32px] p-10 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl flex flex-col items-center text-center ${dark ? 'bg-slate-800' : 'bg-white shadow-xl shadow-gray-200/50'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 shadow-xl -rotate-3 ${
              dark ? 'bg-white shadow-white/5' : 'bg-[#0f172b] shadow-slate-900/20'
            }`}>
              <Eye className={`w-8 h-8 ${dark ? 'text-brand' : 'text-white'}`} />
            </div>
            <h2 className={`text-2xl font-bold font-serif mb-4 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.vision}</h2>
            <p className={`text-[15px] leading-relaxed font-medium ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.visionText}</p>
          </div>
        </div>
      </section>

      {/* Story with Image */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="/images/volunteer-hero.jpg" 
              alt="Our story" 
              className="w-full h-[350px] sm:h-[450px] md:h-[500px] lg:h-[550px] object-cover hover:scale-105 transition-transform duration-700" 
              loading="lazy"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero.jpg'; }}
            />

          </div>
          <div>
            <h2 className={`text-3xl font-bold font-serif mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.story}</h2>
            <p className={`text-lg leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.storyText}</p>
            <div className="mt-6 flex gap-4">
              <div className={`rounded-xl p-6 flex-1 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg shadow-primary-900/5 hover:shadow-xl'}`}>
                <div className={`text-xl font-bold ${dark ? 'text-white' : 'text-primary-600'}`}>6+</div>
                <div className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-500'}`}>Years of Service</div>
              </div>
              <div className={`rounded-xl p-6 flex-1 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1 ${dark ? 'bg-white/5 border border-white/10' : 'bg-white shadow-lg shadow-accent-900/5 hover:shadow-xl'}`}>
                <div className={`text-xl font-bold ${dark ? 'text-white' : 'text-accent-600'}`}>50+</div>
                <div className={`text-sm ${dark ? 'text-slate-300' : 'text-gray-500'}`}>Cities Covered</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className={`py-16 ${dark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-4xl mx-auto px-4">
          <h2 className={`text-3xl font-bold font-serif text-center mb-12 ${dark ? 'text-white' : 'text-gray-900'}`}>Our Journey</h2>
          <div className="relative">
            <div className={`absolute left-4 sm:left-1/2 top-0 bottom-0 w-0.5 ${dark ? 'bg-slate-700' : 'bg-gray-200'}`} />
            {timeline.map((item, i) => (
              <div key={i} className={`relative flex items-start mb-8 ${i % 2 === 0 ? 'sm:flex-row' : 'sm:flex-row-reverse'}`}>
                <div className="hidden sm:block sm:w-1/2" />
                <div className={`absolute left-4 sm:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center z-10 shadow-lg ${
                  dark ? 'bg-white shadow-white/5' : 'bg-[#0f172b] shadow-slate-900/20'
                }`}>
                  {i % 2 === 0 ? (
                    <ChevronRight className={`w-4 h-4 ${dark ? 'text-slate-900' : 'text-white'}`} />
                  ) : (
                    <>
                      <ChevronRight className={`w-4 h-4 sm:hidden ${dark ? 'text-slate-900' : 'text-white'}`} />
                      <ChevronLeft className={`w-4 h-4 hidden sm:block ${dark ? 'text-slate-900' : 'text-white'}`} />
                    </>
                  )}
                </div>
                <div className={`ml-14 sm:ml-0 sm:w-1/2 ${i % 2 === 0 ? 'sm:pr-8' : 'sm:pl-8'}`}>
                  <div className={`rounded-2xl p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${dark ? 'bg-slate-800' : 'bg-white shadow-md'}`}>
                    <span className="text-sm font-bold text-primary-500">{item.year}</span>
                    <h3 className={`font-bold mt-1 ${dark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                    <p className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Animated Counters */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={`text-3xl font-bold font-serif text-center mb-12 ${dark ? 'text-white' : 'text-gray-900'}`}>Impact in Numbers</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { ref: d1.ref, count: d1.count, label: 'Total Donations', icon: HandHeart, color: 'from-green-400 to-emerald-400' },
              { ref: d2.ref, count: d2.count, label: 'People Helped', icon: Users, color: 'from-blue-400 to-indigo-400' },
              { ref: d3.ref, count: d3.count, label: 'Trees Planted', icon: TreePine, color: 'from-teal-400 to-cyan-400' },
              { ref: d4.ref, count: d4.count, label: 'Meals Served', icon: Utensils, color: 'from-orange-400 to-red-400' },
            ].map((item, i) => (
              <div key={i} ref={item.ref} className={`text-center p-6 rounded-2xl transition-all hover:-translate-y-1 hover:shadow-lg ${dark ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-100'}`}>
                <div className={`w-12 h-12 rounded-xl bg-linear-to-br ${item.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.count.toLocaleString()}+</div>
                <div className={`text-sm mt-1 ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Strip */}
      <section className={`py-16 ${dark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={`text-3xl font-bold font-serif text-center mb-12 ${dark ? 'text-white' : 'text-gray-900'}`}>Our Work in Pictures</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c',
              'https://images.unsplash.com/photo-1593113598332-cd288d649433',
              'https://images.unsplash.com/photo-1497633762265-9d179a990aa6',
              'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09'
            ].map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-lg group cursor-pointer aspect-square">
                <img 
                  src={getImageUrl(img)} 
                  alt={`Gallery ${i + 1}`} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                  loading="lazy"
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/images/hero.jpg'; }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className={`text-3xl font-bold font-serif text-center mb-12 ${dark ? 'text-white' : 'text-gray-900'}`}>Meet Our Team</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((m, i) => (
              <div key={i} className={`text-center rounded-2xl p-6 transition-all hover:-translate-y-2 hover:shadow-xl ${dark ? 'bg-slate-800' : 'bg-white shadow-sm border border-gray-100'}`}>
                <div className="text-5xl mb-3">{m.emoji}</div>
                <h3 className={`font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{m.name}</h3>
                <p className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={`py-16 ${dark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className={`text-3xl font-bold font-serif text-center mb-12 ${dark ? 'text-white' : 'text-gray-900'}`}>Our Core Values</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Heart, title: 'Compassion', desc: 'Every action driven by genuine care for communities', color: 'from-[#ff4d6d] to-[#ff758f]' },
              { icon: Globe, title: 'Transparency', desc: '100% visibility into how donations are utilized', color: 'from-[#4361ee] to-[#4895ef]' },
              { icon: Award, title: 'Excellence', desc: 'Striving for the highest impact in everything we do', color: 'from-[#f72585] to-[#7209b7]' },
              { icon: BookOpen, title: 'Education', desc: 'Empowering through knowledge and awareness', color: 'from-[#b5179e] to-[#4cc9f0]' },
            ].map((v, i) => (
              <div key={i} className={`text-center p-8 rounded-[40px] transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl group ${dark ? 'bg-[#1e293b]/50 border border-white/5' : 'bg-white shadow-xl shadow-gray-200/40 border border-gray-50'}`}>
                <div className={`w-20 h-20 rounded-[28px] bg-linear-to-br ${v.color} flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-${v.color.split('-')[1]}/20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
                  <v.icon className="w-10 h-10 text-white" strokeWidth={1.5} fill="none" />
                </div>
                <h3 className={`font-bold text-2xl mb-4 ${dark ? 'text-white' : 'text-slate-900'}`}>{v.title}</h3>
                <p className={`text-[15px] leading-relaxed px-2 ${dark ? 'text-slate-400' : 'text-slate-500 font-medium'}`}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
