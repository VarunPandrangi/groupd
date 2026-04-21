import * as assignmentService from '../services/assignment.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function createAssignment(req, res, next) {
  try {
    const assignment = await assignmentService.create(req.user.userId, req.body);
    return successResponse(
      res,
      { assignment },
      'Assignment created successfully',
      201
    );
  } catch (err) {
    return next(err);
  }
}

export async function updateAssignment(req, res, next) {
  try {
    const assignment = await assignmentService.update(req.params.id, req.body);
    return successResponse(
      res,
      { assignment },
      'Assignment updated successfully',
      200
    );
  } catch (err) {
    return next(err);
  }
}

export async function deleteAssignment(req, res, next) {
  try {
    await assignmentService.softDelete(req.params.id);
    return successResponse(res, null, 'Assignment deleted successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAllAssignments(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      const result = await assignmentService.getAll(req.query.page, req.query.limit);

      return res.status(200).json({
        success: true,
        data: result.assignments,
        pagination: result.pagination,
        message: '',
      });
    }

    const assignments = await assignmentService.getForStudent(req.user.userId);
    return successResponse(res, { assignments }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAssignmentDetail(req, res, next) {
  try {
    const assignment = await assignmentService.getDetail(req.params.id, req.user);
    return successResponse(res, { assignment }, '', 200);
  } catch (err) {
    return next(err);
  }
}