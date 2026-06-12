import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const sparkles = [
  { top: '12%', left: '8%', size: 6, delay: '0s' },
  { top: '22%', left: '46%', size: 4, delay: '1.1s' },
  { top: '8%', left: '70%', size: 5, delay: '2s' },
  { top: '38%', left: '18%', size: 4, delay: '0.6s' },
  { top: '60%', left: '6%', size: 5, delay: '1.6s' },
  { top: '70%', left: '40%', size: 4, delay: '2.4s' },
  { top: '30%', left: '88%', size: 6, delay: '0.9s' },
  { top: '78%', left: '82%', size: 4, delay: '1.9s' },
  { top: '52%', left: '62%', size: 5, delay: '3s' },
  { top: '16%', left: '30%', size: 3, delay: '2.7s' },
];

const features = [
  {
    title: 'Smart Transfers',
    items: [
      {
        title: 'AI Transfer Prediction',
        desc: 'Machine learning algorithms analyze service records and policy criteria to recommend optimal transfers.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47-2.47" />
          </svg>
        ),
      },
      {
        title: 'Transfer Order Generation',
        desc: 'Automatic generation of official government transfer orders upon approval, ready for download.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        ),
      },

    ],
  },
  {
    title: 'Workforce Analytics',
    items: [
      {
        title: 'Smart Workforce Analytics',
        desc: 'Real-time dashboards tracking teacher distribution, shortage areas, and student-teacher ratios.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
          </svg>
        ),
      },
      { title: 'Vacancy Mapping', desc: 'Visualizing open positions across every district and mandal to optimize hiring.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg> },
    ],
  },
  {
    title: 'Governance',
    items: [
      {
        title: 'Role-Based Governance',
        desc: 'Dedicated portals for Teachers and Mandal Education Officers with secure access control.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
          </svg>
        ),
      },
      { title: 'Approval Tracking', desc: 'End-to-end visibility into the status of every application within the pipeline.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg> },
    ],
  },
  {
    title: 'Automation & AI',
    items: [
      {
        title: 'Automated Workflows',
        desc: 'End-to-end transfer management from application to approval with automatic synchronization.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
          </svg>
        ),
      },
      {
        title: 'School Allocation Engine',
        desc: 'Intelligent school recommendations based on vacancy, shortage, and subject requirements.',
        icon: (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
          </svg>
        ),
      },
    ],
  },
];

const aboutHighlights = [
  {
    title: 'AI Eligibility',
    desc: 'Explainable machine learning evaluates every transfer request against transparent, policy-driven criteria.',
    image: '/ai eligibility.png',
    gradient: 'from-[#14B8A6] to-[#14B8A6]',
    accent: '#14B8A6',
  },
  {
    title: 'Transparent Transfers',
    desc: 'Every decision is auditable end-to-end, with clear priority scores and reasons visible to all stakeholders.',
    image: '/transparent transfers.png',
    gradient: 'from-[#14B8A6] to-[#0284C7]',
    accent: '#14B8A6',
  },
  {
    title: 'Workforce Balancing',
    desc: 'Smart allocation closes shortage gaps and balances student-teacher ratios across every mandal.',
    image: '/workforce balancing.png',
    gradient: 'from-[#059669] to-[#14B8A6]',
    accent: '#059669',
  },
  {
    title: 'Data Driven Governance',
    desc: 'Live dashboards turn workforce data into actionable insight for confident, accountable decisions.',
    image: '/data driven governance.png',
    gradient: 'from-[#0284C7] to-[#14B8A6]',
    accent: '#0284C7',
  },
];

const priorityScores = [
  { label: 'Transfer Request Filed', score: '+30' },
  { label: 'Medical Condition', score: '+25' },
  { label: 'Service Years >= 5', score: '+20' },
  { label: 'Spouse Distance > 200km', score: '+20' },
  { label: 'Promotion Due', score: '+10' },
  { label: 'Long Service >= 10 years', score: '+10' },
];

const aiPoints = [
  'Explainable AI — understand why transfers are recommended',
  'Smart school allocation using vacancy and shortage analysis',
];

const featureColors = ['#14B8A6', '#0F766E', '#059669', '#0284C7'];

