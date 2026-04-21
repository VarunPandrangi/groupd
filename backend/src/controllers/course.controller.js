import * as courseService from '../services/course.service.js';
import { successResponse } from '../utils/apiResponse.js';

export async function createCourse(req, res, next) {
  try {
    const course = await courseService.createCourse(req.user.userId, req.body);
    return successResponse(res, { course }, 'Course created successfully', 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const course = await courseService.updateCourse(req.user.userId, req.params.id, req.body);
    return successResponse(res, { course }, 'Course updated successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    await courseService.deleteCourse(req.user.userId, req.params.id);
    return successResponse(res, null, 'Course deleted successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function getCourse(req, res, next) {
  try {
    const result = await courseService.getCourseDetail(
      req.user.userId,
      req.user.role,
      req.params.id
    );
    return successResponse(res, result, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function listCourses(req, res, next) {
  try {
    const courses = await courseService.listCoursesForUser(req.user.userId, req.user.role);
    return successResponse(res, { courses }, '', 200);
  } catch (err) {
    return next(err);
  }
}

export async function enrollStudent(req, res, next) {
  try {
    const student = await courseService.enrollStudent(
      req.user.userId,
      req.params.id,
      req.body
    );
    return successResponse(res, { student }, 'Student enrolled successfully', 201);
  } catch (err) {
    return next(err);
  }
}

export async function unenrollStudent(req, res, next) {
  try {
    await courseService.unenrollStudent(
      req.user.userId,
      req.params.id,
      req.params.studentId
    );
    return successResponse(res, null, 'Student unenrolled successfully', 200);
  } catch (err) {
    return next(err);
  }
}

export async function listEnrolledStudents(req, res, next) {
  try {
    const result = await courseService.getCourseDetail(
      req.user.userId,
      req.user.role,
      req.params.id
    );
    return successResponse(res, { students: result.enrolledStudents }, '', 200);
  } catch (err) {
    return next(err);
  }
}
