import { Link } from 'react-router-dom';

const Icon = ({ path, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24">
    {path}
  </svg>
);

const features = [
  {
    title: 'AI Transfer Prediction',
    desc: 'A Random Forest model analyses service records, medical needs and policy rules to recommend eligible transfers with a confidence score.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.1v5.7a2.25 2.25 0 01-.66 1.6L5 14.5m4.75-11.4a24.3 24.3 0 014.5 0m0 0v5.7a2.25 2.25 0 00.66 1.6L19 14.5M9.75 3.1c-.25 0-.5.05-.75.08" />,
  },
  {
    title: 'Workforce Monitoring',
    desc: 'Live dashboards track teacher distribution, shortage and surplus schools, and student–teacher ratios across every mandal.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.1A1.13 1.13 0 014.1 12h2.3c.6 0 1.1.5 1.1 1.1v6.8c0 .6-.5 1.1-1.1 1.1H4.1A1.13 1.13 0 013 19.9v-6.8zM9.75 8.6c0-.6.5-1.1 1.1-1.1h2.3c.6 0 1.1.5 1.1 1.1v11.3c0 .6-.5 1.1-1.1 1.1h-2.3a1.13 1.13 0 01-1.1-1.1V8.6zM16.5 4.1c0-.6.5-1.1 1.1-1.1h2.3C20.5 3 21 3.5 21 4.1v15.8c0 .6-.5 1.1-1.1 1.1h-2.3a1.13 1.13 0 01-1.1-1.1V4.1z" />,
  },
  {
    title: 'Smart Allocation',
    desc: 'Intelligent school recommendations ranked by vacancy, shortage, ratio and subject requirement to balance the workforce.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33A48.4 48.4 0 0012 9.75c-2.55 0-5.06.2-7.5.58V21" />,
  },
  {
    title: 'Automated Workflows',
    desc: 'Requests auto-route to the correct MEO, the school database synchronises on approval, and analytics update in real time.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.23-.05-2.45-.14-3.66a4 4 0 00-3.7-3.7 48.7 48.7 0 00-7.32 0 4 4 0 00-3.7 3.7c-.02.22-.03.44-.05.66M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.23.05 2.45.14 3.66a4 4 0 003.7 3.7 48.7 48.7 0 007.32 0 4 4 0 003.7-3.7c.02-.22.03-.44.05-.66M4.5 12l3 3m-3-3l-3 3" />,
  },
  {
    title: 'Role-Based Governance',
    desc: 'Dedicated, secure portals for Teachers and Mandal Education Officers with strict access control to mandal data.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.04A11.96 11.96 0 013.6 6 12 12 0 003 9.75c0 5.59 3.82 10.29 9 11.62 5.18-1.33 9-6.03 9-11.62 0-1.31-.21-2.57-.6-3.75h-.15c-3.2 0-6.1-1.25-8.25-3.29z" />,
  },
  {
    title: 'Transfer Order Generation',
    desc: 'Official government transfer orders are generated automatically as PDF on approval, ready for instant download.',
    path: <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.63a3.38 3.38 0 00-3.38-3.37h-1.5a1.13 1.13 0 01-1.12-1.13v-1.5A3.38 3.38 0 0010.12 2.25H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.63c-.62 0-1.13.5-1.13 1.13v17.25c0 .62.5 1.12 1.13 1.12h12.75c.62 0 1.12-.5 1.12-1.12V11.25a9 9 0 00-9-9z" />,
  },
];

const stats = [
  { label: 'Schools Managed', value: '500+', path: <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33A48.4 48.4 0 0012 9.75c-2.55 0-5.06.2-7.5.58V21" /> },
  { label: 'Teachers Tracked', value: '10,000+', path: <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.13v-.88a3 3 0 00-3-3H6a3 3 0 00-3 3v.88M21 19.13v-.88a3 3 0 00-2.25-2.9M15.75 6.13a3 3 0 010 5.74M9 12.13a3 3 0 100-6 3 3 0 000 6z" /> },
  { label: 'Mandals Covered', value: '20', path: <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.5 3.27l3.5-1.74a1 1 0 00.55-.9V4.24a.5.5 0 00-.72-.45L15 5.5M9 6.75L3.66 4.08a.5.5 0 00-.72.45v12.4a1 1 0 00.55.9L9 20.5M9 6.75l6-2.25M15 5.5l-6 1.25" /> },
  { label: 'AI Accuracy', value: '97.8%', path: <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.13A1.13 1.13 0 014.1 12h2.3c.6 0 1.1.5 1.1 1.13v6.75c0 .62-.5 1.12-1.1 1.12H4.1A1.13 1.13 0 013 19.88v-6.75zM9.75 8.63c0-.63.5-1.13 1.1-1.13h2.3c.6 0 1.1.5 1.1 1.13v11.25c0 .62-.5 1.12-1.1 1.12h-2.3a1.13 1.13 0 01-1.1-1.12V8.63zM16.5 4.13c0-.63.5-1.13 1.1-1.13h2.3c.6 0 1.1.5 1.1 1.13v15.75c0 .62-.5 1.12-1.1 1.12h-2.3a1.13 1.13 0 01-1.1-1.12V4.13z" /> },
];

const workflow = [
  { t: 'Teacher Login', d: 'Secure role-based access to the portal.' },
  { t: 'AI Eligibility Check', d: 'Model predicts transfer eligibility + priority score.' },
  { t: 'Transfer Request', d: 'Teacher applies to a recommended school.' },
  { t: 'MEO Review', d: 'Request auto-routes to the mandal officer.' },
  { t: 'Approval', d: 'School records & analytics update instantly.' },
  { t: 'PDF Generation', d: 'Official transfer order is issued for download.' },
];

function Logo({ size = 'h-9 w-9' }) {
  return (
    <span className={`${size} rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center overflow-hidden`}>
      <img src="/favicon2.jpeg" alt="SHIXO logo" className="h-full w-full object-contain p-0.5" />
    </span>
  );
}

/* Premium dashboard mockup illustration (pure markup, on-brand) */
function HeroIllustration() {
  return (
    <div className="relative">
      <div className="absolute -top-6 -right-4 w-40 h-40 bg-teal/20 rounded-full blur-3xl" />
      <div className="absolute -bottom-8 -left-6 w-44 h-44 bg-navy-light/20 rounded-full blur-3xl" />
      <div className="relative bg-white rounded-2xl shadow-lift ring-1 ring-black/5 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Logo size="h-8 w-8" />
            <div>
              <p className="text-[13px] font-bold text-navy leading-none">SHIXO Analytics</p>
              <p className="text-[10px] text-muted">Workforce Overview</p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-teal bg-teal/10 px-2 py-1 rounded-full">Live</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[['Teachers', '466'], ['Schools', '520'], ['Mandals', '20']].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-soft-white border border-light-gray p-2.5">
              <p className="text-base font-bold text-navy leading-none">{v}</p>
              <p className="text-[9px] text-muted mt-1">{l}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-light-gray p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-muted">Transfer Trend</p>
            <p className="text-[10px] text-success font-semibold">▲ 12%</p>
          </div>
          <div className="flex items-end gap-1.5 h-20">
            {[40, 62, 50, 78, 66, 90, 72, 96].map((h, i) => (
              <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: i % 2 ? '#2563EB' : '#153E90' }} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl bg-navy p-3 text-white">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-teal/30">
            <span className="text-xs font-bold">AI</span>
          </span>
          <div className="flex-1">
            <p className="text-[11px] font-semibold leading-none">Eligibility: Recommended</p>
            <p className="text-[9px] text-light-gray mt-1">Confidence 97.8% · Priority 85/100</p>
          </div>
          <div className="text-right">
            <div className="h-1.5 w-16 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-teal" style={{ width: '88%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-soft-white text-ink">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo />
              <div>
                <h1 className="text-lg font-extrabold tracking-tight text-navy leading-none">SHIXO</h1>
                <p className="text-[10px] text-muted mt-0.5">Government Education Portal</p>
              </div>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted hover:text-navy transition-colors">Features</a>
              <a href="#analytics" className="text-sm font-medium text-muted hover:text-navy transition-colors">Analytics</a>
              <a href="#workflow" className="text-sm font-medium text-muted hover:text-navy transition-colors">How it Works</a>
              <a href="#about" className="text-sm font-medium text-muted hover:text-navy transition-colors">About</a>
              <Link to="/login" className="bg-navy hover:bg-navy-light text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm">
                Access Portal
              </Link>
            </nav>
            <Link to="/login" className="md:hidden bg-navy text-white px-4 py-2 rounded-lg text-sm font-semibold">
              Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden hero-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-white via-soft-white to-soft-white" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 bg-white border border-light-gray shadow-sm rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-success rounded-full" />
                <span className="text-xs font-semibold text-navy">AI-Powered Governance Platform</span>
              </div>
              <h2 className="text-4xl lg:text-[3.4rem] font-extrabold leading-[1.07] text-navy mb-5">
                Smart Teacher Transfer &<br />
                <span className="text-gradient">Workforce Analytics</span> Platform
              </h2>
              <p className="text-base lg:text-lg text-muted mb-8 max-w-xl leading-relaxed">
                SHIXO brings transparent, data-driven governance to government teacher transfers — AI eligibility
                prediction, intelligent school allocation and real-time workforce monitoring across districts and mandals.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/login" className="bg-navy hover:bg-navy-light text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-soft">
                  Access Portal
                </Link>
                <a href="#features" className="bg-white border border-light-gray hover:border-teal text-navy px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-sm">
                  Explore Features
                </a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                {[['97.8%', 'AI Accuracy'], ['520', 'Schools'], ['20', 'Mandals']].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-2xl font-extrabold text-navy">{v}</p>
                    <p className="text-xs text-muted">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="animate-fade-up lg:pl-6">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-light-gray shadow-card p-6 hover:shadow-soft hover:-translate-y-1 transition-all">
              <div className="w-11 h-11 rounded-xl bg-teal/10 text-teal flex items-center justify-center mb-4">
                <Icon path={s.path} className="w-6 h-6" />
              </div>
              <p className="text-3xl font-extrabold text-navy">{s.value}</p>
              <p className="text-sm text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-2">Platform Capabilities</p>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-3">Everything governance needs</h3>
            <p className="text-muted max-w-2xl mx-auto">
              A complete, enterprise-grade toolkit for transparent and efficient teacher workforce management.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="group bg-white rounded-2xl p-7 border border-light-gray shadow-card hover:shadow-soft hover:-translate-y-1 hover:border-teal/40 transition-all">
                <div className="w-12 h-12 bg-navy text-white rounded-xl flex items-center justify-center mb-5 group-hover:bg-teal transition-colors">
                  <Icon path={f.path} className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-navy mb-2">{f.title}</h4>
                <p className="text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics */}
      <section id="analytics" className="py-20 bg-white border-y border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-2">Analytics & Intelligence</p>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-4 leading-tight">
                Power BI-grade workforce insights
              </h3>
              <p className="text-muted mb-6 leading-relaxed">
                Random Forest machine learning trained on comprehensive service data predicts transfer eligibility,
                calculates priority scores and recommends optimal placements — all visualised in real time.
              </p>
              <div className="space-y-3">
                {[
                  'Explainable AI — understand exactly why a transfer is recommended',
                  'Priority scoring from service years, medical needs and policy rules',
                  'Smart allocation using vacancy and shortage analysis',
                  'Real-time workforce distribution monitoring across mandals',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 011.4-1.4l3.1 3.1 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    </span>
                    <span className="text-sm text-ink">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Analytics visual panel */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-soft-white rounded-2xl border border-light-gray p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-navy">Transfer Priority Scoring</p>
                  <span className="text-[10px] font-semibold text-teal bg-teal/10 px-2 py-1 rounded-full">Model v2</span>
                </div>
                <div className="space-y-2">
                  {[
                    ['Transfer Request Filed', 30, 100],
                    ['Medical Condition', 25, 83],
                    ['Service Years ≥ 5', 20, 66],
                    ['Spouse Distance > 200km', 20, 66],
                    ['Rural Service ≥ 3 years', 15, 50],
                    ['Promotion Due', 10, 33],
                  ].map(([label, score, w]) => (
                    <div key={label}>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-muted">{label}</span>
                        <span className="font-bold text-navy">+{score}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-light-gray overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-navy-light to-teal" style={{ width: `${w}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-navy rounded-2xl p-5 text-white">
                <p className="text-xs text-light-gray mb-3">School Status</p>
                <div className="flex items-center justify-center">
                  <div className="relative w-28 h-28 rounded-full" style={{ background: 'conic-gradient(#DC2626 0 28%, #16A34A 28% 60%, #2563EB 60% 100%)' }}>
                    <div className="absolute inset-3 rounded-full bg-navy flex items-center justify-center">
                      <span className="text-lg font-extrabold">520</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-[11px]">
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-alert" /> Shortage</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-success" /> Surplus</div>
                  <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm bg-teal" /> Balanced</div>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-light-gray p-5">
                <p className="text-xs text-muted mb-3">Subject Vacancy</p>
                <div className="flex items-end gap-2 h-28">
                  {[['Math', 70], ['Sci', 90], ['Eng', 55], ['PE', 40], ['Soc', 65]].map(([n, h]) => (
                    <div key={n} className="flex-1 h-full flex flex-col items-center justify-end gap-1">
                      <div className="w-full rounded-t bg-gradient-to-t from-navy-light to-teal" style={{ height: `${h}%` }} />
                      <span className="text-[9px] text-muted">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section id="workflow" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-2">End-to-End Workflow</p>
            <h3 className="text-3xl lg:text-4xl font-extrabold text-navy">How SHIXO Works</h3>
          </div>
          <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-5">
            {workflow.map((w, i) => (
              <div key={w.t} className="relative bg-white rounded-2xl border border-light-gray shadow-card p-5">
                <div className="w-9 h-9 rounded-xl bg-navy text-white text-sm font-bold flex items-center justify-center mb-3">
                  {i + 1}
                </div>
                <p className="text-sm font-bold text-navy mb-1">{w.t}</p>
                <p className="text-xs text-muted leading-relaxed">{w.d}</p>
                {i < workflow.length - 1 && (
                  <span className="hidden lg:block absolute top-9 -right-3 text-teal">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-20 bg-white border-t border-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-2xl overflow-hidden shadow-soft ring-1 ring-black/5 bg-gradient-to-br from-navy via-navy-light to-teal p-10 min-h-[320px] flex flex-col justify-end">
              <div className="absolute inset-0 hero-grid opacity-30" />
              <Logo size="h-14 w-14" />
              <h4 className="relative text-2xl font-extrabold text-white mt-6">Department of School Education</h4>
              <p className="relative text-light-gray text-sm mt-2 max-w-sm">
                Empowering transparent, equitable and data-driven teacher administration for public schools.
              </p>
              <div className="relative grid grid-cols-3 gap-4 mt-6">
                {[['10K+', 'Teachers'], ['500+', 'Schools'], ['20', 'Mandals']].map(([v, l]) => (
                  <div key={l}>
                    <p className="text-xl font-extrabold text-white">{v}</p>
                    <p className="text-[11px] text-light-gray">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-teal uppercase tracking-wider mb-2">About SHIXO</p>
              <h3 className="text-3xl lg:text-4xl font-extrabold text-navy mb-4 leading-tight">
                Governance that is transparent by design
              </h3>
              <p className="text-muted mb-4 leading-relaxed">
                SHIXO digitises the entire teacher transfer lifecycle — from eligibility prediction to official order
                generation — removing manual bottlenecks and ensuring every decision is fair, auditable and policy-compliant.
              </p>
              <p className="text-muted mb-6 leading-relaxed">
                Built for scale, the platform keeps schools, mandals and analytics perfectly synchronised so administrators
                always work from a single source of truth.
              </p>
              <Link to="/login" className="inline-flex bg-navy hover:bg-navy-light text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-colors shadow-soft">
                Login to Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-navy via-navy-light to-teal p-12 text-center shadow-lift">
            <div className="absolute inset-0 hero-grid opacity-20" />
            <h3 className="relative text-3xl lg:text-4xl font-extrabold text-white mb-4">Ready to access the portal?</h3>
            <p className="relative text-light-gray mb-8 max-w-lg mx-auto">
              Login as a Teacher to check transfer eligibility, or as a Mandal Education Officer to manage your workforce.
            </p>
            <Link to="/login" className="relative inline-flex bg-white hover:bg-soft-white text-navy px-9 py-3.5 rounded-xl font-bold text-sm transition-colors shadow-soft">
              Login to SHIXO Portal
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy text-white pt-14 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Logo />
                <span className="font-extrabold text-lg">SHIXO</span>
              </div>
              <p className="text-sm text-light-gray leading-relaxed max-w-xs">
                AI-based government teacher transfer & workforce management platform — enabling transparent,
                data-driven governance in education.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Quick Links</h4>
              <div className="space-y-2 text-sm text-light-gray">
                <a href="#features" className="block hover:text-white transition-colors">Features</a>
                <a href="#analytics" className="block hover:text-white transition-colors">Analytics</a>
                <a href="#workflow" className="block hover:text-white transition-colors">How it Works</a>
                <Link to="/login" className="block hover:text-white transition-colors">Portal Login</Link>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contact</h4>
              <div className="space-y-2 text-sm text-light-gray">
                <p>Department of School Education</p>
                <p>Government of Telangana</p>
                <p>support@shixo.gov.in</p>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 text-center text-xs text-light-gray">
            &copy; {new Date().getFullYear()} SHIXO — Government Teacher Management Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
