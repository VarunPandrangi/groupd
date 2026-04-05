/**
 * Standardized API response helpers.
 * Response format defined in plan.md Section 9.1.
 */

export function successResponse(res, data = null, message = '', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
  });
}

export function errorResponse(res, message, code, statusCode = 500, details = null) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
}
