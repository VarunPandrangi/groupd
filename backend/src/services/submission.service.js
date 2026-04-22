import { Assignment } from '../models/assignment.model.js';
import { Course } from '../models/course.model.js';
import { Group } from '../models/group.model.js';
import { Submission } from '../models/submission.model.js';
import { User } from '../models/user.model.js';
import {
  generateSubmissionConfirmationToken,
  verifySubmissionConfirmationToken,
} from '../utils/jwt.js';

const UNKNOWN_GROUP_NAME = 'Unknown Group';

const httpError = (statusCode, code, message) =>
  Object.assign(new Error(message), { statusCode, code });

function computeStatus(dueDate) {
  const due = new Date(dueDate).getTime();
  const now = Date.now();
  const threeDays = 3 * 24 * 60 * 60 * 1000;

  if (due <= now) {
    return 'overdue';
  }

  if (due <= now + threeDays) {
    return 'active';
  }

  return 'upcoming';
}

async function requireUser(userId) {
  const user = await User.findOne({ _id: userId, isDeleted: false });
  if (!user) {
    throw httpError(404, 'USER_NOT_FOUND', 'User not found');
  }

  return user;
}

async function requireAssignment(assignmentId) {
  const assignment = await Assignment.findOne({
    _id: assignmentId,
    isDeleted: false,
  });

  if (!assignment) {
    throw httpError(404, 'ASSIGNMENT_NOT_FOUND', 'Assignment not found');
  }

  return assignment;
}

async function findActiveGroupForUser(userId) {
  return Group.findOne({
    members: userId,
    isDeleted: false,
  });
}

async function getStudentEnrolledCourseIdSet(userId) {
  const courses = await Course.findByStudent(userId).select('_id').lean();
  return new Set(courses.map((course) => course._id.toString()));
}

function isAssignedToGroup(assignment, groupId) {
  if (assignment.assignTo === 'all') {
    return true;
  }

  return assignment.groupTargets
    .map((id) => id.toString())
    .includes(groupId.toString());
}

