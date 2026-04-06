import { pool } from '../config/database.js';
import { findById as findUserById } from '../models/user.model.js';
import {
  addGroups,
  create as createAssignmentRecord,
  findById,
  findGroupsByIds,
  findVisibleForStudent,
  getAll as getAllAssignments,
  getAssignmentGroups,
  getAssignmentSubmissions,
  getForStudent as getStudentAssignments,
  getUnassignedStudentAssignments,
  getGroupsForAssignments,
  softDelete as softDeleteAssignment,
  update as updateAssignmentRecord,
  removeGroups,
} from '../models/assignment.model.js';

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

async function rollbackQuietly(client) {
  try {
    await client.query('ROLLBACK');
  } catch {
    // Ignore rollback failures and preserve the original error.
  }
}

function parsePositiveInteger(value, fallback, fieldName) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw httpError(
      400,
      'INVALID_PAGINATION',
      `${fieldName} must be a positive integer`
    );
  }

  return parsed;
}

function computeStatus(dueDate) {
  const dueAt = new Date(dueDate).getTime();
  const now = Date.now();

  if (dueAt <= now) {
    return 'overdue';
  }

  if (dueAt <= now + THREE_DAYS_IN_MS) {
    return 'active';
  }

  return 'upcoming';
}

function buildSubmissionStatus(confirmedAt, submittedByName = null) {
  return {
    is_submitted: Boolean(confirmedAt),
    confirmed_at: confirmedAt ?? null,
    submitted_by_name: submittedByName ?? null,
  };
}

async function requireUser(userId, db = pool) {
  const user = await findUserById(userId, db);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
}

function normalizeGroupIds(groupIds = []) {
  return [...new Set(groupIds)];
}

async function validateGroupIdsExist(groupIds, db = pool) {
  const normalizedGroupIds = normalizeGroupIds(groupIds);
  const groups = await findGroupsByIds(normalizedGroupIds, db);

  if (groups.length !== normalizedGroupIds.length) {
    throw httpError(
      400,
      'INVALID_GROUP_SELECTION',
      'One or more selected groups do not exist.'
    );
  }

  return { normalizedGroupIds, groups };
}

async function buildAssignmentsWithGroups(assignments, db = pool) {
  if (!assignments.length) {
    return [];
  }

  const groupedRows = await getGroupsForAssignments(
    assignments.map((assignment) => assignment.id),
    db
  );

  const groupsByAssignmentId = groupedRows.reduce((acc, row) => {
    if (!acc.has(row.assignment_id)) {
      acc.set(row.assignment_id, []);
    }

    acc.get(row.assignment_id).push({
      id: row.id,
      name: row.name,
      description: row.description,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
    });

    return acc;
  }, new Map());

  return assignments.map((assignment) => ({
    ...assignment,
    groups: groupsByAssignmentId.get(assignment.id) ?? [],
  }));
}

async function buildAssignmentResponse(assignment, db = pool) {
  const groups =
    assignment.assign_to === 'specific'
      ? await getAssignmentGroups(assignment.id, db)
      : [];

  return {
    ...assignment,
    status: computeStatus(assignment.due_date),
    groups,
  };
}

