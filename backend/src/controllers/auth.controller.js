import * as authService from '../services/auth.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function register(req, res, next) {
  try {
    const result = await authService.register(req.body);
    return successResponse(res, result, 'Registration successful', 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const result = await authService.login(req.body);
    return successResponse(res, result, 'Login successful', 200);
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return successResponse(res, result, 'Token refreshed', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getMe(req.user.userId);
    return successResponse(res, { user }, '', 200);
  } catch (err) {
    return next(err);
  }
}
