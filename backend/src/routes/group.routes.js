import { Router } from 'express';

import * as groupController from '../controllers/group.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireRole } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validate.js';
import {
  addMemberSchema,
  createGroupSchema,
} from '../validators/group.validator.js';

const router = Router();

router.use(authMiddleware);

router.post(
  '/',
  requireRole('student'),
  validate(createGroupSchema),
  groupController.createGroup
);
router.get('/my-group', requireRole('student'), groupController.getMyGroup);
router.post(
  '/members',
  requireRole('student'),
  validate(addMemberSchema),
  groupController.addMember
);
router.delete(
  '/members/:userId',
  requireRole('student'),
  groupController.removeMember
);
router.post('/leave', requireRole('student'), groupController.leaveGroup);
router.delete('/', requireRole('student'), groupController.deleteGroup);

router.get('/', requireRole('admin'), groupController.getAllGroups);
router.get('/:groupId', requireRole('admin'), groupController.getGroupDetail);

export default router;