async function assertGroupMembersEnrolledInCourse({ assignment, group }) {
  const course = await Course.findOne({
    _id: assignment.course,
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
  const groupMemberIds = (group.members ?? []).map((memberId) => memberId.toString());
  const missingMemberIds = groupMemberIds.filter(
    (memberId) => !enrolledStudentIdSet.has(memberId)
  );

  if (missingMemberIds.length === 0) {
    return;
  }

  const missingUsers = await User.find({
    _id: { $in: missingMemberIds },
    isDeleted: false,
  })
    .select('fullName')
    .lean();
  const missingNames = missingUsers.map((user) => user.fullName).filter(Boolean);
  const missingPreview = missingNames.slice(0, 3).join(', ');
  const suffix =
    missingNames.length > 3 ? ` +${missingNames.length - 3} more` : '';
  const readableMissing = missingPreview
    ? `${missingPreview}${suffix}`
    : `${missingMemberIds.length} member(s)`;

  throw httpError(
    400,
    'GROUP_MEMBERS_NOT_ENROLLED',
    `Cannot submit this course assignment because some group members are not enrolled in the course: ${readableMissing}.`
  );
}



async function assertGroupSubmissionEligibility({ user, assignment }) {
  const group = await findActiveGroupForUser(user._id);

  if (!group) {
    throw httpError(400, 'NO_GROUP', 'You must be in a group to submit');
  }

  const isLeader = await Group.isLeader(group._id, user._id);
  if (!isLeader) {
    throw httpError(
      403,
      'NOT_GROUP_LEADER',
      'Only the group leader can submit this assignment'
    );
  }

  if (!isAssignedToGroup(assignment, group._id)) {
    throw httpError(
      403,
      'NOT_ASSIGNED',
      'This assignment is not assigned to your group'
    );
  }

  await assertGroupMembersEnrolledInCourse({ assignment, group });

  const existingSubmission = await Submission.findOne({
    assignment: assignment._id,
    group: group._id,
  }).select('_id');

  if (existingSubmission) {
    throw httpError(
      409,
      'ALREADY_SUBMITTED',
      'Your group has already submitted this assignment'
    );
  }

  return group;
}

async function assertIndividualSubmissionEligibility({ user, assignment }) {
  const enrolled = await Course.isStudentEnrolled(assignment.course, user._id);
  if (!enrolled) {
    throw httpError(403, 'NOT_ENROLLED', 'You are not enrolled in this course');
  }

  const existingSubmission = await Submission.findOne({
    assignment: assignment._id,
    submittedBy: user._id,
    group: null,
  }).select('_id');

  if (existingSubmission) {
    throw httpError(
      409,
      'ALREADY_SUBMITTED',
      'You have already submitted this assignment'
    );
  }
}

function validateConfirmationToken({ token, user, assignmentId, groupId = null }) {
  let payload;

  try {
    payload = verifySubmissionConfirmationToken(token);
  } catch (err) {
    if (err?.name === 'TokenExpiredError') {
      throw httpError(
        400,
        'CONFIRMATION_TOKEN_EXPIRED',
        'Your confirmation token has expired. Please retry submission.'
      );
    }

    throw httpError(
      400,
      'INVALID_CONFIRMATION_TOKEN',
      'Invalid confirmation token. Please retry submission.'
    );
  }

  const isValidAction = payload?.action === 'submission_confirmation';
  const isSameUser = payload?.userId === user._id.toString();
  const isSameAssignment = payload?.assignmentId === assignmentId;
  const isSameGroup = (payload?.groupId ?? null) === (groupId ?? null);

  if (!isValidAction || !isSameUser || !isSameAssignment || !isSameGroup) {
    throw httpError(
      400,
      'INVALID_CONFIRMATION_TOKEN',
      'Invalid confirmation token. Please retry submission.'
    );
  }
}

function mapSubmission(submission) {
  const groupDeleted = !submission.group || Boolean(submission.group?.isDeleted);

  return {
    id: submission._id.toString(),
    assignment_id:
      submission.assignment?._id?.toString?.() ??
      submission.assignment?.toString?.() ??
      null,
    group_id: groupDeleted
      ? null
      : submission.group?._id?.toString?.() ?? submission.group?.toString?.() ?? null,
    group_name:
      submission.group?.name || submission.groupNameSnapshot || UNKNOWN_GROUP_NAME,
    group_deleted: groupDeleted,
    submitted_by:
      submission.submittedBy?._id?.toString?.() ??
      submission.submittedBy?.toString?.() ??
      null,
    submitted_by_name: submission.submittedBy?.fullName ?? null,
    submitted_by_email: submission.submittedBy?.email ?? null,
    confirmed_at: submission.confirmedAt ?? null,
  };
}

export async function prepareSubmissionConfirmation(userId, assignmentId) {
  const user = await requireUser(userId);
  const assignment = await requireAssignment(assignmentId);

  if (assignment.submissionType === 'group') {
    const group = await assertGroupSubmissionEligibility({ user, assignment });

    return {
      assignment_id: assignmentId,
      confirmation_token: generateSubmissionConfirmationToken({
        userId: user._id.toString(),
        groupId: group._id.toString(),
        assignmentId,
      }),
      expires_in_seconds: 300,
    };
  }

  await assertIndividualSubmissionEligibility({ user, assignment });

  return {
    assignment_id: assignmentId,
    confirmation_token: generateSubmissionConfirmationToken({
      userId: user._id.toString(),
      groupId: null,
      assignmentId,
    }),
    expires_in_seconds: 300,
  };
}

export async function confirmSubmission(userId, assignmentId, confirmationToken) {
  const user = await requireUser(userId);
  const assignment = await requireAssignment(assignmentId);

  if (!confirmationToken) {
    throw httpError(
      400,
      'CONFIRMATION_TOKEN_REQUIRED',
      'Please confirm submission before finalizing.'
    );
  }

  try {
    let submission;

    if (assignment.submissionType === 'group') {
      const group = await assertGroupSubmissionEligibility({ user, assignment });

      validateConfirmationToken({
        token: confirmationToken,
        user,
        assignmentId,
        groupId: group._id.toString(),
      });

      submission = await Submission.create({
        assignment: assignment._id,
        submittedBy: user._id,
        group: group._id,
        groupNameSnapshot: group.name,
        submittedAt: new Date(),
        confirmedAt: new Date(),
        status: 'submitted',
      });
    } else {
      await assertIndividualSubmissionEligibility({ user, assignment });

      validateConfirmationToken({
        token: confirmationToken,
        user,
        assignmentId,
        groupId: null,
      });

      submission = await Submission.create({
        assignment: assignment._id,
        submittedBy: user._id,
        group: null,
        groupNameSnapshot: null,
        submittedAt: new Date(),
        confirmedAt: new Date(),
        status: 'submitted',
      });
    }

    const populated = await Submission.findById(submission._id)
      .populate('submittedBy', 'fullName email')
      .populate('group', 'name isDeleted')
      .populate('assignment', '_id')
      .lean();

    return mapSubmission(populated);
  } catch (err) {
    if (err?.code === 11000) {
      throw httpError(
        409,
        'ALREADY_SUBMITTED',
        assignment.submissionType === 'group'
          ? 'Your group has already submitted this assignment'
          : 'You have already submitted this assignment'
      );
    }

    throw err;
  }
}

export async function getMyGroupSubmissions(userId) {
  const user = await requireUser(userId);
  const group = await findActiveGroupForUser(user._id);

  if (!group) {
    throw httpError(400, 'NO_GROUP', 'You must be in a group to view submissions');
  }

  const enrolledCourseIdSet = await getStudentEnrolledCourseIdSet(user._id);

  const submissions = await Submission.find({
    group: group._id,
  })
    .populate('assignment', 'title dueDate isDeleted course')
    .populate('submittedBy', 'fullName')
    .sort({ confirmedAt: -1 })
    .lean();

  return submissions
    .filter(
      (submission) =>
        !submission.assignment?.isDeleted &&
        Boolean(submission.assignment?.course) &&
        enrolledCourseIdSet.has(submission.assignment.course.toString())
    )
    .map((submission) => ({
      assignment_id: submission.assignment?._id?.toString?.() ?? null,
      title: submission.assignment?.title ?? null,
      due_date: submission.assignment?.dueDate ?? null,
      submitted_by_name: submission.submittedBy?.fullName ?? null,
      confirmed_at: submission.confirmedAt ?? null,
    }))
    .sort((a, b) => {
      const aDue = a.due_date ? new Date(a.due_date).getTime() : 0;
      const bDue = b.due_date ? new Date(b.due_date).getTime() : 0;
      if (aDue !== bDue) {
        return aDue - bDue;
      }

      const aConfirm = a.confirmed_at ? new Date(a.confirmed_at).getTime() : 0;
      const bConfirm = b.confirmed_at ? new Date(b.confirmed_at).getTime() : 0;
      return bConfirm - aConfirm;
    });
}

export async function getGroupProgress(userId) {
  const user = await requireUser(userId);
  const group = await findActiveGroupForUser(user._id);

  if (!group) {
    return [];
  }

  const enrolledCourseIds = [...(await getStudentEnrolledCourseIdSet(user._id))];
  if (enrolledCourseIds.length === 0) {
    return [];
  }

  const assignments = await Assignment.find({
    isDeleted: false,
    course: { $in: enrolledCourseIds },
    $or: [{ assignTo: 'all' }, { assignTo: 'group', groupTargets: group._id }],
  })
    .sort({ dueDate: 1, createdAt: -1 })
    .lean();

  const assignmentIds = assignments.map((assignment) => assignment._id);

  const submissions = await Submission.find({
    assignment: { $in: assignmentIds },
    group: group._id,
  })
    .populate('submittedBy', 'fullName')
    .lean();

  const submissionsByAssignmentId = new Map(
    submissions.map((submission) => [
      submission.assignment.toString(),
      submission,
    ])
  );

  return assignments.map((assignment) => {
    const submission = submissionsByAssignmentId.get(assignment._id.toString());

    return {
      assignment_id: assignment._id.toString(),
      title: assignment.title,
      due_date: assignment.dueDate,
      status: computeStatus(assignment.dueDate),
      is_submitted: Boolean(submission),
      submitted_by_name: submission?.submittedBy?.fullName ?? null,
      confirmed_at: submission?.confirmedAt ?? null,
    };
  });
}

export async function getSubmissionsByAssignment(assignmentId) {
  await requireAssignment(assignmentId);

  const submissions = await Submission.find({ assignment: assignmentId })
    .populate('group', 'name isDeleted')
    .populate('submittedBy', 'fullName email')
    .sort({ confirmedAt: 1 })
    .lean();

  return submissions
    .map((submission) => ({
      id: submission._id.toString(),
      group_id:
        submission.group && !submission.group.isDeleted
          ? submission.group._id.toString()
          : null,
      group_name:
        submission.group?.name || submission.groupNameSnapshot || UNKNOWN_GROUP_NAME,
      group_deleted:
        !submission.group || Boolean(submission.group?.isDeleted),
      submitted_by_name: submission.submittedBy?.fullName ?? null,
      submitted_by_email: submission.submittedBy?.email ?? null,
      confirmed_at: submission.confirmedAt ?? null,
    }))
    .sort((a, b) => {
      const aTime = a.confirmed_at ? new Date(a.confirmed_at).getTime() : 0;
      const bTime = b.confirmed_at ? new Date(b.confirmed_at).getTime() : 0;
      if (aTime !== bTime) {
        return aTime - bTime;
      }

      if (a.group_name !== b.group_name) {
        return a.group_name.localeCompare(b.group_name);
      }

      return (a.submitted_by_name ?? '').localeCompare(b.submitted_by_name ?? '');
    });
}

export async function getAssignmentGroupStudentStatus(assignmentId) {
  const assignment = await requireAssignment(assignmentId);

  let expectedGroups = [];
  if (assignment.assignTo === 'all') {
    expectedGroups = await Group.find({ isDeleted: false })
      .sort({ name: 1 })
      .lean();
  } else {
    expectedGroups = await Group.find({
      _id: { $in: assignment.groupTargets },
      isDeleted: false,
    })
      .sort({ name: 1 })
      .lean();
  }

  const expectedGroupIds = expectedGroups.map((group) => group._id);

  const [allSubmissions, members] = await Promise.all([
    Submission.find({
      assignment: assignment._id,
    })
      .populate('submittedBy', 'fullName email')
      .populate('group', 'name isDeleted')
      .lean(),
    User.find({
      isDeleted: false,
      _id: {
        $in: expectedGroups.flatMap((group) => group.members),
      },
    }).lean(),
  ]);

  const expectedGroupIdSet = new Set(
    expectedGroupIds.map((groupId) => groupId.toString())
  );

  const expectedSubmissions = allSubmissions.filter(
    (submission) =>
      submission.group &&
      !submission.group.isDeleted &&
      expectedGroupIdSet.has(submission.group._id.toString())
  );

  const deletedSubmissions = allSubmissions.filter(
    (submission) => !submission.group || submission.group.isDeleted
  );

  const memberMap = new Map(members.map((member) => [member._id.toString(), member]));
  const submissionsByGroupId = new Map(
    expectedSubmissions.map((submission) => [
      submission.group._id.toString(),
      submission,
    ])
  );

  const rows = expectedGroups.map((group) => {
    const submission = submissionsByGroupId.get(group._id.toString());
    const groupMembers = group.members
      .map((memberId) => memberMap.get(memberId.toString()))
      .filter(Boolean)
      .map((member) => ({
        id: member._id.toString(),
        full_name: member.fullName,
        email: member.email,
        student_id: member.studentId ?? null,
      }));

    return {
      row_id: `group:${group._id.toString()}`,
      group_id: group._id.toString(),
      group_name: group.name,
      group_deleted: false,
      group_note: null,
      is_submitted: Boolean(submission),
      submitted_by_name: submission?.submittedBy?.fullName ?? null,
      submitted_by_email: submission?.submittedBy?.email ?? null,
      confirmed_at: submission?.confirmedAt ?? null,
      member_count: groupMembers.length,
      members: groupMembers,
    };
  });

  const deletedRows = deletedSubmissions.map((submission) => ({
    row_id: `deleted:${submission._id.toString()}`,
    group_id: null,
    group_name: submission.groupNameSnapshot || UNKNOWN_GROUP_NAME,
    group_deleted: true,
    group_note: 'Group no longer exists - members were released.',
    is_submitted: true,
    submitted_by_name: submission.submittedBy?.fullName ?? null,
    submitted_by_email: submission.submittedBy?.email ?? null,
    confirmed_at: submission.confirmedAt ?? null,
    member_count: 0,
    members: [],
  }));

  const groups = [...rows, ...deletedRows].sort((a, b) => {
    if (a.group_name !== b.group_name) {
      return a.group_name.localeCompare(b.group_name);
    }

    if (a.group_deleted !== b.group_deleted) {
      return Number(a.group_deleted) - Number(b.group_deleted);
    }

    const aTime = a.confirmed_at ? new Date(a.confirmed_at).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.confirmed_at ? new Date(b.confirmed_at).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });

  const submittedGroups = groups.filter((group) => group.is_submitted).length;
  const totalGroups = groups.length;

  return {
    assignment: {
      id: assignment._id.toString(),
      title: assignment.title,
      assign_to: assignment.assignTo === 'all' ? 'all' : 'specific',
      due_date: assignment.dueDate,
    },
    summary: {
      submitted_groups: submittedGroups,
      total_groups: totalGroups,
      pending_groups: Math.max(totalGroups - submittedGroups, 0),
    },
    groups,
  };
}