export async function create(userId, payload) {
  await requireUser(userId);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let groups = [];
    let normalizedGroupIds = [];

    if (payload.assign_to === 'specific') {
      ({ normalizedGroupIds, groups } = await validateGroupIdsExist(
        payload.group_ids ?? [],
        client
      ));
    }

    const assignment = await createAssignmentRecord(
      {
        ...payload,
        created_by: userId,
      },
      client
    );

    if (payload.assign_to === 'specific') {
      await addGroups(assignment.id, normalizedGroupIds, client);
    }

    await client.query('COMMIT');

    return {
      ...assignment,
      status: computeStatus(assignment.due_date),
      groups,
    };
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function update(id, payload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existingAssignment = await findById(id, client);
    if (!existingAssignment) {
      throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    }

    const nextAssignTo = payload.assign_to ?? existingAssignment.assign_to;

    if (payload.group_ids !== undefined && nextAssignTo !== 'specific') {
      throw httpError(
        400,
        'INVALID_GROUP_SELECTION',
        'group_ids can only be updated when assign_to is specific.'
      );
    }

    const updatedAssignment = await updateAssignmentRecord(
      id,
      {
        title: payload.title,
        description: payload.description,
        due_date: payload.due_date,
        onedrive_link: payload.onedrive_link,
        assign_to: payload.assign_to,
      },
      client
    );

    if (!updatedAssignment) {
      throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    }

    if (nextAssignTo === 'all') {
      await removeGroups(id, client);
      await client.query('COMMIT');
      return buildAssignmentResponse(updatedAssignment, client);
    }

    if (payload.assign_to === 'specific' || payload.group_ids !== undefined) {
      const { normalizedGroupIds, groups } = await validateGroupIdsExist(
        payload.group_ids ?? [],
        client
      );

      await removeGroups(id, client);
      await addGroups(id, normalizedGroupIds, client);

      await client.query('COMMIT');
      return {
        ...updatedAssignment,
        status: computeStatus(updatedAssignment.due_date),
        groups,
      };
    }

    await client.query('COMMIT');
    return buildAssignmentResponse(updatedAssignment, client);
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function softDelete(id) {
  const assignment = await findById(id);
  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  const deletedAssignment = await softDeleteAssignment(id);
  if (!deletedAssignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return deletedAssignment;
}

export async function getAll(page, limit) {
  const currentPage = parsePositiveInteger(page, 1, 'Page');
  const pageSize = parsePositiveInteger(limit, 20, 'Limit');

  const result = await getAllAssignments(currentPage, pageSize);
  const hydratedAssignments = await buildAssignmentsWithGroups(
    result.assignments
  );

  return {
    assignments: hydratedAssignments.map((assignment) => ({
      ...assignment,
      status: computeStatus(assignment.due_date),
    })),
    pagination: result.pagination,
  };
}

export async function getForStudent(userId) {
  const user = await requireUser(userId);

  let assignments;
  if (!user.group_id) {
    assignments = await getUnassignedStudentAssignments(userId);
  } else {
    assignments = await getStudentAssignments(userId);
  }

  return assignments.map((assignment) => ({
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    due_date: assignment.due_date,
    onedrive_link: assignment.onedrive_link,
    assign_to: assignment.assign_to,
    is_deleted: assignment.is_deleted,
    created_by: assignment.created_by,
    created_at: assignment.created_at,
    updated_at: assignment.updated_at,
    status: computeStatus(assignment.due_date),
    submission_status: buildSubmissionStatus(
      assignment.group_confirmed_at,
      assignment.submitted_by_name
    ),
  }));
}

export async function getDetail(id, user) {
  const currentUser = await requireUser(user.userId);

  if (user.role === 'admin') {
    const assignment = await findById(id);
    if (!assignment) {
      throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
    }

    const [groups, submissions] = await Promise.all([
      getAssignmentGroups(id),
      getAssignmentSubmissions(id),
    ]);

    return {
      ...assignment,
      status: computeStatus(assignment.due_date),
      groups,
      submissions,
    };
  }

  const assignment = await findVisibleForStudent(id, user.userId);
  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  const groups =
    assignment.assign_to === 'specific' ? await getAssignmentGroups(id) : [];

  if (assignment.assign_to === 'specific') {
    const isAssignedToUserGroup = groups.some(
      (group) => group.id === currentUser.group_id
    );
    if (!isAssignedToUserGroup) {
      throw httpError(
        403,
        'NOT_ASSIGNED',
        'This assignment is not assigned to your group'
      );
    }
  } else if (!currentUser.group_id && assignment.assign_to !== 'all') {
    throw httpError(
      403,
      'NOT_ASSIGNED',
      'This assignment is not assigned to your group'
    );
  }

  return {
    id: assignment.id,
    title: assignment.title,
    description: assignment.description,
    due_date: assignment.due_date,
    onedrive_link: assignment.onedrive_link,
    assign_to: assignment.assign_to,
    is_deleted: assignment.is_deleted,
    created_by: assignment.created_by,
    created_at: assignment.created_at,
    updated_at: assignment.updated_at,
    status: computeStatus(assignment.due_date),
    groups,
    submission_status: buildSubmissionStatus(
      assignment.group_confirmed_at,
      assignment.submitted_by_name
    ),
  };
}
