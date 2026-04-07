import jwt from 'jsonwebtoken';

import { env } from '../config/env.js';

const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const SUBMISSION_CONFIRMATION_TTL = '5m';

export function generateAccessToken({ userId, email, role }) {
  return jwt.sign({ userId, email, role }, env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });
}

export function generateRefreshToken({ userId, email, role }) {
  return jwt.sign({ userId, email, role }, env.JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_TTL,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, env.JWT_REFRESH_SECRET);
}

export function generateSubmissionConfirmationToken({ userId, groupId, assignmentId }) {
  return jwt.sign(
    {
      action: 'submission_confirmation',
      userId,
      groupId,
      assignmentId,
    },
    env.JWT_SECRET,
    {
      expiresIn: SUBMISSION_CONFIRMATION_TTL,
    }
  );
}

export function verifySubmissionConfirmationToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}