function useScrollReveal() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll('.reveal, .reveal-stagger'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-[65vh] bg-soft-white text-navy">
      {/* Hero */}
        <section id="top" className="relative w-full h-[65vh] min-h-[600px] overflow-hidden bg-transparent">
        {/* 1. Background Artwork */}
        <img
          src="/hero section.jpeg"
          alt="SHIXO Teacher Transfer and India Network Map"
          
        className="absolute inset-0 w-full h-full object-cover object-top select-none pointer-events-none z-0 select-none pointer-events-none z-0" 
          draggable="false"
        />

        {/* Light floating particles */}
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          {sparkles.map((s, i) => (
            <span
              key={i}
              className="sparkle absolute rounded-full bg-teal-light/30"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
        </div>

        {/* Integrated Premium Glassmorphism Navbar */}
        {/* The navbar is positioned at the very top of the hero section */}
        <nav className="absolute top-0 left-0 right-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10"> 
          {/* This ensures the navbar floats over the hero image and does not cover the hero text */}

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-15">
              <a href="#top" className="flex items-center gap-3">
                <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-8 h-8 rounded-xl object-cover shadow-sm ring-1 ring-white/30" />
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight text-black leading-none">SHIXO</h1>
                  <p className="text-[10px] text-teal-light mt-0.5 font-bold uppercase tracking-widest">GovTech Platform</p>
                </div>
              </a>
              <div className="hidden md:flex items-center gap-4">
                <a href="#features" className="text-sm font-bold text-white/80 hover:text-white transition-colors">Features</a>
                <a href="#analytics" className="text-sm font-bold text-white/80 hover:text-white transition-colors">Analytics</a>
                <a href="#about" className="text-sm font-bold text-white/80 hover:text-white transition-colors">About</a>
                
                <Link
                  to="/login"
             className="bg-[#3F7F7A] hover:bg-[#356D68] text-white px-6 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_8px_20px_-6px_rgba(19,78,74,0.5)] hover:scale-105 active:scale-95">
                  Login Portal
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Content Area (Left Side - Visual Split) */}
        <div className="absolute inset-0 z-30 flex items-start pt-24">
          {/* This div ensures content is positioned below navbar */}

          <div className="w-full px-4 sm:px-6 lg:px-8">
            {/* The max-w-[45%] ensures the text content occupies the left side, leaving the right for the image */}
            

 <div className="reveal max-w-[45%] text-left">

<h2
  className="text-lg md:text-2xl lg:text-[3rem] font-bold text-navy leading-[0.95] tracking-[-0.03em] mb-2"
  style={{ fontFamily: 'Space Grotesk, sans-serif' }}
>
  SMART TEACHER
  <br />
  TRANSFER &
  <br />
  <span className="text-[#509B95]">
    WORKFORCE ANALYTICS
  </span>
</h2>

<p className="text-slate text-lg md:text-xl leading-relaxed mb-8 max-w-xl font-medium">
  Transparent, data-driven governance for managing government teacher transfers,
  workforce allocation, and education workforce monitoring across districts and mandals.
</p>

<div className="flex flex-wrap gap-4">
  <Link
    to="/login"
    className="inline-block bg-gradient-to-r from-teal to-[#509B95] text-white px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.03] shadow-[0_12px_30px_-6px_rgba(15,157,148,0.45)]"
  >
    Access Portal
  </Link>

  <a
    href="#features"
    className="inline-block bg-white/90 border border-teal/20 text-navy px-8 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white shadow-lg"
  >
    Explore Features
  </a>
</div>
          </div>
        </div>
      </div>
           </section>


   {/* 3. Statistics Row (Glassmorphism) */}
<div className="bg-gradient-to-b from-teal-50 via-cyan-50 to-white py-10">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="bg-white/50 backdrop-blur-xl border border-teal-100 rounded-[32px] shadow-[0_20px_60px_-15px_rgba(20,184,166,0.25)] py-10 px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 lg:gap-12 reveal">
        {[
          { label: 'AI Accuracy', value: '95%+' },
          { label: 'Teachers Tracked', value: '10,000+' },
          { label: 'Mandals Live', value: '20' },
          { label: 'Time Saved', value: '60%' },
        ].map((stat, i) => (
          <div key={stat.label} className="relative text-center">
            <div className="text-3xl lg:text-4xl font-extrabold text-[#14B8A6] leading-none mb-2">
              {stat.value}
            </div>

            <div className="text-[10px] font-bold text-slate uppercase tracking-[0.2em] opacity-70">
              {stat.label}
            </div>

            {/* Vertical Divider */}
            {i !== 3 && (
              <div className="hidden md:block absolute right-[-24px] top-1/2 -translate-y-1/2 h-12 w-px bg-teal-200" />
            )}
          </div>
        ))}
      </div>
    </div>
  </div>
</div>
   

      {/* About */}
      <section id="about" className="relative overflow-hidden pt-8 pb-24 bg-[#F8FAFC]">
        {/* Background Decorations */}
        <div className="absolute inset-0 opacity-[0.4] pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(#14B8A6 0.6px, transparent 0.6px)', backgroundSize: '24px 24px' }} />
        
        <div className="absolute top-1/4 left-0 w-full h-full pointer-events-none overflow-hidden">
          <svg className="absolute top-0 left-0 w-full h-full opacity-[0.08]" viewBox="0 0 1440 600" fill="none">
             <path d="M-100 200 C 200 100, 600 400, 1540 100" stroke="#14B8A6" strokeWidth="2" strokeDasharray="8 8" />
             <path d="M-100 400 C 400 300, 800 500, 1540 300" stroke="#14B8A6" strokeWidth="1" strokeDasharray="6 6" />
          </svg>
        </div>

        {/* Sparkles */}
        <div className="absolute top-24 right-[12%] text-[#14B8A6]/20 animate-pulse">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
        </div>
        <div className="absolute bottom-40 left-[8%] text-[#14B8A6]/20 animate-pulse delay-700">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" /></svg>
        </div>
        
        {/* Paper Plane Accent */}
        <div className="absolute top-40 left-[15%] text-[#14B8A6] rotate-[15deg]">
          <svg className="w-10 h-10 opacity-[0.07]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="reveal max-w-2xl mx-auto text-center mb-20">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.4em] text-teal bg-teal/5 px-5 py-2 rounded-full mb-6 border border-teal/10">Why SHIXO</span>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-navy mb-6 tracking-tight">Governance, reimagined for education</h3>
            <p className="text-slate text-lg leading-relaxed max-w-xl mx-auto opacity-80 font-medium">
              A modern platform built to make teacher transfers fair, fast, and fully transparent — powered by explainable AI.
            </p>
          </div>
          
        <div className="reveal-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aboutHighlights.map((h, i) => (
              <div
                key={h.title}
                className="group relative bg-white rounded-[28px] border border-light-gray shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] flex flex-col h-full overflow-hidden"
              >
                {/* Top Gradient Accent Strip */}
                <div className={`h-[10px] w-full bg-gradient-to-r ${h.gradient}`} />
                
                <div className="p-4 flex flex-col h-full">
                  {/* Feature Image Area */}
                 <div className="w-full h-40 mb-5 rounded-2xl overflow-hidden bg-[#F8FAFC]">
  <img
    src={h.image}
    alt={h.title}
    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
  />
</div>
                  
                  <h4 className="text-lg font-bold text-navy mb-2 group-hover:text-teal transition-colors duration-300">{h.title}</h4>
                  
                  {/* Title Underline Accent */}
               <div className="w-8 h-[3px] rounded-full mb-3 transition-all duration-300 group-hover:w-16" 
                       style={{ backgroundColor: h.accent }} />
                  
                  <p className="text-[13px] text-slate/70 leading-relaxed font-medium">{h.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features - Kanban Layout */}
     <section id="features" className="relative overflow-hidden py-12 bg-white">
        <div className="pointer-events-none absolute top-1/4 -right-24 w-[34rem] h-[34rem] rounded-full bg-mint/10 blur-3xl -z-0" />
        <div className="pointer-events-none absolute bottom-0 -left-24 w-[30rem] h-[30rem] rounded-full bg-light-teal/20 blur-3xl -z-0" />

        {/* Background Sparkles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {sparkles.map((s, i) => (
            <span
              key={i}
              className="sparkle absolute rounded-full bg-teal/20"
              style={{ top: s.top, left: s.left, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-20">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-teal mb-4">Platform Capabilities</span>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-navy mb-5 tracking-tight">Everything you need to manage a workforce</h3>
            <p className="text-slate max-w-2xl mx-auto text-lg leading-relaxed">
              A unified workflow engine and intelligence layer designed to handle the complexity of large-scale teacher transfers with precision.
            </p>
          </div>

          <div className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((col, idx) => (
              <div key={col.title} className={`flex flex-col gap-6 ${idx % 2 !== 0 ? 'lg:translate-y-12' : ''}`}>
                <div className="flex items-center gap-3 px-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-teal shadow-[0_0_8px_rgba(15,157,148,0.6)]" />
                  <h4 className="text-[11px] font-bold text-navy uppercase tracking-[0.2em] opacity-70">{col.title}</h4>
                </div>
                {col.items.map((f, fidx) => {
                  const isFeatured = fidx === 0;
                  const color = featureColors[idx % featureColors.length];
                  return (
                    <div
                      key={f.title}
                      className={`premium-card group relative overflow-hidden transition-all duration-500 border border-white
                        ${isFeatured 
                          ? 'rounded-[24px] p-7 pt-10 backdrop-blur-sm shadow-xl hover:-translate-y-3' 
                          : 'bg-white rounded-[24px] p-6 pt-9 shadow-sm hover:-translate-y-1 hover:shadow-md'
                        }`}
                      style={isFeatured ? {
                        background: `linear-gradient(135deg, #ffffff 0%, ${color}1a 100%)`,
                        boxShadow: `0 20px 40px -12px rgba(15, 23, 42, 0.1), 0 0 20px -2px ${color}33`
                      } : {}}
                    >
                      <div 
                        className="absolute top-0 left-0 right-0 h-2.5" 
                        style={{ backgroundColor: color }}
                      />
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:scale-110 
                        ${isFeatured ? 'bg-white shadow-sm shadow-black/5' : 'bg-light-teal/40 text-teal group-hover:bg-teal group-hover:text-white'}`}
                        style={isFeatured ? { color: color } : {}}
                      >
                        {f.icon}
                      </div>
                      <h5 className="text-[15px] font-bold text-navy mb-2 leading-snug group-hover:text-teal transition-colors duration-300">{f.title}</h5>
                      <p className={`text-[13px] leading-relaxed font-medium ${isFeatured ? 'text-slate' : 'text-slate/70'}`}>{f.desc}</p>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics / AI - Premium Infographic Section */}
      <section id="analytics" className="relative overflow-hidden pt-8 pb-12 lg:pt-10 lg:pb-16 bg-gradient-to-br from-white via-[#F8FAFC] to-white">
        {/* Background decorations */}
        <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full bg-teal/5 blur-3xl -z-10" />
        <div className="pointer-events-none absolute bottom-0 left-0 w-96 h-96 rounded-full bg-mint/5 blur-3xl -z-10" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="reveal text-center mb-2">
            <span className="inline-block text-[11px] font-bold uppercase tracking-[0.4em] text-teal bg-teal/5 px-5 py-2 rounded-full mb-4 border border-teal/10">Platform Strengths</span>
            <h3 className="text-4xl lg:text-5xl font-extrabold text-navy tracking-tight">Intelligent, Transparent, Accountable</h3>
          </div>

          {/* Three-Column Infographic Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.9fr_1.3fr] gap-4 items-center">
            
            {/* LEFT COLUMN - Features */}
            <div className="flex flex-col gap-4">
              {/* Feature 1 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Explainable AI</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">Models provide clear reasons for every recommendation.</p>
                  </div>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Transparent Decisions</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">Fair, unbiased and rule-based evaluations.</p>
                  </div>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Priority Scoring</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">Multi-factor ranking for transfer requests.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CENTER - Building Illustration with Glow & Decorations */}
            <div className="hidden lg:flex items-center justify-center relative h-[420px]">
              {/* Radial Teal Glow Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute w-96 h-96 rounded-full bg-gradient-radial from-teal/30 via-teal/10 to-transparent blur-3xl" />
              </div>

              {/* Decorative Floating Particles */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Top left particle */}
                <div className="absolute top-12 left-8 w-3 h-3 rounded-full bg-teal/20 animate-pulse" />
                {/* Top right particle */}
                <div className="absolute top-20 right-12 w-2 h-2 rounded-full bg-teal/30 animate-pulse delay-1000" />
                {/* Bottom left particle */}
                <div className="absolute bottom-24 left-16 w-2.5 h-2.5 rounded-full bg-teal/15 animate-pulse delay-500" />
                {/* Bottom right particle */}
                <div className="absolute bottom-32 right-20 w-2 h-2 rounded-full bg-teal/25 animate-pulse delay-700" />
                
                {/* Subtle decorative lines */}
                <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
                  <path d="M50 100 Q 200 150, 350 100" stroke="#14B8A6" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                  <path d="M70 400 Q 200 350, 330 400" stroke="#14B8A6" strokeWidth="1" fill="none" strokeDasharray="5,5" />
                </svg>

                {/* Soft cloud shapes */}
                <div className="absolute top-8 left-20 w-24 h-12 rounded-full bg-gradient-to-r from-teal/5 to-transparent blur-2xl" />
                <div className="absolute bottom-16 right-16 w-32 h-16 rounded-full bg-gradient-to-l from-mint/5 to-transparent blur-2xl" />
              </div>

              {/* Building Image Container */}
              <div className="relative z-10 w-full h-full w-full max-w-lg flex items-center justify-center">
                <img 
                  src="/government-building.png"
               alt="Government Building" 
                  className="w-full max-w-md h-auto object-contain drop-shadow-2xl filter brightness-105"
                  style={{
                    filter: 'drop-shadow(0 0 30px rgba(20, 184, 166, 0.15)) brightness(1.05)'
                  }}
                />
              </div>
            </div>

            {/* RIGHT COLUMN - Features */}
            <div className="flex flex-col gap-4">
              {/* Feature 4 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Workforce Analytics</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">Real-time vacancy and distribution insights.</p>
                  </div>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Smart Allocation</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">AI-driven school placement recommendations.</p>
                  </div>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="reveal group relative bg-white rounded-2xl border border-light-gray shadow-sm hover:shadow-md transition-all duration-300 p-4">
                <div className="flex items-start gap-4">
                  <div className="shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-teal/20 to-teal/10 flex items-center justify-center ring-2 ring-teal/30">
                    <svg className="w-6 h-6 text-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-navy group-hover:text-teal transition-colors">Policy Compliance</h4>
                    <p className="text-[12px] text-slate/70 mt-0.5">Every decision follows government guidelines.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Building Image - Visible only on small screens */}
          <div className="md:hidden reveal text-center mt-12 relative">
            {/* Mobile glow background */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-64 h-64 rounded-full bg-gradient-radial from-teal/20 via-teal/5 to-transparent blur-3xl" />
            </div>
            
            <img 
              src="/government-building.png" 
              alt="Government Building" 
              className="w-full max-w-md h-auto object-contain drop-shadow-lg mx-auto relative z-10"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(20, 184, 166, 0.15)) brightness(1.05)'
              }}
            />
          </div>

          {/* Bottom Callout Card */}
          <div className="reveal relative mt-2">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-white/80 via-white/70 to-white/80 backdrop-blur-2xl border border-white/50 px-8 py-12 lg:px-16 lg:py-14 text-center shadow-[0_20px_60px_-12px_rgba(15,157,148,0.2)]">
              {/* Decorative background */}
              <div className="pointer-events-none absolute -top-20 -right-20 w-40 h-40 rounded-full bg-teal/5 blur-2xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 w-40 h-40 rounded-full bg-mint/5 blur-2xl" />
              
              <div className="relative z-10">
                <h4 className="text-2xl lg:text-3xl font-extrabold text-navy mb-3">
                  Building a Fairer, Smarter, and Stronger Education System
                </h4>
                <p className="text-base text-slate/80 max-w-2xl mx-auto font-medium">
                  Empowering teachers. Strengthening schools. Transforming governance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal to-teal-light px-8 py-14 lg:py-16 text-center shadow-[0_30px_60px_-30px_rgba(15,157,148,0.6)]">
            <div className="pointer-events-none absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 w-72 h-72 rounded-full bg-mint/20 blur-3xl" />
            <h3 className="relative text-3xl lg:text-4xl font-extrabold text-white mb-4">Ready to access the portal?</h3>
            <p className="relative text-white/90 mb-8 max-w-lg mx-auto text-lg">
              Login as a Teacher to check transfer eligibility or as a Mandal Education Officer to manage workforce.
            </p>
            <Link
              to="/login"
              className="relative inline-block bg-white text-teal px-10 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 shadow-lg hover:-translate-y-0.5 hover:shadow-xl"
            >
              Login to SHIXO Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-light-gray py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-9 h-9 rounded-lg object-cover ring-1 ring-light-gray" />
                <span className="font-extrabold text-lg text-navy">SHIXO</span>
              </div>
              <p className="text-sm text-slate leading-relaxed max-w-xs">
                AI-Based Government Teacher Transfer & Workforce Management Platform.
                Enabling transparent, data-driven governance in education.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-navy">Quick Links</h4>
              <div className="space-y-2.5 text-sm text-slate">
                <a href="#features" className="block hover:text-teal transition-colors">Features</a>
                <a href="#analytics" className="block hover:text-teal transition-colors">AI Analytics</a>
                <a href="#about" className="block hover:text-teal transition-colors">About</a>
                <Link to="/login" className="block hover:text-teal transition-colors">Portal Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-3 text-navy">Contact</h4>
              <div className="space-y-2.5 text-sm text-slate">
                <p>Department of School Education</p>
                <p>Government of Telangana</p>
                <p>support@shixo.gov.in</p>
              </div>
            </div>
          </div>
          <div className="mt-10 pt-6 border-t border-light-gray text-center text-xs text-slate">
            © {new Date().getFullYear()} SHIXO — Government Education Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
