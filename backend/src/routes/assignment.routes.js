import { Router } from 'express';

import * as assignmentController from '../controllers/assignment.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
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
  validateId('id'),
  validate(updateAssignmentSchema),
  assignmentController.updateAssignment
);
router.delete('/:id', requireRole('admin'), validateId('id'), assignmentController.deleteAssignment);

router.get('/', requireRole('student', 'admin'), assignmentController.getAllAssignments);
router.get(
  '/:id',
  requireRole('student', 'admin'),
  validateId('id'),
  assignmentController.getAssignmentDetail
);

export default router;
