import api from './api';

export async function confirmSubmission(assignmentId) {
  const { data } = await api.post('/submissions', { assignment_id: assignmentId });
  return data.data.submission;
}

export async function getMySubmissions() {
  const { data } = await api.get('/submissions/my-group-submissions');
  return data.data.submissions ?? data.data ?? [];
}

export async function getGroupProgress() {
  const { data } = await api.get('/submissions/group-progress');
  return data.data?.progress ?? data.data ?? [];
}

export async function getSubmissionsByAssignment(assignmentId) {
  const { data } = await api.get(`/submissions/assignment/${assignmentId}`);
  return data.data.submissions ?? [];
}

export async function getAssignmentGroupStudentStatus(assignmentId) {
  const { data } = await api.get(
    `/submissions/assignment/${assignmentId}/groups-student-status`
  );

  return data.data.tracker ?? {
    assignment: null,
    summary: {
      submitted_groups: 0,
      total_groups: 0,
      pending_groups: 0,
    },
    groups: [],
  };
}

const submissionService = {
  confirmSubmission,
  getMySubmissions,
  getGroupProgress,
  getSubmissionsByAssignment,
  getAssignmentGroupStudentStatus,
};

export default submissionService;
