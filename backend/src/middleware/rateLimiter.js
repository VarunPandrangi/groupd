import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const limitedResponse = (message, code) => ({
  success: false,
  error: {
    code,
    message,
    details: null,
  },
});

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 */
export const generalLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: process.env.NODE_ENV === 'development' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedResponse(
    'Too many requests. Please try again later.',
    'RATE_LIMIT_EXCEEDED'
  ),
});

/**
 * Stricter auth rate limiter: 20 requests per 15 minutes per IP.
 * Protects login, register, and refresh endpoints from brute force.
 */
export const authLimiter = rateLimit({
  windowMs: FIFTEEN_MINUTES,
  max: process.env.NODE_ENV === 'development' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: limitedResponse(
    'Too many authentication attempts. Please try again later.',
    'AUTH_RATE_LIMIT_EXCEEDED'
  ),
});
