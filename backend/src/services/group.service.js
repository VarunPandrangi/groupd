import mongoose from 'mongoose';

import { Group } from '../models/group.model.js';
import { User } from '../models/user.model.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

const GROUP_LEADER_ERROR = 'Only the group leader can perform this action.';

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

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function toMember(user, groupId) {
  return {
    id: user._id.toString(),
    full_name: user.fullName,
    email: user.email,
    student_id: user.studentId ?? null,
    role: user.role,
    group_id: groupId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

function toGroup(group, members = []) {
  return {
    id: group._id.toString(),
    name: group.name,
    description: group.description ?? null,
    created_by: group.createdBy.toString(),
    created_at: group.createdAt,
    updated_at: group.updatedAt,
    members,
  };
}

async function requireExistingUser(userId) {
  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return user;
}

async function findActiveGroupByMember(userId) {
  return Group.findOne({
    members: userId,
    isDeleted: false,
  });
}

async function requireLeaderGroup(leaderId) {
  await requireExistingUser(leaderId);

  const group = await Group.findOne({
    createdBy: leaderId,
    members: leaderId,
    isDeleted: false,
  });

  if (!group) {
    throw httpError(403, 'NOT_GROUP_LEADER', GROUP_LEADER_ERROR);
  }

  return group;
}

async function getGroupWithMembers(groupId) {
  const group = await Group.findOne({
    _id: groupId,
    isDeleted: false,
  }).lean();

  if (!group) {
    return null;
  }

  const members = await User.find({
    _id: { $in: group.members },
    isDeleted: false,
  })
    .sort({ fullName: 1 })
    .lean();

  const sortedMembers = members.sort((a, b) => {
    if (a._id.toString() === group.createdBy.toString()) {
      return -1;
    }
    if (b._id.toString() === group.createdBy.toString()) {
      return 1;
    }

    return a.fullName.localeCompare(b.fullName);
  });

  return toGroup(
    group,
    sortedMembers.map((member) => toMember(member, group._id.toString()))
  );
}

async function findStudentByIdentifier({ email, student_id }) {
  if (email) {
    const byEmail = await User.findByEmail(email.toLowerCase());
    if (byEmail) {
      return byEmail;
    }
  }

  if (student_id) {
    const byStudentId = await User.findByStudentId(student_id);
    if (byStudentId) {
      return byStudentId;
    }
  }

  return null;
}

export async function createGroup(userId, { name, description }) {
  await requireExistingUser(userId);

  if (await findActiveGroupByMember(userId)) {
    throw httpError(400, 'ALREADY_IN_GROUP', 'You are already in a group.');
  }

  const existingByName = await Group.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    isDeleted: false,
  }).lean();

  if (existingByName) {
    throw httpError(
      409,
      'GROUP_NAME_EXISTS',
      'A group with this name already exists.'
    );
  }

  try {
    const group = await Group.create({
      name,
      description: description ?? null,
      createdBy: userId,
      members: [userId],
    });

    return getGroupWithMembers(group._id);
  } catch (err) {
    if (err?.code === 11000) {
      throw httpError(
        409,
        'GROUP_NAME_EXISTS',
        'A group with this name already exists.'
      );
    }

    throw err;
  }
}

export async function addMember(leaderId, { email, student_id }) {
  const group = await requireLeaderGroup(leaderId);

  const targetUser = await findStudentByIdentifier({ email, student_id });
  if (!targetUser) {
    throw httpError(404, 'STUDENT_NOT_FOUND', 'No student found with that email/ID.');
  }

  if (targetUser._id.toString() === leaderId.toString()) {
    throw httpError(400, 'ALREADY_IN_GROUP', 'You are already in this group');
  }

  if (targetUser.role === 'admin') {
    throw httpError(
      400,
      'ADMIN_NOT_ALLOWED',
      'Cannot add admin users to student groups.'
    );
  }

  if (await findActiveGroupByMember(targetUser._id)) {
    throw httpError(400, 'ALREADY_IN_GROUP', 'This student is already in a group.');
  }

  if (group.members.length >= 6) {
    throw httpError(
      400,
      'GROUP_FULL',
      'Group is full. Maximum 6 members allowed.'
    );
  }

  await Group.updateOne(
    { _id: group._id, isDeleted: false },
    { $addToSet: { members: targetUser._id } }
  );

  return getGroupWithMembers(group._id);
}

export async function removeMember(leaderId, targetUserId) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw httpError(404, 'MEMBER_NOT_FOUND', 'Member not found in your group.');
  }

  const group = await requireLeaderGroup(leaderId);

  if (leaderId.toString() === targetUserId.toString()) {
    throw httpError(
      400,
      'SELF_REMOVAL_NOT_ALLOWED',
      'You cannot remove yourself. Delete the group instead.'
    );
  }

  const targetMemberId = new mongoose.Types.ObjectId(targetUserId);
  const isMember = group.members.some(
    (memberId) => memberId.toString() === targetMemberId.toString()
  );

  if (!isMember) {
    throw httpError(404, 'MEMBER_NOT_FOUND', 'Member not found in your group.');
  }

  await Group.updateOne(
    { _id: group._id, isDeleted: false },
    { $pull: { members: targetMemberId } }
  );

  return getGroupWithMembers(group._id);
}

export async function leaveGroup(userId) {
  await requireExistingUser(userId);

  const group = await findActiveGroupByMember(userId);
  if (!group) {
    throw httpError(400, 'NO_GROUP', 'You are not in a group.');
  }

  if (group.createdBy.toString() === userId.toString()) {
    throw httpError(
      400,
      'LEADER_CANNOT_LEAVE',
      'You cannot leave the group as the leader. Delete the group instead.'
    );
  }

  await Group.updateOne(
    { _id: group._id, isDeleted: false },
    { $pull: { members: userId } }
  );

  return null;
}

export async function deleteGroup(leaderId) {
  const group = await requireLeaderGroup(leaderId);

  await Group.updateOne(
    { _id: group._id, isDeleted: false },
    {
      $set: {
        isDeleted: true,
        members: [],
      },
    }
  );

  return toGroup({
    ...group.toObject(),
    isDeleted: true,
    members: [],
  });
}

export async function getMyGroup(userId) {
  await requireExistingUser(userId);

  const group = await findActiveGroupByMember(userId);
  if (!group) {
    return null;
  }

  return getGroupWithMembers(group._id);
}

export async function getAllGroups(page, limit) {
  const currentPage = parsePositiveInteger(page, 1, 'Page');
  const pageSize = parsePositiveInteger(limit, 20, 'Limit');
  const skip = (currentPage - 1) * pageSize;

  const [groups, total] = await Promise.all([
    Group.find({ isDeleted: false })
      .sort({ createdAt: -1, name: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Group.countDocuments({ isDeleted: false }),
  ]);

  return {
    groups: groups.map((group) => ({
      id: group._id.toString(),
      name: group.name,
      description: group.description ?? null,
      created_by: group.createdBy.toString(),
      created_at: group.createdAt,
      updated_at: group.updatedAt,
      member_count: group.members.length,
    })),
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getGroupDetail(groupId) {
  const group = await getGroupWithMembers(groupId);
  if (!group) {
    throw httpError(404, 'GROUP_NOT_FOUND', 'Group not found');
  }

  return group;
}
