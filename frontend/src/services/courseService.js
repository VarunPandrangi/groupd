import api from './api';

/**
 * Create a new course (admin only).
 * @param {{ name: string, code: string, description?: string }} payload
 */
export async function createCourse(payload) {
  const { data } = await api.post('/courses', payload);
  return data.data;
}

/**
 * Update an existing course (admin only).
 * @param {string} id - course _id
 * @param {{ name?: string, code?: string, description?: string }} fields
 */
export async function updateCourse(id, fields) {
  const { data } = await api.put(`/courses/${id}`, fields);
  return data.data;
}

/**
 * Soft-delete a course (admin only).
 * @param {string} id - course _id
 */
export async function deleteCourse(id) {
  const { data } = await api.delete(`/courses/${id}`);
  return data.data;
}

/**
 * List courses for the authenticated user.
 * Admin → owned courses; student → enrolled courses.
 */
export async function listCourses() {
  const { data } = await api.get('/courses');
  return data.data;
}

/**
 * Get a single course with enrolled students and assignments.
 * @param {string} id - course _id
 */
export async function getCourse(id) {
  const { data } = await api.get(`/courses/${id}`);
  return data.data;
}

/**
 * Enroll a student in a course by email or studentId (admin only).
 * @param {string} courseId - course _id
 * @param {{ email?: string, studentId?: string }} identifier
 */
export async function enrollStudent(courseId, identifier) {
  const { data } = await api.post(`/courses/${courseId}/enrollments`, identifier);
  return data.data;
}

/**
 * Unenroll a student from a course (admin only).
 * @param {string} courseId - course _id
 * @param {string} studentId - student user _id
 */
export async function unenrollStudent(courseId, studentId) {
  const { data } = await api.delete(`/courses/${courseId}/enrollments/${studentId}`);
  return data.data;
}

/**
 * List all enrolled students in a course (admin only).
 * @param {string} courseId - course _id
 */
export async function listEnrolledStudents(courseId) {
  const { data } = await api.get(`/courses/${courseId}/students`);
  return data.data;
}

const courseService = {
  createCourse,
  updateCourse,
  deleteCourse,
  listCourses,
  getCourse,
  enrollStudent,
  unenrollStudent,
  listEnrolledStudents,
};

export default courseService;
