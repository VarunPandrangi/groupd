import { pool } from '../config/database.js';
import {
  findByEmail,
  findById as findUserById,
  findByStudentId,
} from '../models/user.model.js';
import {
  assignUserToGroupIfUnassigned,
  countGroupMembers,
  createGroup as insertGroup,
  deleteGroup as removeGroup,
  findById as findGroupById,
  getAllGroups as listGroups,
  getGroupMembers,
  nameExists,
  releaseAllGroupMembers,
  removeUserFromGroup,
} from '../models/group.model.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

const GROUP_LEADER_ERROR = 'Only the group leader can perform this action.';

function sanitizeUserRecord(record) {
  if (!record) {
    return null;
  }

  const { password_hash: _ignored, ...user } = record;
  return user;
}

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

async function requireExistingUser(userId, db = pool) {
  const user = await findUserById(userId, db);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
}

async function getGroupWithMembers(groupId, db = pool) {
  const group = await findGroupById(groupId, db);
  if (!group) {
    return null;
  }

  const members = await getGroupMembers(groupId, db);
  return { ...group, members };
}

async function requireLeaderGroup(leaderId, db = pool) {
  const leader = await requireExistingUser(leaderId, db);

  if (!leader.group_id) {
    throw httpError(403, 'NOT_GROUP_LEADER', GROUP_LEADER_ERROR);
  }

  const group = await findGroupById(leader.group_id, db);
  if (!group || group.created_by !== leaderId) {
    throw httpError(403, 'NOT_GROUP_LEADER', GROUP_LEADER_ERROR);
  }

  return { leader, group };
}

async function findStudentByIdentifier({ email, student_id }, db = pool) {
  if (email) {
    const emailMatch = await findByEmail(email, db);
    if (emailMatch) {
      return sanitizeUserRecord(emailMatch);
    }
  }

  if (student_id) {
    return findByStudentId(student_id, db);
  }

  return null;
}

export async function createGroup(userId, { name, description }) {
  const user = await requireExistingUser(userId);

  if (user.group_id) {
    throw httpError(400, 'ALREADY_IN_GROUP', 'You are already in a group.');
  }

  if (await nameExists(name)) {
    throw httpError(
      409,
      'GROUP_NAME_EXISTS',
      'A group with this name already exists.'
    );
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const group = await insertGroup(
      {
        name,
        description,
        created_by: userId,
      },
      client
    );

    const updatedUser = await assignUserToGroupIfUnassigned(
      userId,
      group.id,
      client
    );

    if (!updatedUser) {
      throw httpError(400, 'ALREADY_IN_GROUP', 'You are already in a group.');
    }

    await client.query('COMMIT');
    return getGroupWithMembers(group.id);
  } catch (err) {
    await rollbackQuietly(client);

    if (err?.code === '23505') {
      throw httpError(
        409,
        'GROUP_NAME_EXISTS',
        'A group with this name already exists.'
      );
    }

    throw err;
  } finally {
    client.release();
  }
}

export async function addMember(leaderId, { email, student_id }) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { group } = await requireLeaderGroup(leaderId, client);
    const targetUser = await findStudentByIdentifier(
      { email, student_id },
      client
    );

    if (!targetUser) {
      throw httpError(
        404,
        'STUDENT_NOT_FOUND',
        'No student found with that email/ID.'
      );
    }

    if (targetUser.role === 'admin') {
      throw httpError(
        400,
        'ADMIN_NOT_ALLOWED',
        'Cannot add admin users to student groups.'
      );
    }

    if (targetUser.group_id) {
      throw httpError(
        400,
        'ALREADY_IN_GROUP',
        'This student is already in a group.'
      );
    }

    const memberCount = await countGroupMembers(group.id, client);
    if (memberCount >= 6) {
      throw httpError(
        400,
        'GROUP_FULL',
        'Group is full. Maximum 6 members allowed.'
      );
    }

    const updatedUser = await assignUserToGroupIfUnassigned(
      targetUser.id,
      group.id,
      client
    );

    if (!updatedUser) {
      throw httpError(
        400,
        'ALREADY_IN_GROUP',
        'This student is already in a group.'
      );
    }

    await client.query('COMMIT');
    return getGroupWithMembers(group.id);
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function removeMember(leaderId, targetUserId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { group } = await requireLeaderGroup(leaderId, client);

    if (leaderId === targetUserId) {
      throw httpError(
        400,
        'SELF_REMOVAL_NOT_ALLOWED',
        'You cannot remove yourself. Delete the group instead.'
      );
    }

    const targetUser = await findUserById(targetUserId, client);
    if (!targetUser || targetUser.group_id !== group.id) {
      throw httpError(
        404,
        'MEMBER_NOT_FOUND',
        'Member not found in your group.'
      );
    }

    const updatedUser = await removeUserFromGroup(
      targetUserId,
      group.id,
      client
    );
    if (!updatedUser) {
      throw httpError(
        404,
        'MEMBER_NOT_FOUND',
        'Member not found in your group.'
      );
    }

    await client.query('COMMIT');
    return getGroupWithMembers(group.id);
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function leaveGroup(userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const user = await requireExistingUser(userId, client);

    if (!user.group_id) {
      throw httpError(400, 'NO_GROUP', 'You are not in a group.');
    }

    const group = await findGroupById(user.group_id, client);
    if (group?.created_by === userId) {
      throw httpError(
        400,
        'LEADER_CANNOT_LEAVE',
        'You cannot leave the group as the leader. Delete the group instead.'
      );
    }

    const updatedUser = await removeUserFromGroup(
      userId,
      user.group_id,
      client
    );
    if (!updatedUser) {
      throw httpError(400, 'NO_GROUP', 'You are not in a group.');
    }

    const remainingMembers = await countGroupMembers(user.group_id, client);
    if (remainingMembers === 0) {
      await removeGroup(user.group_id, client);
    }

    await client.query('COMMIT');
    return null;
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteGroup(leaderId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const { group } = await requireLeaderGroup(leaderId, client);

    await releaseAllGroupMembers(group.id, client);

    const deletedGroup = await removeGroup(group.id, client);
    if (!deletedGroup) {
      throw httpError(404, 'GROUP_NOT_FOUND', 'Group not found');
    }

    await client.query('COMMIT');
    return deletedGroup;
  } catch (err) {
    await rollbackQuietly(client);
    throw err;
  } finally {
    client.release();
  }
}

export async function getMyGroup(userId) {
  const user = await requireExistingUser(userId);

  if (!user.group_id) {
    return null;
  }

  return getGroupWithMembers(user.group_id);
}

export async function getAllGroups(page, limit) {
  const currentPage = parsePositiveInteger(page, 1, 'Page');
  const pageSize = parsePositiveInteger(limit, 20, 'Limit');

  return listGroups(currentPage, pageSize);
}

export async function getGroupDetail(groupId) {
  const group = await getGroupWithMembers(groupId);
  if (!group) {
    throw httpError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }
  return group;
}
