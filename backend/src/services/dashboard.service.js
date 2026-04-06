import * as dashboardModel from '../models/dashboard.model.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

function toNumber(value, fallback = 0) {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return numericValue;
}

function roundPercentage(value) {
  return Number(toNumber(value).toFixed(2));
}

function formatStudentDashboard(dashboard) {
  if (!dashboard.group) {
    return {
      group: null,
      totalAssignments: null,
      submittedCount: null,
      pendingCount: null,
      upcomingDeadlines: [],
    };
  }

  return {
    group: {
      ...dashboard.group,
      members: Array.isArray(dashboard.group.members)
        ? dashboard.group.members
        : [],
    },
    totalAssignments: toNumber(dashboard.totalAssignments, 0),
    submittedCount: toNumber(dashboard.submittedCount, 0),
    pendingCount: toNumber(dashboard.pendingCount, 0),
    upcomingDeadlines: dashboard.upcomingDeadlines ?? [],
  };
}

export async function getStudentDashboard(userId) {
  const dashboard = await dashboardModel.getStudentDashboard(userId);

  if (!dashboard) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return formatStudentDashboard(dashboard);
}

export async function getAdminSummary() {
  const summary = await dashboardModel.getAdminSummary();

  return {
    totalStudents: toNumber(summary.total_students, 0),
    totalGroups: toNumber(summary.total_groups, 0),
    totalAssignments: toNumber(summary.total_assignments, 0),
    overallCompletionRate: roundPercentage(summary.overall_completion_rate),
  };
}

export async function getAssignmentAnalytics() {
  const rows = await dashboardModel.getAssignmentAnalytics();

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    due_date: row.due_date,
    status: row.status,
    groups_submitted: toNumber(row.groups_submitted, 0),
    groups_assigned: toNumber(row.groups_assigned, 0),
    completion_rate: roundPercentage(row.completion_rate),
  }));
}

export async function getGroupAnalytics() {
  const rows = await dashboardModel.getGroupAnalytics();

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    group_deleted: Boolean(row.group_deleted),
    member_count: toNumber(row.member_count, 0),
    total_assignments: toNumber(row.total_assignments, 0),
    submitted_assignments: toNumber(row.submitted_assignments, 0),
    completion_rate: roundPercentage(row.completion_rate),
  }));
}
