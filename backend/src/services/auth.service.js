import {
  createUser,
  emailExists,
  findByEmail,
  findById,
  studentIdExists,
} from '../models/user.model.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.js';

/**
 * Build an Error object tagged with an HTTP status code and error code
 * so the global error handler can format it as a standardized response.
 */
const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

/**
 * Issue both access and refresh tokens for a given user row.
 */
function issueTokens(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
  };
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
}

/**
 * Register a new student account.
 * Admins are NOT creatable via this endpoint (plan.md Rule 10) — role is
 * hardcoded to 'student' regardless of any input.
 */
export async function register({ full_name, email, student_id, password }) {
  if (await emailExists(email)) {
    throw httpError(409, 'EMAIL_EXISTS', 'This email is already registered');
  }
  if (await studentIdExists(student_id)) {
    throw httpError(
      409,
      'STUDENT_ID_EXISTS',
      'This student ID is already registered'
    );
  }

  const password_hash = await hashPassword(password);
  const user = await createUser({
    full_name,
    email,
    student_id,
    password_hash,
    role: 'student',
  });

  const tokens = issueTokens(user);
  return { user, ...tokens };
}

/**
 * Authenticate a user by email + password.
 * Uses a single generic error message for both "email not found" and
 * "wrong password" to avoid user enumeration.
 */
export async function login({ email, password }) {
  const record = await findByEmail(email);
  if (!record) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  const ok = await comparePassword(password, record.password_hash);
  if (!ok) {
    throw httpError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
  }

  // Strip the hash before returning.
  const { password_hash: _ignored, ...user } = record;
  const tokens = issueTokens(user);
  return { user, ...tokens };
}

/**
 * Exchange a valid refresh token for a new access token.
 * Re-reads the user from the DB so role changes (e.g. future promotions)
 * are reflected immediately rather than trusting stale token claims.
 */
export async function refreshToken(token) {
  let payload;
  try {
    payload = verifyRefreshToken(token);
  } catch (err) {
    // Let the error handler map JwtError/TokenExpiredError -> 401.
    throw err;
  }

  const user = await findById(payload.userId);
  if (!user) {
    throw httpError(401, 'INVALID_TOKEN', 'Invalid refresh token');
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  return { accessToken };
}

/**
 * Return the authenticated user's profile.
 */
export async function getMe(userId) {
  const user = await findById(userId);
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }
  return user;
}
