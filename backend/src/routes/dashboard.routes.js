import { Router } from 'express';

import * as dashboardController from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';

const router = Router();

router.use(authMiddleware);

router.get(
  '/student',
  requireRole('student'),
  dashboardController.getStudentDashboard
);
router.get(
  '/admin/summary',
  requireRole('admin'),
  dashboardController.getAdminSummary
);
router.get(
  '/admin/assignments-analytics',
  requireRole('admin'),
  dashboardController.getAssignmentAnalytics
);
router.get(
  '/admin/groups-analytics',
  requireRole('admin'),
  dashboardController.getGroupAnalytics
);

export default router;
