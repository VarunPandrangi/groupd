import { pool } from '../config/database.js';
import { findById as findAssignment } from '../models/assignment.model.js';
import {
  create as createSubmission,
  findByAssignmentAndGroup,
  getByAssignment,
  getByGroup,
  getGroupProgress as getGroupProgressModel,
} from '../models/submission.model.js';
import { findById as findUserById } from '../models/user.model.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

async function requireUser(userId) {
  const user = await findUserById(userId);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return user;
}

async function requireAssignment(assignmentId) {
  const assignment = await findAssignment(assignmentId);
  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return assignment;
}

async function isAssignmentAssignedToGroup(assignmentId, groupId) {
  const { rowCount } = await pool.query(
    `SELECT 1
     FROM assignment_groups
     WHERE assignment_id = $1
       AND group_id = $2`,
    [assignmentId, groupId]
  );

  return rowCount > 0;
}

export async function confirmSubmission(userId, assignmentId) {
  const user = await requireUser(userId);

  if (!user.group_id) {
    throw httpError(400, 'NO_GROUP', 'You must be in a group to submit');
  }

  const assignment = await requireAssignment(assignmentId);

  if (
    assignment.assign_to === 'specific' &&
    !(await isAssignmentAssignedToGroup(assignmentId, user.group_id))
  ) {
    throw httpError(
      403,
      'NOT_ASSIGNED',
      'This assignment is not assigned to your group'
    );
  }

  const existingSubmission = await findByAssignmentAndGroup(
    assignmentId,
    user.group_id
  );
  if (existingSubmission) {
    throw httpError(
      409,
      'ALREADY_SUBMITTED',
      'Your group has already submitted this assignment'
    );
  }

  try {
    return await createSubmission({
      assignment_id: assignmentId,
      group_id: user.group_id,
      submitted_by: userId,
    });
  } catch (err) {
    if (err?.code === '23505') {
      throw httpError(
        409,
        'ALREADY_SUBMITTED',
        'Your group has already submitted this assignment'
      );
    }

    throw err;
  }
}

export async function getMyGroupSubmissions(userId) {
  const user = await requireUser(userId);

  if (!user.group_id) {
    throw httpError(
      400,
      'NO_GROUP',
      'You must be in a group to view submissions'
    );
  }

  return getByGroup(user.group_id);
}

export async function getGroupProgress(userId) {
  const user = await requireUser(userId);

  if (!user.group_id) {
    return [];
  }

  return getGroupProgressModel(user.group_id);
}

export async function getSubmissionsByAssignment(assignmentId) {
  await requireAssignment(assignmentId);
  return getByAssignment(assignmentId);
}
