import { Group } from '../models/group.model.js';
import { User } from '../models/user.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

async function findActiveGroupIdForUser(userId) {
  const group = await Group.findOne({
    members: userId,
    isDeleted: false,
  })
    .select('_id')
    .lean();

  return group?._id?.toString() ?? null;
}

async function toSafeUser(user) {
  const groupId = await findActiveGroupIdForUser(user._id);

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

function issueTokens(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

export async function register({ full_name, email, student_id, password }) {
  const normalizedEmail = email.toLowerCase();

  if (await User.findByEmail(normalizedEmail)) {
    throw httpError(409, 'EMAIL_EXISTS', 'This email is already registered');
  }

  if (await User.findByStudentId(student_id)) {
    throw httpError(
      409,
      'STUDENT_ID_EXISTS',
      'This student ID is already registered'
    );
  }

  const user = await User.create({
    fullName: full_name,
    email: normalizedEmail,
    studentId: student_id,
    password,
    role: 'student',
  });

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: await toSafeUser(user),
    ...tokens,
  };
}

export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase();
  const user = await User.findByEmail(normalizedEmail);

  if (!user) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const tokens = issueTokens(user);
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: await toSafeUser(user),
    ...tokens,
  };
}

export async function refreshToken(token) {
  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    throw err;
  }

  const user = await User.findOne({
    _id: payload.userId,
    refreshToken: token,
    isDeleted: false,
  });

  if (!user) {
    throw httpError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  return {
    accessToken: generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    }),
  };
}

export async function logout(userId) {
  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  user.refreshToken = null;
  await user.save();

  return null;
}

export async function getMe(userId) {
  const user = await User.findOne({
    _id: userId,
    isDeleted: false,
  });

  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return toSafeUser(user);
}