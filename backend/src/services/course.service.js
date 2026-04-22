import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { User } from '../models/user.model.js';

// ---------------------------------------------------------------------------
// Error factory — matches group.service.js pattern exactly
// ---------------------------------------------------------------------------

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

// ---------------------------------------------------------------------------
// createCourse
// ---------------------------------------------------------------------------

/**
 * Create a new course owned by the given professor.
 *
 * @param {string} professorId
 * @param {{ name: string, code: string, description?: string }} fields
 */
export async function createCourse(professorId, { name, code, description }) {
  if (await Course.codeExists(code)) {
    throw httpError(409, 'CODE_TAKEN', `Course code '${code}' is already taken.`);
  }

  const course = await Course.create({
    name,
    code,
    description: description ?? null,
    createdBy: professorId,
  });

  return course;
}

// ---------------------------------------------------------------------------
// updateCourse
// ---------------------------------------------------------------------------

/**
 * Update course fields. Only the owning professor may update.
 *
 * @param {string} professorId
 * @param {string} courseId
 * @param {Partial<{ name: string, code: string, description: string }>} fields
 */
export async function updateCourse(professorId, courseId, fields) {
  const course = await Course.findById(courseId).lean();
  if (!course || course.isDeleted) {
    throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  }

  if (!(await Course.isProfessorOwner(courseId, professorId))) {
    throw httpError(403, 'NOT_COURSE_OWNER', 'You do not own this course.');
  }

  // If the caller is changing the code, make sure the new code is available.
  // Allow the professor to "keep" the same code (no-op update on code).
  if (fields.code && fields.code !== course.code) {
    if (await Course.codeExists(fields.code)) {
      throw httpError(
        409,
        'CODE_TAKEN',
        `Course code '${fields.code}' is already taken.`
      );
    }
  }

  const updated = await Course.findByIdAndUpdate(courseId, fields, {
    new: true,
  });

  return updated;
}

// ---------------------------------------------------------------------------
// deleteCourse
// ---------------------------------------------------------------------------

/**
 * Soft-delete a course. Only the owning professor may delete.
 *
 * @param {string} professorId
 * @param {string} courseId
 */
export async function deleteCourse(professorId, courseId) {
  const course = await Course.findById(courseId).lean();
  if (!course || course.isDeleted) {
    throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  }

  if (!(await Course.isProfessorOwner(courseId, professorId))) {
    throw httpError(403, 'NOT_COURSE_OWNER', 'You do not own this course.');
  }

  await Course.findByIdAndUpdate(courseId, { isDeleted: true });
}

// ---------------------------------------------------------------------------
// enrollStudent
// ---------------------------------------------------------------------------

/**
 * Enroll a student into a course.
 *
 * @param {string} professorId
 * @param {string} courseId
 * @param {{ email?: string, studentId?: string }} identifier
 */
export async function enrollStudent(professorId, courseId, { email, studentId }) {
  if (!(await Course.isProfessorOwner(courseId, professorId))) {
    throw httpError(403, 'NOT_COURSE_OWNER', 'You do not own this course.');
  }

  // Resolve the target user by email or studentId — reuse User model statics.
  let target = null;
  if (email) {
    target = await User.findByEmail(email);
  }
  if (!target && studentId) {
    target = await User.findByStudentId(studentId);
  }

  if (!target) {
    throw httpError(404, 'STUDENT_NOT_FOUND', 'No student found with that email/ID.');
  }

  if (target.role !== 'student') {
    throw httpError(
      400,
      'CANNOT_ENROLL_NON_STUDENT',
      'Only users with the student role can be enrolled in a course.'
    );
  }

  if (await Course.isStudentEnrolled(courseId, target._id)) {
    throw httpError(409, 'ALREADY_ENROLLED', 'This student is already enrolled in the course.');
  }

  await Course.findByIdAndUpdate(courseId, {
    $addToSet: { enrolledStudents: target._id },
  });

  return {
    id: target._id.toString(),
    fullName: target.fullName,
    email: target.email,
    studentId: target.studentId ?? null,
  };
}

