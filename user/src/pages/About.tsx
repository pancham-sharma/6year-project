import { useEffect, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Heart, Target, Eye, BookOpen, Users, TreePine, Utensils, HandHeart, Award, Globe, ChevronRight, ChevronLeft } from 'lucide-react';

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
    { name: 'Priya Sharma', role: 'Founder & CEO', emoji: '👩‍💼' },
    { name: 'Rahul Verma', role: 'Operations Head', emoji: '👨‍💻' },
    { name: 'Ananya Patel', role: 'Community Lead', emoji: '👩‍🎓' },
    { name: 'Vikram Singh', role: 'Tech Lead', emoji: '👨‍🔬' },
  ];

  return (
    <div className={`min-h-screen pt-24 pb-16 ${dark ? 'bg-slate-900' : 'bg-white'}`}>
      {/* Hero Banner */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <div className={`relative rounded-3xl overflow-hidden ${dark ? 'shadow-2xl shadow-slate-950/50' : 'shadow-2xl'}`}>
          <img src="/images/about-team.jpg" alt="Our team" className="w-full h-72 sm:h-96 object-cover" />
          <div className={`absolute inset-0 ${dark ? 'bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-slate-900/20' : 'bg-gradient-to-t from-black/80 via-black/40 to-black/10'}`} />
          <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium mb-4 bg-white/20 backdrop-blur-sm text-white`}>
              <Heart className="w-4 h-4" /> About Us
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold font-serif text-white">{t.about.title}</h1>
            <p className="text-white/70 text-lg mt-3 max-w-2xl">Building bridges of compassion across India since 2019</p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className={`py-16 ${dark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className={`rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-xl ${
              dark ? 'bg-white shadow-white/5' : 'bg-gradient-to-br from-brand to-brand-deep shadow-brand/20'
            }`}>
              <Target className={`w-7 h-7 ${dark ? 'text-brand' : 'text-slate-900'}`} />
            </div>
            <h2 className={`text-2xl font-bold font-serif mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.mission}</h2>
            <p className={`leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.missionText}</p>
          </div>
          <div className={`rounded-3xl p-8 transition-all hover:-translate-y-1 hover:shadow-xl ${dark ? 'bg-slate-800' : 'bg-white shadow-lg'}`}>
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-6 shadow-xl ${
              dark ? 'bg-white shadow-white/5' : 'bg-gradient-to-br from-blue-400 to-indigo-600 shadow-blue-500/20'
            }`}>
              <Eye className={`w-7 h-7 ${dark ? 'text-blue-500' : 'text-white'}`} />
            </div>
            <h2 className={`text-2xl font-bold font-serif mb-3 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.vision}</h2>
            <p className={`leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.visionText}</p>
          </div>
        </div>
      </section>

      {/* Story with Image */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="rounded-3xl overflow-hidden shadow-xl">
            <img src="/images/stories-food.jpg" alt="Our story" className="w-full h-80 object-cover hover:scale-105 transition-transform duration-700" />
          </div>
          <div>
            <h2 className={`text-3xl font-bold font-serif mb-6 ${dark ? 'text-white' : 'text-gray-900'}`}>{t.about.story}</h2>
            <p className={`text-lg leading-relaxed ${dark ? 'text-gray-300' : 'text-gray-600'}`}>{t.about.storyText}</p>
            <div className="mt-6 flex gap-4">
              <div className={`rounded-xl p-4 flex-1 ${dark ? 'bg-primary-900/20' : 'bg-primary-50'}`}>
                <div className={`text-2xl font-bold ${dark ? 'text-brand' : 'text-primary-600'}`}>6+</div>
                <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Years of Service</div>
              </div>
              <div className={`rounded-xl p-4 flex-1 ${dark ? 'bg-accent-900/20' : 'bg-accent-50'}`}>
                <div className={`text-2xl font-bold ${dark ? 'text-brand' : 'text-accent-600'}`}>50+</div>
                <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>Cities Covered</div>
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
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-3 shadow-lg`}>
                  <item.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`text-3xl font-bold ${dark ? 'text-white' : 'text-gray-900'}`}>{item.count.toLocaleString()}+</div>
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
            {['/images/hero.jpg', '/images/stories-food.jpg', '/images/stories-education.jpg', '/images/stories-trees.jpg'].map((img, i) => (
              <div key={i} className="rounded-2xl overflow-hidden shadow-lg group cursor-pointer aspect-square">
                <img src={img} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
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
                <div className={`w-20 h-20 rounded-[28px] bg-gradient-to-br ${v.color} flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-${v.color.split('-')[1]}/20 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-6`}>
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
