import { z } from 'zod';

import * as submissionService from '../services/submission.service.js';
import { successResponse } from '../utils/apiResponse.js';

const assignmentIdParamSchema = z.object({
  assignmentId: z.string().uuid('Invalid assignment ID'),
});

export async function confirmSubmission(req, res, next) {
  try {
    const submission = await submissionService.confirmSubmission(
      req.user.userId,
      req.body.assignment_id
    );
    return successResponse(
      res,
      { submission },
      'Submission confirmed successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

export async function getMySubmissions(req, res, next) {
  try {
    const submissions = await submissionService.getMySubmissions(
      req.user.userId
    );
    return successResponse(res, { submissions }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getSubmissionsByAssignment(req, res, next) {
  try {
    const { assignmentId } = assignmentIdParamSchema.parse(req.params);
    const submissions = await submissionService.getSubmissionsByAssignment(
      assignmentId
    );
    return successResponse(res, { submissions }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getGroupProgress(req, res, next) {
  try {
    const progress = await submissionService.getGroupProgress(
      req.user.userId
    );
    return successResponse(res, { progress }, '', 200);
  } catch (err) {
    return next(err);
  }
}
