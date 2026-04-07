import * as submissionService from '../services/submission.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function prepareSubmissionConfirmation(req, res, next) {
  try {
    const confirmation = await submissionService.prepareSubmissionConfirmation(
      req.user.userId,
      req.body.assignment_id
    );

    return successResponse(
      res,
      { confirmation },
      'Submission confirmation step prepared',
      200
    );
  } catch (err) {
    return next(err);
  }
}

export async function confirmSubmission(req, res, next) {
  try {
    const submission = await submissionService.confirmSubmission(
      req.user.userId,
      req.body.assignment_id,
      req.body.confirmation_token
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

export async function getMyGroupSubmissions(req, res, next) {
  try {
    const submissions = await submissionService.getMyGroupSubmissions(
      req.user.userId
    );

    return successResponse(res, { submissions }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getGroupProgress(req, res, next) {
  try {
    const progress = await submissionService.getGroupProgress(req.user.userId);

    return successResponse(res, { progress }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getSubmissionsByAssignment(req, res, next) {
  try {
    const submissions = await submissionService.getSubmissionsByAssignment(
      req.params.assignmentId
    );

    return successResponse(res, { submissions }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAssignmentGroupStudentStatus(req, res, next) {
  try {
    const tracker = await submissionService.getAssignmentGroupStudentStatus(
      req.params.assignmentId
    );

    return successResponse(res, { tracker }, '', 200);
  } catch (err) {
    return next(err);
  }
}
