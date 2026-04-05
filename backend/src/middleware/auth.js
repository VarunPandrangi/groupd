import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/apiResponse.js';

/**
 * JWT authentication middleware.
 * Expects the Authorization header in the form "Bearer <token>".
 * On success, attaches req.user = { userId, email, role } from the JWT payload.
 * On failure, responds with 401 (missing header) or forwards JWT errors
 * to the global error handler, which converts them into 401 responses.
 */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return errorResponse(
      res,
      'Authentication required',
      'UNAUTHORIZED',
      401
    );
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return errorResponse(
      res,
      'Authentication required',
      'UNAUTHORIZED',
      401
    );
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
    return next();
  } catch (err) {
    return next(err);
  }
}
