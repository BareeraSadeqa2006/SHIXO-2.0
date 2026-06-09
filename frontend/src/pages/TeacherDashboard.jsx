import { useState, useEffect, useCallback } from 'react';
import {
  getTeacherProfile, predictTransfer, recommendSchool,
  applyTransfer, getTransferHistory, getNotifications,
  markNotificationRead, downloadPdf, checkReapplyEligibility,
  submitAppeal, reapplyTransfer, getTeacherAppeals
} from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0F9D94', '#14B8A6', '#10B981', '#F59E0B', '#EF4444', '#0F172A'];
const tabs = ['Dashboard', 'Transfer', 'History', 'Appeals', 'Notifications'];

const APPEAL_TYPES = [
  { value: 'standard', label: 'Standard Appeal' },
  { value: 'medical_emergency', label: 'Medical Emergency' },
  { value: 'spouse_relocation', label: 'Spouse Relocation' },
  { value: 'reconsideration', label: 'Request Reconsideration' },
];

export default function TeacherDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [profile, setProfile] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [history, setHistory] = useState([]);
  const [notifications, setNotifs] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [reason, setReason] = useState('');
  const [applyMsg, setApplyMsg] = useState('');
  const [loading, setLoading] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [appeals, setAppeals] = useState([]);
  const [reapplyEligibility, setReapplyEligibility] = useState(null);
  const [appealForm, setAppealForm] = useState({ requestId: '', reason: '', type: 'standard', isEmergency: false });
  const [appealMsg, setAppealMsg] = useState('');
  const [reapplyForm, setReapplyForm] = useState({ school: '', reason: '' });
  const [reapplyMsg, setReapplyMsg] = useState('');

  const load = useCallback(async () => {
    try {
      const [profileRes, histRes, notifRes] = await Promise.all([
        getTeacherProfile(user.user_id),
        getTransferHistory(user.user_id),
        getNotifications(user.user_id),
      ]);
      setProfile(profileRes.data);
      setHistory(histRes.data);
      setNotifs(notifRes.data);
    } catch (err) {
      console.error(err);
    }
  }, [user.user_id]);

  useEffect(() => {
    let ignore = false;
    getTeacherProfile(user.user_id).then(r => { if (!ignore) setProfile(r.data); });
    getTransferHistory(user.user_id).then(r => { if (!ignore) setHistory(r.data); });
    getNotifications(user.user_id).then(r => { if (!ignore) setNotifs(r.data); });
    getTeacherAppeals(user.user_id).then(r => { if (!ignore) setAppeals(r.data); }).catch(() => {});
    checkReapplyEligibility(user.user_id).then(r => { if (!ignore) setReapplyEligibility(r.data); }).catch(() => {});
    return () => { ignore = true; };
  }, [user.user_id]);

  const handlePredict = async () => {
    setLoading(p => ({ ...p, predict: true }));
    try {
      const res = await predictTransfer(user.user_id);
      setPrediction(res.data);
    } catch (err) {
      console.error(err);
    }
    setLoading(p => ({ ...p, predict: false }));
  };

  const handleRecommend = async () => {
    setLoading(p => ({ ...p, recommend: true }));
    try {
      const res = await recommendSchool(user.user_id);
      setRecommendations(res.data.recommended_schools || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(p => ({ ...p, recommend: false }));
  };

  const handleApply = async (e) => {
    e.preventDefault();
    if (!selectedSchool || !reason) return;
    setLoading(p => ({ ...p, apply: true }));
    setApplyMsg('');
    try {
      const res = await applyTransfer({
        teacher_id: user.user_id,
        requested_school: selectedSchool,
        transfer_reason: reason,
      });
      setApplyMsg(res.data.message || 'Transfer request submitted!');
      setSelectedSchool('');
      setReason('');
      load();
    } catch (err) {
      setApplyMsg(err.response?.data?.detail || 'Failed to submit request');
    }
    setLoading(p => ({ ...p, apply: false }));
  };

  const handleDownloadPdf = async (requestId) => {
    try {
      const res = await downloadPdf(requestId);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `transfer_order_${requestId}.pdf`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('PDF download failed:', err);
    }
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    load();
  };

  const handleSubmitAppeal = async (e) => {
    e.preventDefault();
    if (!appealForm.requestId || !appealForm.reason) return;
    setLoading(p => ({ ...p, appeal: true }));
    setAppealMsg('');
    try {
      const res = await submitAppeal({
        teacher_id: user.user_id,
        original_request_id: appealForm.requestId,
        appeal_reason: appealForm.reason,
        appeal_type: appealForm.type,
        is_emergency: appealForm.isEmergency,
      });
      setAppealMsg(res.data.message || 'Appeal submitted!');
      setAppealForm({ requestId: '', reason: '', type: 'standard', isEmergency: false });
      load();
      getTeacherAppeals(user.user_id).then(r => setAppeals(r.data)).catch(() => {});
      checkReapplyEligibility(user.user_id).then(r => setReapplyEligibility(r.data)).catch(() => {});
    } catch (err) {
      setAppealMsg(err.response?.data?.detail || 'Failed to submit appeal');
    }
    setLoading(p => ({ ...p, appeal: false }));
  };

  const handleReapply = async (e) => {
    e.preventDefault();
    if (!reapplyForm.school || !reapplyForm.reason) return;
    setLoading(p => ({ ...p, reapply: true }));
    setReapplyMsg('');
    try {
      const res = await reapplyTransfer({
        teacher_id: user.user_id,
        requested_school: reapplyForm.school,
        transfer_reason: reapplyForm.reason,
      });
      setReapplyMsg(res.data.message || 'Re-application submitted!');
      setReapplyForm({ school: '', reason: '' });
      load();
      checkReapplyEligibility(user.user_id).then(r => setReapplyEligibility(r.data)).catch(() => {});
    } catch (err) {
      setReapplyMsg(err.response?.data?.detail || 'Failed to submit re-application');
    }
    setLoading(p => ({ ...p, reapply: false }));
  };

  const refreshAppeals = async () => {
    try {
      const [appealsRes, eligRes] = await Promise.all([
        getTeacherAppeals(user.user_id),
        checkReapplyEligibility(user.user_id),
      ]);
      setAppeals(appealsRes.data);
      setReapplyEligibility(eligRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  // Presentation helpers
  const formatRatio = (ratio) => (ratio > 0 ? `${Math.round(ratio)}:1` : 'N/A');
  const ratioLong = (ratio) => (ratio > 0 ? `${Math.round(ratio)} Students per Teacher` : 'N/A');
  const priorityLabelFromScore = (score) => {
    if (score >= 60) return { label: 'High Priority', badge: 'bg-success/10 text-success', text: 'High' };
    if (score >= 40) return { label: 'Medium Priority', badge: 'bg-gold/10 text-gold', text: 'Medium' };
    return { label: 'Low Priority', badge: 'bg-alert/10 text-alert', text: 'Low' };
  };
  const confidenceLabel = (pct) => {
    if (pct >= 80) return { label: 'High Confidence', badge: 'bg-success/10 text-success' };
    if (pct >= 50) return { label: 'Medium Confidence', badge: 'bg-gold/10 text-gold' };
    return { label: 'Low Confidence', badge: 'bg-alert/10 text-alert' };
  };

  const priorityData = prediction ? [
    { name: 'Transfer Request', value: prediction.details.transfer_request ? 30 : 0 },
    { name: 'Medical', value: prediction.details.medical_condition ? 25 : 0 },
    { name: 'Service >= 5yr', value: prediction.details.years_of_service >= 5 ? 20 : 0 },
    { name: 'Spouse > 200km', value: prediction.details.spouse_distance > 200 ? 20 : 0 },
    { name: 'Promotion Due', value: prediction.details.promotion_due ? 10 : 0 },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="min-h-screen bg-soft-white flex">
      {/* Sidebar */}
      <aside className={`bg-navy text-white flex-shrink-0 transition-all duration-300 ${sidebarOpen ? 'w-56' : 'w-16'}`}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          {sidebarOpen && <span className="font-bold text-sm">SHIXO</span>}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-light-gray hover:text-white p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        <nav className="py-4 space-y-1 px-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeTab === t ? 'bg-teal text-white' : 'text-light-gray hover:bg-white/5'
              }`}
            >
              {t === 'Dashboard' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1" /></svg>}
              {t === 'Transfer' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>}
              {t === 'History' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
              {t === 'Appeals' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
              {t === 'Notifications' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>}
              {sidebarOpen && (
                <span className="flex-1 text-left">
                  {t}
                  {t === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-2 bg-alert text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
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
        {/* Top bar */}
        <header className="bg-white border-b border-light-gray px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-navy">Teacher Dashboard</h1>
            <p className="text-xs text-gray-500">Welcome, {user.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-teal/10 text-teal px-3 py-1 rounded-full font-medium">{user.user_id}</span>
            <span className="text-xs bg-navy/10 text-navy px-3 py-1 rounded-full font-medium">{user.mandal}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {/* Dashboard Tab */}
          {activeTab === 'Dashboard' && profile && (
            <div className="space-y-6">
              {/* Profile & School Cards */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Profile Information</h3>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-navy rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {profile.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-navy">{profile.name}</p>
                      <p className="text-sm text-gray-500">{profile.subject} Teacher</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400">ID:</span> <span className="font-medium">{profile.teacher_id}</span></div>
                    <div><span className="text-gray-400">Gender:</span> <span className="font-medium">{profile.gender}</span></div>
                    <div><span className="text-gray-400">Service:</span> <span className="font-medium">{profile.years_of_service} years</span></div>
                    <div><span className="text-gray-400">Appointed:</span> <span className="font-medium">{profile.date_of_first_appointment || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Joined School:</span> <span className="font-medium">{profile.date_joined_current_school || 'N/A'}</span></div>
                    <div><span className="text-gray-400">Status:</span> <span className={`font-medium ${profile.current_status === 'Active' ? 'text-success' : 'text-gold'}`}>{profile.current_status}</span></div>
                    <div><span className="text-gray-400">Transfer:</span> <span className="font-medium">{profile.transfer_status}</span></div>
                  </div>
                </div>
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Current School</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-gray-400">School:</span><span className="font-medium text-right max-w-[200px]">{profile.school_name}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Mandal:</span><span className="font-medium">{profile.mandal}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">District:</span><span className="font-medium">{profile.school_district}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Students:</span><span className="font-medium">{profile.school_student_strength}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Teachers:</span><span className="font-medium">{profile.school_teacher_count}</span></div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-navy">{profile.years_of_service}</p>
                  <p className="text-xs text-gray-500">Years of Service</p>
                </div>
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-teal">{profile.years_in_current_school ?? 0}</p>
                  <p className="text-xs text-gray-500">Years in Current School</p>
                </div>
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-4 text-center">
                  <p className="text-2xl font-bold text-gold">{profile.spouse_distance} km</p>
                  <p className="text-xs text-gray-500">Spouse Distance</p>
                </div>
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-4 text-center">
                  <p className={`text-2xl font-bold ${profile.medical_condition ? 'text-alert' : 'text-success'}`}>
                    {profile.medical_condition ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-gray-500">Medical Condition</p>
                </div>
              </div>

              {/* Predict Button */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">AI Transfer Eligibility</h3>
                  <button
                    onClick={handlePredict}
                    disabled={loading.predict}
                    className="bg-teal hover:bg-teal-light text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading.predict ? 'Analyzing...' : 'Check Eligibility'}
                  </button>
                </div>

                {prediction && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className={`px-4 py-2 rounded-lg text-sm font-bold ${
                        prediction.transfer_recommended
                          ? 'bg-success/10 text-success border border-success/20'
                          : 'bg-alert/10 text-alert border border-alert/20'
                      }`}>
                        {prediction.transfer_recommended ? 'Transfer Recommended' : 'Transfer Not Recommended'}
                      </div>
                      {(() => {
                        const conf = confidenceLabel(prediction.confidence || 0);
                        return (
                          <span className="text-sm text-gray-500">Confidence: <span className={`font-bold ${conf.badge}`}>{conf.label}</span></span>
                        );
                      })()}
                      {(() => {
                        const p = priorityLabelFromScore(prediction.priority_score || 0);
                        return (
                          <span className="text-sm text-gray-500 ml-3">Priority: <span className={`font-bold ${p.badge}`}>{p.label}</span></span>
                        );
                      })()}
                    </div>

                    {/* Explainable AI reasons */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Why This Recommendation</p>
                      <div className="space-y-1.5">
                        {prediction.reasons.map((r, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm">
                            <svg className="w-4 h-4 text-teal mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-600">{r}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Priority breakdown chart */}
                    {priorityData.length > 0 && (
                      <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={priorityData} layout="vertical">
                            <XAxis type="number" domain={[0, 30]} tick={{ fontSize: 11 }} />
                            <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 11 }} />
                            <Tooltip />
                            <Bar dataKey="value" fill="#0F9D94" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transfer Tab */}
          {activeTab === 'Transfer' && (
            <div className="space-y-6">
              {/* Recommend Schools */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Recommended Schools</h3>
                  <button
                    onClick={handleRecommend}
                    disabled={loading.recommend}
                    className="bg-navy hover:bg-navy-light text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading.recommend ? 'Finding...' : 'Find Schools'}
                  </button>
                </div>

                {recommendations.length > 0 && (
                  <div className="space-y-4">
                    {recommendations.map((s, idx) => {
                      const shortage = s.shortage || 0;
                      const ratio = s.student_teacher_ratio || 0;
                      const ratioFormatted = formatRatio(ratio);
                      const vacancies = s.subject_vacancy || 0;
                      
                      let ratioQuality = 'Moderate';
                      if (ratio < 25) ratioQuality = 'Excellent';
                      else if (ratio < 30) ratioQuality = 'Good';
                      else if (ratio > 40) ratioQuality = 'High';

                      const reasons = [];
                      if (shortage > 0) reasons.push(`School shortage: needs ${shortage} teacher${shortage > 1 ? 's' : ''}`);
                      if (vacancies > 0) reasons.push(`Subject vacancies: ${vacancies} opening${vacancies > 1 ? 's' : ''} for ${profile.subject}`);
                      reasons.push(`Student-Teacher ratio: ${ratioLong(ratio)} (${ratioQuality})`);

                      return (
                        <div
                          key={s.school_id}
                          className="border border-light-gray rounded-xl p-5 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="bg-teal/10 text-teal px-3 py-1 rounded-lg font-bold text-sm min-w-fit">
                                #{idx + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold text-navy text-base">{s.school_name}</h4>
                                <p className="text-xs text-gray-500">{s.mandal} • {s.district}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setSelectedSchool(s.school_id)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                selectedSchool === s.school_id
                                  ? 'bg-teal text-white'
                                  : 'bg-light-gray text-navy hover:bg-teal/20'
                              }`}
                            >
                              {selectedSchool === s.school_id ? '✓ Selected' : 'Select'}
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-light-gray">
                            <div className="bg-soft-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Teacher Vacancies</p>
                              <p className="text-xl font-bold text-alert">{shortage}</p>
                              <p className="text-xs text-gray-400 mt-1">position{shortage !== 1 ? 's' : ''} needed</p>
                            </div>
                            <div className="bg-soft-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Student-Teacher Ratio</p>
                              <p className="text-xl font-bold text-navy">{ratioFormatted}</p>
                              <p className="text-xs text-gray-400 mt-1">{ratioLong(ratio)}</p>
                            </div>
                            <div className="bg-soft-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Priority</p>
                              {(() => {
                                const mapIdx = idx === 0 ? { label: 'High Priority', badge: 'bg-success/10 text-success' } : idx === 1 ? { label: 'Medium Priority', badge: 'bg-gold/10 text-gold' } : { label: 'Low Priority', badge: 'bg-alert/10 text-alert' };
                                return (
                                  <p className={`text-xl font-bold ${mapIdx.badge.split(' ')[1] || 'text-teal'}`}>{mapIdx.label}</p>
                                );
                              })()}
                              <p className="text-xs text-gray-400 mt-1">recommendation</p>
                            </div>
                          </div>

                          {reasons.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-2">Why Recommended:</p>
                              <ul className="space-y-1">
                                {reasons.map((reason, i) => (
                                  <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                    <span className="text-teal font-bold">✓</span>
                                    {reason}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Apply Form */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Apply for Transfer</h3>
                <form onSubmit={handleApply} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selected School ID</label>
                    <input
                      type="text"
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                      placeholder="Select from recommended schools above or enter school ID"
                      className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Reason</label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Describe reason for transfer..."
                      className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                      required
                    />
                  </div>
                  {applyMsg && (
                    <div className={`text-sm rounded-lg px-4 py-2.5 ${
                      applyMsg.includes('submitted') ? 'bg-success/10 text-success' : 'bg-alert/10 text-alert'
                    }`}>
                      {applyMsg}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading.apply}
                    className="bg-teal hover:bg-teal-light text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {loading.apply ? 'Submitting...' : 'Submit Transfer Request'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'History' && (
            <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Transfer History</h3>
                  {history.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No transfer requests yet.</p>
              ) : (
                <div className="space-y-4">
                  {history.map((h) => (
                    <div key={h.request_id} className="border border-light-gray rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-mono text-gray-400">{h.request_id}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          h.status === 'Approved' ? 'bg-success/10 text-success' :
                          h.status === 'Rejected' ? 'bg-alert/10 text-alert' :
                          'bg-gold/10 text-gold'
                        }`}>
                          {h.status}
                        </span>
                      </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div><span className="text-gray-400">From:</span> <span className="font-medium">{h.current_school}</span></div>
                        <div><span className="text-gray-400">To:</span> <span className="font-medium">{h.requested_school}</span></div>
                        <div><span className="text-gray-400">Date:</span> <span className="font-medium">{h.request_date}</span></div>
                        <div><span className="text-gray-400">Priority:</span> {(() => { const p = priorityLabelFromScore(h.priority_score || 0); return <span className={`font-bold ${p.badge}`}>{p.label}</span>; })()}</div>
                      </div>
                      {h.status === 'Approved' && h.approved_by && (
                        <div className="mt-3 text-sm text-gray-600">
                          Approved by: <span className="font-medium">{h.approved_by}</span>
                        </div>
                      )}
                      {h.rejection_reason && (
                        <div className="mt-2 text-sm bg-alert/5 text-alert rounded px-3 py-2">
                          Reason: {h.rejection_reason}
                        </div>
                      )}
                      {h.status === 'Approved' && (
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDownloadPdf(h.request_id); }}
                          className="mt-3 bg-navy hover:bg-navy/80 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer relative z-10 inline-flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Download Transfer Order (PDF)
                        </button>
                      )}
                      {/* Timeline */}
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1 text-teal"><span className="w-2 h-2 bg-teal rounded-full"></span> Filed {h.request_date}</div>
                        <div className="flex-1 h-px bg-light-gray"></div>
                        {h.status !== 'Pending' && (
                          <>
                            <div className={`flex items-center gap-1 ${h.status === 'Approved' ? 'text-success' : 'text-alert'}`}>
                              <span className={`w-2 h-2 rounded-full ${h.status === 'Approved' ? 'bg-success' : 'bg-alert'}`}></span>
                              {h.status} {h.approval_date}
                            </div>
                          </>
                        )}
                        {h.status === 'Pending' && (
                          <div className="flex items-center gap-1 text-gold"><span className="w-2 h-2 bg-gold rounded-full"></span> Under Review</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appeals Tab */}
          {activeTab === 'Appeals' && (
            <div className="space-y-6">
              {/* Reapply Eligibility Status */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Re-Apply Eligibility</h3>
                  <button onClick={refreshAppeals} className="text-xs text-teal hover:underline">Refresh Status</button>
                </div>
                {reapplyEligibility ? (
                  <div className="space-y-3">
                    <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                      reapplyEligibility.eligible
                        ? 'bg-success/5 border-success/20'
                        : 'bg-alert/5 border-alert/20'
                    }`}>
                      <div className={`w-3 h-3 rounded-full ${reapplyEligibility.eligible ? 'bg-success' : 'bg-alert'}`}></div>
                      <div>
                        <p className={`text-sm font-medium ${reapplyEligibility.eligible ? 'text-success' : 'text-alert'}`}>
                          {reapplyEligibility.eligible ? 'Eligible for Re-Application' : 'Not Currently Eligible'}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">{reapplyEligibility.reason}</p>
                      </div>
                    </div>
                    {reapplyEligibility.can_bypass_waiting && (
                      <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
                        <p className="text-sm text-gold font-medium">Emergency Bypass Available</p>
                        <p className="text-xs text-gray-500 mt-0.5">{reapplyEligibility.bypass_reason}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-soft-white rounded-lg p-3 border border-light-gray">
                        <p className="text-lg font-bold text-navy">{reapplyEligibility.transfer_attempt_count}</p>
                        <p className="text-xs text-gray-500">Transfer Attempts</p>
                      </div>
                      <div className="bg-soft-white rounded-lg p-3 border border-light-gray">
                        <p className="text-lg font-bold text-navy">{reapplyEligibility.days_remaining}</p>
                        <p className="text-xs text-gray-500">Days Remaining</p>
                      </div>
                      <div className="bg-soft-white rounded-lg p-3 border border-light-gray">
                        <p className="text-lg font-bold text-navy">{reapplyEligibility.last_transfer_date || 'N/A'}</p>
                        <p className="text-xs text-gray-500">Last Transfer</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-4">Loading eligibility...</p>
                )}
              </div>

              {/* Appeal Submission Form */}
              {reapplyEligibility?.has_rejected_requests && (
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Submit Transfer Appeal</h3>
                  <form onSubmit={handleSubmitAppeal} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Select Rejected Request</label>
                      <select
                        value={appealForm.requestId}
                        onChange={(e) => setAppealForm(p => ({ ...p, requestId: e.target.value }))}
                        className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                        required
                      >
                        <option value="">Select a rejected request...</option>
                        {reapplyEligibility.rejected_requests?.map(r => (
                          <option key={r.request_id} value={r.request_id}>
                            {r.request_id} — {r.current_school} → {r.requested_school} ({r.request_date})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Appeal Type</label>
                      <select
                        value={appealForm.type}
                        onChange={(e) => setAppealForm(p => ({ ...p, type: e.target.value }))}
                        className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                      >
                        {APPEAL_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Appeal Reason</label>
                      <textarea
                        value={appealForm.reason}
                        onChange={(e) => setAppealForm(p => ({ ...p, reason: e.target.value }))}
                        rows={3}
                        placeholder="Explain why your transfer should be reconsidered..."
                        className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                        required
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="emergency"
                        checked={appealForm.isEmergency}
                        onChange={(e) => setAppealForm(p => ({ ...p, isEmergency: e.target.checked }))}
                        className="w-4 h-4 text-teal border-light-gray rounded focus:ring-teal"
                      />
                      <label htmlFor="emergency" className="text-sm text-gray-700">
                        Mark as Emergency (medical/spouse relocation — bypasses waiting period)
                      </label>
                    </div>
                    {appealMsg && (
                      <div className={`text-sm rounded-lg px-4 py-2.5 ${
                        appealMsg.includes('submitted') || appealMsg.includes('success')
                          ? 'bg-success/10 text-success' : 'bg-alert/10 text-alert'
                      }`}>
                        {appealMsg}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading.appeal}
                      className="bg-gold hover:bg-gold/80 text-navy px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loading.appeal ? 'Submitting...' : 'Submit Appeal'}
                    </button>
                  </form>
                </div>
              )}

              {/* Re-Apply Form */}
              {(reapplyEligibility?.eligible || reapplyEligibility?.can_bypass_waiting) && (
                <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Re-Apply for Transfer</h3>
                  {reapplyEligibility?.can_bypass_waiting && (
                    <div className="bg-gold/5 border border-gold/20 rounded-lg p-3 mb-4">
                      <p className="text-xs text-gold">You are applying under emergency bypass: {reapplyEligibility.bypass_reason}</p>
                    </div>
                  )}
                  <form onSubmit={handleReapply} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">School ID</label>
                      <input
                        type="text"
                        value={reapplyForm.school}
                        onChange={(e) => setReapplyForm(p => ({ ...p, school: e.target.value }))}
                        placeholder="Enter school ID (e.g., SCH0001)"
                        className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Transfer Reason</label>
                      <textarea
                        value={reapplyForm.reason}
                        onChange={(e) => setReapplyForm(p => ({ ...p, reason: e.target.value }))}
                        rows={3}
                        placeholder="Describe reason for re-application..."
                        className="w-full border border-light-gray rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal resize-none"
                        required
                      />
                    </div>
                    {reapplyMsg && (
                      <div className={`text-sm rounded-lg px-4 py-2.5 ${
                        reapplyMsg.includes('submitted') || reapplyMsg.includes('success')
                          ? 'bg-success/10 text-success' : 'bg-alert/10 text-alert'
                      }`}>
                        {reapplyMsg}
                      </div>
                    )}
                    <button
                      type="submit"
                      disabled={loading.reapply}
                      className="bg-teal hover:bg-teal-light text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {loading.reapply ? 'Submitting...' : 'Submit Re-Application'}
                    </button>
                  </form>
                </div>
              )}

              {/* Appeals History */}
              <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Appeal History</h3>
                {appeals.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">No appeals submitted yet.</p>
                ) : (
                  <div className="space-y-3">
                    {appeals.map((a) => (
                      <div key={a.appeal_id} className="border border-light-gray rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-mono text-gray-400">{a.appeal_id}</span>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            a.status === 'Approved' ? 'bg-success/10 text-success' :
                            a.status === 'Rejected' ? 'bg-alert/10 text-alert' :
                            'bg-gold/10 text-gold'
                          }`}>
                            {a.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><span className="text-gray-400">Original Request:</span> <span className="font-mono text-xs">{a.original_request_id}</span></div>
                          <div><span className="text-gray-400">Type:</span> <span className="font-medium capitalize">{a.appeal_type?.replace('_', ' ')}</span></div>
                          <div><span className="text-gray-400">Submitted:</span> <span>{a.submitted_date}</span></div>
                          {a.is_emergency ? <div><span className="text-gold font-medium">Emergency</span></div> : null}
                        </div>
                        <p className="text-sm text-gray-600 mt-2 bg-soft-white rounded p-2">{a.appeal_reason}</p>
                        {a.review_notes && (
                          <div className={`mt-2 text-sm rounded px-3 py-2 ${
                            a.status === 'Approved' ? 'bg-success/5 text-success' : 'bg-alert/5 text-alert'
                          }`}>
                            Review Notes: {a.review_notes}
                          </div>
                        )}
                        {a.reviewed_date && (
                          <p className="text-xs text-gray-400 mt-1">Reviewed on {a.reviewed_date} by {a.reviewed_by}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'Notifications' && (
            <div className="bg-white rounded-2xl border border-light-gray shadow-sm p-6">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Notification Center</h3>
              {notifications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No notifications yet.</p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border transition-colors ${
                        n.read ? 'bg-white border-light-gray' : 'bg-teal/5 border-teal/20'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        n.type === 'success' ? 'bg-success' : n.type === 'error' ? 'bg-alert' : 'bg-teal'
                      }`}></div>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{n.created_at}</p>
                      </div>
                      {!n.read && (
                        <button
                          onClick={() => handleMarkRead(n.id)}
                          className="text-xs text-teal hover:underline shrink-0"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
