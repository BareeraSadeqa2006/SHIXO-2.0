import { useState, useEffect, useCallback } from 'react';
import { getMeoDashboard, approveTransfer, rejectTransfer, getMeoAppeals, reviewAppeal, getMeoNotifications, checkEligibilityMeo } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0F9D94', '#14B8A6', '#10B981', '#F59E0B', '#EF4444', '#0F172A', '#99F6E4', '#8B5CF6'];
const REJECT_REASONS = [
  'No vacancy available at requested school',
  'Current school has teacher shortage',
  'Low priority score - does not meet threshold',
  'Minimum service period not completed',
  'Subject requirement conflict at requested school',
  'Policy constraints - transfer freeze period active',
];

const tabs = ['Overview', 'Requests', 'Appeals', 'Schools', 'Analytics'];

export default function MEODashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appealsData, setAppealsData] = useState(null);
  const [appealReviewModal, setAppealReviewModal] = useState(null);
  const [appealReviewNotes, setAppealReviewNotes] = useState('');
  const [meoNotifs, setMeoNotifs] = useState([]);
  const [showNotif, setShowNotif] = useState(false);
  const [eligibilityModal, setEligibilityModal] = useState(null);
  const [eligibilityResult, setEligibilityResult] = useState(null);
  const [eligibilityLoading, setEligibilityLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMeoDashboard(user.user_id);
      setData(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, [user.user_id]);

  useEffect(() => {
    let ignore = false;
    getMeoDashboard(user.user_id)
      .then(res => { if (!ignore) { setData(res.data); setLoading(false); } })
      .catch(() => { if (!ignore) setLoading(false); });
    getMeoAppeals(user.user_id)
      .then(res => { if (!ignore) setAppealsData(res.data); })
      .catch(() => {});
    getMeoNotifications(user.user_id)
      .then(res => { if (!ignore) setMeoNotifs(res.data); })
      .catch(() => {});
    return () => { ignore = true; };
  }, [user.user_id]);

  const loadNotifications = async () => {
    try {
      const r = await getMeoNotifications(user.user_id);
      setMeoNotifs(r.data);
    } catch (e) { /* ignore */ }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await approveTransfer({ request_id: requestId, meo_id: user.user_id });
      load();
      loadNotifications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to approve');
    }
    setActionLoading('');
  };

  const handleReject = async () => {
    if (!rejectModal || !rejectReason) return;
    setActionLoading(rejectModal);
    try {
      await rejectTransfer({ request_id: rejectModal, meo_id: user.user_id, rejection_reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      load();
      loadNotifications();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to reject');
    }
    setActionLoading('');
  };

  const handleAppealAction = async (appealId, action) => {
    if (action === 'reject' && !appealReviewNotes) {
      setAppealReviewModal(appealId);
      return;
    }
    setActionLoading(appealId);
    try {
      await reviewAppeal({
        appeal_id: appealId,
        meo_id: user.user_id,
        action,
        review_notes: appealReviewNotes,
      });
      setAppealReviewModal(null);
      setAppealReviewNotes('');
      load();
      getMeoAppeals(user.user_id).then(r => setAppealsData(r.data)).catch(() => {});
      loadNotifications();
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${action} appeal`);
    }
    setActionLoading('');
  };

  const handleCheckEligibility = async (requestId) => {
    setEligibilityLoading(true);
    setEligibilityModal(requestId);
    try {
      const res = await checkEligibilityMeo({
        request_id: requestId,
        meo_id: user.user_id,
      });
      setEligibilityResult(res.data.eligibility_result);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to check eligibility');
      setEligibilityModal(null);
    }
    setEligibilityLoading(false);
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-3 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const subjectData = Object.entries(data.subject_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const schoolStatusData = [
    { name: 'Shortage', value: data.shortage_schools, color: '#EF4444' },
    { name: 'Surplus', value: data.surplus_schools, color: '#10B981' },
    { name: 'Balanced', value: data.total_schools - data.shortage_schools - data.surplus_schools, color: '#0F9D94' },
  ];

  // Presentation helpers
  const priorityLabelFromScore = (score) => {
    if ((score || 0) >= 60) return { label: 'High Priority', badge: 'bg-success/10 text-success' };
    if ((score || 0) >= 40) return { label: 'Medium Priority', badge: 'bg-gold/10 text-gold' };
    return { label: 'Low Priority', badge: 'bg-alert/10 text-alert' };
  };

  const formatRatio = (r) => (r ? `${Math.round(r)}:1` : 'N/A');
  const ratioLong = (r) => (r ? `${Math.round(r)} Students per Teacher` : 'N/A');

  return (
    <div className="min-h-screen bg-soft-white flex">
      {/* Sidebar */}
      <aside className={`bg-navy text-white flex-shrink-0 transition-all duration-300 flex flex-col ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">SHIXO</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-light-gray hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {sidebarOpen && data && (
          <div className="px-4 py-3 border-b border-white/10">
            <p className="text-xs font-semibold text-light-gray mb-1">MEO Officer</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-teal rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user.user_id?.charAt(user.user_id.length - 1)}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{data.mandal}</p>
                <p className="text-xs text-light-gray truncate">{user.user_id}</p>
              </div>
            </div>
          </div>
        )}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === t ? 'bg-teal text-white' : 'text-light-gray hover:bg-white/5'
              }`}
            >
              {t === 'Overview' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>}
              {t === 'Requests' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              {t === 'Schools' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
              {t === 'Appeals' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              {t === 'Analytics' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              {sidebarOpen && (
                <span className="flex-1 text-left">
                  {t}
                  {t === 'Requests' && data.pending_requests?.length > 0 && (
                    <span className="ml-2 bg-gold text-navy text-xs rounded-full px-1.5 py-0.5 font-bold">{data.pending_requests.length}</span>
                  )}
                  {t === 'Appeals' && appealsData?.pending_appeals?.length > 0 && (
                    <span className="ml-2 bg-alert text-white text-xs rounded-full px-1.5 py-0.5 font-bold">{appealsData.pending_appeals.length}</span>
                  )}
                </span>
              )}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-2 mt-auto">
          <button onClick={onLogout} className="w-full text-xs text-light-gray hover:text-white hover:bg-white/10 flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-light-gray px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-navy">MEO Dashboard</h1>
            <p className="text-xs text-gray-500">Mandal Education Officer — {data.mandal}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-medium">{user.user_id}</span>
            <span className="text-xs bg-gold/10 text-gold px-3 py-1 rounded-full font-medium">{data.mandal}</span>
            <div className="relative">
              <button onClick={() => setShowNotif(!showNotif)} className="p-2 rounded-full hover:bg-gray-100">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h11z"/></svg>
                {meoNotifs.filter(n => n.read === 0).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-alert text-white rounded-full text-[10px] px-1">{meoNotifs.filter(n => n.read === 0).length}</span>
                )}
              </button>
              {showNotif && (
                <div className="absolute right-0 mt-2 w-80 bg-white border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b text-sm font-semibold">Notifications</div>
                  <div className="max-h-64 overflow-y-auto">
                    {meoNotifs.length === 0 ? (
                      <p className="p-3 text-xs text-gray-500">No notifications</p>
                    ) : (
                      meoNotifs.map((n) => (
                        <div key={n.id} className={`p-3 text-sm ${n.read === 0 ? 'bg-soft-white' : ''}`}>
                          <div className="text-xs text-gray-500 mb-1">{n.created_at}</div>
                          <div className="text-sm text-gray-800">{n.message}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Teachers', value: data.total_teachers, color: 'text-navy', bg: 'bg-navy/5' },
                  { label: 'Total Schools', value: data.total_schools, color: 'text-teal', bg: 'bg-teal/5' },
                  { label: 'Shortage Schools', value: data.shortage_schools, color: 'text-alert', bg: 'bg-alert/5' },
                  { label: 'Pending Requests', value: data.pending_requests?.length || 0, color: 'text-gold', bg: 'bg-gold/5' },
                ].map((s) => (
                  <div key={s.label} className={`${s.bg} rounded-2xl border border-light-gray shadow-sm p-5`}>
                    <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* School status pie */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">School Status Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={schoolStatusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                          {schoolStatusData.map((entry, i) => (
                            <Cell key={i} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Subject dist bar */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Subject-wise Teacher Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#0F9D94" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick transfer summary */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-gold/5 rounded-xl border border-gold/20 p-5 text-center">
                  <p className="text-3xl font-bold text-gold">{data.pending_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
                <div className="bg-success/5 rounded-xl border border-success/20 p-5 text-center">
                  <p className="text-3xl font-bold text-success">{data.approved_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Approved</p>
                </div>
                <div className="bg-alert/5 rounded-xl border border-alert/20 p-5 text-center">
                  <p className="text-3xl font-bold text-alert">{data.rejected_requests?.length || 0}</p>
                  <p className="text-sm text-gray-500">Rejected</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-5">
                <p className="text-sm text-gray-500"><span className="font-semibold text-navy">Avg Student-Teacher Ratio:</span> {formatRatio(data.avg_student_teacher_ratio)} — <span className="text-xs text-gray-400">{ratioLong(data.avg_student_teacher_ratio)}</span></p>
              </div>
            </div>
          )}

          {/* Requests */}
          {activeTab === 'Requests' && (
            <div className="space-y-6">
              {/* Pending */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Pending Transfer Requests ({data.pending_requests?.length || 0})
                </h3>
                {data.pending_requests?.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No pending requests</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-soft-white">
                          <th className="text-left p-3 font-medium text-gray-500">Request ID</th>
                          <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                          <th className="text-left p-3 font-medium text-gray-500">From</th>
                          <th className="text-left p-3 font-medium text-gray-500">To</th>
                          <th className="text-center p-3 font-medium text-gray-500">Priority</th>
                          <th className="text-left p-3 font-medium text-gray-500">Reason</th>
                          <th className="text-center p-3 font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.pending_requests.map((r) => (
                          <tr key={r.request_id} className="border-t border-light-gray hover:bg-soft-white">
                            <td className="p-3 font-mono text-xs">{r.request_id}</td>
                            <td className="p-3 font-medium">{r.teacher_id}</td>
                            <td className="p-3 text-gray-500 text-xs">{r.current_school}</td>
                            <td className="p-3 text-gray-500 text-xs">{r.requested_school}</td>
                            <td className="p-3 text-center">
                              {(() => { const p = priorityLabelFromScore(r.priority_score); return <span className={`font-bold ${p.badge}`}>{p.label}</span>; })()}
                            </td>
                            <td className="p-3 text-xs text-gray-500 max-w-[150px] truncate">{r.transfer_reason}</td>
                            <td className="p-3 text-center">
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleCheckEligibility(r.request_id)}
                                  disabled={eligibilityLoading && eligibilityModal === r.request_id}
                                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                                    r.eligibility_checked
                                      ? 'bg-teal hover:bg-teal/80 text-white'
                                      : 'bg-gold hover:bg-gold/80 text-navy'
                                  } disabled:opacity-50`}
                                >
                                  {r.eligibility_checked ? '✓ Eligibility Checked' : 'Check Eligibility'}
                                </button>
                                <div className="flex items-center gap-2 justify-center">
                                  <button
                                    onClick={() => handleApprove(r.request_id)}
                                    disabled={actionLoading === r.request_id || !r.eligibility_checked}
                                    className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                    title={!r.eligibility_checked ? 'Check eligibility first' : ''}
                                  >
                                    Approve
                                  </button>
                                  <button
                                    onClick={() => { setRejectModal(r.request_id); setRejectReason(''); }}
                                    disabled={actionLoading === r.request_id || !r.eligibility_checked}
                                    className="bg-alert hover:bg-alert/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                    title={!r.eligibility_checked ? 'Check eligibility first' : ''}
                                  >
                                    Reject
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Approved/Rejected */}
              {['approved_requests', 'rejected_requests'].map((key) => (
                <div key={key} className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                    {key === 'approved_requests' ? 'Approved' : 'Rejected'} Requests ({data[key]?.length || 0})
                  </h3>
                  {data[key]?.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-soft-white">
                            <th className="text-left p-3 font-medium text-gray-500">Request ID</th>
                            <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                            <th className="text-left p-3 font-medium text-gray-500">From → To</th>
                            <th className="text-center p-3 font-medium text-gray-500">Priority</th>
                            <th className="text-left p-3 font-medium text-gray-500">Date</th>
                            {key === 'rejected_requests' && <th className="text-left p-3 font-medium text-gray-500">Reason</th>}
                          </tr>
                        </thead>
                        <tbody>
                          {data[key].map((r) => (
                            <tr key={r.request_id} className="border-t border-light-gray">
                              <td className="p-3 font-mono text-xs">{r.request_id}</td>
                              <td className="p-3">{r.teacher_id}</td>
                              <td className="p-3 text-xs text-gray-500">{r.current_school} → {r.requested_school}</td>
                              <td className="p-3 text-center">{(() => { const p = priorityLabelFromScore(r.priority_score); return <span className={`font-bold ${p.badge}`}>{p.label}</span>; })()}</td>
                              <td className="p-3 text-xs">{r.approval_date}</td>
                              {key === 'rejected_requests' && <td className="p-3 text-xs text-alert">{r.rejection_reason}</td>}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">None</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Appeals */}
          {activeTab === 'Appeals' && (
            <div className="space-y-6">
              {/* Pending Appeals */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Pending Appeals ({appealsData?.pending_appeals?.length || 0})
                </h3>
                {!appealsData?.pending_appeals?.length ? (
                  <p className="text-sm text-gray-400 text-center py-6">No pending appeals</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-soft-white">
                          <th className="text-left p-3 font-medium text-gray-500">Appeal ID</th>
                          <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                          <th className="text-left p-3 font-medium text-gray-500">Original Request</th>
                          <th className="text-left p-3 font-medium text-gray-500">Type</th>
                          <th className="text-center p-3 font-medium text-gray-500">Emergency</th>
                          <th className="text-left p-3 font-medium text-gray-500">Reason</th>
                          <th className="text-center p-3 font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appealsData.pending_appeals.map((a) => (
                          <tr key={a.appeal_id} className="border-t border-light-gray hover:bg-soft-white">
                            <td className="p-3 font-mono text-xs">{a.appeal_id}</td>
                            <td className="p-3 font-medium">{a.teacher_id}</td>
                            <td className="p-3 font-mono text-xs">{a.original_request_id}</td>
                            <td className="p-3 text-xs capitalize">{a.appeal_type?.replace('_', ' ')}</td>
                            <td className="p-3 text-center">
                              {a.is_emergency ? (
                                <span className="bg-alert/10 text-alert text-xs px-2 py-0.5 rounded-full font-medium">Yes</span>
                              ) : (
                                <span className="text-gray-400 text-xs">No</span>
                              )}
                            </td>
                            <td className="p-3 text-xs text-gray-500 max-w-[200px] truncate">{a.appeal_reason}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => handleAppealAction(a.appeal_id, 'approve')}
                                  disabled={actionLoading === a.appeal_id}
                                  className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setAppealReviewModal(a.appeal_id); setAppealReviewNotes(''); }}
                                  disabled={actionLoading === a.appeal_id}
                                  className="bg-alert hover:bg-alert/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Reviewed Appeals */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                  Reviewed Appeals ({appealsData?.reviewed_appeals?.length || 0})
                </h3>
                {!appealsData?.reviewed_appeals?.length ? (
                  <p className="text-sm text-gray-400 text-center py-4">None</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-soft-white">
                          <th className="text-left p-3 font-medium text-gray-500">Appeal ID</th>
                          <th className="text-left p-3 font-medium text-gray-500">Teacher</th>
                          <th className="text-left p-3 font-medium text-gray-500">Original Request</th>
                          <th className="text-center p-3 font-medium text-gray-500">Status</th>
                          <th className="text-left p-3 font-medium text-gray-500">Review Notes</th>
                          <th className="text-left p-3 font-medium text-gray-500">Reviewed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appealsData.reviewed_appeals.map((a) => (
                          <tr key={a.appeal_id} className="border-t border-light-gray">
                            <td className="p-3 font-mono text-xs">{a.appeal_id}</td>
                            <td className="p-3">{a.teacher_id}</td>
                            <td className="p-3 font-mono text-xs">{a.original_request_id}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                a.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-alert/10 text-alert'
                              }`}>
                                {a.status}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500">{a.review_notes || '-'}</td>
                            <td className="p-3 text-xs">{a.reviewed_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schools */}
          {activeTab === 'Schools' && (
            <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Schools in {data.mandal} ({data.schools?.length || 0})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-soft-white">
                      <th className="text-left p-3 font-medium text-gray-500">School ID</th>
                      <th className="text-left p-3 font-medium text-gray-500">Name</th>
                      <th className="text-center p-3 font-medium text-gray-500">Students</th>
                      <th className="text-center p-3 font-medium text-gray-500">Current</th>
                      <th className="text-center p-3 font-medium text-gray-500">Required</th>
                      <th className="text-center p-3 font-medium text-gray-500">Ratio</th>
                      <th className="text-center p-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.schools?.map((s) => {
                      const diff = s.current_teacher_count - s.required_teacher_count;
                      return (
                        <tr key={s.school_id} className="border-t border-light-gray hover:bg-soft-white">
                          <td className="p-3 font-mono text-xs">{s.school_id}</td>
                          <td className="p-3 font-medium">{s.school_name}</td>
                          <td className="p-3 text-center">{s.student_strength}</td>
                          <td className="p-3 text-center">{s.current_teacher_count}</td>
                          <td className="p-3 text-center">{s.required_teacher_count}</td>
                          <td className="p-3 text-center">{formatRatio(s.student_teacher_ratio)}</td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              diff < 0 ? 'bg-alert/10 text-alert' : diff > 0 ? 'bg-success/10 text-success' : 'bg-teal/10 text-teal'
                            }`}>
                              {diff < 0 ? `Shortage (${Math.abs(diff)})` : diff > 0 ? `Surplus (+${diff})` : 'Balanced'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Analytics */}
          {activeTab === 'Analytics' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Student-Teacher ratio distribution */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Student-Teacher Ratio by School</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.schools?.slice(0, 15).map(s => ({
                        name: s.school_id, ratio: s.student_teacher_ratio
                      }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="ratio" fill="#14B8A6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Teacher distribution */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Subject Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={subjectData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90}>
                          {subjectData.map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: 11 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Shortage/Surplus table */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Shortage & Surplus Analysis</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-alert mb-2">Top Shortage Schools</p>
                    {data.schools?.filter(s => s.current_teacher_count < s.required_teacher_count)
                      .sort((a, b) => (a.current_teacher_count - a.required_teacher_count) - (b.current_teacher_count - b.required_teacher_count))
                      .slice(0, 5)
                      .map(s => (
                        <div key={s.school_id} className="flex justify-between text-sm py-1.5 border-b border-light-gray">
                          <span className="text-gray-600">{s.school_name}</span>
                          <span className="text-alert font-medium">-{s.required_teacher_count - s.current_teacher_count}</span>
                        </div>
                      ))}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-success mb-2">Top Surplus Schools</p>
                    {data.schools?.filter(s => s.current_teacher_count > s.required_teacher_count)
                      .sort((a, b) => (b.current_teacher_count - b.required_teacher_count) - (a.current_teacher_count - a.required_teacher_count))
                      .slice(0, 5)
                      .map(s => (
                        <div key={s.school_id} className="flex justify-between text-sm py-1.5 border-b border-light-gray">
                          <span className="text-gray-600">{s.school_name}</span>
                          <span className="text-success font-medium">+{s.current_teacher_count - s.required_teacher_count}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Appeal Review Modal */}
      {appealReviewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-navy mb-4">Reject Appeal</h3>
            <p className="text-sm text-gray-500 mb-4">Appeal: {appealReviewModal}</p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes / Rejection Reason</label>
              <textarea
                value={appealReviewNotes}
                onChange={(e) => setAppealReviewNotes(e.target.value)}
                rows={3}
                placeholder="Provide reason for rejection..."
                className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                required
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleAppealAction(appealReviewModal, 'reject')}
                disabled={!appealReviewNotes}
                className="flex-1 bg-alert hover:bg-alert/80 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setAppealReviewModal(null)}
                className="flex-1 bg-light-gray hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Eligibility Results Modal */}
      {eligibilityModal && eligibilityResult && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-96 overflow-y-auto">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold ${
                eligibilityResult.transfer_recommended ? 'bg-success' : 'bg-alert'
              }`}>
                {eligibilityResult.transfer_recommended ? '✓' : '✗'}
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy">Transfer Eligibility Review</h3>
                <p className="text-sm text-gray-500">{eligibilityResult.name} ({eligibilityResult.teacher_id})</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg ${eligibilityResult.transfer_recommended ? 'bg-success/10' : 'bg-alert/10'}`}>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Recommendation</p>
                <p className={`text-sm font-bold ${eligibilityResult.transfer_recommended ? 'text-success' : 'text-alert'}`}>
                  {eligibilityResult.transfer_recommended ? 'Transfer Recommended' : 'Transfer Not Recommended'}
                </p>
              </div>
              <div className="bg-teal/10 p-3 rounded-lg">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Confidence</p>
                <p className="text-sm font-bold text-teal">{eligibilityResult.confidence}%</p>
              </div>
              <div className="bg-gold/10 p-3 rounded-lg col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Priority Score</p>
                <p className="text-sm font-bold text-gold">{eligibilityResult.priority_score}/100</p>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="text-sm font-semibold text-navy mb-2">Key Eligibility Factors</h4>
              <ul className="space-y-2">
                {eligibilityResult.reasons && eligibilityResult.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-teal mt-0.5">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>

            {eligibilityResult.details && (
              <div className="mb-4 p-3 bg-soft-white rounded-lg">
                <h4 className="text-sm font-semibold text-navy mb-2">Teacher Details</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Years of Service:</span> {eligibilityResult.details.years_of_service}</div>
                  <div><span className="font-medium">Years in Current School:</span> {eligibilityResult.details.years_in_current_school}</div>
                  <div><span className="font-medium">Transfer Request:</span> {eligibilityResult.details.transfer_request ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Medical Condition:</span> {eligibilityResult.details.medical_condition ? 'Yes' : 'No'}</div>
                  <div><span className="font-medium">Spouse Distance:</span> {eligibilityResult.details.spouse_distance} km</div>
                  <div><span className="font-medium">Promotion Due:</span> {eligibilityResult.details.promotion_due ? 'Yes' : 'No'}</div>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-500 mb-4 italic">
              Note: This AI recommendation is advisory. You can approve or reject based on your professional judgment and policy requirements.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setEligibilityModal(null)}
                className="flex-1 bg-teal hover:bg-teal/80 text-white py-2.5 rounded-lg text-sm font-medium"
              >
                Close & Proceed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-navy mb-4">Reject Transfer Request</h3>
            <p className="text-sm text-gray-500 mb-4">Request: {rejectModal}</p>
            <div className="space-y-3 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reject_reason"
                    value={r}
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="mt-0.5"
                  />
                  <span className="text-sm text-gray-600">{r}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleReject}
                disabled={!rejectReason}
                className="flex-1 bg-alert hover:bg-alert/80 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectModal(null)}
                className="flex-1 bg-light-gray hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
