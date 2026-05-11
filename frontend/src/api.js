import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: API_BASE });

export const login = (data) => api.post('/login', data);
export const getTeacherProfile = (id) => api.get(`/teacher/${id}`);
export const predictTransfer = (teacher_id) => api.post('/predict_transfer', { teacher_id });
export const recommendSchool = (teacher_id) => api.post('/recommend_school', { teacher_id });
export const applyTransfer = (data) => api.post('/apply_transfer', data);
export const getTransferHistory = (id) => api.get(`/transfer_history/${id}`);
export const getNotifications = (id) => api.get(`/notifications/${id}`);
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const getMeoDashboard = (id) => api.get(`/meo/${id}/dashboard`);
export const getMeoSchools = (id) => api.get(`/meo/${id}/schools`);
export const approveTransfer = (data) => api.post('/approve_transfer', data);
export const rejectTransfer = (data) => api.post('/reject_transfer', data);
export const getDashboardStats = () => api.get('/dashboard_stats');
export const getWorkforceStats = () => api.get('/workforce_stats');
export const getSchools = (mandal) => api.get('/schools', { params: mandal ? { mandal } : {} });
export const downloadPdf = (request_id) => api.get(`/download_transfer_pdf/${request_id}`, { responseType: 'blob' });
export const getTestCredentials = () => api.get('/test_credentials');

// Appeal / Re-Apply APIs
export const checkReapplyEligibility = (id) => api.get(`/check_reapply_eligibility/${id}`);
export const submitAppeal = (data) => api.post('/submit_appeal', data);
export const reapplyTransfer = (data) => api.post('/reapply_transfer', data);
export const getTeacherAppeals = (id) => api.get(`/appeals/${id}`);
export const getMeoAppeals = (id) => api.get(`/meo/${id}/appeals`);
export const reviewAppeal = (data) => api.post('/review_appeal', data);

export default api;