// ---------------------------------------------------------------------------
// unenrollStudent
// ---------------------------------------------------------------------------

/**
 * Remove a student from a course's enrolled list.
 *
 * @param {string} professorId
 * @param {string} courseId
 * @param {string} studentId  — Mongo ObjectId string of the student
 */
export async function unenrollStudent(professorId, courseId, studentId) {
  if (!(await Course.isProfessorOwner(courseId, professorId))) {
    throw httpError(403, 'NOT_COURSE_OWNER', 'You do not own this course.');
  }

  const updated = await Course.findByIdAndUpdate(
    courseId,
    { $pull: { enrolledStudents: studentId } },
    { new: true }
  );

  // If the student was not in the list, the pull is a no-op and the _id we
  // tried to pull will still be absent — detect by checking the returned doc.
  const stillEnrolled =
    updated &&
    updated.enrolledStudents.some((id) => id.toString() === studentId.toString());

  if (!updated || stillEnrolled) {
    // stillEnrolled true → pull had no effect → student was not enrolled
    // !updated → course disappeared mid-request (race) — treat as 404
    if (!updated) {
      throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
    }
    throw httpError(404, 'STUDENT_NOT_ENROLLED', 'Student is not enrolled in this course.');
  }

  return updated;
}

// ---------------------------------------------------------------------------
// getCourseDetail
// ---------------------------------------------------------------------------

/**
 * Return full course detail including populated students and course assignments.
 * Access rules:
 *   - admin/professor: must own the course
 *   - student: must be enrolled
 *
 * @param {string} userId
 * @param {'admin'|'student'} userRole
 * @param {string} courseId
 */
export async function getCourseDetail(userId, userRole, courseId) {
  const course = await Course.findById(courseId)
    .populate('createdBy', 'fullName email')
    .populate('enrolledStudents', 'fullName email studentId createdAt');

  if (!course || course.isDeleted) {
    throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found.');
  }

  if (userRole === 'admin') {
    if (course.createdBy._id.toString() !== userId.toString()) {
      throw httpError(403, 'NOT_COURSE_OWNER', 'You do not own this course.');
    }
  } else {
    // student path
    const enrolled = await Course.isStudentEnrolled(courseId, userId);
    if (!enrolled) {
      throw httpError(403, 'NOT_ENROLLED', 'You are not enrolled in this course.');
    }
  }

  const assignments = await Assignment.find({
    course: courseId,
    isDeleted: false,
  }).lean();

  return {
    course,
    enrolledStudents: course.enrolledStudents,
    assignments,
  };
}

// ---------------------------------------------------------------------------
// listCoursesForUser
// ---------------------------------------------------------------------------

/**
 * List courses relevant to the calling user.
 *   - admin → courses they own, with student + assignment counts
 *   - student → courses they are enrolled in, with assignment + pending counts
 *
 * @param {string} userId
 * @param {'admin'|'student'} userRole
 */
export async function listCoursesForUser(userId, userRole) {
  if (userRole === 'admin') {
    const courses = await Course.findByProfessor(userId).lean();

    const enriched = await Promise.all(
      courses.map(async (course) => {
        const assignmentCount = await Assignment.countDocuments({
          course: course._id,
          isDeleted: false,
        });

        return {
          ...course,
          studentCount: course.enrolledStudents.length,
          assignmentCount,
        };
      })
    );

    return enriched;
  }

  // student path
  const courses = await Course.findByStudent(userId).lean();

  const enriched = await Promise.all(
    courses.map(async (course) => {
      const [assignmentCount, pendingCount] = await Promise.all([
        Assignment.countDocuments({ course: course._id, isDeleted: false }),
        // "pending" = assignments that are not yet past their due date
        Assignment.countDocuments({
          course: course._id,
          isDeleted: false,
          dueDate: { $gte: new Date() },
        }),
      ]);

      return {
        ...course,
        assignmentCount,
        pendingCount,
      };
    })
  );

  return enriched;
}
