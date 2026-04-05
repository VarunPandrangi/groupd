import { Router } from 'express';

import * as assignmentController from '../controllers/assignment.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import {
  createAssignmentSchema,
  updateAssignmentSchema,
} from '../validators/assignment.validator.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRole('admin'),
  validate(createAssignmentSchema),
  assignmentController.createAssignment
);
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment
);
router.delete('/:id', requireRole('admin'), assignmentController.deleteAssignment);

router.get('/', requireRole('student', 'admin'), assignmentController.getAllAssignments);
router.get(
  '/:id',
  requireRole('student', 'admin'),
  assignmentController.getAssignmentDetail
);

export default router;
