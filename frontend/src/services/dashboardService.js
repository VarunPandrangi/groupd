import api from './api';

export async function getStudentDashboard() {
  const { data } = await api.get('/dashboard/student');
  return data.data.dashboard;
}

export async function getAdminSummary() {
  const { data } = await api.get('/dashboard/admin/summary');
  return data.data.summary;
}

export async function getAssignmentAnalytics() {
  const { data } = await api.get('/dashboard/admin/assignments-analytics');
  return data.data.assignments ?? [];
}

export async function getGroupAnalytics() {
  const { data } = await api.get('/dashboard/admin/groups-analytics');
  return data.data.groups ?? [];
}

const dashboardService = {
  getStudentDashboard,
  getAdminSummary,
  getAssignmentAnalytics,
  getGroupAnalytics,
};

export default dashboardService;
