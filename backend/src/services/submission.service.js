import { findById as findUserById } from '../models/user.model.js';
import { findById as findAssignment } from '../models/assignment.model.js';
import {
  create as createSubmission,
  findByAssignmentAndStudent,
  getByAssignment,
  getByStudent,
  getGroupProgress as getGroupProgressModel,
} from '../models/submission.model.js';
import { pool } from '../config/database.js';

/**
 * Build an Error tagged with HTTP status code and error code
 * so the global error handler can format it.
 */
const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

/**
 * Confirm a submission for a student.
 *
 * Business rules (plan.md §3.3 rules 4–6, §5.1 FR-SUBMIT, §14 Submissions):
 *   1. Student must have a group_id (400)
 *   2. Assignment must exist and not be soft-deleted (404)
 *   3. Assignment must be assigned to the student's group:
 *      - assign_to = 'all' → always OK
 *      - assign_to = 'specific' → check junction table (403)
 *   4. Student must not have already submitted (409)
 *   5. Late submissions are allowed (§3.3 rule 9)
 *   6. Submission is irreversible (§3.3 rule 6) — no delete endpoint exists
 */
export async function confirmSubmission(userId, assignmentId) {
  // 1. Get user and verify they have a group
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (!user.group_id) {
    throw httpError(
      400,
      'NO_GROUP',
      'You must be in a group before confirming a submission'
    );
  }

  // 2. Get assignment and verify it exists / not deleted
  const assignment = await findAssignment(assignmentId);
  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  // 3. Check the assignment is assigned to the student's group
  if (assignment.assign_to === 'specific') {
    const { rows } = await pool.query(
      `SELECT 1 FROM assignment_groups
       WHERE assignment_id = $1 AND group_id = $2`,
      [assignmentId, user.group_id]
    );
    if (rows.length === 0) {
      throw httpError(
        403,
        'NOT_ASSIGNED',
        'This assignment is not assigned to your group'
      );
    }
  }

  // 4. Duplicate check
  const existing = await findByAssignmentAndStudent(assignmentId, userId);
  if (existing) {
    throw httpError(
      409,
      'ALREADY_SUBMITTED',
      'You have already confirmed submission for this assignment'
    );
  }

  // 5. Insert submission
  const submission = await createSubmission({
    assignment_id: assignmentId,
    student_id: userId,
    group_id: user.group_id,
  });

  return submission;
}

/**
 * Get all submissions for the current student.
 */
export async function getMySubmissions(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return getByStudent(userId);
}

/**
 * Get all submissions for an assignment (admin view) with student details.
 */
export async function getSubmissionsByAssignment(assignmentId) {
  const assignment = await findAssignment(assignmentId);
  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return getByAssignment(assignmentId);
}

/**
 * Get the current student's group progress across all assignments.
 */
export async function getGroupProgress(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  if (!user.group_id) {
    throw httpError(
      400,
      'NO_GROUP',
      'You must be in a group to view group progress'
    );
  }

  return getGroupProgressModel(user.group_id);
}
