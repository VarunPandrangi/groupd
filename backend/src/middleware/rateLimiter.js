import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;
const DEFAULT_GENERAL_LIMIT =
  process.env.NODE_ENV === 'development' ? 100000 : 50000;
const DEFAULT_AUTH_LIMIT =
  process.env.NODE_ENV === 'development' ? 5000 : 500;

const limitedResponse = (message, code) => ({
  success: false,
  error: {
    code,
    message,
    details: null,
  },
});

function parsePositiveIntegerEnv(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return parsed;
}

const rateLimitWindowMs = parsePositiveIntegerEnv(
  process.env.RATE_LIMIT_WINDOW_MS,
  FIFTEEN_MINUTES
);
const generalRateLimitMax = parsePositiveIntegerEnv(
  process.env.GENERAL_RATE_LIMIT_MAX,
  DEFAULT_GENERAL_LIMIT
);
const authRateLimitMax = parsePositiveIntegerEnv(
  process.env.AUTH_RATE_LIMIT_MAX,
  DEFAULT_AUTH_LIMIT
);

/**
 * Global rate limiter: high ceiling for normal app navigation and testing.
 */
export const generalLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: generalRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedResponse(
    'Too many requests. Please try again later.',
    'RATE_LIMIT_EXCEEDED'
  ),
});

/**
 * Stricter auth rate limiter: still protective, but high enough for testing
 * and shared-campus/public-network traffic.
 * Protects login, register, and refresh endpoints from brute force.
 */
export const authLimiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedResponse(
    'Too many authentication attempts. Please try again later.',
    'AUTH_RATE_LIMIT_EXCEEDED'
  ),
});
