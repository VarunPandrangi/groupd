import mongoose from 'mongoose';

import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Group } from '../models/group.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';

const THREE_DAYS_IN_MS = 3 * 24 * 60 * 60 * 1000;
const UNKNOWN_GROUP_NAME = 'Unknown Group';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

function parsePositiveInteger(value, fallback, fieldName) {
  if (value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw httpError(
      400,
      'INVALID_PAGINATION',
      `${fieldName} must be a positive integer`
    );
  }

  return parsed;
}

function computeStatus(dueDate) {
  const dueAt = new Date(dueDate).getTime();
  const now = Date.now();

  if (dueAt <= now) {
    return 'overdue';
  }

  if (dueAt <= now + THREE_DAYS_IN_MS) {
    return 'active';
  }

  return 'upcoming';
}

function buildSubmissionStatus(confirmedAt, submittedByName = null) {
  return {
    is_submitted: Boolean(confirmedAt),
    confirmed_at: confirmedAt ?? null,
    submitted_by_name: submittedByName ?? null,
  };
}

function toGroupSummary(group) {
  return {
    id: group._id.toString(),
    name: group.name,
    description: group.description ?? null,
    created_by: group.createdBy.toString(),
    created_at: group.createdAt,
    updated_at: group.updatedAt,
  };
}

function mapAssignment(assign) {
  // course may be a populated object or a raw ObjectId
  const courseObj = assign.course && typeof assign.course === 'object' && assign.course._id
    ? assign.course
    : null;

  return {
    id: assign._id.toString(),
    title: assign.title,
    description: assign.description,
    due_date: assign.dueDate,
    onedrive_link: assign.onedriveLink,
    assign_to: assign.assignTo === 'all' ? 'all' : 'specific',
    submission_type: assign.submissionType,
    course_id: courseObj
      ? courseObj._id.toString()
      : assign.course?.toString?.() ?? null,
    course_name: courseObj?.name ?? null,
    course_code: courseObj?.code ?? null,
    is_deleted: assign.isDeleted,
    created_by:
      assign.createdBy?.toString?.() ?? assign.createdBy?._id?.toString?.() ?? null,
    created_at: assign.createdAt,
    updated_at: assign.updatedAt,
  };
}

async function requireUser(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return user;
}

async function findActiveGroupForUser(userId) {
  return Group.findOne({
    members: userId,
    isDeleted: false,
  });
}

