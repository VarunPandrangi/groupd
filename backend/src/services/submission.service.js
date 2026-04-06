import { pool } from '../config/database.js';
import { findById as findAssignment } from '../models/assignment.model.js';
import {
  create as createSubmission,
  findByAssignmentAndGroup,
  getAssignmentGroupTrackerRows,
  getByAssignment,
  getByGroup,
  getGroupProgress as getGroupProgressModel,
  getStudentMembersByGroupIds,
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
    const submission = await createSubmission({
      assignment_id: assignmentId,
      group_id: user.group_id,
      submitted_by: userId,
    });

    if (!submission) {
      throw httpError(400, 'NO_GROUP', 'You must be in a group to submit');
    }

    return submission;
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

export async function getAssignmentGroupStudentStatus(assignmentId) {
  const assignment = await requireAssignment(assignmentId);
  const trackerRows = await getAssignmentGroupTrackerRows(assignmentId);

  const activeGroupIds = [
    ...new Set(
      trackerRows
        .filter((row) => !row.group_deleted && row.group_id)
        .map((row) => row.group_id)
    ),
  ];

  const memberRows = await getStudentMembersByGroupIds(activeGroupIds);
  const membersByGroupId = memberRows.reduce((map, member) => {
    const list = map.get(member.group_id) ?? [];

    list.push({
      id: member.id,
      full_name: member.full_name,
      email: member.email,
      student_id: member.student_id,
    });

    map.set(member.group_id, list);
    return map;
  }, new Map());

  const groups = trackerRows.map((row) => {
    const members = row.group_deleted
      ? []
      : membersByGroupId.get(row.group_id) ?? [];

    return {
      row_id: row.group_deleted
        ? `deleted:${row.submission_id}`
        : `group:${row.group_id}`,
      group_id: row.group_id,
      group_name: row.group_name,
      group_deleted: Boolean(row.group_deleted),
      group_note: row.group_deleted ? row.group_note : null,
      is_submitted: Boolean(row.is_submitted),
      submitted_by_name: row.submitted_by_name ?? null,
      submitted_by_email: row.submitted_by_email ?? null,
      confirmed_at: row.confirmed_at ?? null,
      member_count: members.length,
      members,
    };
  });

  const submittedGroups = groups.filter((group) => group.is_submitted).length;
  const totalGroups = groups.length;

  return {
    assignment: {
      id: assignment.id,
      title: assignment.title,
      assign_to: assignment.assign_to,
      due_date: assignment.due_date,
    },
    summary: {
      submitted_groups: submittedGroups,
      total_groups: totalGroups,
      pending_groups: Math.max(totalGroups - submittedGroups, 0),
    },
    groups,
  };
}
