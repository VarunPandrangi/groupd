import { Router } from 'express';

import * as courseController from '../controllers/course.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import { validateId } from '../middleware/validateId.js';
import {
  createCourseSchema,
  enrollStudentSchema,
  updateCourseSchema,
} from '../validators/course.validator.js';

const router = Router();

// All course routes require authentication.
router.use(authMiddleware);

// ── Collection routes ──────────────────────────────────────────────────────

router.post(
  '/',
  requireRole('admin'),
  validate(createCourseSchema),
  courseController.createCourse
);

router.get('/', courseController.listCourses);

// ── Document routes ────────────────────────────────────────────────────────

router.put(
  '/:id',
  requireRole('admin'),
  validateId('id'),
  validate(updateCourseSchema),
  courseController.updateCourse
);

router.delete(
  '/:id',
  requireRole('admin'),
  validateId('id'),
  courseController.deleteCourse
);

router.get('/:id', validateId('id'), courseController.getCourse);

// ── Enrollment sub-resource ────────────────────────────────────────────────

router.post(
  '/:id/enrollments',
  requireRole('admin'),
  validateId('id'),
  validate(enrollStudentSchema),
  courseController.enrollStudent
);

router.delete(
  '/:id/enrollments/:studentId',
  requireRole('admin'),
  validateId('id', 'studentId'),
  courseController.unenrollStudent
);

router.get(
  '/:id/students',
  requireRole('admin'),
  validateId('id'),
  courseController.listEnrolledStudents
);

export default router;