function normalizeGroupIds(groupIds = []) {
  const seen = new Set();

  return groupIds.filter((id) => {
    const normalized = id.toString();
    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

async function validateGroupIdsExist(groupIds = []) {
  const normalizedGroupIds = normalizeGroupIds(groupIds);

  if (!normalizedGroupIds.length) {
    throw httpError(
      400,
      'INVALID_GROUP_SELECTION',
      'One or more selected groups do not exist.'
    );
  }

  const groups = await Group.find({
    _id: { $in: normalizedGroupIds },
    isDeleted: false,
  })
    .sort({ name: 1 })
    .lean();

  if (groups.length !== normalizedGroupIds.length) {
    throw httpError(
      400,
      'INVALID_GROUP_SELECTION',
      'One or more selected groups do not exist.'
    );
  }

  return {
    normalizedGroupIds,
    groups,
  };
}

async function getOrCreateLegacyCourse(userId) {
  let course = await Course.findOne({
    code: 'LEGACY-001',
    isDeleted: false,
  });

  if (course) {
    return course;
  }

  course = await Course.create({
    name: 'Legacy Course',
    code: 'LEGACY-001',
    description: 'Auto-created for existing assignments',
    createdBy: userId,
  });

  return course;
}

async function resolveCourse(userId, payload, existingAssignment = null) {
  if (payload.course_id) {
    const course = await Course.findOne({
      _id: payload.course_id,
      isDeleted: false,
    });

    if (!course) {
      throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found');
    }

    return course;
  }

  if (existingAssignment?.course) {
    const existingCourse = await Course.findOne({
      _id: existingAssignment.course,
      isDeleted: false,
    });

    if (existingCourse) {
      return existingCourse;
    }
  }

  return getOrCreateLegacyCourse(userId);
}

async function assertGroupsFullyEnrolledInCourse(groups, courseId) {
  if (!Array.isArray(groups) || groups.length === 0) {
    return;
  }

  const course = await Course.findOne({
    _id: courseId,
    isDeleted: false,
  })
    .select('enrolledStudents')
    .lean();

  if (!course) {
    throw httpError(404, 'COURSE_NOT_FOUND', 'Course not found');
  }

  const enrolledStudentIdSet = new Set(
    (course.enrolledStudents ?? []).map((studentId) => studentId.toString())
  );

  const invalidGroups = [...groups]
    .sort((left, right) => left.name.localeCompare(right.name))
    .map((group) => {
      const memberIds = (group.members ?? []).map((memberId) => memberId.toString());
      const missingMemberIds = memberIds.filter(
        (memberId) => !enrolledStudentIdSet.has(memberId)
      );

      return {
        name: group.name,
        missingMemberIds,
      };
    })
    .filter((entry) => entry.missingMemberIds.length > 0);

  if (invalidGroups.length === 0) {
    return;
  }

  const allMissingMemberIds = [
    ...new Set(invalidGroups.flatMap((entry) => entry.missingMemberIds)),
  ];
  const missingUsers = await User.find({
    _id: { $in: allMissingMemberIds },
    isDeleted: false,
  })
    .select('fullName')
    .sort({ fullName: 1 })
    .lean();

  const missingNameById = new Map(
    missingUsers.map((user) => [user._id.toString(), user.fullName])
  );

  const sampleGroupMessages = invalidGroups.slice(0, 3).map((entry) => {
    const missingNames = entry.missingMemberIds
      .map((memberId) => missingNameById.get(memberId))
      .filter(Boolean);
    missingNames.sort((left, right) => left.localeCompare(right));

    if (missingNames.length === 0) {
      return `${entry.name} (${entry.missingMemberIds.length} unenrolled member${entry.missingMemberIds.length === 1 ? '' : 's'})`;
    }

    const sampleNames = missingNames.slice(0, 2).join(', ');
    const remaining = missingNames.length - 2;
    const suffix = remaining > 0 ? ` +${remaining} more` : '';
    return `${entry.name} (${sampleNames}${suffix})`;
  });

  throw httpError(
    400,
    'GROUP_MEMBERS_NOT_ENROLLED',
    `Selected group targets include students not enrolled in this course: ${sampleGroupMessages.join('; ')}.`
  );
}

async function ensureStudentEnrolledInAssignmentCourse(userId, assignment) {
  const enrolled = await Course.isStudentEnrolled(assignment.course, userId);
  if (!enrolled) {
    throw httpError(403, 'NOT_ENROLLED', 'You are not enrolled in this course');
  }
}

async function getAssignmentGroups(assignment) {
  if (assignment.assignTo === 'all') {
    return [];
  }

  const groups = await Group.find({
    _id: { $in: assignment.groupTargets },
    isDeleted: false,
  })
    .sort({ name: 1 })
    .lean();

  return groups.map(toGroupSummary);
}

async function getSubmissionForAssignment(assignment, user, userGroup) {
  if (assignment.submissionType === 'individual') {
    const submission = await Submission.findOne({
      assignment: assignment._id,
      submittedBy: user._id,
      group: null,
    })
      .populate('submittedBy', 'fullName')
      .lean();

    if (!submission) {
      return buildSubmissionStatus(null, null);
    }

    return buildSubmissionStatus(
      submission.confirmedAt,
      submission.submittedBy?.fullName ?? null
    );
  }

  if (!userGroup) {
    return buildSubmissionStatus(null, null);
  }

  const submission = await Submission.findOne({
    assignment: assignment._id,
    group: userGroup._id,
  })
    .populate('submittedBy', 'fullName')
    .lean();

  if (!submission) {
    return buildSubmissionStatus(null, null);
  }

  return buildSubmissionStatus(
    submission.confirmedAt,
    submission.submittedBy?.fullName ?? null
  );
}

async function mapAssignmentWithDetails(assignment) {
  const groups = await getAssignmentGroups(assignment);

  return {
    ...mapAssignment(assignment),
    status: computeStatus(assignment.dueDate),
    groups,
  };
}

function ensureGroupTargetVisibility(assignment, userGroup) {
  if (assignment.assignTo !== 'group') {
    return;
  }

  if (!userGroup) {
    throw httpError(
      403,
      'NOT_ASSIGNED',
      'This assignment is not assigned to your group'
    );
  }

  const targetGroupIds = assignment.groupTargets.map((id) => id.toString());
  if (!targetGroupIds.includes(userGroup._id.toString())) {
    throw httpError(
      403,
      'NOT_ASSIGNED',
      'This assignment is not assigned to your group'
    );
  }
}

async function mapAssignmentSubmissions(assignmentId) {
  const submissions = await Submission.find({ assignment: assignmentId })
    .populate('submittedBy', 'fullName email studentId')
    .populate('group', 'name isDeleted')
    .lean();

  return submissions
    .map((submission) => {
      const groupDeleted =
        !submission.group || Boolean(submission.group?.isDeleted);
      const groupName =
        submission.group?.name || submission.groupNameSnapshot || UNKNOWN_GROUP_NAME;

      return {
        id: submission._id.toString(),
        assignment_id: submission.assignment.toString(),
        submitted_by:
          submission.submittedBy?._id?.toString?.() ??
          submission.submittedBy?.toString?.() ??
          null,
        group_id: groupDeleted
          ? null
          : submission.group?._id?.toString?.() ?? null,
        group_name: groupName,
        group_deleted: groupDeleted,
        confirmed_at: submission.confirmedAt ?? null,
        submitted_by_name: submission.submittedBy?.fullName ?? null,
        submitted_by_email: submission.submittedBy?.email ?? null,
        student_identifier: submission.submittedBy?.studentId ?? null,
        full_name: submission.submittedBy?.fullName ?? null,
        email: submission.submittedBy?.email ?? null,
      };
    })
    .sort((a, b) => {
      const aTime = a.confirmed_at ? new Date(a.confirmed_at).getTime() : 0;
      const bTime = b.confirmed_at ? new Date(b.confirmed_at).getTime() : 0;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      if (a.group_name !== b.group_name) {
        return a.group_name.localeCompare(b.group_name);
      }

      return (a.full_name ?? '').localeCompare(b.full_name ?? '');
    });
}


export async function create(userId, payload) {
  await requireUser(userId);

  const course = await resolveCourse(userId, payload);
  const nextSubmissionType = payload.submission_type ?? 'group';

  // Enforce professor ownership — only the course owner may create assignments for it
  const isOwner = await Course.isProfessorOwner(course._id, userId);
  if (!isOwner) {
    throw httpError(
      403,
      'NOT_COURSE_OWNER',
      'You do not own this course'
    );
  }

  let normalizedGroupIds = [];
  let groups = [];
  if (payload.assign_to === 'specific') {
    ({ normalizedGroupIds, groups } = await validateGroupIdsExist(
      payload.group_ids ?? []
    ));
  } else if (nextSubmissionType === 'group') {
    groups = await Group.find({ isDeleted: false }).sort({ name: 1 }).lean();
  }

  if (nextSubmissionType === 'group') {
    await assertGroupsFullyEnrolledInCourse(groups, course._id);
  }

  const assignment = await Assignment.create({
    title: payload.title,
    description: payload.description ?? '',
    dueDate: payload.due_date,
    onedriveLink: payload.onedrive_link,
    assignTo: payload.assign_to === 'specific' ? 'group' : 'all',
    submissionType: payload.submission_type ?? 'group',
    course: course._id,
    createdBy: userId,
    groupTargets: normalizedGroupIds,
  });

  // Re-fetch with populated course so mapAssignment can include name/code
  const populated = await Assignment.findById(assignment._id)
    .populate('course', 'name code')
    .lean();

  return {
    ...mapAssignment(populated),
    status: computeStatus(assignment.dueDate),
    groups: groups.map(toGroupSummary),
  };
}

export async function update(id, payload) {
  const assignment = await Assignment.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  if (
    payload.submission_type &&
    payload.submission_type !== assignment.submissionType
  ) {
    const hasSubmissions = await Submission.exists({ assignment: assignment._id });
    if (hasSubmissions) {
      throw httpError(
        400,
        'SUBMISSION_TYPE_LOCKED',
        'Cannot change submission type after submissions exist.'
      );
    }
  }

  const nextAssignTo = payload.assign_to ?? (assignment.assignTo === 'all' ? 'all' : 'specific');
  const nextSubmissionType = payload.submission_type ?? assignment.submissionType;

  if (payload.group_ids !== undefined && nextAssignTo !== 'specific') {
    throw httpError(
      400,
      'INVALID_GROUP_SELECTION',
      'group_ids can only be updated when assign_to is specific.'
    );
  }

  const course = await resolveCourse(
    assignment.createdBy,
    payload,
    assignment
  );
  let resolvedGroups = [];

  if (payload.title !== undefined) {
    assignment.title = payload.title;
  }

  if (payload.description !== undefined) {
    assignment.description = payload.description ?? '';
  }

  if (payload.due_date !== undefined) {
    assignment.dueDate = payload.due_date;
  }

  if (payload.onedrive_link !== undefined) {
    assignment.onedriveLink = payload.onedrive_link;
  }

  if (payload.assign_to !== undefined) {
    assignment.assignTo = payload.assign_to === 'specific' ? 'group' : 'all';
  }

  if (payload.submission_type !== undefined) {
    assignment.submissionType = payload.submission_type;
  }

  assignment.course = course._id;

  if (nextAssignTo === 'all') {
    resolvedGroups = await Group.find({ isDeleted: false }).sort({ name: 1 }).lean();
    assignment.groupTargets = [];
  } else if (payload.assign_to === 'specific' || payload.group_ids !== undefined) {
    const { normalizedGroupIds, groups } = await validateGroupIdsExist(
      payload.group_ids ?? []
    );
    resolvedGroups = groups;
    assignment.groupTargets = normalizedGroupIds;
  } else {
    resolvedGroups = await Group.find({
      _id: { $in: assignment.groupTargets },
      isDeleted: false,
    })
      .sort({ name: 1 })
      .lean();
  }

  if (nextSubmissionType === 'group') {
    await assertGroupsFullyEnrolledInCourse(resolvedGroups, course._id);
  }

  await assignment.save();

  return mapAssignmentWithDetails(assignment);
}

export async function softDelete(id) {
  const assignment = await Assignment.findOneAndUpdate(
    { _id: id, isDeleted: false },
    {
      $set: {
        isDeleted: true,
      },
    },
    { new: true }
  );

  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return mapAssignment(assignment);
}

export async function getAll(page, limit) {
  const currentPage = parsePositiveInteger(page, 1, 'Page');
  const pageSize = parsePositiveInteger(limit, 20, 'Limit');
  const skip = (currentPage - 1) * pageSize;

  const [assignments, total] = await Promise.all([
    Assignment.find({ isDeleted: false })
      .populate('course', 'name code')
      .sort({ dueDate: 1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Assignment.countDocuments({ isDeleted: false }),
  ]);

  const result = [];
  for (const assignment of assignments) {
    const groups = await getAssignmentGroups(assignment);
    result.push({
      ...mapAssignment(assignment),
      status: computeStatus(assignment.dueDate),
      groups,
    });
  }

  return {
    assignments: result,
    pagination: {
      page: currentPage,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

export async function getForStudent(userId) {
  const user = await requireUser(userId);
  const userGroup = await findActiveGroupForUser(user._id);

  const enrolledCourses = await Course.findByStudent(user._id).select('_id').lean();
  const courseIds = enrolledCourses.map((course) => course._id);

  const assignments = await Assignment.find({
    isDeleted: false,
    course: { $in: courseIds },
  })
    .populate('course', 'name code')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const visibleAssignments = assignments.filter((assignment) => {
    if (assignment.assignTo === 'all') {
      return true;
    }

    if (!userGroup) {
      return false;
    }

    return assignment.groupTargets
      .map((groupId) => groupId.toString())
      .includes(userGroup._id.toString());
  });

  const response = [];

  for (const assignment of visibleAssignments) {
    const assignmentDoc = Assignment.hydrate(assignment);

    const submissionStatus = await getSubmissionForAssignment(
      assignmentDoc,
      user,
      userGroup
    );

    response.push({
      ...mapAssignment(assignment),  // use lean object so course obj is intact
      status: computeStatus(assignment.dueDate),
      submission_status: submissionStatus,
    });
  }

  return response;
}

/**
 * List assignments scoped to courses owned by the given professor.
 * Includes course.name and course.code in each row.
 */
export async function getForAdmin(userId) {
  await requireUser(userId);

  const ownedCourses = await Course.findByProfessor(userId).select('_id').lean();
  const courseIds = ownedCourses.map((c) => c._id);

  const assignments = await Assignment.find({
    isDeleted: false,
    course: { $in: courseIds },
  })
    .populate('course', 'name code')
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  return assignments.map((assignment) => ({
    ...mapAssignment(assignment),
    status: computeStatus(assignment.dueDate),
  }));
}

export async function getDetail(id, user) {
  const currentUser = await requireUser(user.userId);

  const assignment = await Assignment.findOne({
    _id: id,
    isDeleted: false,
  });

  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  if (user.role === 'admin') {
    const [groups, submissions] = await Promise.all([
      getAssignmentGroups(assignment),
      mapAssignmentSubmissions(assignment._id),
    ]);

    return {
      ...mapAssignment(assignment),
      status: computeStatus(assignment.dueDate),
      groups,
      submissions,
    };
  }

  await ensureStudentEnrolledInAssignmentCourse(currentUser._id, assignment);

  const userGroup = await findActiveGroupForUser(currentUser._id);
  ensureGroupTargetVisibility(assignment, userGroup);

  const groups = await getAssignmentGroups(assignment);
  const submissionStatus = await getSubmissionForAssignment(
    assignment,
    currentUser,
    userGroup
  );

  return {
    ...mapAssignment(assignment),
    status: computeStatus(assignment.dueDate),
    groups,
    submission_status: submissionStatus,
  };
}
