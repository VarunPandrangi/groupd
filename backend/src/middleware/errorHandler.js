import { ZodError } from 'zod';
import jwt from 'jsonwebtoken';

import { errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

/**
 * Global error handler. Must be mounted LAST in the middleware chain.
 * - ZodError         -> 400 VALIDATION_ERROR with per-field details
 * - TokenExpiredError -> 401 TOKEN_EXPIRED
 * - JsonWebTokenError -> 401 INVALID_TOKEN
 * - Service errors with { statusCode, code } -> use those
 * - Everything else  -> 500 INTERNAL_ERROR with a generic message
 *
 * Never exposes stack traces to clients. Always logs via Winston.
 */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  // Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    logger.warn(`Validation failed on ${req.method} ${req.originalUrl}`);
    return errorResponse(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      details
    );
  }

  // JWT errors
  if (err instanceof TokenExpiredError) {
    return errorResponse(res, 'Token expired', 'TOKEN_EXPIRED', 401);
  }
  if (err instanceof JsonWebTokenError) {
    return errorResponse(res, 'Invalid token', 'INVALID_TOKEN', 401);
  }

  // Service-thrown errors carrying an explicit statusCode + code
  if (err && typeof err.statusCode === 'number' && err.code) {
    if (err.statusCode >= 500) {
      logger.error(err.stack || err.message);
    } else {
      logger.warn(`${err.code}: ${err.message}`);
    }
    return errorResponse(res, err.message, err.code, err.statusCode);
  }

  // Unknown error
  logger.error(err?.stack || err?.message || 'Unknown error');
  return errorResponse(
    res,
    'Internal server error',
    'INTERNAL_ERROR',
    500
  );
}
