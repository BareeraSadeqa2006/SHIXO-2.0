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
      { title: 'Mutual Transfers', desc: 'Facilitating seamless swap requests between eligible teachers with automated validation.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
      { title: 'Priority Allocation', desc: 'Priority scoring based on service years, medical needs, and policy criteria.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg> },
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
      { title: 'District Insights', desc: 'Granular data on student-teacher ratios and workforce health at the administrative level.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
      { title: 'Teacher Distribution', desc: 'Real-time monitoring of subject-wise teacher availability and surpluses.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
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
      { title: 'Audit Logs', desc: 'Comprehensive logging of all administrative actions for transparency.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
      { title: 'Policy Compliance', desc: 'Ensuring every transfer adheres to government guidelines and eligibility.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
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
      { title: 'AI Recommendations', desc: 'Smart suggestions to balance teacher ratios effectively and solve localized shortages.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
      { title: 'Decision Support', desc: 'Empowering administrators with data-backed insights for efficient workforce optimization.', icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg> },
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
  { label: 'Rural Service >= 3 years', score: '+15' },
  { label: 'Promotion Due', score: '+10' },
  { label: 'Long Service >= 10 years', score: '+10' },
];

const aiPoints = [
  'Explainable AI — understand why transfers are recommended',
  'Priority scoring based on service years, medical needs, and policy criteria',
  'Smart school allocation using vacancy and shortage analysis',
  'Real-time workforce distribution monitoring',
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
    <div className="min-h-screen bg-soft-white text-navy">
      {/* Navbar */}
      <header
        className={`sticky top-0 z-50 bg-white/90 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'shadow-[0_4px_20px_-8px_rgba(15,23,42,0.18)] border-b border-light-gray' : 'border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="#top" className="flex items-center gap-3">
              <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-10 h-10 rounded-xl object-cover shadow-sm ring-1 ring-light-gray" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight text-navy leading-none">SHIXO</h1>
                <p className="text-[11px] text-slate mt-0.5">Government Education Portal</p>
              </div>
            </a>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="nav-link text-sm font-semibold text-navy">Features</a>
              <a href="#analytics" className="nav-link text-sm font-semibold text-navy">Analytics</a>
              <a href="#about" className="nav-link text-sm font-semibold text-navy">About</a>
              <Link
                to="/login"
                className="bg-teal hover:bg-teal-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-[0_6px_16px_-6px_rgba(15,157,148,0.6)] hover:shadow-[0_10px_22px_-8px_rgba(15,157,148,0.7)] hover:scale-[1.03] active:scale-[0.97]"
              >
                Login Portal
              </Link>
            </nav>
            <Link to="/login" className="md:hidden bg-teal hover:bg-teal-light text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative w-full h-[320px] md:h-[400px] overflow-hidden bg-navy">
        {/* 1. Background Artwork */}
        <img
          src="/bg-hero.jpeg"
          alt="SHIXO Teacher Transfer and India Network Map"
          className="absolute inset-0 w-full h-full object-cover object-center select-none pointer-events-none"
          draggable="false"
        />
        {/* Overlay to ensure text readability on the left side */}
        <div className="absolute inset-0 bg-gradient-to-r from-navy/80 via-navy/30 to-transparent lg:from-navy/60 z-0" />

        {/* 2. Content Area (Left Aligned) */}
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="reveal max-w-2xl text-left">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.3em] text-teal-light mb-4">Smart Governance Platform</span>
            
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-8">
              Transparent, Data-Driven <br />
              <span className="text-teal-light">Education Governance</span>
            </h2>

            <p className="text-white/90 text-lg md:text-xl leading-relaxed mb-10">
              Managing government teacher transfers, workforce allocation, and 
              real-time monitoring across every district and mandal with intelligent 
              priority analytics.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-5">
              <Link
                to="/login"
                className="w-full sm:w-auto bg-teal hover:bg-teal-light text-white px-12 py-4 rounded-xl font-bold text-base transition-all shadow-[0_12px_24px_-8px_rgba(15,157,148,0.5)] hover:scale-[1.02] active:scale-[0.98]"
              >
                Access Portal
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-sm px-12 py-4 rounded-xl font-bold text-base transition-all"
              >
                Explore Features
              </a>
            </div>
          </div>
        </div>
        </div>
      </section>


      {/* 3. Statistics Row (Below the Hero Section) */}
      <div className="bg-white py-12 border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 reveal">
            {[
              { label: 'AI Accuracy', value: '95%+' },
              { label: 'Teachers Tracked', value: '10,000+' },
              { label: 'Mandals Live', value: '20' },
              { label: 'Time Saved', value: '60%' },
            ].map((stat) => (
              <div key={stat.label} className="text-center md:text-left">
                <div className="text-3xl lg:text-4xl font-extrabold text-navy leading-none mb-2 text-teal">
                  {stat.value}
                </div>
                <div className="text-[10px] font-bold text-slate uppercase tracking-[0.2em] opacity-60">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
   

      {/* About */}
      <section id="about" className="relative overflow-hidden py-24 lg:py-32 bg-[#F8FAFC]">
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
          
        <div className="reveal-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {aboutHighlights.map((h, i) => (
              <div
                key={h.title}
                className="group relative bg-white rounded-[28px] border border-light-gray shadow-[0_8px_30px_rgba(15,23,42,0.04)] transition-all duration-300 hover:-translate-y-3 hover:shadow-[0_20px_50px_-12px_rgba(15,23,42,0.12)] flex flex-col h-full overflow-hidden"
              >
                {/* Top Gradient Accent Strip */}
                <div className={`h-[10px] w-full bg-gradient-to-r ${h.gradient}`} />
                
                <div className="p-5 flex flex-col h-full">
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
      <section id="features" className="relative overflow-hidden py-24 lg:py-32 bg-white">
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

      {/* Analytics / AI */}
      <section id="analytics" className="relative overflow-hidden py-20 lg:py-24">
        <div className="pointer-events-none absolute top-1/3 left-0 w-[32rem] h-[32rem] rounded-full bg-teal/10 blur-3xl -z-10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="reveal">
              <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-teal mb-3">Explainable AI</span>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-4 leading-tight">
                AI-Based Government Teacher Management System
              </h3>
              <p className="text-slate mb-8 leading-relaxed text-lg">
                Leveraging Random Forest machine learning algorithms trained on comprehensive
                teacher service data to predict transfer eligibility, calculate priority scores,
                and recommend optimal school placements.
              </p>
              <div className="space-y-4">
                {aiPoints.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 shrink-0 w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    </span>
                    <span className="text-[15px] text-slate">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="reveal bg-white rounded-2xl p-8 border border-light-gray shadow-[0_20px_50px_-24px_rgba(15,23,42,0.25)]">
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-bold text-navy">Transfer Priority Scoring</div>
                <span className="text-xs font-semibold text-teal bg-light-teal px-3 py-1 rounded-full">Live model</span>
              </div>
              <div className="space-y-2.5">
                {priorityScores.map((item) => (
                  <div key={item.label} className="flex justify-between items-center bg-soft-white border border-light-gray rounded-xl px-4 py-3">
                    <span className="text-sm text-slate">{item.label}</span>
                    <span className="text-sm font-bold text-teal tabular-nums">{item.score}</span>
                  </div>
                ))}
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
