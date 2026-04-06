import * as dashboardService from '../services/dashboard.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function getStudentDashboard(req, res, next) {
  try {
    const dashboard = await dashboardService.getStudentDashboard(req.user.userId);
    return successResponse(res, { dashboard }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAdminSummary(req, res, next) {
  try {
    const summary = await dashboardService.getAdminSummary();
    return successResponse(res, { summary }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAssignmentAnalytics(req, res, next) {
  try {
    const assignments = await dashboardService.getAssignmentAnalytics();
    return successResponse(res, { assignments }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getGroupAnalytics(req, res, next) {
  try {
    const groups = await dashboardService.getGroupAnalytics();
    return successResponse(res, { groups }, '', 200);
  } catch (err) {
    return next(err);
  }
}
