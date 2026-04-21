import { verifyAccessToken } from '../utils/jwt.js';
import { errorResponse } from '../utils/apiResponse.js';

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) {
    return errorResponse(res, 'Authentication required', 'UNAUTHORIZED', 401);
  }

  try {
    const payload = verifyAccessToken(token);

    req.user = {
      ...payload,
      _id: payload.userId,
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    return next();
  } catch (err) {
    return next(err);
  }
}