import { useState, useEffect, useCallback } from 'react';
import { getMeoDashboard, approveTransfer, rejectTransfer, getMeoAppeals, reviewAppeal } from '../api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#081D3A', '#2563EB', '#16A34A', '#F59E0B', '#DC2626', '#153E90', '#3B82F6', '#8B5CF6'];
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
    return () => { ignore = true; };
  }, [user.user_id]);

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      await approveTransfer({ request_id: requestId, meo_id: user.user_id });
      load();
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
    } catch (err) {
      alert(err.response?.data?.detail || `Failed to ${action} appeal`);
    }
    setActionLoading('');
  };

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-soft-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-9 h-9 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const subjectData = Object.entries(data.subject_distribution || {}).map(([k, v]) => ({ name: k, value: v }));
  const schoolStatusData = [
    { name: 'Shortage', value: data.shortage_schools, color: '#DC2626' },
    { name: 'Surplus', value: data.surplus_schools, color: '#16A34A' },
    { name: 'Balanced', value: data.total_schools - data.shortage_schools - data.surplus_schools, color: '#2563EB' },
  ];

  return (
    <div className="min-h-screen bg-soft-white flex">
      {/* Sidebar */}
      <aside className={`relative bg-gradient-to-b from-navy to-navy-deep text-white flex-shrink-0 transition-all duration-300 shadow-xl ${sidebarOpen ? 'w-60' : 'w-16'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && (
            <div className="flex items-center gap-2.5">
              <span className="h-9 w-9 rounded-xl bg-white flex items-center justify-center overflow-hidden ring-1 ring-white/20">
                <img src="/favicon2.jpeg" alt="SHIXO" className="h-full w-full object-contain p-0.5" />
              </span>
              <div>
                <p className="font-extrabold text-sm leading-none">SHIXO</p>
                <p className="text-[9px] text-light-gray mt-0.5">MEO Portal</p>
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-light-gray hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        {sidebarOpen && <p className="px-5 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-wider text-light-gray/60">Menu</p>}
        <nav className="py-2 space-y-1 px-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                activeTab === t ? 'bg-teal text-white shadow-sm' : 'text-light-gray hover:bg-white/10 hover:text-white'
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
        <div className="absolute bottom-0 left-0 p-4">
          <button onClick={onLogout} className="text-xs text-light-gray hover:text-white flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-light-gray px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-extrabold text-navy">MEO Dashboard</h1>
            <p className="text-xs text-muted">Mandal Education Officer — {data.mandal}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex text-xs bg-teal/10 text-teal px-3 py-1.5 rounded-full font-semibold">{data.mandal}</span>
            <div className="flex items-center gap-2 pl-3 border-l border-light-gray">
              <span className="h-9 w-9 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">{user.name?.charAt(0) || 'M'}</span>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-navy leading-none">{user.user_id}</p>
                <p className="text-[10px] text-muted mt-0.5">Officer</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Overview */}
          {activeTab === 'Overview' && (
            <div className="space-y-6">
              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {[
                  { label: 'Total Teachers', value: data.total_teachers, color: 'text-navy', tile: 'bg-navy/10 text-navy', icon: 'M15 19.13v-.88a3 3 0 00-3-3H6a3 3 0 00-3 3v.88M21 19.13v-.88a3 3 0 00-2.25-2.9M15.75 6.13a3 3 0 010 5.74M9 12.13a3 3 0 100-6 3 3 0 000 6z' },
                  { label: 'Total Schools', value: data.total_schools, color: 'text-teal', tile: 'bg-teal/10 text-teal', icon: 'M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.33A48.4 48.4 0 0012 9.75c-2.55 0-5.06.2-7.5.58V21' },
                  { label: 'Shortage Schools', value: data.shortage_schools, color: 'text-alert', tile: 'bg-alert/10 text-alert', icon: 'M12 9v3.75m-9.3 3.38c-.87 1.5.22 3.37 1.95 3.37h14.7c1.73 0 2.82-1.87 1.95-3.37L13.95 4.5a2.25 2.25 0 00-3.9 0L2.7 16.13zM12 15.75h.01' },
                  { label: 'Pending Requests', value: data.pending_requests?.length || 0, color: 'text-gold', tile: 'bg-gold/10 text-gold', icon: 'M12 6v6l4 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z' },
                ].map((s) => (
                  <div key={s.label} className="bg-white rounded-2xl border border-light-gray shadow-card p-5 hover:shadow-soft transition-all">
                    <div className={`w-10 h-10 rounded-xl ${s.tile} flex items-center justify-center mb-3`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.7} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d={s.icon} /></svg>
                    </div>
                    <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-muted mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* School status pie */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
                <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Subject-wise Teacher Distribution</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={subjectData}>
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
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

              <div className="bg-white rounded-2xl border border-light-gray shadow-card p-5">
                <p className="text-sm text-gray-500"><span className="font-semibold text-navy">Avg Student-Teacher Ratio:</span> {data.avg_student_teacher_ratio}</p>
              </div>
            </div>
          )}

          {/* Requests */}
          {activeTab === 'Requests' && (
            <div className="space-y-6">
              {/* Pending */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
                              <span className={`font-bold ${r.priority_score >= 60 ? 'text-success' : r.priority_score >= 40 ? 'text-gold' : 'text-alert'}`}>
                                {r.priority_score}
                              </span>
                            </td>
                            <td className="p-3 text-xs text-gray-500 max-w-[150px] truncate">{r.transfer_reason}</td>
                            <td className="p-3 text-center">
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => handleApprove(r.request_id)}
                                  disabled={actionLoading === r.request_id}
                                  className="bg-success hover:bg-success/80 text-white px-3 py-1.5 rounded text-xs font-medium transition-colors disabled:opacity-50"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => { setRejectModal(r.request_id); setRejectReason(''); }}
                                  disabled={actionLoading === r.request_id}
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

              {/* Approved/Rejected */}
              {['approved_requests', 'rejected_requests'].map((key) => (
                <div key={key} className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
                              <td className="p-3 text-center font-bold text-teal">{r.priority_score}</td>
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
              <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
              <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
            <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
                          <td className="p-3 text-center">{s.student_teacher_ratio}</td>
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
                <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Student-Teacher Ratio by School</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.schools?.slice(0, 15).map(s => ({
                        name: s.school_id, ratio: s.student_teacher_ratio
                      }))}>
                        <XAxis dataKey="name" tick={{ fontSize: 9 }} angle={-45} textAnchor="end" height={50} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Bar dataKey="ratio" fill="#081D3A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Teacher distribution */}
                <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
              <div className="bg-white rounded-2xl border border-light-gray shadow-card p-6">
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
