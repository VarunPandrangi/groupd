import api from './api';

export async function getAssignments(params = {}) {
  const { data } = await api.get('/assignments', { params });

  if (Array.isArray(data.data)) {
    return {
      assignments: data.data,
      pagination: data.pagination ?? null,
    };
  }

  return {
    assignments: data.data.assignments ?? [],
    pagination: data.pagination ?? null,
  };
}

export async function getAssignment(id) {
  const { data } = await api.get(`/assignments/${id}`);
  return data.data.assignment;
}

export async function getAllAssignmentsForAdmin(limit = 100) {
  const assignments = [];
  let page = 1;
  let totalPages = 1;

  do {
    const response = await getAssignments({ page, limit });
    assignments.push(...response.assignments);
    totalPages = response.pagination?.totalPages ?? 1;
    page += 1;
  } while (page <= totalPages);

  return assignments;
}

export async function createAssignment(payload) {
  const { data } = await api.post('/assignments', payload);
  return data.data.assignment;
}

export async function updateAssignment(id, payload) {
  const { data } = await api.put(`/assignments/${id}`, payload);
  return data.data.assignment;
}

export async function deleteAssignment(id) {
  await api.delete(`/assignments/${id}`);
  return null;
}

const assignmentService = {
  getAssignments,
  getAssignment,
  getAllAssignmentsForAdmin,
  createAssignment,
  updateAssignment,
  deleteAssignment,
};

export default assignmentService;
