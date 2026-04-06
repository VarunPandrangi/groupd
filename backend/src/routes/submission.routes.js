import { Router } from 'express';

import * as submissionController from '../controllers/submission.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import { confirmSubmissionSchema } from '../validators/submission.validator.js';

const router = Router();

// All submission routes require authentication
router.use(authMiddleware);

// POST /  — Confirm submission (student only)
router.post(
  '/',
  requireRole('student'),
  validate(confirmSubmissionSchema),
  submissionController.confirmSubmission
);

// GET /my-submissions — Get current student's submissions
router.get(
  '/my-submissions',
  requireRole('student'),
  submissionController.getMySubmissions
);

// GET /group-progress — Get student's group progress across assignments
router.get(
  '/group-progress',
  requireRole('student'),
  submissionController.getGroupProgress
);

// GET /assignment/:assignmentId — Get all submissions for an assignment (admin only)
router.get(
  '/assignment/:assignmentId',
  requireRole('admin'),
  submissionController.getSubmissionsByAssignment
);

export default router;
