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
  <div className="min-h-screen bg-white flex flex-col">
    {/* Navbar */}
    <div className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img
            src="/favicon2.jpeg"
            alt="SHIXO Logo"
            className="w-10 h-10 rounded-lg shadow-md"
          />
          <span className="text-xl font-bold text-navy">SHIXO</span>
        </Link>

        <Link
          to="/"
          className="text-teal font-medium hover:text-teal-light"
        >
          Back to Home
        </Link>
      </div>
    </div>

    {/* Main Section */}

        {/* Main Section */}
<div className="flex-1 flex items-center">

  {/* Left Side */}
  <div className="w-full lg:w-[55%] flex justify-start pl-8">
    <img
      src="/Learning-amico.svg"
      alt="Illustration"
     
      className="w-[280px] -mr-16"
    />
  </div>

  {/* Right Side */}
  <div className="w-full lg:w-[55%] flex justify-start pl-6"></div>
          <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-teal to-teal-light px-8 py-7 text-center">
              <img src="/favicon2.jpeg" alt="SHIXO Logo" className="w-14 h-14 rounded-xl object-cover mx-auto mb-3 shadow-lg" />
              <h2 className="text-xl font-bold text-white">SHIXO Login Portal</h2>
              <p className="text-sm text-white/80 mt-1">Government Teacher Management System</p>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-6">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Role
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-3 rounded-lg border-2 font-medium ${
                      role === 'teacher'
                        ? 'border-teal bg-teal/5 text-teal'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    Teacher
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('meo')}
                    className={`py-3 rounded-lg border-2 font-medium ${
                      role === 'meo'
                        ? 'border-teal bg-teal/5 text-teal'
                        : 'border-gray-200 text-gray-500'
                    }`}
                  >
                    MEO
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {role === 'teacher' ? 'Teacher' : 'MEO'} ID
                </label>

                <input
                  type="text"
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder={
                    role === 'teacher'
                      ? 'e.g. TCH00001'
                      : 'e.g. MEO001'
                  }
                  className="w-full border rounded-lg px-5 py-3.5"
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
                <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-teal text-white py-3 rounded-lg font-semibold"
              >
                {loading ? 'Authenticating...' : 'Login to Portal'}
              </button>

              {creds && (
                <div className="bg-gray-50 border rounded-lg p-4 text-sm">
                  <p className="font-semibold text-gray-600 mb-3">
                    Demo Credentials
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium mb-2">Teachers</p>

                      {creds.teachers?.slice(0, 2).map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            fillCredentials(
                              t.id,
                              t.password,
                              'teacher'
                            )
                          }
                          className="block text-teal text-sm"
                        >
                          {t.id}
                        </button>
                      ))}
                    </div>

                    <div>
                      <p className="font-medium mb-2">MEOs</p>

                      {creds.meos?.slice(0, 2).map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            fillCredentials(
                              m.id,
                              m.password,
                              'meo'
                            )
                          }
                          className="block text-teal text-sm"
                        >
                          {m.id}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

            </form>
          </div>
        </div>
</div>
      
    
  
  
);
}