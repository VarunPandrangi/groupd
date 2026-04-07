import { Router } from 'express';

import * as submissionController from '../controllers/submission.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import {
  confirmSubmissionSchema,
  prepareSubmissionSchema,
} from '../validators/submission.validator.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/prepare',
  requireRole('student'),
  validate(prepareSubmissionSchema),
  submissionController.prepareSubmissionConfirmation
);

router.post(
  '/',
  requireRole('student'),
  validate(confirmSubmissionSchema),
  submissionController.confirmSubmission
);

router.get(
  '/my-group-submissions',
  requireRole('student'),
  submissionController.getMyGroupSubmissions
);

router.get(
  '/group-progress',
  requireRole('student'),
  submissionController.getGroupProgress
);

router.get(
  '/assignment/:assignmentId/groups-student-status',
  requireRole('admin'),
  validateId('assignmentId'),
  submissionController.getAssignmentGroupStudentStatus
);

router.get(
  '/assignment/:assignmentId',
  requireRole('admin'),
  validateId('assignmentId'),
  submissionController.getSubmissionsByAssignment
);

export default router;
