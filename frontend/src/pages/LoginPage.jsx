import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getTestCredentials } from '../api';

function Logo({ size = 'h-10 w-10' }) {
  return (
    <span className={`${size} rounded-xl bg-white shadow-sm ring-1 ring-black/5 flex items-center justify-center overflow-hidden`}>
      <img src="/favicon2.jpeg" alt="SHIXO logo" className="h-full w-full object-contain p-0.5" />
    </span>
  );
}

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('teacher');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    getTestCredentials().then(r => setCreds(r.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ user_id: userId, password, role });
      onLogin(res.data);
      navigate(role === 'teacher' ? '/teacher' : '/meo');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (id, pw, r) => {
    setUserId(id);
    setPassword(pw);
    setRole(r);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-teal text-white">
        <div className="absolute inset-0 hero-grid opacity-30" />
        <div className="relative flex flex-col justify-between p-12 w-full">
          <Link to="/" className="flex items-center gap-3 w-fit">
            <Logo />
            <div>
              <p className="text-lg font-extrabold leading-none">SHIXO</p>
              <p className="text-[11px] text-light-gray mt-0.5">Government Education Portal</p>
            </div>
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-extrabold leading-tight mb-4">
              Smart Teacher Transfer & Workforce Analytics
            </h2>
            <p className="text-light-gray leading-relaxed">
              Transparent, data-driven governance for managing government teacher transfers, intelligent allocation
              and real-time workforce monitoring.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-10">
              {[['97.8%', 'AI Accuracy'], ['520', 'Schools'], ['20', 'Mandals']].map(([v, l]) => (
                <div key={l}>
                  <p className="text-2xl font-extrabold">{v}</p>
                  <p className="text-[11px] text-light-gray">{l}</p>
                </div>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-light-gray">© {new Date().getFullYear()} Department of School Education</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col bg-soft-white">
        <div className="lg:hidden bg-white border-b border-light-gray">
          <div className="px-4 py-3 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo size="h-8 w-8" />
              <span className="text-navy font-extrabold">SHIXO</span>
            </Link>
            <Link to="/" className="text-sm text-muted hover:text-navy">Back to Home</Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="w-full max-w-md">
            <div className="hidden lg:flex justify-end mb-6">
              <Link to="/" className="text-sm text-muted hover:text-navy">Back to Home</Link>
            </div>
            <div className="bg-white rounded-2xl shadow-soft border border-light-gray overflow-hidden">
              <div className="px-8 pt-8 pb-6 text-center border-b border-light-gray">
                <div className="flex justify-center mb-4"><Logo size="h-14 w-14" /></div>
                <h2 className="text-2xl font-extrabold text-navy">Portal Login</h2>
                <p className="text-sm text-muted mt-1">Government Teacher Management System</p>
              </div>

              <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-ink mb-2">Select Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['teacher', 'meo'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={`py-2.5 px-4 rounded-xl text-sm font-semibold border-2 transition-all ${
                          role === r
                            ? 'border-teal bg-teal/5 text-teal'
                            : 'border-light-gray text-muted hover:border-gray-300'
                        }`}
                      >
                        {r === 'teacher' ? 'Teacher' : 'MEO'}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">
                    {role === 'teacher' ? 'Teacher' : 'MEO'} ID
                  </label>
                  <input
                    type="text"
                    value={userId}
                    onChange={(e) => setUserId(e.target.value)}
                    placeholder={role === 'teacher' ? 'e.g. TCH00001' : 'e.g. MEO001'}
                    className="w-full border border-light-gray rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-ink mb-1.5">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border border-light-gray rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                    required
                  />
                </div>

                {error && (
                  <div className="bg-alert/10 border border-alert/20 text-alert text-sm rounded-xl px-4 py-2.5">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-navy hover:bg-navy-light text-white py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 shadow-sm"
                >
                  {loading ? 'Authenticating...' : 'Login to Portal'}
                </button>
              </form>

              {creds && (
                <div className="px-8 pb-7">
                  <div className="bg-soft-white rounded-xl p-4 border border-light-gray">
                    <p className="text-xs font-semibold text-muted mb-3 uppercase tracking-wide">Demo Credentials</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-semibold text-navy mb-1.5">Teachers</p>
                        {creds.teachers?.slice(0, 2).map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => fillCredentials(t.id, t.password, 'teacher')}
                            className="block text-xs text-teal hover:underline cursor-pointer"
                          >
                            {t.id}
                          </button>
                        ))}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-navy mb-1.5">MEOs</p>
                        {creds.meos?.slice(0, 2).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => fillCredentials(m.id, m.password, 'meo')}
                            className="block text-xs text-teal hover:underline cursor-pointer"
                          >
                            {m.id} ({m.mandal})
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
