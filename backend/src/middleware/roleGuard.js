import { errorResponse } from '../utils/apiResponse.js';

/**
 * Role-based access control middleware factory.
 * Must be mounted AFTER authMiddleware so that req.user is populated.
 *   requireRole('admin')                 -> admin only
 *   requireRole('student', 'admin')      -> either role
 */
export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }
  if (!roles.includes(req.user.role)) {
    return errorResponse(res, 'Forbidden', 'FORBIDDEN', 403);
  }
  return next();
};
