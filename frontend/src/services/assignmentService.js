import api from './api';

function normalizeAssignmentPayload(input = {}) {
  const payload = {
    title: String(input.title ?? '').trim(),
    due_date: input.due_date,
    onedrive_link: String(input.onedrive_link ?? '').trim(),
  };

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description) {
    payload.description = description;
  }

  const courseId = input.course ?? input.course_id ?? null;
  if (courseId) {
    payload.course_id = courseId;
  }

  const submissionType = input.submissionType ?? input.submission_type ?? 'group';
  payload.submission_type = submissionType;

  const normalizedAssignTo = input.assignTo ?? input.assign_to ?? 'all';
  const isSpecificGroups =
    normalizedAssignTo === 'groups' || normalizedAssignTo === 'specific';

  if (submissionType === 'group' && isSpecificGroups) {
    const groupTargets = Array.isArray(input.groupTargets)
      ? input.groupTargets
      : Array.isArray(input.group_ids)
        ? input.group_ids
        : [];

    if (groupTargets.length > 0) {
      payload.assign_to = 'specific';
      payload.group_ids = groupTargets;
      return payload;
    }
  }

  payload.assign_to = 'all';
  return payload;
}

function buildCamelCasePayload(input = {}) {
  const payload = {
    title: String(input.title ?? '').trim(),
    due_date: input.due_date,
    onedrive_link: String(input.onedrive_link ?? '').trim(),
  };

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description) {
    payload.description = description;
  }

  const course = input.course ?? input.course_id ?? null;
  if (course) {
    payload.course = course;
  }

  const submissionType = input.submissionType ?? input.submission_type ?? 'group';
  payload.submissionType = submissionType;

  const normalizedAssignTo = input.assignTo ?? input.assign_to ?? 'all';
  const isSpecificGroups =
    normalizedAssignTo === 'groups' || normalizedAssignTo === 'specific';
  if (submissionType === 'group' && isSpecificGroups) {
    const groupTargets = Array.isArray(input.groupTargets)
      ? input.groupTargets
      : Array.isArray(input.group_ids)
        ? input.group_ids
        : [];

    if (groupTargets.length > 0) {
      payload.assignTo = 'groups';
      payload.groupTargets = groupTargets;
      return payload;
    }
  }

  payload.assignTo = 'all';
  return payload;
}

function shouldRetryWithFallback(error) {
  const status = error?.response?.status ?? 0;
  const code = error?.response?.data?.error?.code;
  return status >= 500 || code === 'VALIDATION_ERROR' || code === 'INTERNAL_ERROR';
}

async function postWithPayloadFallback(url, payload) {
  const primary = buildCamelCasePayload(payload);
  const fallback = normalizeAssignmentPayload(payload);

  try {
    const { data } = await api.post(url, primary);
    return data;
  } catch (error) {
    const shouldRetry = shouldRetryWithFallback(error);
    if (!shouldRetry) {
      throw error;
    }

    const { data } = await api.post(url, fallback);
    return data;
  }
}

async function putWithPayloadFallback(url, payload) {
  const primary = buildCamelCasePayload(payload);
  const fallback = normalizeAssignmentPayload(payload);

  try {
    const { data } = await api.put(url, primary);
    return data;
  } catch (error) {
    const shouldRetry = shouldRetryWithFallback(error);
    if (!shouldRetry) {
      throw error;
    }

    const { data } = await api.put(url, fallback);
    return data;
  }
}

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
  const data = await postWithPayloadFallback('/assignments', payload);
  return data.data.assignment;
}

export async function updateAssignment(id, payload) {
  const data = await putWithPayloadFallback(`/assignments/${id}`, payload);
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
