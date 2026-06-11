import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login, getTestCredentials } from '../api';

export default function LoginPage({ onLogin }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
    <div className="min-h-screen bg-gradient-to-br from-teal via-teal-light to-navy flex flex-col">
      {/* Top bar */}
      <div className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-8 h-8 rounded object-cover shadow-md" />
            <span className="text-white font-bold">SHIXO</span>
          </Link>
          <Link to="/" className="text-sm text-light-gray hover:text-white">Back to Home</Link>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-teal to-teal-light px-8 py-7 text-center">
              <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-14 h-14 rounded-xl object-cover mx-auto mb-3 shadow-lg" />
              <h2 className="text-xl font-bold text-white">SHIXO Login Portal</h2>
              <p className="text-sm text-white/80 mt-1">Government Teacher Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="px-8 py-6 space-y-5">
              {/* Role Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                      role === 'teacher'
                        ? 'border-teal bg-teal/5 text-teal'
                        : 'border-light-gray text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    Teacher
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('meo')}
                    className={`py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all ${
                      role === 'meo'
                        ? 'border-teal bg-teal/5 text-teal'
                        : 'border-light-gray text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    MEO
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {role === 'teacher' ? 'Teacher' : 'MEO'} ID
                </label>
                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={role === 'teacher' ? 'e.g. TCH00001' : 'e.g. MEO001'}
                  className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full border border-light-gray rounded-lg px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-4.803m5.596-3.856a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-alert/10 border border-alert/20 text-alert text-sm rounded-lg px-4 py-2.5">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal hover:bg-teal-light text-white py-3 rounded-lg font-semibold text-sm transition-colors disabled:opacity-50 shadow-[0_8px_20px_-8px_rgba(15,157,148,0.6)]"
              >
                {loading ? 'Authenticating...' : 'Login to Portal'}
              </button>
            </form>

            {/* Demo credentials */}
            {creds && (
              <div className="px-8 pb-6">
                <div className="bg-soft-white rounded-lg p-4 border border-light-gray">
                  <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Demo Credentials</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-medium text-navy mb-1">Teachers</p>
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
                      <p className="text-xs font-medium text-navy mb-1">MEOs</p>
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
  );
}