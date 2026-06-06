import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

const features = [
  {
    title: 'AI Transfer Prediction',
    desc: 'Machine learning algorithms analyze service records, medical conditions, and policy criteria to recommend optimal transfers.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47-2.47" />
      </svg>
    ),
  },
  {
    title: 'Smart Workforce Analytics',
    desc: 'Real-time dashboards tracking teacher distribution, shortage areas, student-teacher ratios across all mandals.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    title: 'Automated Workflows',
    desc: 'End-to-end transfer management from application to approval with automatic database synchronization.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3" />
      </svg>
    ),
  },
  {
    title: 'Role-Based Governance',
    desc: 'Dedicated portals for Teachers and Mandal Education Officers with secure access control.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    ),
  },
  {
    title: 'School Allocation Engine',
    desc: 'Intelligent school recommendations based on vacancy, shortage, student-teacher ratio, and subject requirements.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" />
      </svg>
    ),
  },
  {
    title: 'Transfer Order Generation',
    desc: 'Automatic generation of official government transfer orders upon approval, ready for download.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
  },
];

const aboutHighlights = [
  {
    title: 'AI Eligibility',
    desc: 'Explainable machine learning evaluates every transfer request against transparent, policy-driven criteria.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
      </svg>
    ),
  },
  {
    title: 'Transparent Transfers',
    desc: 'Every decision is auditable end-to-end, with clear priority scores and reasons visible to all stakeholders.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    title: 'Workforce Balancing',
    desc: 'Smart allocation closes shortage gaps and balances student-teacher ratios across every mandal.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M12 3v17.25m0 0c-1.472 0-2.882.265-4.185.75M12 20.25c1.472 0 2.882.265 4.185.75M18.75 4.97A48.416 48.416 0 0012 4.5c-2.291 0-4.545.16-6.75.47m13.5 0c1.01.143 2.01.317 3 .52m-3-.52l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.988 5.988 0 01-2.031.352 5.988 5.988 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L18.75 4.971zm-16.5.52c.99-.203 1.99-.377 3-.52m0 0l2.62 10.726c.122.499-.106 1.028-.589 1.202a5.989 5.989 0 01-2.031.352 5.989 5.989 0 01-2.031-.352c-.483-.174-.711-.703-.59-1.202L5.25 4.971z" />
      </svg>
    ),
  },
  {
    title: 'Data Driven Governance',
    desc: 'Live dashboards turn workforce data into actionable insight for confident, accountable decisions.',
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605" />
      </svg>
    ),
  },
];

const stats = [
  { end: 500, suffix: '+', label: 'Schools Managed' },
  { end: 10000, suffix: '+', label: 'Teachers Tracked' },
  { end: 20, suffix: '', label: 'Mandals Covered' },
  { end: 95, suffix: '%+', label: 'AI Accuracy' },
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

function Counter({ end, suffix = '', duration = 1400 }) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const run = () => {
      if (started.current) return;
      started.current = true;
      const startTime = performance.now();
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setValue(Math.round(end * eased));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    if (!('IntersectionObserver' in window)) {
      run();
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{value.toLocaleString()}{suffix}</span>;
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
              <a href="#features" className="text-sm font-semibold text-navy hover:text-teal transition-colors duration-200">Features</a>
              <a href="#analytics" className="text-sm font-semibold text-navy hover:text-teal transition-colors duration-200">Analytics</a>
              <a href="#about" className="text-sm font-semibold text-navy hover:text-teal transition-colors duration-200">About</a>
              <Link
                to="/login"
                className="bg-teal hover:bg-teal-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 shadow-[0_6px_16px_-6px_rgba(15,157,148,0.6)] hover:shadow-[0_10px_22px_-8px_rgba(15,157,148,0.7)] active:bg-teal-light"
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
      <section id="top" className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-light-teal/40 via-white to-soft-white" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div>
              <div className="hero-fade hero-fade-1 inline-flex items-center gap-2 bg-white border border-light-gray rounded-full px-4 py-1.5 mb-6 shadow-sm">
                <span className="w-2 h-2 bg-teal rounded-full"></span>
                <span className="text-xs font-semibold text-slate tracking-wide">AI-Powered Governance Platform</span>
              </div>
              <h2 className="hero-fade hero-fade-2 text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.05] mb-6 text-navy">
                Smart Teacher Transfer &{' '}
                <span className="text-teal">Workforce Analytics</span> Platform
              </h2>
              <p className="hero-fade hero-fade-3 text-lg text-slate mb-8 max-w-xl leading-relaxed">
                Transparent, data-driven governance for managing government teacher transfers,
                workforce allocation, and education workforce monitoring across districts and mandals.
              </p>
              <div className="hero-fade hero-fade-4 flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="bg-teal hover:bg-teal-light text-white px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-[0_10px_24px_-8px_rgba(15,157,148,0.6)] hover:shadow-[0_14px_30px_-10px_rgba(15,157,148,0.7)] hover:-translate-y-0.5"
                >
                  Access Portal
                </Link>
                <a
                  href="#features"
                  className="bg-white border border-light-gray text-navy hover:border-teal hover:text-teal px-8 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm"
                >
                  Explore Features
                </a>
              </div>
            </div>
            <div className="relative flex justify-center items-center">
              {/* Soft glow behind image — not a card/container */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-[80%] h-[80%] rounded-full bg-mint/40 blur-3xl" />
              </div>
              <img
                src="/teacher-hero-cutout.png"
                alt="Female teacher with a book, India map and government building illustration"
                className="w-full max-w-md h-auto object-contain drop-shadow-[0_18px_30px_rgba(15,23,42,0.10)]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="py-16 bg-white border-y border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal-stagger grid grid-cols-2 lg:grid-cols-4 gap-5">
            {stats.map((s) => (
              <div
                key={s.label}
                className="premium-card bg-white rounded-2xl border border-light-gray p-7 text-center shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="text-4xl lg:text-5xl font-extrabold text-teal tracking-tight">
                  <Counter end={s.end} suffix={s.suffix} />
                </div>
                <div className="text-sm font-medium text-slate mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal max-w-2xl mx-auto text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-teal mb-3">Why SHIXO</span>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-4">Governance, reimagined for education</h3>
            <p className="text-slate text-lg leading-relaxed">
              A modern platform built to make teacher transfers fair, fast, and fully transparent — powered by explainable AI.
            </p>
          </div>
          <div className="reveal-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {aboutHighlights.map((h) => (
              <div
                key={h.title}
                className="premium-card bg-white rounded-2xl border border-light-gray p-7 shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="w-12 h-12 rounded-xl bg-light-teal text-teal flex items-center justify-center mb-5">
                  {h.icon}
                </div>
                <h4 className="text-lg font-bold text-navy mb-2">{h.title}</h4>
                <p className="text-sm text-slate leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-[0.2em] text-teal mb-3">Platform Capabilities</span>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-4">Everything you need to manage a workforce</h3>
            <p className="text-slate max-w-xl mx-auto text-lg">
              Comprehensive tools for transparent and efficient teacher workforce management.
            </p>
          </div>
          <div className="reveal-stagger grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="premium-card group bg-white rounded-2xl p-7 border border-light-gray shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
              >
                <div className="w-12 h-12 bg-light-teal text-teal rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 group-hover:bg-teal group-hover:text-white">
                  {f.icon}
                </div>
                <h4 className="text-lg font-bold text-navy mb-2">{f.title}</h4>
                <p className="text-sm text-slate leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics / AI */}
      <section id="analytics" className="py-20 lg:py-24">
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
